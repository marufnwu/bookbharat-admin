#!/bin/bash
# BookBharat Admin Docker Update Script
# Usage: ./update-docker.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}BookBharat Admin Docker Update${NC}"
echo -e "${BLUE}======================================${NC}"

# Function to check command status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Step 1: Check for uncommitted changes
echo -e "\n${YELLOW}Step 1: Checking for local changes...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Update cancelled${NC}"
        exit 1
    fi
fi

# Step 2: Pull latest code (optional)
echo -e "\n${YELLOW}Step 2: Pull latest code from git?${NC}"
read -p "Pull from git? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin main
    check_status "Git pull completed"
fi

# Step 3: Backup current image
echo -e "\n${YELLOW}Step 3: Backing up current image...${NC}"
BACKUP_TAG="bookbharat-admin:backup-$(date +%Y%m%d-%H%M%S)"
docker tag bookbharat-admin:latest $BACKUP_TAG 2>/dev/null
echo -e "${GREEN}✓ Backup created: $BACKUP_TAG${NC}"

# Step 4: Stop current container
echo -e "\n${YELLOW}Step 4: Stopping current container...${NC}"
docker-compose down
check_status "Container stopped"

# Step 5: Build new image
echo -e "\n${YELLOW}Step 5: Building new image...${NC}"
docker-compose build --no-cache
check_status "Image built successfully"

# Step 6: Start updated container
echo -e "\n${YELLOW}Step 6: Starting updated container...${NC}"
docker-compose up -d
check_status "Container started"

# Step 7: Health check
echo -e "\n${YELLOW}Step 7: Performing health check...${NC}"
sleep 5
curl -f http://localhost:3002/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Health check failed, but container is running${NC}"
fi

# Step 8: Show status
echo -e "\n${YELLOW}Step 8: Current status...${NC}"
docker-compose ps

# Step 9: Show recent logs
echo -e "\n${YELLOW}Step 9: Recent logs...${NC}"
docker-compose logs --tail=10

# Success message
echo -e "\n${GREEN}======================================${NC}"
echo -e "${GREEN}✅ Update Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo -e "\nAdmin panel: ${BLUE}http://localhost:3002${NC}"
echo -e "Backup image: ${BLUE}$BACKUP_TAG${NC}"
echo -e "\nTo rollback if needed:"
echo -e "  ${YELLOW}docker-compose down${NC}"
echo -e "  ${YELLOW}docker tag $BACKUP_TAG bookbharat-admin:latest${NC}"
echo -e "  ${YELLOW}docker-compose up -d${NC}"