// web/lib/api.ts
const DEFAULT_API_BASE = 'https://arya-production-e42c.up.railway.app';

const rawApiBase = DEFAULT_API_BASE;

/**
 * Validate and normalize the API base URL.
 * 
 * Supports:
 * - Absolute URLs: https://example.com/api (required for production)
 * - Relative paths: /api (for local development)
 */
function normalizeApiBase(base: string): string {
  // Accept relative paths starting with /
  if (base.startsWith('/')) {
    // Relative path for local dev - trim trailing slash
    return base.replace(/\/$/, '');
  }
  
  // Absolute URL must have protocol
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(
      'NEXT_PUBLIC_API_URL must be an absolute URL (https://...) or a relative path starting with /. ' +
      `Received: ${base}`
    );
  }
  
  // Ensure we never end up with a trailing slash
  return base.replace(/\/$/, '');
}

export const API_BASE = normalizeApiBase(rawApiBase);

/**
 * Build a full API URL from a path.
 * 
 * @param path - The API path (e.g., '/path' or 'path')
 * @returns The full API URL
 * 
 * @example
 * // With absolute base: https://api.example.com
 * getApiUrl('/users') => 'https://api.example.com/users'
 * 
 * // With relative base: /api
 * getApiUrl('/users') => '/api/users'
 */
export const getApiUrl = (path: string): string => {
  if (!path) return API_BASE;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

export default API_BASE;
