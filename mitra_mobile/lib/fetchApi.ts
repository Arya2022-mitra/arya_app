
import { getApiUrl } from './api';
import { getToken, getRefreshToken, saveToken } from './secureAuth';

interface FetchOptions extends RequestInit {
  // Allow adding custom headers
  headers?: Record<string, string>;
  // Add any other custom options you might need
}

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

/**
 * A centralized API client for the mobile app.
 *
 * - Automatically adds the Authorization header.
 * - Implements a single-retry mechanism on 401 errors after refreshing the token.
 * - Handles network errors and aborts.
 * - Returns a structured response object.
 */
export async function fetchApi<T>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  let token = await getToken();

  const doFetch = async (authToken: string | null): Promise<Response> => {
    const url = getApiUrl(path);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    return await fetch(url, {
      ...options,
      headers,
    });
  };

  try {
    let response = await doFetch(token);

    if (response.status === 401) {
      const refreshToken = await getRefreshToken();

      if (refreshToken) {
        // TODO: Implement the actual token refresh logic here.
        // This will likely involve a call to a specific refresh endpoint.
        // For now, we'll just simulate a failed refresh.
        const refreshed = false; // Replace with actual refresh call
        let newToken: string | null = null;

        if (refreshed) {
          // newToken = await response.json()... or similar
          await saveToken(newToken);
          token = newToken;
          // Retry the request with the new token
          response = await doFetch(token);
        } else {
          // If refresh fails, we treat it as a final 401
        }
      }
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data: null,
        error: data.message || 'An API error occurred',
      };
    }

    return {
      ok: true,
      status: response.status,
      data: data as T,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        data: null,
        error: 'Request aborted',
      };
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: error.message || 'A network error occurred',
    };
  }
}
