import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
  useRef,
} from 'react';
import { onAuthStateChanged, getIdToken, signOut } from 'firebase/auth';
import { API_BASE } from '@/lib/api';
import { auth } from '../firebase/firebase';
import { loadActiveProfile } from '@/lib/loadActiveProfile';
import type { Profile } from '@/types/Profile';
import getProfileId from '@/lib/getProfileId';
import { normaliseProfile } from '@/lib/normaliseProfile';
import type { SessionStatus } from '@/lib/sessionChecker';
import i18n from '@/lib/i18n';

const SESSION_CHECK_TIMESTAMP_KEY = 'session_checked_at';

function readCachedProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached =
      localStorage.getItem('active_profile') ?? localStorage.getItem('profile');
    if (!cached) {
      return null;
    }
    const parsed = JSON.parse(cached);
    const id = getProfileId(parsed);
    if (!id) {
      return null;
    }
    return normaliseProfile({ ...parsed, id } as Profile);
  } catch {
    return null;
  }
}

function readCachedSession() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const token =
      localStorage.getItem('firebase_token') ?? localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const userEmail = localStorage.getItem('user_email');
    const userLanguage = localStorage.getItem('user_language') || localStorage.getItem('locale');
    const storedProfileId = localStorage.getItem('active_profile_id');
    const activeProfileId =
      storedProfileId && storedProfileId !== 'null' && storedProfileId !== 'undefined'
        ? storedProfileId
        : null;
    const profile = readCachedProfile();
    const timestampRaw = localStorage.getItem(SESSION_CHECK_TIMESTAMP_KEY);
    const timestamp = timestampRaw ? Number(timestampRaw) : null;
    return {
      token,
      userId,
      userEmail,
      userLanguage,
      activeProfileId,
      profile,
      timestamp,
    } as const;
  } catch {
    return null;
  }
}

const TOKEN_REFRESH_INTERVAL_MS = 55 * 60 * 1000;

export interface GlobalSessionContextValue {
  token: string | null;
  userId: string | null;
  activeProfileId: string | null;
  userEmail: string | null;
  userLanguage: string | null;
  profile: Profile | null;
  profileLoading: boolean;
  sessionRestored: boolean;
  firebaseReady: boolean;
  initializing: boolean;
  status: SessionStatus;
  login: (
    token: string,
    userId?: string | null,
    activeProfileId?: string | null,
    email?: string | null,
    language?: string | null,
  ) => void;
  logout: () => Promise<void>;
  restoreSession: (tok?: string | null) => Promise<boolean>;
  refreshToken: (force?: boolean) => Promise<string | null>;
  setActiveProfile: (profile: Profile | null) => void;
  setUserLanguage: (lang: string | null) => Promise<void>;
  reloadProfile: (
    profileId?: string | number | null,
    tokenOverride?: string | null,
  ) => Promise<Profile | null>;
  ensureSession: (
    options?: { tokenOverride?: string | null; forceRefresh?: boolean },
  ) => Promise<SessionStatus>;
  waitForAuthReady: () => Promise<void>;
}

const GlobalSessionContext = createContext<GlobalSessionContextValue>({
  token: null,
  userId: null,
  activeProfileId: null,
  userEmail: null,
  userLanguage: null,
  profile: null,
  profileLoading: false,
  sessionRestored: false,
  firebaseReady: false,
  initializing: true,
  status: 'pending',
  login: () => {},
  logout: async () => {},
  restoreSession: async () => false,
  refreshToken: async () => null,
  setActiveProfile: () => {},
  setUserLanguage: async () => {},
  reloadProfile: async () => null,
  ensureSession: async () => 'pending',
  waitForAuthReady: async () => {},
});

function cleanupProfileStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('active_profile_id');
    localStorage.removeItem('profile');
    localStorage.removeItem('active_profile');
    localStorage.removeItem(SESSION_CHECK_TIMESTAMP_KEY);
  } catch {
    /* ignore storage issues */
  }
}

