const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Validate environment variables at startup
// Note: This is non-fatal - server continues even if validation fails
// This allows the server to start with warnings rather than failing completely
// In production, missing critical env vars will cause runtime errors with better diagnostics
try {
  const { validateEnv } = require('./lib/env-validation.js');
  validateEnv();
} catch (err) {
  console.warn('[Server] Could not validate environment:', err.message);
}

let fetchFn = global.fetch;

if (typeof fetchFn !== 'function') {
  fetchFn = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const portValue = process.env.PORT;
  const port = portValue ? Number(portValue) : 3000;

  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT value: ${portValue}`);
  }

  if (!portValue && !dev) {
    console.warn('PORT environment variable not set; defaulting to 3000 in production.');
  }

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    if (parsedUrl.pathname === '/api/geo/citylist') {
      const fetch = fetchFn;
      if (typeof fetch !== 'function') {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'GeoAPI lookup failed',
            details: 'Fetch API not available in this environment',
          }),
        );
        return;
      }

      const query = parsedUrl.query?.q || '';
      if (
        !process.env.NEXT_PUBLIC_GEO_API_URL ||
        !process.env.NEXT_PUBLIC_GEO_API_KEY
      ) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'GeoAPI lookup failed',
            details: 'GeoAPI configuration is missing',
          }),
        );
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_GEO_API_URL.replace(/\/$/, '');
      const targetUrl = `${baseUrl}/api/citylist?q=${encodeURIComponent(
        query,
      )}&apikey=${encodeURIComponent(process.env.NEXT_PUBLIC_GEO_API_KEY)}`;

      fetch(targetUrl)
        .then(async (response) => {
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`GeoAPI responded with ${response.status}: ${text}`);
          }
          return response.json();
        })
        .then((data) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        })
        .catch((error) => {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'GeoAPI lookup failed',
              details: error.message,
            }),
          );
        });
      return;
    }

    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> 🚀 Server ready on port ${port}`);
  });
});
