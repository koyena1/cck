# QUICK FIX GUIDE - Login Error 500

## The Problem:
- Database password is not set correctly in `.env.local`
- Database might not exist yet
- Port conflicts with Next.js

## STEP-BY-STEP FIXES:

### 1. Update Database Password
Open `.env.local` and replace `your_password_here` with your actual PostgreSQL password:

```env
DB_USER=postgres
DB_PASSWORD=YOUR_ACTUAL_POSTGRES_PASSWORD
DB_NAME=cctv_platform
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

### 2. Create Database & Tables

**Option A: Using pgAdmin**
1. Open pgAdmin 4
2. Connect with your postgres password
3. Right-click "Databases" → Create → Database
4. Name: `cctv_platform`
5. Open Query Tool
6. Copy everything from `schema.sql` and run it

**Option B: Using Command Line**
```powershell
# Open PostgreSQL command line
psql -U postgres

# Enter your password when prompted

# Create database
CREATE DATABASE cctv_platform;

# Connect to it
\c cctv_platform

# Run schema file
\i E:/cctv/schema.sql

# Check if tables created
\dt

# Verify admin exists
SELECT * FROM admins;

# Exit
\q
```

### 3. Kill Existing Server & Restart
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Restart dev server
npm run dev
```

### 4. Test Login
- Go to: http://localhost:3000/login (or 3001 if port changed)
- Email: admin@gmail.com
- Password: 123456789

---

## Still Getting Error?

Check if database is accessible:
```powershell
# Test connection
psql -U postgres -d cctv_platform -c "SELECT * FROM admins;"
```

If you see the admin record, the database is working!

---

## Common Issues:

### "database does not exist"
→ Run Step 2 above

### "password authentication failed"
→ Check DB_PASSWORD in .env.local

### "relation admins does not exist"
→ Run the schema.sql file (Step 2)

### Port 3000 in use
→ Either kill the process or use port 3001
```

Let me know what error message you see in the terminal when the login fails!
