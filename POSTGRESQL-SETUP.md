# PostgreSQL Setup Guide for CCTV Platform

## Step-by-Step Setup Instructions

### 1. Install PostgreSQL (If not already installed)
- Download from: https://www.postgresql.org/download/windows/
- During installation, remember your **postgres** user password
- Default port: 5432

### 2. Configure Environment Variables
Edit `.env.local` file and update:
```
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE
DB_NAME=cctv_platform
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

### 3. Create Database and Tables

#### Option A: Using pgAdmin (GUI)
1. Open pgAdmin 4
2. Connect to PostgreSQL server (use your postgres password)
3. Right-click on "Databases" → Create → Database
4. Name it: `cctv_platform`
5. Open the Query Tool (Tools → Query Tool)
6. Copy and paste the contents of `schema.sql`
7. Click Execute (▶️ button)

#### Option B: Using psql (Command Line)
```powershell
# Open PowerShell as Administrator
psql -U postgres

# Inside psql:
CREATE DATABASE cctv_platform;
\c cctv_platform
\i E:/cctv/schema.sql
\dt
# You should see: admins, customers, customer_leads, dealers, products
\q
```

### 4. Install Dependencies
Run in PowerShell:
```powershell
npm install
```

This will install:
- `pg` (PostgreSQL client)
- `@types/pg` (TypeScript types)

### 5. Remove Old MSSQL Dependencies (Optional)
```powershell
npm uninstall mssql @types/mssql
```

### 6. Test Database Connection
Run the development server:
```powershell
npm run dev
```

Visit: http://localhost:3000

### 7. Verify Database Connection
Check the API endpoints:
- GET http://localhost:3000/api/leads
- POST http://localhost:3000/api/auth/login
  ```json
  {
    "email": "admin@gmail.com",
    "password": "123456789"
  }
  ```

## Database Tables Created

✅ **admins** - Admin user accounts
✅ **customers** - Customer accounts
✅ **customer_leads** - CCTV installation requests
✅ **dealers** - Dealer/installer accounts
✅ **products** - Product catalog

## Default Admin Account
```
Email: admin@gmail.com
Password: 123456789
```

## Common PostgreSQL Commands

```sql
-- View all tables
\dt

-- View table structure
\d dealers

-- Query data
SELECT * FROM admins;
SELECT * FROM dealers;
SELECT * FROM customer_leads;

-- Update admin password
UPDATE admins SET password_hash = 'new_password' WHERE email = 'admin@gmail.com';
```

## Troubleshooting

### Connection Error
- Verify PostgreSQL is running (Windows Services)
- Check DB_USER and DB_PASSWORD in `.env.local`
- Ensure database `cctv_platform` exists

### Port Conflict
If port 5432 is in use, change it in:
- PostgreSQL configuration
- `.env.local` file

### Permission Issues
```sql
-- Grant permissions (run in psql as postgres user)
GRANT ALL PRIVILEGES ON DATABASE cctv_platform TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

## Migration Complete! 🎉

All API routes now use PostgreSQL:
- ✅ `/api/leads` - Customer leads
- ✅ `/api/auth/login` - Multi-role login
- ✅ `/api/auth/register` - User registration
- ✅ `/api/admin/verify-dealer` - Dealer verification
- ✅ `/api/products` - Product catalog
- ✅ `/dealer/login` - Dealer login
- ✅ `/dealer/register` - Dealer registration

## Next Steps

1. **Security**: Implement password hashing (bcrypt)
2. **Production**: Set `DB_SSL=true` for hosted databases
3. **Backup**: Set up automated database backups
4. **Indexes**: Already created for optimal performance
