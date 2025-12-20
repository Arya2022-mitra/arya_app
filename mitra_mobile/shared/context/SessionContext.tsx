
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import {
  getActiveProfileId, saveActiveProfileId 
} from '../../lib/secureAuth';
import { fetchApi } from '../../lib/fetchApi';
import { mobileAuthService } from '../auth/MobileAuthService';

interface UserProfile {
  id: string; // Use string for ID to be safe
  first_name: string;
  [key: string]: any; // Allow other profile fields
}

interface Session {
  token: string | null;
  refreshToken: string | null;
  profile: UserProfile | null;
  activeProfileId: string | null;
  isLoading: boolean;
  sessionRestored: boolean;
  login: (newToken: string, newRefreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  setActiveProfile: (profileId: string) => Promise<boolean>;
}

const SessionContext = createContext<Session | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProfile = useCallback(async (authToken: string, profileId: string) => {
    // Note: The API endpoint needs to support fetching a specific profile by ID
    const { ok, data } = await fetchApi<UserProfile>(`/api/profile/${profileId}`, { 
        headers: { Authorization: `Bearer ${authToken}` }
    });
    if (ok && data) {
      setProfile(data);
      return true;
    } else {
      console.error("Failed to fetch profile for ID:", profileId);
      setProfile(null); // Clear profile if fetch fails
      return false;
    }
  }, []);

  /**
   * Fetch user info from /api/me and load profile
   */
  const fetchUserInfo = useCallback(async (authToken: string) => {
    try {
      const { ok, data } = await fetchApi<any>('/api/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (ok && data) {
        // Check if response has activeProfileId
        if (data.activeProfileId) {
          const success = await fetchProfile(authToken, data.activeProfileId);
          if (success) {
            await saveActiveProfileId(data.activeProfileId);
            setActiveProfileIdState(data.activeProfileId);
          }
        } else if (data.profile) {
          // If profile object is directly provided, use it
          setProfile(data.profile);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SessionProvider] Failed to fetch user info:', error);
      return false;
    }
  }, [fetchProfile]);

  /**
   * Schedule periodic token refresh (every 55 minutes)
   */
  const scheduleTokenRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Schedule refresh every 55 minutes
    refreshTimerRef.current = setInterval(async () => {
      console.log('[SessionProvider] Executing scheduled token refresh');
      const newToken = await mobileAuthService.forceRefresh();
      if (newToken) {
        setToken(newToken);
        console.log('[SessionProvider] Scheduled token refresh successful');
      } else {
        console.warn('[SessionProvider] Scheduled token refresh failed');
      }
    }, 55 * 60 * 1000); // 55 minutes
  }, []);

  /**
   * Clear the token refresh timer
   */
  const clearTokenRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const setActiveProfile = useCallback(async (profileId: string): Promise<boolean> => {
    if (!token) return false;
    setIsLoading(true);
    const success = await fetchProfile(token, profileId);
    if (success) {
      await saveActiveProfileId(profileId);
      setActiveProfileIdState(profileId);
    }
    setIsLoading(false);
    return success;
  }, [token, fetchProfile]);

  /**
   * Login with ID token and optional refresh token
   * Persists tokens, calls /api/me, and loads profile
   */
  const login = async (newToken: string, newRefreshToken?: string | null) => {
    setIsLoading(true);
    
    // Tokens are already persisted by MobileAuthService
    setToken(newToken);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }
    
    // Call /api/me to get user info and profile
    const userInfoLoaded = await fetchUserInfo(newToken);
    
    // If /api/me didn't provide profile, try to load last active profile
    if (!userInfoLoaded) {
      const lastActiveId = await getActiveProfileId();
      if (lastActiveId) {
        await fetchProfile(newToken, lastActiveId);
        setActiveProfileIdState(lastActiveId);
      }
    }

    // Schedule periodic token refresh
    scheduleTokenRefresh();
    
    setSessionRestored(true);
    setIsLoading(false);
  };

  /**
   * Logout: sign out from MobileAuthService and clear state
   */
  const logout = async () => {
    setIsLoading(true);
    
    // Clear refresh timer
    clearTokenRefresh();
    
    // Sign out using MobileAuthService (clears tokens and signs out from Firebase/Google)
    await mobileAuthService.signOut();
    
    // Clear active profile from secure storage
    await saveActiveProfileId(null);
    
    // Clear state
    setToken(null);
    setProfile(null);
    setRefreshToken(null);
    setActiveProfileIdState(null);
    setSessionRestored(true);
    setIsLoading(false);
  };

  /**
   * Force refresh the token using MobileAuthService
   */
  const refresh = async (): Promise<string | null> => {
    const newToken = await mobileAuthService.forceRefresh();
    if (newToken) {
      setToken(newToken);
    }
    return newToken;
  };

  /**
   * Initialize MobileAuthService and restore session on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Initialize MobileAuthService
        await mobileAuthService.init();
        console.log('[SessionProvider] MobileAuthService initialized');
        
        // Restore token from secure storage
        const storedToken = await mobileAuthService.getToken();
        const storedRefreshToken = await mobileAuthService.getRefreshToken();
        
        if (storedToken) {
          setToken(storedToken);
          if (storedRefreshToken) {
            setRefreshToken(storedRefreshToken);
          }
          
          // Try to fetch user info
          const userInfoLoaded = await fetchUserInfo(storedToken);
          
          // If no profile loaded, try to load from last active profile ID
          if (!userInfoLoaded) {
            const storedProfileId = await getActiveProfileId();
            if (storedProfileId) {
              await fetchProfile(storedToken, storedProfileId);
              setActiveProfileIdState(storedProfileId);
            }
          }
          
          // Schedule periodic token refresh
          scheduleTokenRefresh();
        }
        
        setSessionRestored(true);
      } catch (error) {
        console.error('[SessionProvider] Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to token changes
    const unsubscribe = mobileAuthService.onTokenChange((newToken) => {
      if (newToken) {
        setToken(newToken);
        // Optionally reload profile on token change
        fetchUserInfo(newToken).catch((err: any) => 
          console.error('[SessionProvider] Failed to fetch user info on token change:', err)
        );
      } else {
        // User signed out
        setToken(null);
        setRefreshToken(null);
        setProfile(null);
        setActiveProfileIdState(null);
        clearTokenRefresh();
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      clearTokenRefresh();
    };
  }, []);

  const value = {
    token,
    refreshToken,
    profile,
    activeProfileId,
    isLoading,
    sessionRestored,
    login,
    logout,
    refresh,
    setActiveProfile,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
