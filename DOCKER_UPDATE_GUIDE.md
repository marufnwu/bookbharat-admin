# Docker Update Guide for BookBharat Admin

## Overview
This guide explains how to update your Dockerized BookBharat Admin UI when you make changes to the code.

## Quick Update Process

### For Code Changes (JavaScript, React Components, etc.)

```bash
# 1. Make your code changes in bookbharat-admin/src

# 2. Rebuild the Docker image
cd bookbharat-admin
docker-compose build --no-cache

# 3. Restart the container with new image
docker-compose down
docker-compose up -d

# Your updated admin panel is now running!
```

## Detailed Update Scenarios

### 1. Updating React Components/Features

When you modify files in `src/` directory:

```bash
# Stop current container
docker-compose down

# Rebuild with changes
docker-compose build

# Start updated container
docker-compose up -d

# Verify update
docker logs bookbharat-admin
```

### 2. Updating API URL

When backend API URL changes:

```bash
# Method 1: Update .env file
echo "REACT_APP_API_URL=https://new-api.domain.com/api/v1/admin" > .env

# Rebuild and redeploy
docker-compose up -d --build

# Method 2: Direct build argument
docker build -t bookbharat-admin \
  --build-arg REACT_APP_API_URL=https://new-api.domain.com/api/v1/admin .
docker run -d -p 3002:80 bookbharat-admin
```

### 3. Updating Dependencies (package.json)

When adding new npm packages:

```bash
# Update package.json with new dependencies

# Force rebuild without cache
docker-compose build --no-cache

# Restart
docker-compose down && docker-compose up -d
```

### 4. Updating Nginx Configuration

When modifying nginx.conf:

```bash
# Edit nginx.conf

# Rebuild and restart
docker-compose up -d --build
```

## Automated Update Script

Create `update-docker.sh`:

```bash
#!/bin/bash
# BookBharat Admin Docker Update Script

echo "🚀 Starting BookBharat Admin Update..."

# Pull latest code (if using git)
echo "📥 Pulling latest code..."
git pull origin main

# Stop current container
echo "🛑 Stopping current container..."
docker-compose down

# Rebuild image
echo "🔨 Building new image..."
docker-compose build --no-cache

# Start updated container
echo "▶️ Starting updated container..."
docker-compose up -d

# Show status
echo "✅ Update complete!"
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20
```

Make it executable:
```bash
chmod +x update-docker.sh
./update-docker.sh
```

## Production Update Workflow

### Step 1: Test Updates Locally

```bash
# Build and test locally first
docker-compose build
docker-compose up -d

# Test at http://localhost:3002
# If everything works, proceed to production
```

### Step 2: Tag Version

```bash
# Tag your image with version
docker build -t bookbharat-admin:v1.1.0 .
docker tag bookbharat-admin:v1.1.0 bookbharat-admin:latest
```

### Step 3: Deploy to Production

```bash
# On production server
# Pull latest code
git pull origin main

# Build new image
docker-compose build

# Deploy with zero downtime
docker-compose up -d --no-deps --build admin
```

## Zero-Downtime Updates

### Using Docker Compose

```bash
# This updates without downtime
docker-compose up -d --no-deps --build admin

# The --no-deps flag prevents restarting dependent services
# The --build flag rebuilds the image
# Docker automatically handles the container swap
```

### Manual Blue-Green Deployment

```bash
# 1. Build new image
docker build -t bookbharat-admin:new .

# 2. Start new container on different port
docker run -d --name bookbharat-admin-new -p 3003:80 bookbharat-admin:new

# 3. Test new version at port 3003
curl http://localhost:3003

# 4. If successful, swap containers
docker stop bookbharat-admin
docker rm bookbharat-admin
docker run -d --name bookbharat-admin -p 3002:80 bookbharat-admin:new

# 5. Remove temporary container
docker stop bookbharat-admin-new
docker rm bookbharat-admin-new
```

## Version Management

### Tagging Strategy

```bash
# Development version
docker build -t bookbharat-admin:dev .

# Staging version
docker build -t bookbharat-admin:staging .

# Production versions
docker build -t bookbharat-admin:v1.0.0 .
docker build -t bookbharat-admin:latest .

# List all versions
docker images | grep bookbharat-admin
```

### Rollback Process

