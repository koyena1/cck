# 🔧 Alternative Migration Methods

Since `psql` command is not available, you have **3 options** to run the database migration:

---

## ✅ Option 1: Use Node.js Script (EASIEST)

Run the migration using Node.js (already have all dependencies):

```powershell
node run-guest-checkout-migration.js
```

This script will:
- ✅ Read your database config from `.env`
- ✅ Connect to PostgreSQL
- ✅ Run the migration SQL file
- ✅ Verify changes were applied
- ✅ Show detailed progress and errors

**Advantages:**
- No need to install PostgreSQL command-line tools
- Automatic verification
- Clear error messages
- Works on any system with Node.js

---

## ✅ Option 2: Use pgAdmin (GUI Method)

If you have pgAdmin installed:

### Step-by-Step:

1. **Open pgAdmin**
   - Launch pgAdmin application

2. **Connect to Database**
   - Expand Servers → PostgreSQL
   - Connect to your database
   - Find database: `cctv`

3. **Open Query Tool**
   - Right-click on `cctv` database
   - Select `Query Tool`

4. **Load SQL File**
   - Click folder icon (📁) or press `Ctrl+O`
   - Navigate to: `D:\cctv-website\`
   - Select: `add-guest-checkout-system.sql`
   - Click Open

5. **Execute Query**
   - Click Execute button (▶️) or press `F5`
   - Wait for "Query completed successfully" message

6. **Verify Changes**
   - Right-click on `cctv` database → Refresh
   - Check `orders` table columns
   - Check for new `email_logs` table

---

## ✅ Option 3: Add psql to PATH (For Future Use)

If you want to use `psql` command:

### For PostgreSQL Installed:

1. **Find PostgreSQL Installation**
   - Usually at: `C:\Program Files\PostgreSQL\{version}\bin\`
   - Or: `C:\Program Files (x86)\PostgreSQL\{version}\bin\`

2. **Add to System PATH**
   ```powershell
   # Check PostgreSQL version
   $pgPath = "C:\Program Files\PostgreSQL\16\bin"
   
   # Add to PATH temporarily (current session)
   $env:Path += ";$pgPath"
   
   # Now you can run psql
   psql -U postgres -d cctv -f add-guest-checkout-system.sql
   ```

3. **Add Permanently**
   - Windows Search → "Environment Variables"
   - System Properties → Environment Variables
   - Under "System variables", select "Path" → Edit
   - Click "New" → Add: `C:\Program Files\PostgreSQL\16\bin`
   - Click OK → Restart PowerShell

---

## 🎯 Recommended: Use Option 1 (Node.js Script)

**Run this command now:**

```powershell
node run-guest-checkout-migration.js
```

It's the easiest and gives you detailed feedback!

---

## 🐛 Troubleshooting

### If Node.js script fails:

**Error: "Cannot find module 'pg'"**
```powershell
npm install
```

**Error: "Connection refused"**
- Check if PostgreSQL is running
- Verify database name is "cctv" (check .env)
- Verify credentials in .env file

**Error: "Database does not exist"**
- Create database first:
```sql
-- In pgAdmin or psql
CREATE DATABASE cctv;
```

**Error: "Permission denied"**
- Grant permissions to your database user
- Or use postgres superuser

### Test Database Connection:

```powershell
# Create a quick test file
node -e "const {Pool}=require('pg');require('dotenv').config();const p=new Pool({user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,host:process.env.DB_HOST,port:process.env.DB_PORT});p.query('SELECT NOW()',(e,r)=>console.log(e?'❌ Failed':'✅ Connected!',e||r.rows[0]));"
```

---

## 📞 Still Having Issues?

1. **Check database is running:**
   ```powershell
   # Check if PostgreSQL service is running
   Get-Service -Name postgresql*
   ```

2. **Verify .env credentials:**
   ```
   DB_USER=postgres
   DB_PASSWORD=root
   DB_NAME=cctv
   DB_HOST=localhost
   DB_PORT=5432
   ```

3. **Try pgAdmin** (Option 2) - Most reliable GUI method

---

**Quick Command:**
```powershell
node run-guest-checkout-migration.js
```

This is the easiest way! 🚀
