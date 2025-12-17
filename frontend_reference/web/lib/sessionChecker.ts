import { NextRouter } from 'next/router';
import { API_BASE } from './api';

const SESSION_CHECK_TIMESTAMP_KEY = 'session_checked_at';
const SESSION_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export type SessionStatus = 'ok' | 'no_profile' | 'invalid' | 'pending';

type SessionCheckerOptions = {
  logout?: () => Promise<void>;
  refreshToken?: (force?: boolean) => Promise<string | null>;
  firebaseReady?: boolean;
  sessionRestored?: boolean;
  waitForAuthReady?: () => Promise<void>;
  treatNullTokenAsProvided?: boolean;
};

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return (
      localStorage.getItem('firebase_token') ??
      localStorage.getItem('token') ??
      null
    );
  } catch {
    return null;
  }
}

function updateSessionTimestamp(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(SESSION_CHECK_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function clearSessionTimestamp(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(SESSION_CHECK_TIMESTAMP_KEY);
  } catch {
    /* ignore */
  }
}

function getCachedSessionStatus(): SessionStatus | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const token = getStoredToken();
    if (!token) {
      return null;
    }

    const timestampRaw = localStorage.getItem(SESSION_CHECK_TIMESTAMP_KEY);
    if (!timestampRaw) {
      return null;
    }

    const timestamp = Number(timestampRaw);
    if (!Number.isFinite(timestamp) || Date.now() - timestamp > SESSION_CACHE_TTL_MS) {
      return null;
    }

    const cachedProfile =
      localStorage.getItem('active_profile') ?? localStorage.getItem('profile');
    if (cachedProfile) {
      return 'ok';
    }

    const storedProfileId = localStorage.getItem('active_profile_id');
    if (!storedProfileId || storedProfileId === 'null' || storedProfileId === 'undefined') {
      return 'no_profile';
    }

    return null;
  } catch {
    return null;
  }
}

function buildAuthHeaders(token?: string | null): Record<string, string> | undefined {
  if (!token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${token}`,
    'X-Firebase-Token': token,
  };
}

async function resolveActiveToken(
  initial: string | null | undefined,
  refreshToken: SessionCheckerOptions['refreshToken'],
  firebaseReady: boolean,
): Promise<string | null> {
  const activeToken = initial ?? null;

  if (activeToken) {
    return activeToken;
  }

  const stored = getStoredToken();
  if (stored) {
    return stored;
  }

  if (!firebaseReady || !refreshToken) {
    return null;
  }

  try {
    return await refreshToken(true);
  } catch {
    return null;
  }
}

export async function checkSessionOrRedirect(
  router: NextRouter,
  token?: string | null,
  opts: SessionCheckerOptions = {},
): Promise<SessionStatus> {
  const {
    logout,
    refreshToken,
    firebaseReady = true,
    sessionRestored = true,
    waitForAuthReady,
    treatNullTokenAsProvided = false,
  } = opts;
  const tokenWasProvided =
    typeof token !== 'undefined' && (token !== null || treatNullTokenAsProvided);
  const ensureLogout = async () => {
    if (logout) {
      await logout();
    }
  };

  try {
    // Always wait for auth hydration to prevent race condition
    let authReady = firebaseReady;
    let restored = sessionRestored;

    if (!authReady || !restored) {
      if (waitForAuthReady) {
        try {
          await waitForAuthReady();
          authReady = true;
          restored = true;
        } catch {
          console.warn('[sessionChecker] waitForAuthReady failed, returning pending');
          return 'pending';
        }
      } else {
        console.warn('[sessionChecker] Auth not ready and no waitForAuthReady callback, returning pending');
        return 'pending';
      }
    }

    const normalizedToken = token ?? null;
    let activeToken = await resolveActiveToken(
      normalizedToken,
      refreshToken,
      authReady,
    );
    if (!activeToken) {
      if (!tokenWasProvided) {
        return 'pending';
      }
      await ensureLogout();
      if (router.pathname !== '/auth') {
        router.replace('/auth');
      }
      return 'invalid';
    }

    const sessionHeaders = buildAuthHeaders(activeToken);
    if (!sessionHeaders) {
      await ensureLogout();
      if (router.pathname !== '/auth') {
        router.replace('/auth');
      }
      return 'invalid';
    }

    const cachedStatus = getCachedSessionStatus();
    if (cachedStatus === 'ok') {
      updateSessionTimestamp();
      return 'ok';
    }
    if (cachedStatus === 'no_profile') {
      try {
        localStorage.removeItem('profile');
        localStorage.removeItem('active_profile');
        localStorage.removeItem('active_profile_id');
      } catch {
        /* ignore */
      }
      updateSessionTimestamp();
      if (router.pathname !== '/add_profile?from=session') {
        router.replace('/add_profile?from=session');
      }
      return 'no_profile';
    }

    const sessionOptions: RequestInit = {
      credentials: 'include',
    };
    sessionOptions.headers = sessionHeaders;
    const res = await fetch(`${API_BASE}/api/check_session_or_profile`, sessionOptions);

    if (res.status === 401) {
      clearSessionTimestamp();
      await ensureLogout();
      if (router.pathname !== '/auth') {
        router.replace('/auth');
      }
      return 'invalid';
    }

    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      clearSessionTimestamp();
      await ensureLogout();
      if (router.pathname !== '/auth') {
        router.replace('/auth');
      }
      return 'invalid';
    }

    if (data.status === 'no_profile') {
      updateSessionTimestamp();
      try {
        localStorage.removeItem('profile');
        localStorage.removeItem('active_profile');
        localStorage.removeItem('active_profile_id');
      } catch {
        /* ignore */
      }
      router.replace('/add_profile?from=session');
      return 'no_profile';
    }

    if (data?.user_id && typeof window !== 'undefined') {
      localStorage.setItem('user_id', String(data.user_id));
    }
    updateSessionTimestamp();
    return 'ok';
  } catch {
    clearSessionTimestamp();
    await ensureLogout();
    if (router.pathname !== '/auth') {
      router.replace('/auth');
    }
    return 'invalid';
  }
}