```bash
# If update fails, rollback to previous version
docker-compose down
docker run -d --name bookbharat-admin -p 3002:80 bookbharat-admin:v1.0.0

# Or using docker-compose with specific image
# Edit docker-compose.yml to use specific version:
# image: bookbharat-admin:v1.0.0
docker-compose up -d
```

## CI/CD Pipeline for Updates

### GitHub Actions Workflow

Create `.github/workflows/docker-deploy.yml`:

```yaml
name: Deploy Admin Updates

on:
  push:
    branches: [main]
    paths:
      - 'bookbharat-admin/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./bookbharat-admin
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/bookbharat-admin:latest
            ${{ secrets.DOCKER_USERNAME }}/bookbharat-admin:${{ github.sha }}
          build-args: |
            REACT_APP_API_URL=${{ secrets.PRODUCTION_API_URL }}

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_USERNAME }}/bookbharat-admin:latest
            docker stop bookbharat-admin || true
            docker rm bookbharat-admin || true
            docker run -d --name bookbharat-admin -p 80:80 \
              ${{ secrets.DOCKER_USERNAME }}/bookbharat-admin:latest
```

## Monitoring Updates

### Check Update Status

```bash
# View running version
docker inspect bookbharat-admin | grep -i "created"

# Check container status
docker ps -a | grep bookbharat-admin

# View recent logs
docker logs --since 5m bookbharat-admin

# Monitor real-time logs
docker logs -f bookbharat-admin
```

### Health Checks After Update

```bash
# Check if app is responding
curl -I http://localhost:3002

# Check specific endpoint
curl http://localhost:3002/health

# Check from inside container
docker exec bookbharat-admin wget -O- http://localhost/health
```

## Common Update Issues & Solutions

### Issue 1: Old version still showing
```bash
# Clear browser cache (Ctrl+Shift+R)

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up -d --force-recreate
```

### Issue 2: Build fails
```bash
# Clean Docker system
docker system prune -a

# Remove old images
docker rmi $(docker images -f "dangling=true" -q)

# Rebuild
docker-compose build --no-cache
```

### Issue 3: Container won't start after update
```bash
# Check logs for errors
docker logs bookbharat-admin

# Rollback to previous version
docker run -d --name bookbharat-admin -p 3002:80 bookbharat-admin:previous

# Debug inside container
docker run -it --rm bookbharat-admin sh
```

### Issue 4: API connection issues after update
```bash
# Verify API URL in container
docker exec bookbharat-admin printenv | grep REACT_APP_API_URL

# Rebuild with correct API URL
docker build --build-arg REACT_APP_API_URL=https://correct-api.com -t bookbharat-admin .
```

## Update Checklist

Before updating production:

- [ ] Test changes locally
- [ ] Build Docker image successfully
- [ ] Test Docker container locally
- [ ] Backup current production image
- [ ] Update environment variables if needed
- [ ] Plan rollback strategy
- [ ] Notify team about update
- [ ] Monitor after deployment

## Quick Commands Reference

```bash
# Rebuild and update
docker-compose up -d --build

# Update without cache
docker-compose build --no-cache && docker-compose up -d

# Update specific service
docker-compose up -d --no-deps --build admin

# Force recreate containers
docker-compose up -d --force-recreate

# Update and follow logs
docker-compose up -d --build && docker-compose logs -f

# Check what changed
docker diff bookbharat-admin

# See image history
docker history bookbharat-admin
```

## Best Practices

1. **Always test locally first**
   ```bash
   docker-compose build
   docker-compose up -d
   # Test at http://localhost:3002
   ```

2. **Tag versions before major updates**
   ```bash
   docker tag bookbharat-admin:latest bookbharat-admin:backup-$(date +%Y%m%d)
   ```

3. **Keep images clean**
   ```bash
   # Remove unused images regularly
   docker image prune -a
   ```

4. **Document changes**
   ```bash
   # Add to your commit message what changed
   git commit -m "feat: Add new shipping module to admin panel"
   ```

5. **Monitor after updates**
   ```bash
   # Watch logs for 5 minutes after update
   docker logs -f --since 5m bookbharat-admin
   ```

## Summary

Updating your Dockerized admin panel is straightforward:

1. Make your code changes
2. Run `docker-compose up -d --build`
3. Verify the update worked

For production, always test locally first and have a rollback plan ready!