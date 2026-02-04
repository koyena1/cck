# 🚀 Quick Start - Unified Orders System

## 📋 What You Need to Know

Your system now has **ONE unified orders table** that handles:
- ✅ Cart orders from product pages
- ✅ Quotation orders from HD combo forms
- ✅ Both visible in single admin panel

## ⚡ Quick Setup (3 Steps)

### Step 1️⃣: Open pgAdmin

1. Launch **pgAdmin 4**
2. Enter your master password
3. Expand **Servers** → **PostgreSQL**
4. Expand **Databases** → **cctv_platform**

### Step 2️⃣: Run Migration

1. Right-click **cctv_platform** → **Query Tool**
2. Click **📁 Open File** button (top toolbar)
3. Navigate to: `D:\cctv-website\`
4. Select: **unified-orders-migration.sql**
5. Click **▶️ Execute** (or press F5)
6. Wait for green checkmark ✅
7. Should see: "Unified orders migration completed successfully!"

### Step 3️⃣: Verify It Worked

In the same Query Tool, run:
```sql
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('products', 'with_amc', 'landmark');
```

**Expected Result**: 3 rows showing: landmark, products, with_amc

✅ If you see these 3 columns → **Migration Successful!**

## 🧪 Test the System

### Test 1: Create a Cart Order

1. Go to your website
2. Navigate to any category (e.g., HD Camera)
3. Click "Add to Cart" on any product
4. Click cart icon → "Proceed to Checkout"
5. Click "Buy Now"
6. Fill the form:
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
   - Address: 123 Test Street
   - City: Mumbai
   - State: Maharashtra
   - Pin Code: 400001
   - Landmark: Near Mall
7. Click **"COD"** button
8. Should see success message

### Test 2: Check Admin Panel

1. Go to: `/admin/orders`
2. You should see:
   - Your new test order with **🛒 Cart** badge
   - Any existing orders with **📦 HD Combo** or **📋 Quotation** badges
   - Stats cards showing counts

### Test 3: Verify in Database

In pgAdmin Query Tool, run:
```sql
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  total_amount,
  status
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

You should see your test order with `order_type = 'product_cart'`

## 📊 Understanding Order Types

| Badge | Order Type | Source |
|-------|-----------|--------|
| 🛒 Cart | product_cart | User bought from category pages |
| 📦 HD Combo | hd_combo | User requested HD combo quotation |
| 📋 Quotation | quotation | User submitted quotation form |

## 🎯 What Each File Does

| File | Purpose |
|------|---------|
| **unified-orders-migration.sql** | Adds new columns to orders table |
| **app/api/orders/route.ts** | API to create/fetch orders |
| **app/admin/orders/page.tsx** | Admin dashboard to view orders |
| **app/buy-now/page.tsx** | Customer form for cart orders |
| **pgadmin-quick-queries.sql** | Useful queries to explore data |

## 🔍 Useful pgAdmin Queries

Copy-paste these into pgAdmin Query Tool:

### View All Orders
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
```

### View Cart Orders Only
```sql
SELECT * FROM orders 
WHERE order_type = 'product_cart' 
ORDER BY created_at DESC;
```

### View Quotation Orders Only
```sql
SELECT * FROM orders 
WHERE order_type IN ('hd_combo', 'quotation') 
ORDER BY created_at DESC;
```

### Count Orders by Type
```sql
SELECT 
  order_type, 
  COUNT(*) as total,
  SUM(total_amount) as revenue
FROM orders
GROUP BY order_type;
```

### Today's Orders
```sql
SELECT * FROM orders 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Search by Phone
```sql
SELECT * FROM orders 
WHERE customer_phone = '9876543210';
```

## ❓ Troubleshooting

### Migration Fails
- ✅ Check connected to **cctv_platform** database
- ✅ Check PostgreSQL user has permissions
- ✅ Try closing and reopening Query Tool

### Cart Order Not Creating
- ✅ Fill ALL form fields (all mandatory)
- ✅ Open browser Console (F12) and check for errors
- ✅ Verify email format is correct
- ✅ Phone must be exactly 10 digits
- ✅ Pin code must be exactly 6 digits

### Orders Not Showing in Admin
- ✅ Open browser Console (F12)
- ✅ Go to Network tab
- ✅ Refresh Admin Orders page
- ✅ Look for `/api/orders` request
- ✅ Check if response has orders array

### Database Connection Error
- ✅ Check PostgreSQL service is running
- ✅ Verify connection details in `lib/db.ts`
- ✅ Check environment variables

## 📁 File Locations

All files are in: `D:\cctv-website\`

**Migration Files:**
- `unified-orders-migration.sql`
- `run-unified-orders-migration.ps1`

**Documentation:**
- `SETUP-SUMMARY.md` (overview)
- `UNIFIED-ORDERS-GUIDE.md` (detailed guide)
- `QUICK-START.md` (this file)

**Code Files:**
- `app/api/orders/route.ts` (API)
- `app/admin/orders/page.tsx` (Admin UI)
- `app/buy-now/page.tsx` (Customer form)

**Query Files:**
- `pgadmin-quick-queries.sql` (20 useful queries)

## ✅ Success Checklist

- [ ] Migration ran without errors
- [ ] Verified 3 new columns exist
- [ ] Created test cart order
- [ ] Order shows in admin with 🛒 badge
- [ ] Status filters work
- [ ] Can see order in database

## 🎉 All Done!

Your unified orders system is now ready!

**What happens now:**
1. Users can order from category pages → Creates cart order (order_type='product_cart')
2. Users can request quotations → Creates quotation order (order_type='hd_combo')
3. Both appear in Admin → Orders with badges showing type
4. You can filter by status, search, and manage all orders in one place

---

**Need More Help?**
- Detailed guide: `UNIFIED-ORDERS-GUIDE.md`
- SQL queries: `pgadmin-quick-queries.sql`
- Setup overview: `SETUP-SUMMARY.md`
