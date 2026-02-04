# 502 Bad Gateway Troubleshooting Guide

## What 502 Bad Gateway Means:
Your web server (nginx/apache) is running, but it can't connect to your Node.js application.

## Quick Fix Steps:

### Step 1: Check if Node.js Application is Running

```bash
# SSH into your server
ssh user@168.231.121.116

# Check if your app is running
pm2 status
# OR
ps aux | grep node

# Check for errors
pm2 logs --err
# OR
journalctl -u your-service-name -n 100
```

### Step 2: Restart Your Application

```bash
# If using PM2:
pm2 restart cctv-website
pm2 logs cctv-website --lines 50

# If using systemd:
sudo systemctl restart your-app-name
sudo systemctl status your-app-name

# If running directly:
cd /var/www/cctv-website
npm run build
npm start
```

### Step 3: Check Application Port

Your application needs to run on a port (usually 3000). Verify:

```bash
# Check if port 3000 is listening
netstat -tulpn | grep 3000
# OR
lsof -i :3000

# Check nginx/apache config points to correct port
cat /etc/nginx/sites-available/your-site
```

### Step 4: Common Issues

#### A) Application Crashed During Startup
```bash
# Check the logs
pm2 logs --err --lines 100

# Common reasons:
# - Database connection failed
# - Missing environment variables
# - Build errors
# - Port already in use
```

#### B) Environment Variables Missing
```bash
# Check .env.local exists on server
ls -la /var/www/cctv-website/.env.local

# Verify it has all required variables:
cat /var/www/cctv-website/.env.local

# Required variables:
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=
```

#### C) Build Failed
```bash
cd /var/www/cctv-website
npm run build

# If build fails, fix errors and rebuild
```

#### D) Port Conflict
```bash
# If port 3000 is in use by another process
sudo lsof -ti:3000 | xargs kill -9

# Then restart your app
pm2 restart cctv-website
```

### Step 5: Check Nginx/Apache Configuration

#### For Nginx:
```bash
# Check nginx config
sudo nginx -t

# Your config should have:
cat /etc/nginx/sites-available/your-site
```

Expected content:
```nginx
server {
    listen 80;
    server_name 168.231.121.116;

    location / {
        proxy_pass http://localhost:3000;  # <- Must match your app port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Restart nginx after any changes
sudo systemctl restart nginx
```

### Step 6: Manual Test

```bash
# SSH into server
cd /var/www/cctv-website

# Stop PM2 if running
pm2 stop cctv-website

# Try to start manually to see errors
NODE_ENV=production npm start

# You should see:
# "Ready - started server on 0.0.0.0:3000"
# If you see errors, that's the problem!
```

### Step 7: Database Connection Test

```bash
# On server, test database connection
cd /var/www/cctv-website
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cctv_platform',
  host: process.env.DB_HOST || 'localhost',
  port: 5432
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('DB Error:', err);
  else console.log('DB Connected:', res.rows[0]);
  pool.end();
});
"
```

## Quick Commands Summary:

```bash
# 1. Check status
pm2 status

# 2. View errors
pm2 logs --err --lines 50

# 3. Restart app
pm2 restart cctv-website

# 4. Check if app is listening
curl http://localhost:3000

# 5. Check nginx
sudo systemctl status nginx
sudo nginx -t

# 6. Restart nginx
sudo systemctl restart nginx
```

## Most Common Solution:

Usually a 502 happens because:
1. **App crashed** - Check `pm2 logs` for the error
2. **Database connection failed** - Check DB credentials in `.env.local`
3. **Port mismatch** - App runs on 3000, nginx points elsewhere

## Still Not Working?

Run these diagnostic commands and share the output:
```bash
pm2 logs cctv-website --lines 100 --err
sudo systemctl status nginx
netstat -tulpn | grep 3000
cat /etc/nginx/sites-available/your-site | grep proxy_pass
```
