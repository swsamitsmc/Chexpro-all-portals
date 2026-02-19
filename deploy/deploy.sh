#!/bin/bash
set -e

# ChexPro Client Portal Deployment Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-staging}
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
LOG_DIR="logs"

echo -e "${GREEN}=== ChexPro Deployment Script ===${NC}"
echo "Deploying to: $DEPLOY_ENV"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed.${NC}" >&2; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${YELLOW}PM2 is not installed. Installing...${NC}"; npm install -g pm2; }

# Create logs directory
mkdir -p $LOG_DIR

# Backend deployment
echo -e "${YELLOW}Building backend...${NC}"
cd $BACKEND_DIR
npm ci --production
npm run build

# Check if build was successful
if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}Backend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Backend built successfully!${NC}"

# Frontend deployment
echo -e "${YELLOW}Building frontend...${NC}"
cd ../$FRONTEND_DIR
npm ci
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo -e "${RED}Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Frontend built successfully!${NC}"

# Restart PM2 processes
echo -e "${YELLOW}Restarting PM2 processes...${NC}"
cd ..
pm2 delete all > /dev/null 2>&1 || true
pm2 start deploy/ecosystem.config.js --env $DEPLOY_ENV

# Save PM2 state
pm2 save

# Show status
pm2 status

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo "Backend API: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Useful commands:"
echo "  pm2 status           - Check process status"
echo "  pm2 logs             - View logs"
echo "  pm2 restart all      - Restart all processes"
echo "  pm2 monit            - Monitor processes"
