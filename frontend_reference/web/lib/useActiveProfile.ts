import { useAuth } from '@/lib/useAuth';

export function useActiveProfile() {
  const { profile, setActiveProfile, profileLoading, initializing } = useAuth();
  return { profile, setActiveProfile, loading: profileLoading || initializing };
}

export default useActiveProfile;
