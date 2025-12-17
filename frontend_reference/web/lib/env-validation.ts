/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at application startup
 * to fail fast with clear error messages if configuration is missing.
 */

export interface EnvConfig {
  NEXT_PUBLIC_BACKEND_URL?: string;
  NEXT_PUBLIC_API_URL?: string;
  NEXT_PUBLIC_GEO_API_URL?: string;
  NEXT_PUBLIC_GEO_API_KEY?: string;
}

/**
 * Masks a URL for safe logging by hiding sensitive parts while preserving structure
 */
function maskUrl(url: string | undefined): string {
  if (!url) return 'not set';
  try {
    const urlObj = new URL(url);
    // Show protocol and hostname, but mask port and path partially
    const host = urlObj.hostname;
    const maskedHost = host.length > 10 
      ? host.substring(0, 4) + '***' + host.substring(host.length - 4)
      : host;
    return `${urlObj.protocol}//${maskedHost}:${urlObj.port || 'default'}`;
  } catch {
    // If URL parsing fails, just mask most of the string
    return url.length > 10 
      ? url.substring(0, 7) + '***' + url.substring(url.length - 3)
      : '***';
  }
}

/**
 * Validates environment variables and logs warnings for missing optional variables
 */
export function validateEnv(): void {
  const config: EnvConfig = {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GEO_API_URL: process.env.NEXT_PUBLIC_GEO_API_URL,
    NEXT_PUBLIC_GEO_API_KEY: process.env.NEXT_PUBLIC_GEO_API_KEY,
  };

  // Log configuration status (without exposing sensitive values)
  console.log('[Environment] Configuration check:');
  
  if (!config.NEXT_PUBLIC_BACKEND_URL) {
    console.warn('[Environment] ⚠️  NEXT_PUBLIC_BACKEND_URL not set - using default: http://localhost:5000');
    console.warn('[Environment] ⚠️  In production/Docker environments, set this to the actual backend service URL');
  } else {
    console.log(`[Environment] ✓ NEXT_PUBLIC_BACKEND_URL configured: ${maskUrl(config.NEXT_PUBLIC_BACKEND_URL)}`);
  }

  if (!config.NEXT_PUBLIC_API_URL) {
    console.warn('[Environment] ⚠️  NEXT_PUBLIC_API_URL not set');
  } else {
    console.log(`[Environment] ✓ NEXT_PUBLIC_API_URL configured: ${maskUrl(config.NEXT_PUBLIC_API_URL)}`);
  }

  if (!config.NEXT_PUBLIC_GEO_API_URL) {
    console.warn('[Environment] ⚠️  NEXT_PUBLIC_GEO_API_URL not set');
  } else {
    console.log(`[Environment] ✓ NEXT_PUBLIC_GEO_API_URL configured: ${maskUrl(config.NEXT_PUBLIC_GEO_API_URL)}`);
  }

  if (!config.NEXT_PUBLIC_GEO_API_KEY) {
    console.warn('[Environment] ⚠️  NEXT_PUBLIC_GEO_API_KEY not set');
  } else {
    console.log('[Environment] ✓ NEXT_PUBLIC_GEO_API_KEY configured');
  }
}

/**
 * Gets the backend URL with fallback to default
 */
export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
}
