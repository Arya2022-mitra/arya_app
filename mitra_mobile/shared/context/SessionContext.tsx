
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  getToken, saveToken, clearToken, 
  getRefreshToken, saveRefreshToken, 
  getActiveProfileId, saveActiveProfileId 
} from '../../lib/secureAuth';
import { fetchApi } from '../../lib/fetchApi';

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

  const login = async (newToken: string, newRefreshToken?: string) => {
    setIsLoading(true);
    await saveToken(newToken);
    setToken(newToken);
    if (newRefreshToken) {
        await saveRefreshToken(newRefreshToken);
        setRefreshToken(newRefreshToken);
    }
    // After login, we don't know the active profile yet. 
    // Let's try to load it, or the user will have to select one.
    const lastActiveId = await getActiveProfileId();
    if(lastActiveId) {
      await setActiveProfile(lastActiveId);
    }
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await clearToken(); // This will also clear the active profile ID
    setToken(null);
    setProfile(null);
    setRefreshToken(null);
    setActiveProfileIdState(null);
    setIsLoading(false);
  };

  const refresh = async (): Promise<string | null> => {
    console.log("Token refresh logic not implemented.");
    return null;
  };

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
        const storedRefreshToken = await getRefreshToken();
        if(storedRefreshToken) setRefreshToken(storedRefreshToken);
        
        const storedProfileId = await getActiveProfileId();
        if (storedProfileId) {
          await fetchProfile(storedToken, storedProfileId);
          setActiveProfileIdState(storedProfileId);
        }
      } else {
          // No token, ensure everything is cleared
          setProfile(null);
          setActiveProfileIdState(null);
      }
      setIsLoading(false);
    };

    restoreSession();
  }, [fetchProfile]);

  const value = {
    token,
    refreshToken,
    profile,
    activeProfileId,
    isLoading,
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
