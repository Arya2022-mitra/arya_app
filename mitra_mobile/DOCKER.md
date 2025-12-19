# Docker Setup for Mitra Mobile

This directory contains Docker configuration files for the Mitra Mobile application. The Docker setup is **optional** and primarily useful for web deployment and CI/CD standardization.

## 📋 Files Overview

- **`Dockerfile`** - Multi-stage production build for web deployment with Nginx
- **`Dockerfile.dev`** - Development environment with Expo CLI
- **`docker-compose.yml`** - Orchestration for both dev and production services
- **`.dockerignore`** - Excludes unnecessary files from Docker build context
- **`nginx.conf`** - Nginx configuration for serving the production web build

## 🚀 Quick Start

### Production Web Build

Build and run the production web application:

```bash
# Build the image
docker build -t mitra-mobile-web .

# Run the container
docker run -p 3000:80 mitra-mobile-web

# Access the app at http://localhost:3000
```

Using docker-compose:

```bash
docker compose up mitra-mobile-web

# Access the app at http://localhost:3000
```

### Development Environment

Run the development server with hot reload:

```bash
# Start the development container
docker compose up mitra-mobile-dev

# Access Expo DevTools at http://localhost:19002
# Metro bundler at http://localhost:8081
```

## ⚙️ Configuration

### Environment Variables

For the build to succeed, you need to configure Firebase credentials. Create a `.env` file based on `.env.example` (if available) or set the following environment variables:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

**Note:** The `.env` file is excluded from Docker builds via `.dockerignore` for security. You'll need to pass environment variables at runtime if needed.

## 🏗️ Build Details

### Multi-Stage Production Build

The production `Dockerfile` uses a two-stage build:

1. **Builder Stage (Node.js Alpine)**
   - Installs dependencies with `npm ci`
   - Builds the web application with `npm run build:web`
   - Creates optimized static files in `dist/` directory

2. **Production Stage (Nginx Alpine)**
   - Copies built files from builder stage
   - Configures Nginx for SPA routing
   - Includes security headers and caching
   - Minimal footprint (~30MB total)

### Development Build

The development `Dockerfile.dev`:
- Installs Expo CLI globally
- Mounts source code as volume for hot reload
- Exposes Expo and Metro bundler ports
- Runs `npm start` to launch development server

## 📝 Notes

### When to Use Docker

✅ **Use Docker if:**
- Deploying web version to containerized infrastructure (Kubernetes, ECS, Cloud Run)
- Need consistent build environment across team
- Running automated tests in CI/CD pipeline
- Want to standardize Node.js version

❌ **Don't use Docker if:**
- Just doing local development (use `npx expo start` instead)
- Building mobile apps (use EAS Build cloud service)
- Don't need web deployment

### Port Mappings

- **Production (mitra-mobile-web):** 3000:80
- **Development (mitra-mobile-dev):**
  - 19000: Expo DevTools
  - 19001: Expo CLI
  - 19002: Expo Metro
  - 8081: Metro bundler

## 🐛 Troubleshooting

### Build fails with Firebase errors

This is expected if environment variables are not configured. The build process attempts to initialize Firebase. Either:
1. Configure environment variables properly
2. Modify `firebaseConfig.ts` to handle missing credentials gracefully during build

### Nginx serving 404 errors

Ensure the SPA routing is working correctly. The `nginx.conf` includes:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This ensures all routes are handled by the React app.

### Development container can't access Expo

Make sure all ports are properly mapped and not blocked by firewall. You may need to set:
```
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
```

## 📚 Additional Resources

- [DOCKER_AUDIT.md](./DOCKER_AUDIT.md) - Comprehensive Docker analysis and recommendations
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🔄 Updating

When updating dependencies:

```bash
# Rebuild without cache
docker build --no-cache -t mitra-mobile-web .

# Or with docker-compose
docker compose build --no-cache
```

## 🤝 Contributing

When modifying Docker configuration:
1. Test both production and development builds
2. Update this documentation
3. Ensure `.dockerignore` excludes unnecessary files
4. Keep images as small as possible (use Alpine, multi-stage builds)
