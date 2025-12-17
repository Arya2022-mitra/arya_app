# Next.js Image Optimization and Backend Connectivity Fixes

## Quick Operations Checklist

This document provides a quick reference for operations teams deploying the Next.js frontend.

## A. Image Optimization (Sharp Library)

### What Was Fixed
- Added `sharp` library for Next.js image optimization
- Prevents "missing native image library" warnings
- Enables automatic image optimization for better performance

### Installation (Already Done in package.json)
The `sharp` library is now included in dependencies. When deploying:

```bash
cd web
npm install  # or npm ci for production
```

### Verification
Check that sharp is installed:
```bash
npm list sharp
# Should output: mitraveda-frontend@1.0.0 /path/to/web
#                └── sharp@0.32.6
```

### Docker/Alpine Considerations
If deploying to Alpine Linux or custom distributions, ensure the following system packages are available:
```dockerfile
# In Dockerfile, before npm install:
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    build-base \
    gcc \
    g++ \
    python3
```

For Debian/Ubuntu-based images (already works):
```dockerfile
# System dependencies (if needed):
RUN apt-get update && apt-get install -y \
    build-essential \
    libvips-dev
```

### CI/CD Verification
A new GitHub Actions workflow `.github/workflows/nextjs-build.yml` verifies:
1. Sharp is installed correctly
2. Next.js build completes successfully
3. No image optimization warnings

## B. Backend Connectivity (ECONNREFUSED Fixes)

### What Was Fixed
- Enhanced error handling for backend API calls
- Added detailed diagnostic logging for connection failures
- Environment variable validation at startup
- Clear troubleshooting messages for ECONNREFUSED errors

### Required Environment Variable

**NEXT_PUBLIC_BACKEND_URL** - URL of the backend service

Default: `http://localhost:5000` (only works for local development)

### Deployment Configuration

#### 1. Local Development
```bash
# .env.local or .env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

#### 2. Docker Compose
```yaml
services:
  backend:
    # ... backend configuration
    ports:
      - "5000:5000"
  
  frontend:
    # ... frontend configuration
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:5000  # Use service name!
    depends_on:
      - backend
```

#### 3. Kubernetes
```yaml
env:
  - name: NEXT_PUBLIC_BACKEND_URL
    value: "http://backend-service.default.svc.cluster.local:5000"
```

#### 4. Cloud Platforms (Railway, Render, etc.)
```bash
# Use internal service discovery
NEXT_PUBLIC_BACKEND_URL=http://backend.railway.internal:5000

# Or use external URL
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

### Startup Validation
The application now validates environment variables at startup:
```bash
npm start
# Look for output:
[Environment] Configuration check:
[Environment] ✓ NEXT_PUBLIC_BACKEND_URL configured: http://backend:5000
```

### Error Diagnostics
When backend connection fails, logs now include:
- Full URL attempted
- Environment variable values
- ECONNREFUSED troubleshooting tips
- Connection attempt details

Example log output:
```
[Chat API] ECONNREFUSED: Backend service not accessible
[Chat API] Attempted URL: http://localhost:5000/api/v1/chat
[Chat API] Troubleshooting tips:
  1. Ensure backend service is running and accessible
  2. Check NEXT_PUBLIC_BACKEND_URL environment variable
  3. In Docker: use service names or host.docker.internal instead of localhost
  4. Verify network connectivity between containers
```

### Common Issues and Solutions

#### Issue: "ECONNREFUSED" in Docker
**Cause**: Using `localhost` in containers
**Solution**: Use service names or `host.docker.internal`
```bash
# Wrong
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Correct (Docker Compose)
NEXT_PUBLIC_BACKEND_URL=http://backend:5000

# Correct (Docker Desktop, frontend accessing host)
NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:5000
```

#### Issue: Backend not accessible from frontend
**Troubleshooting steps**:
1. Verify backend is running: `curl http://backend:5000/health`
2. Check Docker network: `docker network inspect <network-name>`
3. Verify backend binds to `0.0.0.0`, not `127.0.0.1`
4. Check firewall rules

#### Issue: Environment variable not set
**Solution**: Check build logs for validation warnings
```bash
npm start
# Look for: [Environment] ⚠️  NEXT_PUBLIC_BACKEND_URL not set
```

## Build and Deployment Commands

### Standard Build
```bash
cd web
npm install
npm run build
npm start
```

### Production Build with Environment Check
```bash
cd web
npm ci  # Clean install for production
export NEXT_PUBLIC_BACKEND_URL=http://your-backend:5000
npm run build
npm start
```

### Docker Build Example
```dockerfile
FROM node:18-alpine

WORKDIR /app/web

# Install system dependencies for sharp (Alpine)
RUN apk add --no-cache libc6-compat vips-dev build-base

# Copy package files
COPY web/package*.json ./
RUN npm ci --production=false

# Copy source
COPY web/ ./

# Build Next.js app
RUN npm run build

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
```

## Monitoring and Alerts

### Recommended Alerts
1. **Sharp Missing**: Alert if build logs show "missing native image library"
2. **Connection Errors**: Alert on repeated ECONNREFUSED in logs
3. **Backend Unavailable**: Alert on 503 responses from /api/voice/chat
4. **Environment Missing**: Alert if validation warnings appear

### Health Check
The application runs on port 3000 (or $PORT) and serves Next.js pages.
Health check endpoint: `http://localhost:3000/` (returns 200 when ready)

## Testing Your Deployment

### 1. Verify Sharp
```bash
node -e "const sharp = require('sharp'); console.log('Sharp version:', sharp.versions.sharp);"
```

### 2. Test Backend Connectivity
```bash
# From inside the frontend container
curl http://backend:5000/health  # Should succeed
```

### 3. Check Environment
```bash
# Start the server and look for validation output
npm start
# Verify all environment variables are configured
```

## Documentation References
- **Docker Networking Guide**: `web/DOCKER_NETWORKING.md`
- **Environment Example**: `web/.env.example`
- **CI/CD Workflow**: `.github/workflows/nextjs-build.yml`

## Support
If you encounter issues:
1. Check the enhanced error logs for diagnostic information
2. Review `web/DOCKER_NETWORKING.md` for Docker-specific guidance
3. Verify environment variables are set correctly
4. Ensure backend service is accessible from frontend container

## Rollback
If issues occur, the changes are minimal and focused:
- Sharp can be removed from dependencies (image optimization will be disabled)
- Backend URL defaults to `http://localhost:5000` if not set
- Error handling is non-breaking (only adds more logging)
