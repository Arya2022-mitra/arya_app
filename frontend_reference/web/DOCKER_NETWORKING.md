# Docker Networking and Backend Connectivity Guide

## Overview

This document provides guidance for configuring the Next.js frontend to communicate with the backend service in various deployment environments, particularly Docker and containerized deployments.

## Common Issue: ECONNREFUSED in Containers

When running the Next.js application in a Docker container, you may encounter `ECONNREFUSED` errors when the `/api/voice/chat` endpoint tries to reach the backend service. This happens because `localhost` inside a container refers to the container itself, not the host machine or other containers.

## Configuration

### Environment Variable: NEXT_PUBLIC_BACKEND_URL

The frontend uses the `NEXT_PUBLIC_BACKEND_URL` environment variable to determine where the backend service is located:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000  # Default fallback
```

### Deployment Scenarios

#### 1. Local Development (non-Docker)
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```
Both frontend and backend run on the host machine, so `localhost` works fine.

#### 2. Docker Compose with Named Networks
```yaml
version: '3.8'
services:
  backend:
    image: backend:latest
    ports:
      - "5000:5000"
    networks:
      - app-network
  
  frontend:
    image: frontend:latest
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:5000
    ports:
      - "3000:3000"
    networks:
      - app-network
    depends_on:
      - backend

networks:
  app-network:
    driver: bridge
```

**Key Point**: Use the service name (`backend`) as the hostname, not `localhost`.

#### 3. Frontend in Docker, Backend on Host

**Linux/WSL2**:
```bash
NEXT_PUBLIC_BACKEND_URL=http://172.17.0.1:5000  # Docker bridge IP
```

**macOS/Windows Docker Desktop**:
```bash
NEXT_PUBLIC_BACKEND_URL=http://host.docker.internal:5000
```

#### 4. Kubernetes/Cloud Platforms

Use internal service DNS names:
```bash
NEXT_PUBLIC_BACKEND_URL=http://backend-service.default.svc.cluster.local:5000
```

Or use ingress/load balancer URLs:
```bash
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

#### 5. Railway/Cloud Platforms with Service Discovery

Railway and similar platforms provide internal networking:
```bash
NEXT_PUBLIC_BACKEND_URL=http://backend.railway.internal:5000
```

## Troubleshooting ECONNREFUSED

### Step 1: Check Environment Variable
Ensure `NEXT_PUBLIC_BACKEND_URL` is set correctly:
```bash
# In the container
echo $NEXT_PUBLIC_BACKEND_URL
```

### Step 2: Test Connectivity from Container
```bash
# Enter the frontend container
docker exec -it <container-id> /bin/sh

# Test DNS resolution
nslookup backend

# Test TCP connection
nc -zv backend 5000

# Test HTTP request
curl http://backend:5000/health
```

### Step 3: Verify Backend is Accessible
- Ensure the backend service is running
- Check that the backend is listening on `0.0.0.0:5000`, not `127.0.0.1:5000`
- Verify firewall rules allow the connection
- Check Docker network configuration

### Step 4: Review Logs
The enhanced error logging will show:
- The exact URL being attempted
- The environment variable value
- Detailed connection error information
- Troubleshooting tips

Look for logs like:
```
[Chat API] ECONNREFUSED: Backend service not accessible
[Chat API] Attempted URL: http://localhost:5000/api/v1/chat
[Chat API] Troubleshooting tips:
  1. Ensure backend service is running and accessible
  2. Check NEXT_PUBLIC_BACKEND_URL environment variable
  3. In Docker: use service names or host.docker.internal instead of localhost
  4. Verify network connectivity between containers
```

## Best Practices

1. **Never use `localhost` in containerized environments** for cross-container communication
2. **Use service discovery names** provided by your orchestration platform
3. **Set environment variables explicitly** in deployment configuration
4. **Test connectivity** during deployment with health check endpoints
5. **Enable detailed logging** in development/staging environments
6. **Configure health checks** for backend service readiness
7. **Use retry logic** for transient network failures (implemented in the code)

## Network Binding for Backend Services

If your backend service is not accessible from containers, ensure it's bound to `0.0.0.0` instead of `127.0.0.1`:

**Flask example**:
```python
app.run(host='0.0.0.0', port=5000)
```

**Express example**:
```javascript
app.listen(5000, '0.0.0.0', () => {
  console.log('Server listening on all interfaces');
});
```

## Monitoring and Alerts

Consider setting up alerts for:
- Repeated ECONNREFUSED errors in logs
- High error rates on `/api/voice/chat` endpoint
- Backend service availability
- Network connectivity issues

## Additional Resources

- [Docker Networking Documentation](https://docs.docker.com/network/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Kubernetes Service Discovery](https://kubernetes.io/docs/concepts/services-networking/service/)