export function GlobalSessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userLanguage, setUserLanguageState] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [status, setStatus] = useState<SessionStatus>('pending');

  const tokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const refreshForceRef = useRef(false);
  const firebaseInitializedRef = useRef(false);
  const logoutInFlightRef = useRef(false);
  const authReadyWaitersRef = useRef<((value: void | PromiseLike<void>) => void)[]>([]);
  const bootstrappedRef = useRef(false);
  const sessionValidationReadyRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTokenCallbackRef = useRef<
    ((force?: boolean) => Promise<string | null>) | null
  >(null);
  const ensureSessionPromiseRef = useRef<Promise<SessionStatus> | null>(null);
  const ensureSessionRerunOptionsRef = useRef<
    { tokenOverride?: string | null; forceRefresh?: boolean } | null
  >(null);
  const lastSessionCheckRef = useRef<number | null>(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const persistToken = useCallback((tok: string | null) => {
    setToken(tok);
    if (typeof window === 'undefined') return;

    if (tok) {
      document.cookie = `firebase_token=${tok}; path=/;`;
      localStorage.setItem('firebase_token', tok);
      localStorage.setItem('token', tok);
    } else {
      document.cookie = 'firebase_token=; Max-Age=0; path=/;';
      localStorage.removeItem('firebase_token');
      localStorage.removeItem('token');
    }
  }, []);

  const setActiveProfile = useCallback((p: Profile | null) => {
    if (!p) {
      setProfile(null);
      setActiveProfileId(null);
      cleanupProfileStorage();
      return;
    }

    const id = getProfileId(p);
    const normalized = normaliseProfile({ ...p, id } as Profile);
    if (!normalized) {
      return;
    }

    setProfile(normalized);
    setActiveProfileId(String(normalized.id));

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('active_profile_id', String(normalized.id));
        localStorage.setItem('profile', JSON.stringify(normalized));
        localStorage.setItem('active_profile', JSON.stringify(normalized));
      } catch {
        /* ignore storage issues */
      }
    }
  }, []);

  const clearClientStorage = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('firebase_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('active_profile_id');
      localStorage.removeItem('active_profile');
      localStorage.removeItem('profile');
      localStorage.removeItem(SESSION_CHECK_TIMESTAMP_KEY);
    } catch {
      /* ignore */
    }

    try {
      document.cookie = 'firebase_token=; Max-Age=0; path=/;';
    } catch {
      /* ignore */
    }

    try {
      if ('indexedDB' in window) {
        if (typeof indexedDB.databases === 'function') {
          const dbs = await indexedDB.databases();
          await Promise.all(
            dbs
              .map((db) => db?.name)
              .filter((name): name is string => Boolean(name) && /firebase/i.test(String(name)))
              .map(
                (name) =>
                  new Promise<void>((resolve) => {
                    const request = indexedDB.deleteDatabase(name);
                    request.onsuccess = request.onerror = request.onblocked = () => resolve();
                  }),
              ),
          );
        } else {
          await new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase('firebaseLocalStorageDb');
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          });
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleTokenRefresh = useCallback(() => {
    clearRefreshTimer();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      return;
    }

    refreshTimerRef.current = setTimeout(() => {
      const refresher = refreshTokenCallbackRef.current;
      if (!refresher) {
        return;
      }

      void refresher(true).catch((err) => {
        console.error('[AUTH] Scheduled token refresh failed', err);
      });
    }, TOKEN_REFRESH_INTERVAL_MS);
  }, [clearRefreshTimer]);

  useEffect(() => {
    return () => {
      clearRefreshTimer();
    };
  }, [clearRefreshTimer]);

  const login = useCallback(
    (
      tok: string,
      uid?: string | null,
      profileId?: string | null,
      email?: string | null,
      language?: string | null,
    ) => {
      persistToken(tok);
      bootstrappedRef.current = false;
      setSessionRestored(false);
      sessionValidationReadyRef.current = false;
      if (uid !== undefined) setUserId(uid);
      if (profileId !== undefined) setActiveProfileId(profileId);
      if (email !== undefined) setUserEmail(email || null);
      if (language !== undefined) setUserLanguageState(language || null);
      if (typeof window !== 'undefined') {
        if (uid !== undefined) {
          if (uid) localStorage.setItem('user_id', uid);
          else localStorage.removeItem('user_id');
        }
        if (profileId !== undefined) {
          if (profileId) localStorage.setItem('active_profile_id', profileId);
          else localStorage.removeItem('active_profile_id');
        }
        if (email !== undefined) {
          if (email) localStorage.setItem('user_email', email);
          else localStorage.removeItem('user_email');
        }
        if (language !== undefined) {
          if (language) localStorage.setItem('user_language', language);
          else localStorage.removeItem('user_language');
        }
      }
      setStatus('pending');
    },
    [persistToken],
  );

  const logout = useCallback(async () => {
    persistToken(null);
    setUserId(null);
    setActiveProfileId(null);
    setUserEmail(null);
    setUserLanguageState(null);
    setProfile(null);
    setStatus('invalid');
    setSessionRestored(true);
    setInitializing(false);
    cleanupProfileStorage();
    clearRefreshTimer();
    bootstrappedRef.current = false;
    logoutInFlightRef.current = true;
    sessionValidationReadyRef.current = false;

    await clearClientStorage();

    try {
      await signOut(auth);
    } catch {
      logoutInFlightRef.current = false;
    }
  }, [clearClientStorage, clearRefreshTimer, persistToken]);

  const setUserLanguage = useCallback(
    async (lang: string | null) => {
      // Update React state and localStorage immediately for responsive UI
      setUserLanguageState(lang);
      if (typeof window !== 'undefined') {
        try {
          if (lang) localStorage.setItem('user_language', lang);
          else localStorage.removeItem('user_language');
        } catch {}
      }
      
      // Trigger i18n language change for immediate UI update
      if (lang) {
        try {
          await i18n.changeLanguage(lang);
        } catch (err) {
          console.error('[AUTH] Failed to change i18n language', err);
        }
      }
      
      // Resolve auth token before calling backend
      let activeToken: string | null = token;
      
      // Try fallback sources if token not in context
      if (!activeToken && typeof window !== 'undefined') {
        activeToken = localStorage.getItem('firebase_token') ?? localStorage.getItem('token');
      }
      
      // Try refreshing token if still no token available
      if (!activeToken && refreshTokenCallbackRef.current) {
        try {
          activeToken = await refreshTokenCallbackRef.current(true);
        } catch (err) {
          console.warn('[AUTH] Failed to refresh token for language update', err);
        }
      }
      
      // If no token available, don't attempt backend persistence
      if (!activeToken) {
        console.warn('[AUTH] No token available - language change is local-only');
        return;
      }
      
      // Attempt to persist to backend
      const attemptUpdate = async (authToken: string): Promise<Response> => {
        return fetch(`${API_BASE}/api/v1/settings/language`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            locale: lang || 'en',
          }),
        });
      };
      
      try {
        let response = await attemptUpdate(activeToken);
        
        // Handle 401 by refreshing token and retrying once
        if (response.status === 401 && refreshTokenCallbackRef.current) {
          console.log('[AUTH] Received 401 for language update, attempting token refresh');
          try {
            const freshToken = await refreshTokenCallbackRef.current(true);
            if (freshToken) {
              response = await attemptUpdate(freshToken);
            }
          } catch (refreshErr) {
            console.error('[AUTH] Token refresh failed during language update retry', refreshErr);
            throw new Error('Failed to refresh authentication token. Please sign in again.');
          }
        }
        
        // Check if response is successful
        if (!response.ok) {
          let errorMessage = `Failed to update language setting (status ${response.status})`;
          try {
            const errorData = await response.json();
            if (errorData?.error || errorData?.message) {
              errorMessage = errorData.error || errorData.message;
            }
          } catch {
            // If we can't parse JSON, try text
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch {
              // Use default message
            }
          }
          console.error('[AUTH] Failed to update language setting:', errorMessage);
          throw new Error(errorMessage);
        }
        
        // Success - backend persisted the change
        console.log('[AUTH] Language setting updated successfully on backend');
      } catch (err) {
        console.error('[AUTH] Failed to update language setting', err);
        // Re-throw so caller can handle the error
        if (err instanceof Error) {
          throw err;
        }
        throw new Error('Failed to update language setting. Please try again.');
      }
    },
    [token],
  );

  const refreshToken = useCallback(
    async (force = false): Promise<string | null> => {
      const user = auth.currentUser;
      if (!user) {
        clearRefreshTimer();
        return null;
      }
      if (!refreshPromiseRef.current || (force && !refreshForceRef.current)) {
        refreshForceRef.current = force;
        refreshPromiseRef.current = getIdToken(user, force)
          .then((freshToken) => {
            persistToken(freshToken);
            setUserEmail(user.email ?? null);
            return freshToken;
          })
          .catch((err) => {
            console.error('[AUTH] Firebase token refresh failed:', err);
            return null;
          })
          .finally(() => {
            refreshPromiseRef.current = null;
            refreshForceRef.current = false;
            if (auth.currentUser) {
              scheduleTokenRefresh();
            } else {
              clearRefreshTimer();
            }
          });
      }
      return refreshPromiseRef.current;
    },
    [clearRefreshTimer, persistToken, scheduleTokenRefresh],
  );

  useEffect(() => {
    refreshTokenCallbackRef.current = refreshToken;
    return () => {
      if (refreshTokenCallbackRef.current === refreshToken) {
        refreshTokenCallbackRef.current = null;
      }
    };
  }, [refreshToken]);

  const runEnsureSession = useCallback(
    async (
      options?: { tokenOverride?: string | null; forceRefresh?: boolean },
    ): Promise<SessionStatus> => {
      if (!firebaseReady || !sessionRestored) {
        return 'pending';
      }

      const { tokenOverride, forceRefresh } = options ?? {};

      let activeToken: string | null = tokenOverride ?? tokenRef.current ?? null;
      if (!forceRefresh && !tokenOverride) {
        if (sessionValidationReadyRef.current && status !== 'pending') {
          return status;
        }

        const cached = readCachedSession();
        if (cached?.token) {
          activeToken = cached.token;
          persistToken(cached.token);
          tokenRef.current = cached.token;
          if (cached.userId !== undefined) {
            setUserId(cached.userId ?? null);
          }
          if (cached.userEmail !== undefined) {
            setUserEmail(cached.userEmail ?? null);
          }
          if (cached.userLanguage !== undefined) {
            setUserLanguageState(cached.userLanguage ?? null);
          }
          if (cached.profile) {
            setProfile(cached.profile);
            setActiveProfileId(String(cached.profile.id));
            sessionValidationReadyRef.current = true;
            setStatus('ok');
            lastSessionCheckRef.current = cached.timestamp ?? Date.now();
            try {
              localStorage.setItem(
                SESSION_CHECK_TIMESTAMP_KEY,
                String(lastSessionCheckRef.current),
              );
            } catch {
              /* ignore */
            }
            return 'ok';
          }
          if (!cached.activeProfileId) {
            cleanupProfileStorage();
            setProfile(null);
            setActiveProfileId(null);
            sessionValidationReadyRef.current = true;
            setStatus('no_profile');
            lastSessionCheckRef.current = cached.timestamp ?? Date.now();
            try {
              localStorage.setItem(
                SESSION_CHECK_TIMESTAMP_KEY,
                String(lastSessionCheckRef.current),
              );
            } catch {
              /* ignore */
            }
            return 'no_profile';
          }
          setActiveProfileId(cached.activeProfileId);
          setProfile(null);
        }
      }

      const currentUser = auth.currentUser;

      if (!activeToken && currentUser) {
        try {
          activeToken = await getIdToken(currentUser);
          if (activeToken) {
            persistToken(activeToken);
            if (auth.currentUser) {
              scheduleTokenRefresh();
            }
          }
        } catch (err) {
          console.error('[AUTH] Failed to resolve cached token before ensureSession', err);
        }
      }

      if (!activeToken && forceRefresh) {
        try {
          activeToken = await refreshToken(true);
        } catch (err) {
          console.error('[AUTH] Forced token refresh failed', err);
        }
      }

      if (!activeToken && typeof window !== 'undefined') {
        try {
          const storedToken =
            localStorage.getItem('firebase_token') ?? localStorage.getItem('token');
          if (storedToken) {
            activeToken = storedToken;
            persistToken(storedToken);
            if (auth.currentUser) {
              scheduleTokenRefresh();
            }
          }
        } catch (err) {
          console.error('[AUTH] Failed to read stored token for ensureSession', err);
        }
      }

      if (!activeToken) {
        sessionValidationReadyRef.current = false;
        setStatus('invalid');
        cleanupProfileStorage();
        setProfile(null);
        return 'invalid';
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${activeToken}`,
        'X-Firebase-Token': activeToken,
      };

      try {
        const res = await fetch(`${API_BASE}/api/check_session_or_profile`, {
          credentials: 'include',
          headers,
        });

        if (res.status === 401) {
          if (!sessionValidationReadyRef.current) {
            setStatus('invalid');
            return 'invalid';
          }
          await logout();
          setStatus('invalid');
          return 'invalid';
        }

        const data = await res.json().catch(() => null);
        if (!data?.ok) {
          setStatus('invalid');
          return 'invalid';
        }

        if (data.user_id != null) {
          const normalized = String(data.user_id);
          setUserId(normalized);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_id', normalized);
          }
        }

        if (data.status === 'no_profile') {
          cleanupProfileStorage();
          setProfile(null);
          setStatus('no_profile');
          sessionValidationReadyRef.current = true;
          lastSessionCheckRef.current = Date.now();
          try {
            localStorage.setItem(
              SESSION_CHECK_TIMESTAMP_KEY,
              String(lastSessionCheckRef.current),
            );
          } catch {
            /* ignore */
          }
          return 'no_profile';
        }

        sessionValidationReadyRef.current = true;
        setStatus('ok');
        lastSessionCheckRef.current = Date.now();
        try {
          localStorage.setItem(
            SESSION_CHECK_TIMESTAMP_KEY,
            String(lastSessionCheckRef.current),
          );
        } catch {
          /* ignore */
        }
        return 'ok';
      } catch (err) {
        console.error('[AUTH] Failed to ensure session', err);
        sessionValidationReadyRef.current = false;
        setStatus('invalid');
        return 'invalid';
      }
    },
    [
      cleanupProfileStorage,
      firebaseReady,
      logout,
      persistToken,
      scheduleTokenRefresh,
      refreshToken,
      sessionRestored,
      status,
    ],
  );

  const ensureSession = useCallback(
    (options?: { tokenOverride?: string | null; forceRefresh?: boolean }) => {
      const normalizedOptions = {
        tokenOverride: options?.tokenOverride,
        forceRefresh: options?.forceRefresh ?? false,
      };

      if (ensureSessionPromiseRef.current) {
        const pending = ensureSessionRerunOptionsRef.current;
        ensureSessionRerunOptionsRef.current = {
          tokenOverride:
            normalizedOptions.tokenOverride !== undefined
              ? normalizedOptions.tokenOverride
              : pending?.tokenOverride,
          forceRefresh:
            normalizedOptions.forceRefresh || pending?.forceRefresh === true,
        };
        return ensureSessionPromiseRef.current;
      }

      ensureSessionPromiseRef.current = runEnsureSession(normalizedOptions).finally(() => {
        const pending = ensureSessionRerunOptionsRef.current;
        ensureSessionPromiseRef.current = null;
        ensureSessionRerunOptionsRef.current = null;
        if (pending && (pending.forceRefresh || pending.tokenOverride !== undefined)) {
          void ensureSession(pending);
        }
      });

      return ensureSessionPromiseRef.current;
    },
    [runEnsureSession],
  );

  const restoreSession = useCallback(
    async (tok?: string | null): Promise<boolean> => {
      if (sessionRestored && tok === undefined) {
        return token !== null;
      }
      const cached = readCachedSession();
      if (cached?.token) {
        persistToken(cached.token);
        tokenRef.current = cached.token;
        if (cached.userId !== undefined) {
          setUserId(cached.userId ?? null);
        }
        if (cached.userEmail !== undefined) {
          setUserEmail(cached.userEmail ?? null);
        }
        if (cached.userLanguage !== undefined) {
          setUserLanguageState(cached.userLanguage ?? null);
        }
        if (cached.profile) {
          setProfile(cached.profile);
          setActiveProfileId(String(cached.profile.id));
          setStatus('ok');
        } else if (!cached.activeProfileId) {
          cleanupProfileStorage();
          setProfile(null);
          setActiveProfileId(null);
          setStatus('no_profile');
        } else {
          setActiveProfileId(cached.activeProfileId);
          setProfile(null);
          setStatus('pending');
        }
        lastSessionCheckRef.current = cached.timestamp ?? Date.now();
        try {
          localStorage.setItem(
            SESSION_CHECK_TIMESTAMP_KEY,
            String(lastSessionCheckRef.current),
          );
        } catch {
          /* ignore */
        }
        sessionValidationReadyRef.current = true;
        setSessionRestored(true);
        if (auth.currentUser) {
          scheduleTokenRefresh();
        }
        return true;
      }
      const initialToken =
        tok ??
        (typeof window !== 'undefined'
          ? localStorage.getItem('firebase_token') ?? localStorage.getItem('token')
          : null);
      if (!initialToken && !auth.currentUser) {
        sessionValidationReadyRef.current = false;
        setSessionRestored(true);
        setStatus('invalid');
        return false;
      }

      const executeProfileRequest = async (tokenOverride?: string | null) => {
        if (!tokenOverride) {
          return fetch(`${API_BASE}/profile`, {
            method: 'GET',
            credentials: 'include',
          });
        }

        const headers: Record<string, string> = {
          Authorization: `Bearer ${tokenOverride}`,
          'X-Firebase-Token': tokenOverride,
        };

        const options: RequestInit = {
          method: 'GET',
          credentials: 'include',
          headers,
        };
        return fetch(`${API_BASE}/profile`, options);
      };

      const resolveTokenForRequest = async (
        fallback?: string | null,
      ): Promise<string | null> => {
        const currentUser = auth.currentUser;

        if (currentUser) {
          try {
            const refreshed = await getIdToken(currentUser);
            if (refreshed) {
              persistToken(refreshed);
              return refreshed;
            }
          } catch (err) {
            console.error('[AUTH] Failed to refresh token before profile request', err);
          }
        }

        if (fallback) {
          return fallback;
        }

        try {
          const forced = await refreshToken(true);
          if (forced) {
            return forced;
          }
        } catch (err) {
          console.error('[AUTH] Forced token refresh for profile failed', err);
        }

        return null;
      };

      let activeToken = await resolveTokenForRequest(tok ?? initialToken ?? null);

      if (!activeToken) {
        sessionValidationReadyRef.current = false;
        setSessionRestored(true);
        setStatus('invalid');
        return false;
      }

      tokenRef.current = activeToken;

      try {
        let res = await executeProfileRequest(activeToken);
        if (res.status === 401) {
          const fresh = await resolveTokenForRequest(null);
          if (fresh && fresh !== activeToken) {
            activeToken = fresh;
            tokenRef.current = activeToken;
            res = await executeProfileRequest(activeToken);
          }
        }

        if (res.ok) {
          const data = (await res.json().catch(() => null)) as
            | { uid?: string; email?: string; user_id?: string | number }
            | null;

          if (!data || (data.user_id == null && !data.uid && !data.email)) {
            await logout();
            setSessionRestored(true);
            setStatus('invalid');
            return false;
          }

          persistToken(activeToken);
          if (auth.currentUser) {
            scheduleTokenRefresh();
          }

          if (data.user_id != null) {
            const normalized = String(data.user_id);
            setUserId(normalized);
            if (typeof window !== 'undefined') {
              localStorage.setItem('user_id', normalized);
            }
          } else {
            setUserId(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('user_id');
            }
          }

          const email = data.email ?? auth.currentUser?.email ?? null;
          setUserEmail(email);
          if (typeof window !== 'undefined') {
            if (email) {
              localStorage.setItem('user_email', email);
            } else {
              localStorage.removeItem('user_email');
            }
          }

          setSessionRestored(true);
          setStatus('pending');
          sessionValidationReadyRef.current = true;
          return true;
        }

        if (res.status === 401 || res.status === 404) {
          if (sessionValidationReadyRef.current) {
            await logout();
          }
          sessionValidationReadyRef.current = false;
          setSessionRestored(true);
          setStatus('invalid');
          return false;
        }
      } catch (err) {
        console.error('[AUTH] Failed to restore session', err);
        if (sessionValidationReadyRef.current) {
          await logout();
        }
        sessionValidationReadyRef.current = false;
      }
      setSessionRestored(true);
      setStatus('invalid');
      return false;
    },
    [
      logout,
      persistToken,
      refreshToken,
      scheduleTokenRefresh,
      sessionRestored,
      token,
      cleanupProfileStorage,
    ],
  );

  const reloadProfile = useCallback(
    async (
      profileId?: string | number | null,
      tokenOverride?: string | null,
    ): Promise<Profile | null> => {
      const activeToken = tokenOverride ?? tokenRef.current;
      if (!activeToken) {
        cleanupProfileStorage();
        setProfile(null);
        setActiveProfileId(null);
        return null;
      }

      let idToLoad: string | number | null | undefined = profileId;
      if (typeof idToLoad === 'undefined' || idToLoad === null) {
        idToLoad =
          typeof window !== 'undefined'
            ? localStorage.getItem('active_profile_id') ?? undefined
            : undefined;
      }

      if (!idToLoad) {
        cleanupProfileStorage();
        setProfile(null);
        return null;
      }

      const cachedProfile = readCachedProfile();
      if (cachedProfile && String(cachedProfile.id) === String(idToLoad)) {
        setProfile(cachedProfile);
        setActiveProfileId(String(cachedProfile.id));
        return cachedProfile;
      }

      setProfileLoading(true);
      try {
        const prof = await loadActiveProfile(idToLoad, activeToken);
        if (prof) {
          setProfile(prof);
          setActiveProfileId(String(prof.id));
          return prof;
        }
        cleanupProfileStorage();
        setProfile(null);
        setActiveProfileId(null);
        return null;
      } finally {
        setProfileLoading(false);
      }
    },
    [],
  );

  const waitForAuthReady = useCallback(async (): Promise<void> => {
    if (firebaseReady && sessionRestored) {
      return;
    }

    await new Promise<void>((resolve) => {
      authReadyWaitersRef.current.push(resolve);
    });
  }, [firebaseReady, sessionRestored]);

  const fetchFirstProfile = useCallback(
    async (tokenOverride?: string | null): Promise<Profile | null> => {
      const activeToken = tokenOverride ?? tokenRef.current;
      if (!activeToken) {
        return null;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${activeToken}`,
        'X-Firebase-Token': activeToken,
      };

      setProfileLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/profiles`, {
          credentials: 'include',
          headers,
        });

        if (!res.ok) {
          return null;
        }

        const list = await res.json();
        if (Array.isArray(list) && list.length > 0) {
          const first = normaliseProfile({
            ...list[0],
            id: getProfileId(list[0]),
          } as Profile);
          if (first) {
            setActiveProfile(first);
            return first;
          }
        }
        return null;
      } catch (err) {
        console.error('[AUTH] Failed to fetch profiles list', err);
        return null;
      } finally {
        setProfileLoading(false);
      }
    },
    [setActiveProfile],
  );

  useEffect(() => {
    if (firebaseReady && sessionRestored && authReadyWaitersRef.current.length > 0) {
      const waiters = [...authReadyWaitersRef.current];
      authReadyWaitersRef.current = [];
      waiters.forEach((resolve) => {
        try {
          resolve();
        } catch {
          /* ignore resolution errors */
        }
      });
    }
  }, [firebaseReady, sessionRestored]);

  useEffect(() => {
    if (firebaseReady && token === null) {
      restoreSession();
    }
  }, [token, restoreSession, firebaseReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    const markFirebaseReady = () => {
      if (!firebaseInitializedRef.current) {
        firebaseInitializedRef.current = true;
      }
      setFirebaseReady(true);
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user) {
        try {
          const freshToken = await getIdToken(user);
          if (!mounted) return;
          login(freshToken, undefined, undefined, user.email ?? null);
          scheduleTokenRefresh();
          await restoreSession(freshToken);
          await ensureSession({ tokenOverride: freshToken, forceRefresh: false });
        } catch (err) {
          console.error('[AUTH] Firebase token refresh failed:', err);
        } finally {
          markFirebaseReady();
        }
        return;
      }

      if (logoutInFlightRef.current) {
        logoutInFlightRef.current = false;
        markFirebaseReady();
        return;
      }

      if (!firebaseInitializedRef.current) {
        firebaseInitializedRef.current = true;
      }

      const storedToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('firebase_token') ?? localStorage.getItem('token')
          : null;

          if (storedToken) {
            try {
              const restored = await restoreSession(storedToken);
              if (!restored) {
                await logout();
              } else {
                await ensureSession({ tokenOverride: storedToken, forceRefresh: false });
                if (auth.currentUser) {
                  scheduleTokenRefresh();
                }
              }
            } catch (err) {
              console.error('[AUTH] Failed to handle missing Firebase user', err);
              await logout();
            } finally {
          markFirebaseReady();
        }
        return;
      }

      setStatus('invalid');
      setSessionRestored(true);
      markFirebaseReady();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [ensureSession, login, logout, restoreSession, scheduleTokenRefresh]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored =
        localStorage.getItem('firebase_token') ?? localStorage.getItem('token');
      if (stored) persistToken(stored);
      const storedProfile = localStorage.getItem('profile');
      const storedProfileId = localStorage.getItem('active_profile_id');
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile) as Profile;
          setProfile(normaliseProfile(parsed) ?? null);
        } catch {
          setProfile(null);
        }
      }
      if (storedProfileId) {
        setActiveProfileId(storedProfileId);
      }
    }
  }, [persistToken]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const baseRequest = new Request(input, init);
      const resolvedUrl = baseRequest.url;

      const sameOrigin =
        typeof window !== 'undefined' &&
        resolvedUrl.startsWith(window.location.origin);
      const matchesApiBase =
        typeof API_BASE === 'string' && resolvedUrl.startsWith(API_BASE);
      const shouldAttach = sameOrigin || matchesApiBase;

      if (!shouldAttach) {
        return originalFetch(baseRequest);
      }

      const existingAuthHeader = baseRequest.headers.get('Authorization');
      const explicitBearer = existingAuthHeader?.toLowerCase().startsWith('bearer ')
        ? existingAuthHeader.slice(7).trim()
        : null;
      const preserveAuthorization = Boolean(existingAuthHeader && !explicitBearer);

      if (!explicitBearer && !preserveAuthorization) {
        try {
          await waitForAuthReady();
        } catch {
          /* ignore */
        }
      }

      const resolveBearer = async () => {
        let bearer = tokenRef.current;
        if (bearer) {
          return bearer;
        }

        try {
          bearer = await refreshToken();
        } catch (err) {
          console.error('[AUTH] fetch token refresh failed', err);
        }

        if (bearer) {
          return bearer;
        }

        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            bearer = await getIdToken(currentUser);
            if (bearer) {
              persistToken(bearer);
            }
          } catch (err) {
            console.error('[AUTH] Failed to derive token for fetch', err);
          }
        }

        return bearer;
      };

      const performFetch = async (
        bearer: string | null,
        keepAuthorization: boolean,
      ): Promise<Response> => {
        const requestClone = baseRequest.clone();
        const headers = new Headers(requestClone.headers);

        if (keepAuthorization) {
          if (bearer) {
            headers.set('X-Firebase-Token', bearer);
          } else {
            headers.delete('X-Firebase-Token');
          }
        } else if (bearer) {
          headers.set('Authorization', `Bearer ${bearer}`);
          headers.set('X-Firebase-Token', bearer);
        } else {
          headers.delete('Authorization');
          headers.delete('X-Firebase-Token');
        }

        const requestWithAuth = new Request(requestClone, {
          headers,
          credentials: 'include',
        });

        return originalFetch(requestWithAuth);
      };

      let activeBearer = explicitBearer ?? (await resolveBearer());
      let response = await performFetch(activeBearer, preserveAuthorization);

      if (response.status === 401 && !preserveAuthorization) {
        let refreshed: string | null = null;
        try {
          refreshed = await refreshToken(true);
        } catch (err) {
          console.error('[AUTH] Forced token refresh failed', err);
        }

        if (refreshed && refreshed !== activeBearer) {
          activeBearer = refreshed;
          response = await performFetch(refreshed, false);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [refreshToken, firebaseReady, persistToken, waitForAuthReady]);

  useEffect(() => {
    if (!firebaseReady || !sessionRestored || bootstrappedRef.current) {
      return;
    }

    let cancelled = false;

    const bootstrap = async () => {
      setInitializing(true);
      const currentToken = tokenRef.current;
      const sessionStatus = await ensureSession({ tokenOverride: currentToken });
      if (cancelled) {
        return;
      }

      if (sessionStatus === 'ok') {
        const prof = await reloadProfile(undefined, currentToken);
        if (!cancelled && !prof) {
          const fallback = await fetchFirstProfile(currentToken);
          if (!cancelled) {
            if (fallback) {
              setStatus('ok');
            } else {
              setStatus('no_profile');
            }
          }
        }
      }

      if (!cancelled) {
        if (sessionStatus === 'no_profile' || sessionStatus === 'invalid') {
          cleanupProfileStorage();
          setProfile(null);
        }
        bootstrappedRef.current = true;
        setInitializing(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [ensureSession, fetchFirstProfile, reloadProfile, firebaseReady, sessionRestored]);

  // Sync userLanguage state to i18n whenever it changes (on app startup or language change)
  useEffect(() => {
    if (userLanguage && typeof window !== 'undefined') {
      // Only sync if i18n language differs from userLanguage state
      if (i18n.language !== userLanguage) {
        i18n.changeLanguage(userLanguage).catch((err) => {
          console.error('[AUTH] Failed to sync language to i18n on mount/change', err);
        });
      }
    }
  }, [userLanguage]);

  return (
    <GlobalSessionContext.Provider
      value={{
        token,
        userId,
        activeProfileId,
        userEmail,
        userLanguage,
        profile,
        profileLoading,
        sessionRestored,
        firebaseReady,
        initializing,
        status,
        login,
        logout,
        restoreSession,
        refreshToken,
        setActiveProfile,
        setUserLanguage,
        reloadProfile,
        ensureSession,
        waitForAuthReady,
      }}
    >
      {children}
    </GlobalSessionContext.Provider>
  );
}

export function useAuth() {
  return useContext(GlobalSessionContext);
}

export function useUserId() {
  return useContext(GlobalSessionContext).userId;
}

export function useActiveProfileId() {
  return useContext(GlobalSessionContext).activeProfileId;
}

export function useUserEmail() {
  return useContext(GlobalSessionContext).userEmail;
}

export function useSessionRestored() {
  return useContext(GlobalSessionContext).sessionRestored;
}

export function useWaitForAuthReady() {
  return useContext(GlobalSessionContext).waitForAuthReady;
}

export default GlobalSessionContext;
export { GlobalSessionProvider as AuthProvider };
