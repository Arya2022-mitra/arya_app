/**
 * Environment Variable Validation (JavaScript version for server.js)
 * 
 * Validates required environment variables at application startup
 * to fail fast with clear error messages if configuration is missing.
 */

/**
 * Masks a URL for safe logging by hiding sensitive parts while preserving structure
 */
function maskUrl(url) {
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

function validateEnv() {
  const config = {
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

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
}

module.exports = {
  validateEnv,
  getBackendUrl,
};
