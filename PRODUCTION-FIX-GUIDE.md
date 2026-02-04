# Production Server Fix Guide

## Issues Found:
1. ❌ `/admin/access` route missing (404 error)
2. ❌ `/api/ip-combo-products` failing with 500 error
3. ❌ Database tables missing on production server

## Fixes Applied:

### 1. Created `/admin/access` Page ✓
- Created: `app/admin/access/page.tsx`
- This fixes the 404 error for the "E. LOGIN" menu item

### 2. Enhanced API Error Logging ✓
- Updated: `app/api/ip-combo-products/route.ts`
- Updated: `app/api/solar-camera-products/route.ts`
- Now shows detailed error messages to help debug production issues

### 3. Created Production Database Setup Scripts ✓
- Created: `setup-production-database.js`
- Created: `setup-production-database.sh`

## Deploy to Production Server:

### Step 1: Upload Files to Server
```bash
# From your local machine, upload to server
scp setup-production-database.js user@168.231.121.116:/var/www/cctv-website/
scp schema*.sql user@168.231.121.116:/var/www/cctv-website/
scp add-*.sql user@168.231.121.116:/var/www/cctv-website/
scp insert-channels.sql user@168.231.121.116:/var/www/cctv-website/
scp update-*.sql user@168.231.121.116:/var/www/cctv-website/
```

### Step 2: SSH into Production Server
```bash
ssh user@168.231.121.116
cd /var/www/cctv-website
```

### Step 3: Setup Database on Server
```bash
# Make sure .env.local exists with correct DB credentials on server
node setup-production-database.js
```

### Step 4: Rebuild and Restart Application
```bash
# Build the Next.js application
npm run build

# Restart PM2 (if using PM2)
pm2 restart cctv-website

# OR restart your Node.js service
sudo systemctl restart your-service-name
```

### Step 5: Verify on Server
Check the logs to see the detailed error messages:
```bash
# PM2 logs
pm2 logs cctv-website

# OR check service logs
journalctl -u your-service-name -f
```

## Quick Test After Deployment:

1. Go to: `http://168.231.121.116/admin/access`
   - Should see the Access Management page (not 404)

2. Try adding a product in any category
   - Check console/logs for detailed error messages
   - The API will now show: table name, error code, and helpful hints

3. If you still see errors, check server logs for the detailed error output

## Environment Variables Required on Server:

Make sure your `.env.local` on the server has:
```env
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=cctv_platform
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=false  # or true if using SSL
```

## Common Issues:

### If database connection fails:
- Check if PostgreSQL is running on server
- Verify DB credentials in `.env.local`
- Check firewall rules (port 5432)

### If tables still don't exist:
- Run: `node setup-production-database.js` again
- Check PostgreSQL user has CREATE TABLE permissions

### If getting "relation already exists" errors:
- This is OK - it means tables already exist
- The setup script uses `CREATE TABLE IF NOT EXISTS`

## Testing Locally First:

Before deploying, test locally:
```bash
npm run build
npm start
```

Then visit:
- http://localhost:3000/admin/access (should work)
- Add a product from admin panel (should work)

---

## Need Help?

Check the server logs for detailed error messages. The enhanced error logging will show:
- Exact PostgreSQL error code
- Which table is causing the issue
- Helpful hints for fixing the problem
