# Docker Deployment Guide for BookBharat Admin UI

## Overview
This guide helps you deploy the BookBharat Admin Panel using Docker, making deployment consistent and easy across any environment.

## Prerequisites
- Docker installed on your machine or server
- Docker Compose installed
- Access to your backend API

## Quick Start

### 1. Build and Run Locally

```bash
# Navigate to admin directory
cd bookbharat-admin

# Build and run with docker-compose
docker-compose up -d

# Admin panel will be available at http://localhost:3002
```

### 2. Build with Custom API URL

```bash
# Using environment variable
REACT_APP_API_URL=https://api.yourdomain.com/api/v1/admin docker-compose up -d

# Or create .env file in bookbharat-admin directory
echo "REACT_APP_API_URL=https://api.yourdomain.com/api/v1/admin" > .env
docker-compose up -d
```

## Detailed Deployment Steps

### Step 1: Configure API URL

Create a `.env` file in the `bookbharat-admin` directory:

```env
# Production API URL
REACT_APP_API_URL=https://api.yourdomain.com/api/v1/admin

# Or for local testing
REACT_APP_API_URL=http://localhost:8000/api/v1/admin
```

### Step 2: Build Docker Image

```bash
# Build the image
docker build -t bookbharat-admin:latest \
  --build-arg REACT_APP_API_URL=https://api.yourdomain.com/api/v1/admin \
  .

# Or using docker-compose
docker-compose build
```

### Step 3: Run the Container

```bash
# Using docker run
docker run -d \
  --name bookbharat-admin \
  -p 3002:80 \
  bookbharat-admin:latest

# Using docker-compose (recommended)
docker-compose up -d
```

### Step 4: Verify Deployment

```bash
# Check if container is running
docker ps

# Check logs
docker logs bookbharat-admin

# Test the admin panel
curl http://localhost:3002
```

## Production Deployment

### Option 1: Deploy to VPS/Cloud Server

```bash
# On your server, clone the repository
git clone https://github.com/your-repo/bookbharat.git
cd bookbharat/bookbharat-admin

# Create production .env
echo "REACT_APP_API_URL=https://api.yourdomain.com/api/v1/admin" > .env

# Build and run
docker-compose up -d
```

### Option 2: Using Docker Hub

```bash
# Build and tag image
docker build -t yourusername/bookbharat-admin:latest .

# Push to Docker Hub
docker login
docker push yourusername/bookbharat-admin:latest

# On production server
docker pull yourusername/bookbharat-admin:latest
docker run -d -p 80:80 yourusername/bookbharat-admin:latest
```

### Option 3: Deploy with Nginx Reverse Proxy

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  admin:
    image: bookbharat-admin:latest
    container_name: bookbharat-admin
    restart: always
    networks:
      - webnet

  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - webnet
    depends_on:
      - admin

networks:
  webnet:
    driver: bridge
```

## Docker Commands Reference

### Build Commands
```bash
# Build image
docker build -t bookbharat-admin .

# Build with specific API URL
docker build --build-arg REACT_APP_API_URL=https://api.domain.com -t bookbharat-admin .

# Build without cache
docker build --no-cache -t bookbharat-admin .
```

### Run Commands
```bash
# Run in detached mode
docker run -d -p 3002:80 bookbharat-admin

# Run with custom name
docker run -d --name my-admin -p 3002:80 bookbharat-admin

# Run with environment variable
docker run -d -e REACT_APP_API_URL=https://api.domain.com -p 3002:80 bookbharat-admin
```

### Management Commands
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Stop container
docker stop bookbharat-admin

# Start container
docker start bookbharat-admin

# Restart container
docker restart bookbharat-admin

# Remove container
docker rm bookbharat-admin

# View logs
docker logs bookbharat-admin

# Follow logs
docker logs -f bookbharat-admin

# Execute command in container
docker exec -it bookbharat-admin sh
```

### Docker Compose Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Scale service
docker-compose up -d --scale admin=3
```

## Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:8000/api/v1/admin | https://api.domain.com/api/v1/admin |
| NODE_ENV | Environment | production | production |
| PORT | Container port | 80 | 80 |

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs bookbharat-admin

# Check if port is in use
netstat -tulpn | grep 3002
```

