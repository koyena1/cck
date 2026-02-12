# Customer Authentication Database Setup - PRODUCTION FIX

## Problem
Getting 500 error when trying to register/login customers in production.

## Root Cause
The `customers` table likely doesn't exist in your production PostgreSQL database.

## Solution - Follow these steps:

### Step 1: Check Database Status
Visit this URL on your production server:
```
https://your-domain.com/api/check-customer-db
```

This will tell you:
- If the customers table exists
- Current table structure
- Number of customers in the database

### Step 2: Run SQL Setup Script on Production

**Option A: Using psql command line**
```bash
# On your production server
psql -U your_db_user -d your_db_name -f /var/www/cctv-website/setup-customer-auth-production.sql
```

**Option B: Using pgAdmin or other GUI**
1. Open pgAdmin and connect to your production database
2. Open the query tool
3. Copy and paste the contents of `setup-customer-auth-production.sql`
4. Execute the script

**Option C: Using command line directly**
```bash
# SSH into your production server
cd /var/www/cctv-website

# Run the SQL script
sudo -u postgres psql -d your_database_name -f setup-customer-auth-production.sql
```

### Step 3: Verify Setup
After running the script, visit the check endpoint again:
```
https://your-domain.com/api/check-customer-db
```

You should see:
```json
{
  "success": true,
  "tableExists": true,
  "customerCount": 0,
  "columns": [...]
}
```

### Step 4: Test Registration
Try registering a new customer on your website. It should now work!

## Common Issues & Solutions

### Issue: "permission denied for schema public"
**Solution:**
```sql
GRANT ALL ON SCHEMA public TO your_db_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_db_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
```

### Issue: "relation customers already exists"
This is fine! It means the table already exists. The script uses `CREATE TABLE IF NOT EXISTS`.

### Issue: Still getting 500 error after setup
**Check:**
1. Database connection string in `.env` file
2. Database user has proper permissions
3. Check server logs: `pm2 logs` or `journalctl -u your-service-name`

## Database Connection Info Needed

Make sure your production `.env.local` file has:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
```

## Quick Verification Commands

Check if table exists:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'customers';
```

Check table structure:
```sql
\d customers
```

Insert a test customer:
```sql
INSERT INTO customers (full_name, email, phone_number, password_hash) 
VALUES ('Test User', 'test@example.com', '1234567890', 'test123');
```

Query customers:
```sql
SELECT * FROM customers;
```

## After Setup

Once the table is created, your customer authentication should work:
- Registration at `/` (home page)
- Login at `/` (home page)
- Customer dashboard at `/customer/dashboard`

## Need Help?

If you're still facing issues, check:
1. Browser console for specific error messages
2. Server logs: `pm2 logs` or check your server logs
3. Database logs: `tail -f /var/log/postgresql/postgresql-*.log`
