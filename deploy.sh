#!/bin/bash

# CCTV Website - Quick Deployment Script
# Run this script on your Ubuntu server after initial setup

set -e  # Exit on error

echo "================================================"
echo "CCTV Website Deployment Script"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/cctv-website"
APP_NAME="cctv-website"
DB_NAME="cctv_quotation_db"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

echo "Step 1: Checking prerequisites..."
# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+"
    exit 1
fi
print_status "Node.js $(node --version) found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed"
    exit 1
fi
print_status "PostgreSQL found"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing..."
    sudo npm install -g pm2
fi
print_status "PM2 found"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR not found"
    exit 1
fi

echo ""
echo "Step 2: Stopping application (if running)..."
pm2 stop $APP_NAME 2>/dev/null || print_warning "App not running"

echo ""
echo "Step 3: Pulling latest changes..."
cd $APP_DIR
if [ -d ".git" ]; then
    git pull origin main || git pull origin master
    print_status "Code updated from Git"
else
    print_warning "Not a Git repository. Skipping pull."
fi

echo ""
echo "Step 4: Installing dependencies..."
npm install --production=false
print_status "Dependencies installed"

echo ""
echo "Step 5: Building application..."
npm run build
print_status "Build completed"

echo ""
echo "Step 6: Starting application with PM2..."
pm2 restart $APP_NAME || pm2 start npm --name "$APP_NAME" -- start
print_status "Application started"

echo ""
echo "Step 7: Saving PM2 configuration..."
pm2 save
print_status "PM2 configuration saved"

echo ""
echo "Step 8: Reloading Nginx..."
sudo systemctl reload nginx
print_status "Nginx reloaded"

echo ""
echo "================================================"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "================================================"
echo ""
echo "Application Status:"
pm2 status $APP_NAME
echo ""
echo "Useful commands:"
echo "  pm2 logs $APP_NAME     - View application logs"
echo "  pm2 restart $APP_NAME  - Restart application"
echo "  pm2 monit              - Monitor resources"
echo ""
