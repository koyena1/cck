# CCTV Website - Server Deployment Summary

## 📋 What You Have

I've created comprehensive deployment documentation for your CCTV website:

### 1. **DEPLOYMENT-GUIDE.md** (Main Guide)
   - Complete step-by-step instructions
   - 16 detailed steps covering everything
   - Server setup, database, Nginx, SSL
   - Security and optimization tips
   - Troubleshooting section

### 2. **deploy.sh** (Quick Deployment Script)
   - Automated deployment after initial setup
   - Updates code, rebuilds, restarts app
   - Use for future updates

### 3. **setup-database.sh** (Database Setup Script)
   - Automated database creation
   - Schema import
   - User configuration

### 4. **PRE-DEPLOYMENT-CHECKLIST.md**
   - Things to prepare before starting
   - Common issues and solutions
   - Testing procedures

### 5. **.env.example**
   - Template for environment variables
   - Copy to .env.local on server

### 6. **README-DEPLOYMENT.md**
   - Quick reference
   - Common commands

---

## 🚀 Quick Start Guide

### Step 1: Prepare Your Server
```bash
# SSH into your Ubuntu server
ssh username@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Required Software
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 3: Transfer Your Code
```bash
# Create directory
sudo mkdir -p /var/www/cctv-website
sudo chown -R $USER:$USER /var/www/cctv-website

# Option A: Using Git (recommended)
cd /var/www/cctv-website
git clone YOUR_REPOSITORY_URL .

# Option B: Upload files using SCP/FileZilla
# From Windows: scp -r E:\cctv\* user@server:/var/www/cctv-website/
```

### Step 4: Setup Database
```bash
cd /var/www/cctv-website

# Make script executable
chmod +x setup-database.sh

# Run database setup
./setup-database.sh
```

### Step 5: Configure Environment
```bash
# Create environment file
cp .env.example .env.local

# Edit with your values
nano .env.local
```

### Step 6: Build and Deploy
```bash
# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start npm --name "cctv-website" -- start
pm2 startup
pm2 save
```

### Step 7: Configure Nginx
```bash
# Create Nginx configuration (see DEPLOYMENT-GUIDE.md)
sudo nano /etc/nginx/sites-available/cctv-website

# Enable site
sudo ln -s /etc/nginx/sites-available/cctv-website /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: Setup SSL (Optional but Recommended)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔄 For Future Updates

After initial setup, use the deployment script:

```bash
cd /var/www/cctv-website
chmod +x deploy.sh
./deploy.sh
```

---

## 📊 Key Technologies

- **Frontend**: Next.js 16.1.1 (Turbopack)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Process Manager**: PM2
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (Certbot)

---

## 🔒 Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Setup firewall (UFW)
- [ ] Install SSL certificate
- [ ] Setup regular backups
- [ ] Use SSH keys (not passwords)
- [ ] Keep system updated
- [ ] Monitor logs regularly

---

## 📝 Important Files on Server

```
/var/www/cctv-website/          # Application code
/var/www/cctv-website/.env.local # Environment variables (SECRET!)
/etc/nginx/sites-available/      # Nginx configuration
/var/log/nginx/                  # Nginx logs
/home/user/.pm2/logs/           # PM2 application logs
/var/backups/postgresql/         # Database backups
```

---

## 🆘 Emergency Commands

```bash
# Application not working?
pm2 restart cctv-website
pm2 logs cctv-website

# Nginx issues?
sudo nginx -t
sudo systemctl restart nginx

# Database issues?
sudo systemctl restart postgresql
sudo -u postgres psql -d cctv_quotation_db

# Check what's using port 3000
sudo lsof -i :3000

# Kill process on port 3000
sudo kill -9 $(sudo lsof -t -i:3000)
```

---

## 📞 Need Help?

1. Check logs first: `pm2 logs cctv-website`
2. Review DEPLOYMENT-GUIDE.md troubleshooting section
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify services: `sudo systemctl status postgresql nginx`

---

## ⏱️ Estimated Deployment Time

- **First time**: 1-2 hours (including SSL setup)
- **Future updates**: 2-5 minutes (using deploy.sh)

---

## 🎯 Next Steps After Deployment

1. Test website thoroughly
2. Add products through admin panel
3. Setup monitoring (optional)
4. Configure backups
5. Document admin credentials
6. Test on mobile devices
7. Setup Google Analytics (future)
8. Plan content updates

---

## 📁 All Deployment Files

1. `DEPLOYMENT-GUIDE.md` - Complete guide (16 steps)
2. `PRE-DEPLOYMENT-CHECKLIST.md` - Preparation checklist
3. `README-DEPLOYMENT.md` - Quick reference
4. `deploy.sh` - Deployment automation script
5. `setup-database.sh` - Database setup script
6. `.env.example` - Environment variables template
7. This file - `DEPLOYMENT-SUMMARY.md`

---

**Ready to deploy?** Start with **PRE-DEPLOYMENT-CHECKLIST.md** then follow **DEPLOYMENT-GUIDE.md**!

Good luck! 🚀
