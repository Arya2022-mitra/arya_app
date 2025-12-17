/** @type {import('next').NextConfig} */
const path = require('path');

// Load environment variables from the project root .env file so both the
// backend and frontend share the same configuration source. We fall back to
// regular process.env values if the file does not exist.
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('Could not load root .env file:', err);
}

const nextConfig = {
  distDir: 'out',
  // Enable React strict mode to catch common mistakes
  reactStrictMode: true,
  // Disable minification in production to get readable error messages for debugging
  // Set to false during development/debugging, true for production
  productionBrowserSourceMaps: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GEO_API_URL: process.env.NEXT_PUBLIC_GEO_API_URL,
    NEXT_PUBLIC_GEO_API_URL_FALLBACK: process.env.NEXT_PUBLIC_GEO_API_URL_FALLBACK,
    NEXT_PUBLIC_GEO_API_KEY: process.env.NEXT_PUBLIC_GEO_API_KEY,
  },
};

module.exports = nextConfig;
