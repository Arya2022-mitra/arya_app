/**
 * Fetch the active profile from the backend API.
 *
 * The `active_profile_id` is read from localStorage. The profile is always
 * requested from `/api/profile/<active_id>` to ensure the latest data is
 * retrieved from PostgreSQL.
 *
 * On 401, this function attempts to use stored tokens from localStorage as a
 * fallback before giving up. It no longer clears cached profile keys on
 * transient 401 errors, allowing the caller an opportunity to refresh the
 * token and retry.
 */
import { API_BASE } from './api';
import type { Profile } from '@/types/Profile';
import { getProfileId } from './getProfileId';
import { normaliseProfile } from './normaliseProfile';

export async function loadActiveProfile(
  id?: number | string | null,
  authToken?: string | null,
): Promise<Profile | null> {
  if (typeof window === 'undefined') return null;
  const activeId = id ?? localStorage.getItem('active_profile_id');
  if (!activeId || activeId === 'undefined') {
    console.warn('[loadActiveProfile] Invalid profile ID, aborting API call.');
    return null;
  }

  // Resolve token with fallback to localStorage
  let resolvedToken = authToken;
  if (!resolvedToken && typeof window !== 'undefined') {
    try {
      resolvedToken = 
        localStorage.getItem('firebase_token') ?? 
        localStorage.getItem('token') ?? 
        null;
    } catch {
      // ignore storage errors
    }
  }

  try {
    const headers: Record<string, string> = {};
    if (resolvedToken) {
      headers.Authorization = `Bearer ${resolvedToken}`;
      headers['X-Firebase-Token'] = resolvedToken;
    }

    const res = await fetch(`${API_BASE}/api/profile/${activeId}`, {
      credentials: 'include',
      headers,
    });
    
    // On 401, check if we have a stored token before giving up
    if (res.status === 401) {
      // If we already tried with a stored token, or no token exists, return null
      // but DO NOT clear cached profile keys - allow caller to refresh token and retry
      console.warn('[loadActiveProfile] Received 401, returning null without clearing cache');
      return null;
    }
    
    if (!res.ok) {
      console.warn(`[loadActiveProfile] Non-OK response: ${res.status}`);
      return null;
    }

    const prof = await res.json();
    const pid = getProfileId(prof);
    const profWithId = normaliseProfile({ ...prof, id: pid } as Profile);
    if (!profWithId) {
      console.warn('[loadActiveProfile] Failed to normalize profile');
      return null;
    }
    
    // Successfully fetched profile - persist to localStorage
    try {
      localStorage.setItem('profile', JSON.stringify(profWithId));
      localStorage.setItem('active_profile', JSON.stringify(profWithId));
      localStorage.setItem('active_profile_id', String(pid));
    } catch {
      // ignore storage errors
    }
    return profWithId;
  } catch (err) {
    console.error('[loadActiveProfile] Request failed:', err);
    return null;
  }
}
