/**
 * Robust token resolution utility.
 * 
 * Attempts to resolve an authentication token using a 4-level fallback strategy:
 * 1. Use provided token from context
 * 2. Attempt to refresh token from Firebase
 * 3. Ensure session and get token
 * 4. Fall back to localStorage
 * 
 * This pattern ensures profile/session requests have the best chance of succeeding
 * even when the token is temporarily unavailable or expired.
 */

interface TokenResolutionOptions {
  token: string | null;
  refreshToken?: ((force?: boolean) => Promise<string | null>) | null;
  ensureSession?: ((options?: { forceRefresh?: boolean }) => Promise<string>) | null;
}

export async function resolveAuthToken(
  options: TokenResolutionOptions
): Promise<string | null> {
  const { token, refreshToken, ensureSession } = options;

  // Level 1: Use provided token
  let authTok = token;
  if (authTok) {
    return authTok;
  }

  // Level 2: Attempt token refresh
  if (refreshToken) {
    try {
      authTok = await refreshToken(true);
      if (authTok) {
        return authTok;
      }
    } catch (err) {
      console.warn('[resolveAuthToken] Token refresh failed', err);
    }
  }

  // Level 3: Ensure session and get token
  if (ensureSession) {
    try {
      const ensured = await ensureSession({ forceRefresh: true });
      if (ensured === 'ok' && typeof window !== 'undefined') {
        authTok = 
          localStorage.getItem('firebase_token') ?? 
          localStorage.getItem('token');
        if (authTok) {
          return authTok;
        }
      }
    } catch (err) {
      console.warn('[resolveAuthToken] ensureSession failed', err);
    }
  }

  // Level 4: Fall back to localStorage
  if (typeof window !== 'undefined') {
    authTok = 
      localStorage.getItem('firebase_token') ?? 
      localStorage.getItem('token');
  }

  return authTok || null;
}
