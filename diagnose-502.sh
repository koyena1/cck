#!/bin/bash
# Quick Diagnostic Script for 502 Error
# Run this on your production server: bash diagnose-502.sh

echo "================================================"
echo "  502 Bad Gateway Diagnostic Script"
echo "================================================"
echo ""

echo "1. Checking if Node.js process is running..."
echo "----------------------------------------"
if command -v pm2 &> /dev/null; then
    echo "PM2 Status:"
    pm2 status
    echo ""
    echo "Recent PM2 Errors:"
    pm2 logs --err --lines 20 --nostream
else
    echo "PM2 not found, checking for node processes:"
    ps aux | grep node | grep -v grep
fi
echo ""

echo "2. Checking if application port is listening..."
echo "----------------------------------------"
netstat -tulpn 2>/dev/null | grep :3000 || echo "Port 3000 not listening!"
netstat -tulpn 2>/dev/null | grep :3001 || echo "Port 3001 not listening!"
echo ""

echo "3. Testing localhost connection..."
echo "----------------------------------------"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "Cannot connect to localhost:3000"
echo ""

echo "4. Checking Nginx status..."
echo "----------------------------------------"
if command -v nginx &> /dev/null; then
    sudo systemctl status nginx --no-pager -l | head -20
    echo ""
    echo "Nginx configuration test:"
    sudo nginx -t
else
    echo "Nginx not found, checking Apache..."
    sudo systemctl status apache2 --no-pager -l | head -20 2>/dev/null || echo "Apache not found"
fi
echo ""

echo "5. Checking environment file..."
echo "----------------------------------------"
if [ -f ".env.local" ]; then
    echo "✓ .env.local exists"
    echo "Variables present:"
    grep -E "^(DB_|PORT)" .env.local | sed 's/=.*/=***/' || echo "No DB variables found"
else
    echo "✗ .env.local NOT FOUND!"
fi
echo ""

echo "6. Recent application logs..."
echo "----------------------------------------"
if command -v pm2 &> /dev/null; then
    pm2 logs --lines 30 --nostream 2>/dev/null || echo "No PM2 logs"
elif [ -d "/var/log/your-app" ]; then
    tail -30 /var/log/your-app/error.log 2>/dev/null || echo "No logs found"
else
    journalctl -u cctv-website -n 30 --no-pager 2>/dev/null || echo "No systemd logs found"
fi
echo ""

echo "================================================"
echo "  Diagnostic Complete"
echo "================================================"
echo ""
echo "Common fixes:"
echo "1. Restart app: pm2 restart cctv-website"
echo "2. Check logs: pm2 logs --err"
echo "3. Rebuild: npm run build && pm2 restart cctv-website"
echo "4. Check DB: Test database connection with credentials in .env.local"
