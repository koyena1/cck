# Pre-Deployment Checklist

## Before You Start

### 1. Server Access
- [ ] Have server IP address
- [ ] Have SSH credentials (username/password or SSH key)
- [ ] Root or sudo access confirmed
- [ ] Server meets minimum requirements (2GB RAM, 2 CPU, 20GB storage)

### 2. Domain Configuration (Optional)
- [ ] Domain name purchased
- [ ] DNS A record pointing to server IP
- [ ] DNS propagation completed (check with `nslookup yourdomain.com`)

### 3. Code Preparation
- [ ] All code tested locally
- [ ] Database schema files ready (schema.sql, schema-quotation-settings.sql)
- [ ] Environment variables documented
- [ ] Git repository created (recommended)

### 4. Database Planning
- [ ] Database name decided: `cctv_quotation_db`
- [ ] Strong password generated for PostgreSQL
- [ ] Backup strategy planned

### 5. Security Preparation
- [ ] Strong passwords ready for:
  - [ ] PostgreSQL user
  - [ ] Server SSH
  - [ ] Admin panel (if applicable)
- [ ] Email address for SSL certificate
- [ ] Firewall rules planned

---

## Files to Prepare

1. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required values

2. **Database Schemas**
   - `schema.sql` - Ready to upload
   - `schema-quotation-settings.sql` - Ready to upload

3. **Code Transfer Method**
   - Option A: Git repository URL
   - Option B: Files ready for SCP/SFTP transfer

---

## Quick Setup Commands (Copy-Paste Ready)

### Initial Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Quick Verification
```bash
# Check versions
node --version    # Should be v20.x.x
npm --version     # Should be v10.x.x
psql --version    # Should show PostgreSQL version

# Check services
sudo systemctl status postgresql
sudo systemctl status nginx
```

---

## Common Issues & Solutions

### Issue 1: Cannot connect to server
**Solution**: Check firewall rules, verify SSH credentials

### Issue 2: PostgreSQL authentication failed
**Solution**: 
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Change 'peer' to 'md5' for postgres user
sudo systemctl restart postgresql
```

### Issue 3: Port 3000 already in use
**Solution**:
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Issue 4: Permission denied
**Solution**:
```bash
sudo chown -R $USER:$USER /var/www/cctv-website
```

---

## Post-Deployment Testing

### Test Application
```bash
# Check if app is running
pm2 status

# Test local access
curl http://localhost:3000

# Test external access (replace with your IP/domain)
curl http://your-server-ip
```

### Test Database
```bash
# Connect to database
sudo -u postgres psql -d cctv_quotation_db

# List tables
\dt

# Check a table
SELECT * FROM hd_combo_products LIMIT 1;

# Exit
\q
```

### Test Nginx
```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Check if serving content
curl http://your-server-ip
```

### Test SSL (if configured)
```bash
# Check certificate
sudo certbot certificates

# Test HTTPS
curl https://yourdomain.com
```

---

## Emergency Rollback

If something goes wrong:

```bash
# Stop application
pm2 stop cctv-website

# Restore previous code (if using git)
cd /var/www/cctv-website
git reset --hard HEAD~1
npm install
npm run build
pm2 restart cctv-website

# Restore database backup
sudo -u postgres psql -d cctv_quotation_db < backup.sql
```

---

## Support Contacts

- Server Provider: [Your hosting provider support]
- Domain Registrar: [Your domain registrar support]
- Developer: [Your contact info]

---

## Estimated Time

- Initial server setup: 30-45 minutes
- Application deployment: 15-20 minutes
- SSL certificate setup: 5-10 minutes
- Testing & verification: 10-15 minutes

**Total**: ~1-2 hours for first-time deployment

---

## Next Steps After Deployment

1. [ ] Test all pages and features
2. [ ] Test admin panel login
3. [ ] Add sample products
4. [ ] Setup monitoring
5. [ ] Configure backup schedule
6. [ ] Update DNS (if needed)
7. [ ] Test contact forms (if applicable)
8. [ ] Setup analytics (future)
9. [ ] Document admin credentials securely
10. [ ] Create maintenance schedule
