
import { fetchApi } from './fetchApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_CACHE_KEY = 'active_profile';

interface UserProfile {
  id: number;
  first_name: string;
  // Add other profile fields as needed
}

/**
 * Fetches the active user profile from the API and caches it in AsyncStorage.
 *
 * @param id The ID of the profile to load. If not provided, it will try to load from the cache.
 * @param authToken The authentication token to use for the API request.
 * @returns The user profile, or null if it fails to load.
 */
export async function loadActiveProfile(
  id?: number,
  authToken?: string
): Promise<UserProfile | null> {
  const cachedProfile = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
  let profileId = id;

  if (!profileId && cachedProfile) {
    try {
      const parsed = JSON.parse(cachedProfile);
      if (parsed?.id) {
        profileId = parsed.id;
      }
    } catch (e) {
      // Malformed cache, ignore
    }
  }

  if (!profileId) {
    return null;
  }

  const { ok, data, status } = await fetchApi<UserProfile>(
    `/api/profile/${profileId}`,
    authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
  );

  if (ok && data) {
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data));
    return data;
  }

  if (status === 401) {
    // Don't clear the cache on 401, as the caller may want to refresh the token
    return null;
  }

  if (cachedProfile) {
    try {
      return JSON.parse(cachedProfile);
    } catch (e) {
      return null;
    }
  }

  return null;
}
