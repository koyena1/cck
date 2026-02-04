# Production Deployment Guide - Ubuntu Server

## Overview
This guide covers deploying your Next.js CCTV website to an Ubuntu production server with PostgreSQL, Nginx, and SSL.

---

## Prerequisites

### Server Requirements
- Ubuntu 20.04 LTS or higher
- Minimum 2GB RAM, 2 CPU cores
- 20GB storage
- Root or sudo access
- Domain name (optional but recommended)

---

## Step 1: Update System & Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential
```

---

## Step 2: Install Node.js 20+

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

---

## Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL prompt, run:
CREATE DATABASE cctv_quotation_db;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE cctv_quotation_db TO postgres;
\q
```

### Edit PostgreSQL Configuration (Allow connections)

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add this line (or modify existing):
# local   all             postgres                                md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Step 4: Setup Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/cctv-website
sudo chown -R $USER:$USER /var/www/cctv-website
cd /var/www/cctv-website
```

---

## Step 5: Transfer Your Code to Server

### Option A: Using Git (Recommended)

```bash
# Initialize git repository on your local machine (if not done)
cd E:\cctv
git init
git add .
git commit -m "Initial commit"

# Push to GitHub/GitLab (create repo first)
git remote add origin YOUR_GIT_REPOSITORY_URL
git push -u origin main

# On server, clone the repository
cd /var/www/cctv-website
git clone YOUR_GIT_REPOSITORY_URL .
```

### Option B: Using SCP/SFTP

```bash
# From your Windows machine (PowerShell):
scp -r E:\cctv\* username@your-server-ip:/var/www/cctv-website/

# Or use FileZilla/WinSCP for GUI transfer
```

---

## Step 6: Create Environment Variables

```bash
# Create .env.local file on server
cd /var/www/cctv-website
nano .env.local
```

Add the following content:

```env
# Database Configuration
DB_USER=postgres
DB_PASSWORD=YourStrongPassword123!
DB_NAME=cctv_quotation_db
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false

# Next.js Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

Save and exit (Ctrl+X, Y, Enter)

---

## Step 7: Setup Database Schema

```bash
cd /var/www/cctv-website

# Run schema files in order
sudo -u postgres psql -d cctv_quotation_db -f schema.sql
sudo -u postgres psql -d cctv_quotation_db -f schema-quotation-settings.sql

# Verify tables were created
sudo -u postgres psql -d cctv_quotation_db -c "\dt"
```

---

## Step 8: Install Dependencies & Build

```bash
cd /var/www/cctv-website

# Install dependencies
npm install

# Build the application
npm run build

# Test if build was successful
npm start
# Press Ctrl+C to stop after verifying it starts correctly
```

---

## Step 9: Install PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start npm --name "cctv-website" -- start

# Configure PM2 to start on boot
pm2 startup systemd
# Copy and run the command it outputs

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs cctv-website
```

### Useful PM2 Commands

```bash
pm2 restart cctv-website   # Restart app
pm2 stop cctv-website      # Stop app
pm2 logs cctv-website      # View logs
pm2 monit                  # Monitor resources
```

---

## Step 10: Install & Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Create Nginx Configuration

```bash
# Create new site configuration
sudo nano /etc/nginx/sites-available/cctv-website
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain or IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Image optimization
    location ~* \.(jpg|jpeg|png|gif|ico|webp)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable the site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cctv-website /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Step 11: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS

# Check status
sudo ufw status
```

---

## Step 12: Setup SSL Certificate (Free with Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 13: Setup Database Backup

Create a backup script:

```bash
# Create backup directory
sudo mkdir -p /var/backups/postgresql

# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

Add this content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="cctv_quotation_db"

# Create backup
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${DB_NAME}_${TIMESTAMP}.sql.gz"
```

Make it executable:

```bash
sudo chmod +x /usr/local/bin/backup-db.sh

# Test the backup
sudo -u postgres /usr/local/bin/backup-db.sh
```

### Setup Daily Backup Cron Job

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /usr/local/bin/backup-db.sh
```

---

## Step 14: Setup Log Rotation

```bash
# Create log rotation config
sudo nano /etc/logrotate.d/cctv-website
```

Add this content:

```
/home/ubuntu/.pm2/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

---

## Step 15: Performance Optimization

### Enable Nginx Caching

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;
```

### PostgreSQL Tuning

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Optimize for your server (example for 2GB RAM):

```
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 5242kB
min_wal_size = 1GB
max_wal_size = 4GB
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

---

## Step 16: Monitoring Setup (Optional but Recommended)

```bash
# Install monitoring tools
sudo npm install -g pm2-logrotate
pm2 install pm2-logrotate

# Monitor server resources
sudo apt install -y htop

# Check logs
pm2 logs cctv-website --lines 100
```

---

## Deployment Checklist

- [ ] Ubuntu server updated
- [ ] Node.js 20+ installed
- [ ] PostgreSQL installed and configured
- [ ] Application code transferred
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] Dependencies installed
- [ ] Application built successfully
- [ ] PM2 configured and running
- [ ] Nginx installed and configured
- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Database backup configured
- [ ] Domain DNS configured (if using domain)

---

## Post-Deployment Tasks

### 1. Test Your Website

```bash
# Check if app is running
pm2 status

# Check Nginx
sudo systemctl status nginx

# Test website
curl http://localhost:3000
curl http://yourdomain.com
```

### 2. Monitor Logs

```bash
# PM2 logs
pm2 logs cctv-website

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 3. Update Deployment

When you make changes:

```bash
cd /var/www/cctv-website

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Restart with PM2
pm2 restart cctv-website

# Clear Nginx cache (if needed)
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs cctv-website --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart cctv-website
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
sudo -u postgres psql -d cctv_quotation_db

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# Verify environment variables
cat /var/www/cctv-website/.env.local
```

### Nginx Issues

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx
sudo systemctl reload nginx

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

---

## Security Best Practices

1. **Change default PostgreSQL password**
2. **Use strong passwords** for all services
3. **Keep system updated**: `sudo apt update && sudo apt upgrade`
4. **Setup fail2ban** to prevent brute force attacks
5. **Regular backups** - test restore process
6. **Monitor logs** regularly
7. **Use SSH keys** instead of passwords
8. **Disable root SSH login**

---

## Maintenance Commands

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Clean old packages
sudo apt autoremove -y
sudo apt autoclean

# Check disk space
df -h

# Check memory usage
free -m

# Monitor processes
htop

# PM2 maintenance
pm2 update
pm2 flush  # Clear logs
```

---

## Support & Contact

For issues or questions:
- Check logs: `pm2 logs cctv-website`
- Review Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check PostgreSQL: `sudo systemctl status postgresql`

---

## Quick Reference Commands

```bash
# Application
pm2 restart cctv-website
pm2 logs cctv-website
pm2 monit

# Nginx
sudo systemctl reload nginx
sudo nginx -t

# PostgreSQL
sudo systemctl restart postgresql
sudo -u postgres psql -d cctv_quotation_db

# System
sudo ufw status
sudo systemctl status
df -h
```

---

**Deployment Date**: January 30, 2026  
**Next.js Version**: 16.1.1  
**Node.js Version**: 20.x  
**PostgreSQL Version**: Latest from Ubuntu repos
