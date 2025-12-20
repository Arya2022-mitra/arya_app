
import { getApiUrl } from './api';
import { mobileAuthService, TOKEN_KEY, REFRESH_KEY } from '../shared/auth/MobileAuthService';

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
 * - Implements retry mechanism on 401 errors:
 *   1. First tries MobileAuthService.forceRefresh()
 *   2. Falls back to backend /auth/refresh endpoint if available
 * - Handles network errors and aborts.
 * - Returns a structured response object.
 */
export async function fetchApi<T>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  let token = await mobileAuthService.getToken();

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

    // Handle 401 Unauthorized with retry logic
    if (response.status === 401) {
      console.log('[fetchApi] Received 401, attempting token refresh');
      
      // Step 1: Try to refresh using MobileAuthService
      const newToken = await mobileAuthService.forceRefresh();
      
      if (newToken) {
        console.log('[fetchApi] Token refreshed via MobileAuthService, retrying request');
        token = newToken;
        response = await doFetch(token);
        
        // If still 401 after client refresh, try backend refresh
        if (response.status === 401) {
          console.log('[fetchApi] Still 401 after client refresh, trying backend refresh');
          const backendRefreshed = await refreshTokenViaBackend();
          
          if (backendRefreshed) {
            token = await mobileAuthService.getToken();
            response = await doFetch(token);
          }
        }
      } else {
        // Client refresh failed, try backend refresh
        console.log('[fetchApi] Client refresh failed, trying backend refresh');
        const backendRefreshed = await refreshTokenViaBackend();
        
        if (backendRefreshed) {
          token = await mobileAuthService.getToken();
          response = await doFetch(token);
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

/**
 * Refresh token via backend /auth/refresh endpoint
 * 
 * @returns true if refresh successful, false otherwise
 */
async function refreshTokenViaBackend(): Promise<boolean> {
  try {
    const refreshToken = await mobileAuthService.getRefreshToken();
    
    if (!refreshToken) {
      console.warn('[fetchApi] No refresh token available for backend refresh');
      return false;
    }

    const url = getApiUrl('/auth/refresh');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.warn('[fetchApi] Backend refresh failed with status:', response.status);
      return false;
    }

    const data = await response.json();
    
    // Expect backend to return { token, refreshToken } or similar
    if (data.token) {
      // Persist new tokens via MobileAuthService
      // Note: We need to add a method to persist tokens without full sign-in
      await persistTokensDirectly(data.token, data.refreshToken);
      console.log('[fetchApi] Backend refresh successful');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[fetchApi] Backend refresh error:', error);
    return false;
  }
}

/**
 * Helper to persist tokens directly to secure storage
 * Uses exported keys from MobileAuthService for consistency
 */
async function persistTokensDirectly(idToken: string, refreshToken?: string): Promise<void> {
  const SecureStore = await import('expo-secure-store');
  
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, idToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
  } catch (error) {
    console.error('[fetchApi] Failed to persist tokens:', error);
  }
}