### API connection issues
```bash
# Verify API URL in container
docker exec bookbharat-admin printenv | grep REACT_APP_API_URL

# Test API from container
docker exec bookbharat-admin wget -O- http://api-server:8000/api/health
```

### Permission issues
```bash
# Fix permissions
docker exec bookbharat-admin chown -R nginx:nginx /usr/share/nginx/html
```

### Build failures
```bash
# Clean Docker cache
docker system prune -a

# Remove node_modules and rebuild
rm -rf node_modules
docker-compose build --no-cache
```

## Performance Optimization

### 1. Multi-stage Build (Already Implemented)
The Dockerfile uses multi-stage build to reduce image size:
- Stage 1: Build the React app
- Stage 2: Serve with Nginx (smaller final image)

### 2. Enable BuildKit
```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker build -t bookbharat-admin .
```

### 3. Use Docker Layer Caching
```bash
# Cache dependencies separately
docker build --target builder -t bookbharat-admin:builder .
docker build -t bookbharat-admin:latest .
```

## Security Best Practices

1. **Don't expose sensitive data**
   - Never commit .env files with production values
   - Use Docker secrets for sensitive data

2. **Run as non-root user**
   - Nginx image already runs as non-root

3. **Use specific versions**
   ```dockerfile
   FROM node:18.17.0-alpine AS builder
   FROM nginx:1.24-alpine
   ```

4. **Scan for vulnerabilities**
   ```bash
   docker scan bookbharat-admin
   ```

## CI/CD Integration

### GitHub Actions
```yaml
name: Deploy Admin UI

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

      - name: Build and push Docker image
        env:
          DOCKER_HUB_USERNAME: ${{ secrets.DOCKER_HUB_USERNAME }}
          DOCKER_HUB_TOKEN: ${{ secrets.DOCKER_HUB_TOKEN }}
        run: |
          echo $DOCKER_HUB_TOKEN | docker login -u $DOCKER_HUB_USERNAME --password-stdin
          docker build -t $DOCKER_HUB_USERNAME/bookbharat-admin:latest ./bookbharat-admin
          docker push $DOCKER_HUB_USERNAME/bookbharat-admin:latest

      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            docker pull ${{ secrets.DOCKER_HUB_USERNAME }}/bookbharat-admin:latest
            docker stop bookbharat-admin || true
            docker rm bookbharat-admin || true
            docker run -d --name bookbharat-admin -p 80:80 \
              ${{ secrets.DOCKER_HUB_USERNAME }}/bookbharat-admin:latest
```

## Monitoring

### Health Check
```bash
# Check container health
curl http://localhost:3002/health

# Monitor resource usage
docker stats bookbharat-admin

# Monitor with docker-compose
docker-compose ps
```

### Logs
```bash
# View Nginx access logs
docker exec bookbharat-admin cat /var/log/nginx/access.log

# View Nginx error logs
docker exec bookbharat-admin cat /var/log/nginx/error.log
```

## Backup and Restore

### Backup
```bash
# Backup container
docker commit bookbharat-admin bookbharat-admin-backup:$(date +%Y%m%d)

# Export image
docker save bookbharat-admin > bookbharat-admin-backup.tar
```

### Restore
```bash
# Load image
docker load < bookbharat-admin-backup.tar

# Run from backup
docker run -d -p 3002:80 bookbharat-admin-backup:20240101
```

## Quick Commands Cheatsheet

```bash
# Build and run
docker-compose up -d --build

# Stop and remove
docker-compose down

# Update and redeploy
git pull
docker-compose up -d --build

# View logs
docker-compose logs -f

# Enter container
docker exec -it bookbharat-admin sh

# Restart
docker-compose restart

# Check status
docker-compose ps
```

## Support

For issues:
1. Check container logs: `docker logs bookbharat-admin`
2. Verify API URL is correct
3. Ensure backend is accessible from container
4. Check port bindings: `docker port bookbharat-admin`