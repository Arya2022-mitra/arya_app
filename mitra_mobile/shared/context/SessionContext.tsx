
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getToken, saveToken, clearToken, getRefreshToken, saveRefreshToken } from '../../lib/secureAuth';
import { fetchApi } from '../../lib/fetchApi';

// Define the shape of your user profile
interface UserProfile {
  id: number;
  first_name: string;
  // Add other profile fields as needed
}

interface Session {
  token: string | null;
  refreshToken: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (newToken: string, newRefreshToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (authToken: string) => {
    const { ok, data } = await fetchApi<UserProfile>('/api/profile', { // Assuming /api/profile is the endpoint
        headers: { Authorization: `Bearer ${authToken}` }
    });
    if (ok && data) {
      setProfile(data);
    }
    return ok && data ? data : null;
  };

  const login = async (newToken: string, newRefreshToken?: string) => {
    setIsLoading(true);
    await saveToken(newToken);
    setToken(newToken);
    if (newRefreshToken) {
        await saveRefreshToken(newRefreshToken);
        setRefreshToken(newRefreshToken);
    }
    await fetchProfile(newToken);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsLoading(true);
    await clearToken();
    setToken(null);
    setProfile(null);
    setRefreshToken(null);
    setIsLoading(false);
  };

  const refresh = async (): Promise<string | null> => {
    // TODO: Implement the actual token refresh logic here.
    // This will involve calling the refresh endpoint and getting a new token.
    console.log("Token refresh logic not implemented.");
    return null;
  };


  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      const storedToken = await getToken();
      const storedRefreshToken = await getRefreshToken();
      if (storedToken) {
        setToken(storedToken);
        if(storedRefreshToken) setRefreshToken(storedRefreshToken);
        await fetchProfile(storedToken);
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const value = {
    token,
    refreshToken,
    profile,
    isLoading,
    login,
    logout,
    refresh
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
