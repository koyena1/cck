# Quick Start: Customer Authentication System

## 🚀 Installation Steps

### 1. Database Setup (Required)

**Option A: Using PowerShell Script**
```powershell
# Edit run-customer-table-migration.ps1 first
# Update line 6 with your PostgreSQL password:
$env:PGPASSWORD = "your_password_here"

# Then run:
.\run-customer-table-migration.ps1
```

**Option B: Manual SQL Execution**
```bash
# Using psql command line
psql -U postgres -d cctv_platform -f create-customers-table.sql

# Or open create-customers-table.sql in pgAdmin and execute it
```

### 2. Verify Database

```sql
-- Check if table was created
SELECT * FROM customers;

-- Should return: 0 rows (table is empty initially)
```

### 3. Start Development Server

```bash
npm run dev
```

### 4. Test the System

Go to: `http://localhost:3000`

## 🧪 Quick Test

### Test Registration
1. Click **"Login / Register"** in the navbar
2. Click **"Don't have an account? Create one"**
3. Fill in the form:
   ```
   Full Name:     Test User
   Email:         test@example.com
   Phone:         1234567890
   Password:      test123
   Confirm Pass:  test123
   ```
4. Click **"Create Account"**
5. ✅ You should see: "Registration successful!"

### Test Login
1. After registration, you'll auto-switch to login
2. Enter:
   ```
   Email:     test@example.com
   Password:  test123
   ```
3. Click **"Login"**
4. ✅ Modal closes, page refreshes, navbar shows "Test User"

### Test Logout
1. Click the **logout icon** (next to your name)
2. ✅ Page refreshes, navbar shows "Login / Register" again

## 📋 Files Created/Modified

### New Files (6)
```
✨ create-customers-table.sql
✨ run-customer-table-migration.ps1
✨ components/customer-auth-modal.tsx
✨ app/api/auth/customer/login/route.ts
✨ app/api/auth/customer/register/route.ts
✨ CUSTOMER-AUTH-IMPLEMENTATION.md
✨ CUSTOMER-AUTH-FLOW.md
✨ CUSTOMER-AUTH-QUICK-START.md (this file)
```

### Modified Files (1)
```
📝 components/navbar.tsx
   - Added customer auth modal integration
   - Added customer session display
   - Added logout functionality
   - Added LogOut icon import
```

## 🎯 What Works Now

### ✅ Customers Can:
- Open login/register modal from navbar
- Register new accounts
- Login with credentials
- See their name in navbar after login
- Logout from navbar
- Stay on home page throughout (no navigation away)

### ✅ Dealers/Admins Can Still:
- Use existing `/login` page
- Use existing `/admin/login` page
- Nothing changed for them!

## 🔍 Troubleshooting

### Modal doesn't open
```bash
# Check if component exists
ls components/customer-auth-modal.tsx

# Check console for errors
# Open browser DevTools (F12) and look at Console tab
```

### Database error: "relation customers does not exist"
```bash
# You forgot to run the migration!
.\run-customer-table-migration.ps1
```

### "Email already registered"
```sql
-- Check existing users
SELECT * FROM customers;

-- Delete test user if needed
DELETE FROM customers WHERE email = 'test@example.com';
```

### Session not persisting
```javascript
// Check localStorage in browser DevTools
// Application tab > Local Storage > http://localhost:3000
// Should see: customerToken, customerName, customerEmail
```

## 📱 Mobile Testing

1. Open DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select a mobile device
4. Test all flows work on mobile

## 🔐 Important Security Note

**⚠️ This is a development implementation only!**

Before deploying to production, you MUST:
- [ ] Hash passwords with bcrypt
- [ ] Use proper JWT tokens
- [ ] Implement HTTPS
- [ ] Add rate limiting
- [ ] Add email verification
- [ ] Use HTTP-only cookies instead of localStorage

See `CUSTOMER-AUTH-IMPLEMENTATION.md` for details.

## 📚 Full Documentation

- **Implementation Guide**: `CUSTOMER-AUTH-IMPLEMENTATION.md`
- **Flow Diagrams**: `CUSTOMER-AUTH-FLOW.md`
- **This Quick Start**: `CUSTOMER-AUTH-QUICK-START.md`

## ✅ Success Criteria

You know it's working when:
1. ✅ Modal opens when clicking "Login / Register"
2. ✅ Can register new customer successfully
3. ✅ Can login with registered credentials
4. ✅ Customer name appears in navbar after login
5. ✅ Logout clears session and refreshes page
6. ✅ Dealer/admin login at `/login` still works unchanged
7. ✅ Mobile menu shows customer auth options

## 🎉 Done!

If all checks pass, your customer authentication system is fully functional!

**Need help?** Check the troubleshooting section or the full documentation in `CUSTOMER-AUTH-IMPLEMENTATION.md`.
