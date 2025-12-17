import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import type { Profile } from '@/types/Profile';
import { handleUnauthorized } from '@/lib/handleUnauthorized';
import { resolveAuthToken } from '@/lib/resolveAuthToken';

interface ProfileState {
  profiles: Profile[];
  currentProfileId: number | null;
  loadProfiles: () => Promise<void>;
  setActiveProfile: (id: number) => void;
  refreshForActiveProfile: () => void;
}

const ProfileStoreContext = createContext<ProfileState | undefined>(undefined);

export const ProfileStoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}): JSX.Element => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<number | null>(null);
  const router = useRouter();
  const { token, logout, refreshToken, userId, ensureSession } = useAuth();

  const loadProfiles = useCallback(async () => {
    if (!userId) {
      setProfiles([]);
      return;
    }

    try {
      // Robust token resolution using shared utility
      const authTok = await resolveAuthToken({ token, refreshToken, ensureSession });
      if (!authTok) {
        setProfiles([]);
        return;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${authTok}`,
      };

      // Use canonical /get_profiles endpoint
      let res = await fetch(`${API_BASE}/get_profiles?user_id=${userId}`, {
        credentials: 'include',
        headers,
      });

      if (res.status === 401) {
        const retryRes = await handleUnauthorized(router, {
          logout,
          refreshToken,
          retry: async (freshToken) =>
            fetch(`${API_BASE}/get_profiles?user_id=${userId}`, {
              credentials: 'include',
              headers: freshToken ? { Authorization: `Bearer ${freshToken}` } : {},
            }),
        });

        if (!retryRes) {
          setProfiles([]);
          return;
        }

        res = retryRes;
      }

      if (!res.ok) {
        throw new Error(`Failed to load profiles (${res.status})`);
      }

      const data = await res.json();
      // /get_profiles returns an array directly
      const normalized = Array.isArray(data)
        ? data.map((p: any) => ({
            ...p,
            processing_status: p.processing_status === 'done' ? 'done' : 'pending',
          }))
        : [];
      setProfiles(normalized);
    } catch (err) {
      console.error('[profileStore] Failed to load profiles', err);
      setProfiles([]);
    }
  }, [token, router, logout, refreshToken, userId, ensureSession]);

  const setActiveProfile = (id: number) => {
    setCurrentProfileId(id);
    refreshForActiveProfile();
  };

  const refreshForActiveProfile = () => {
    // Placeholder: components can listen to profile changes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('profile-switched', { detail: { id: currentProfileId } }));
    }
  };

  return (
    <ProfileStoreContext.Provider
      value={{ profiles, currentProfileId, loadProfiles, setActiveProfile, refreshForActiveProfile }}
    >
      {children}
    </ProfileStoreContext.Provider>
  );
};

export const useProfileStore = () => {
  const ctx = useContext(ProfileStoreContext);
  if (!ctx) throw new Error('useProfileStore must be used within ProfileStoreProvider');
  return ctx;
};
