type UnauthorizedHandlerOptions = {
  logout?: () => Promise<void>;
  refreshToken?: (force?: boolean) => Promise<string | null>;
  retry?: (token: string | null) => Promise<Response>;
};

export async function handleUnauthorized(
  router: { replace: (url: string) => void; pathname: string },
  options: UnauthorizedHandlerOptions = {},
): Promise<Response | null> {
  const { logout, refreshToken, retry } = options;

  if (refreshToken && retry) {
    try {
      const freshToken = await refreshToken(true);
      if (freshToken) {
        const retryResponse = await retry(freshToken);
        if (retryResponse.status !== 401) {
          return retryResponse;
        }
      }
    } catch (err) {
      console.error('[AUTH] Failed to refresh token after 401', err);
    }
  }

  if (logout) {
    await logout();
  }
  if (router.pathname !== '/auth') {
    router.replace('/auth');
  }
  return null;
}
