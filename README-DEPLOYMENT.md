# CCTV Website - Production Deployment

This is a Next.js website for CCTV products with PostgreSQL database.

## Quick Start

1. Follow the **DEPLOYMENT-GUIDE.md** for full setup instructions
2. Use **deploy.sh** for quick deployments after initial setup

## Server Requirements

- Ubuntu 20.04 LTS or higher
- Node.js 20+
- PostgreSQL 12+
- Nginx
- 2GB RAM minimum

## Quick Commands

```bash
# Deploy updates
bash deploy.sh

# View logs
pm2 logs cctv-website

# Restart application
pm2 restart cctv-website

# Database backup
sudo -u postgres pg_dump cctv_quotation_db > backup.sql
```

## Important Files

- `DEPLOYMENT-GUIDE.md` - Complete deployment instructions
- `.env.example` - Environment variables template
- `deploy.sh` - Quick deployment script
- `schema.sql` - Main database schema
- `schema-quotation-settings.sql` - Quotation settings schema

## Support

For deployment issues, check:
1. Application logs: `pm2 logs cctv-website`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. PostgreSQL: `sudo systemctl status postgresql`
