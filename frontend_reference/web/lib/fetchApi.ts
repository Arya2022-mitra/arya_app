/**
 * web/lib/fetchApi.ts
 * 
 * Centralized fetch helper with auth token handling and 401 retry logic.
 * Reduces duplication across components like TodayPrediction and DailyPredictionPage.
 */

import { getApiUrl } from '@/lib/api';

export interface FetchApiOptions {
  /** HTTP method (default: GET) */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request body (will be JSON stringified) */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Auth token for Authorization header */
  token?: string | null;
  /** Function to refresh token (called on 401) */
  refreshToken?: (force?: boolean) => Promise<string | null>;
  /** Whether to include credentials */
  credentials?: RequestCredentials;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

export interface FetchApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

/**
 * Check if an error is an AbortError.
 * Utility for detecting cancelled fetch requests.
 */
export function isAbortError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'AbortError'
  );
}

/**
 * Get auth token from localStorage as fallback.
 * Safe to call on client only.
 */
function getLocalStorageToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('firebase_token');
  } catch {
    return null;
  }
}

/**
 * Centralized API fetch helper with auth handling.
 * 
 * Features:
 * - Automatic token from localStorage fallback
 * - 401 retry with token refresh
 * - Consistent headers (Accept, Content-Type)
 * - Credentials included by default
 * 
 * @param path - API path (e.g., '/api/ai_summary/daily')
 * @param options - Fetch options including auth
 * @returns Typed result with ok, status, data, and optional error
 */
export async function fetchApi<T = unknown>(
  path: string,
  options: FetchApiOptions = {}
): Promise<FetchApiResult<T>> {
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    token,
    refreshToken,
    credentials = 'include',
    signal,
  } = options;

  // Resolve auth token - prefer provided token, fall back to localStorage
  let authToken = token;
  if (!authToken) {
    authToken = getLocalStorageToken();
  }

  // If still no token but refreshToken is available, try to get a fresh one
  if (!authToken && refreshToken) {
    try {
      authToken = await refreshToken(true);
    } catch {
      // Ignore refresh errors on initial attempt
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Build URL
  const url = getApiUrl(path);

  // Make initial request
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      credentials,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err: unknown) {
    // Handle network/abort errors
    if (isAbortError(err)) {
      return { ok: false, status: 0, data: null, error: 'Request aborted' };
    }
    return { ok: false, status: 0, data: null, error: 'Network error' };
  }

  // Handle 401 with retry
  if (res.status === 401 && refreshToken) {
    try {
      const freshToken = await refreshToken(true);
      if (freshToken) {
        // Retry with fresh token
        const retryRes = await fetch(url, {
          method,
          headers: {
            ...headers,
            Authorization: `Bearer ${freshToken}`,
          },
          credentials,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal,
        });

        if (retryRes.ok) {
          try {
            const data = await retryRes.json();
            return { ok: true, status: retryRes.status, data: data as T };
          } catch {
            return { ok: true, status: retryRes.status, data: null };
          }
        }

        // Retry also failed
        const errorText = await retryRes.text().catch(() => '');
        return {
          ok: false,
          status: retryRes.status,
          data: null,
          error: errorText || `HTTP ${retryRes.status}`,
        };
      }
    } catch {
      // Token refresh failed, fall through to return original 401
    }
  }

  // Handle non-OK responses
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    return {
      ok: false,
      status: res.status,
      data: null,
      error: errorText || `HTTP ${res.status}`,
    };
  }

  // Success - parse JSON
  try {
    const data = await res.json();
    return { ok: true, status: res.status, data: data as T };
  } catch {
    // Response was OK but not valid JSON
    return { ok: true, status: res.status, data: null };
  }
}

export default fetchApi;
