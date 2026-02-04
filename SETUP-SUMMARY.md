# Unified Orders System - Setup Summary

## What Was Done

I've analyzed your database backup (`bkp_3_2_2026.sql`) and implemented a **unified orders system** that combines:

1. ✅ **Product Cart Orders** - From your category product pages (HD Camera, IP Camera, WiFi Camera, etc.)
2. ✅ **Quotation Orders** - From HD Combo/IP Combo quotation forms
3. ✅ **Single Admin View** - All orders visible in one place with order type indicators

## Key Changes

### 1. Database Migration
- **File**: `unified-orders-migration.sql`
- **Action**: Adds columns to existing `orders` table to support cart orders
- **New Columns**:
  - `products` (JSONB) - Array of cart products
  - `products_total` (NUMERIC) - Subtotal of products
  - `with_amc` (BOOLEAN) - AMC service option
  - `amc_details` (JSONB) - AMC plan details
  - `amc_cost` (NUMERIC) - AMC cost
  - `landmark` (VARCHAR) - Address landmark

### 2. API Integration
- **File**: `app/api/orders/route.ts`
- **Changes**: Updated to use existing `orders` table with `order_type = 'product_cart'`
- **Mapping**:
  - Form's "address" → database's `installation_address`
  - Form's "pinCode" → database's `pincode`
  - Products array stored in `products` JSONB column

### 3. Admin Panel
- **File**: `app/admin/orders/page.tsx`
- **New Features**:
  - Order type badges (🛒 Cart, 📦 HD Combo, 📋 Quotation)
  - Case-insensitive status filtering
  - Unified view of all order types

## Files Created

1. **unified-orders-migration.sql** - Database migration script
2. **run-unified-orders-migration.ps1** - Automated migration script
3. **UNIFIED-ORDERS-GUIDE.md** - Complete documentation
4. **pgadmin-quick-queries.sql** - 20 useful SQL queries for pgAdmin
5. **SETUP-SUMMARY.md** - This file

## Next Steps (Important!)

### Step 1: Run the Migration in pgAdmin

**Option A: Using pgAdmin (Recommended)**
1. Open **pgAdmin**
2. Connect to your database: **cctv_platform**
3. Right-click on database → **Query Tool**
4. Click **Open File** button (folder icon)
5. Select: `unified-orders-migration.sql`
6. Click **Execute** (▶️ Play button or F5)
7. Check for success message

**Option B: Using PowerShell Script**
```powershell
.\run-unified-orders-migration.ps1
```

### Step 2: Verify Migration
Open pgAdmin Query Tool and run:
```sql
-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('products', 'with_amc', 'landmark')
ORDER BY column_name;
```

Expected output: Should show 3 rows (products, with_amc, landmark)

### Step 3: Test the System

#### Test Cart Order:
1. Go to any category page (e.g., HD Camera)
2. Add a product to cart
3. Click cart icon → "Proceed to Checkout"
4. Click "Buy Now"
5. Fill customer details form
6. Click "COD" button
7. Order should be created

#### Verify in Admin:
1. Go to Admin → Orders
2. You should see:
   - New order with 🛒 Cart badge
   - Any existing quotation orders with 📦 HD Combo badge
   - All orders in one unified list

### Step 4: Verify in Database
Open pgAdmin Query Tool and run:
```sql
-- View recent orders with type
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  total_amount,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

Your new cart order should appear with `order_type = 'product_cart'`

## Database Structure

Your existing `orders` table NOW supports:

### Common Fields (All Order Types)
- order_id, order_number
- customer_name, customer_phone, customer_email
- **order_type** (identifies source: 'product_cart', 'hd_combo', 'quotation', etc.)
- installation_address, pincode, city, state
- total_amount, status, payment_method, payment_status
- created_at, updated_at

### Cart Order Specific Fields
- products (JSONB array)
- products_total
- with_amc, amc_details, amc_cost
- landmark

### Quotation Order Specific Fields
- combo_id, camera_type, brand, channels, dvr_model
- indoor_cameras, outdoor_cameras (JSONB)
- storage_size, cable_option
- includes_accessories

## Testing Checklist

- [ ] Migration completed in pgAdmin
- [ ] New columns exist in orders table
- [ ] Add product to cart from category page
- [ ] Complete checkout and place order
- [ ] Order appears in admin panel with 🛒 Cart badge
- [ ] Existing quotation orders still visible
- [ ] Status filters work correctly
- [ ] Order type badges display correctly

## Useful pgAdmin Queries

Use the file `pgadmin-quick-queries.sql` for 20 pre-written queries including:
- View all orders
- View cart orders only
- View quotation orders only
- Statistics by order type
- Today's orders
- Search by customer phone
- Revenue reports
- And more...

## Order Types Reference

| Order Source | order_type Value | When Used |
|--------------|-----------------|-----------|
| **Product Cart** | `product_cart` | User buys from category pages |
| **HD Combo** | `hd_combo` | HD combo quotation |
| **Quotation** | `quotation` | General quotation |
| **IP Combo** | `ip_combo` | IP combo quotation |

## Visual Indicators in Admin

When you open Admin → Orders, you'll see badges:
- **🛒 Cart** - Orders from product categories (new)
- **📦 HD Combo** - Orders from HD combo quotations (existing)
- **📋 Quotation** - Orders from quotation forms (existing)

## Troubleshooting

### Migration Errors
If migration fails:
1. Check you're connected to **cctv_platform** database
2. Ensure columns don't already exist (migration is idempotent)
3. Check PostgreSQL user has ALTER TABLE permission

### Orders Not Showing
1. Open browser Console (F12)
2. Go to Admin → Orders
3. Check Network tab for `/api/orders` request
4. Verify response contains orders array
5. Check database: `SELECT COUNT(*) FROM orders;`

### Cart Order Not Creating
1. Fill all form fields (all are mandatory)
2. Check browser console for validation errors
3. Check Network tab for POST to `/api/orders`
4. Verify error response if any

## Architecture Overview

```
Cart Product Flow:
Category Page → Add to Cart → Cart Sidebar → 
Cart Checkout → Buy Now Page → Customer Form → 
Submit Order → API (/api/orders POST) → 
Database (orders table with order_type='product_cart') → 
Admin Panel (shows with 🛒 Cart badge)

Quotation Flow (Existing):
Quotation Page → Configure HD Combo → Submit → 
API (/api/leads POST) → 
Database (orders table with order_type='hd_combo') → 
Admin Panel (shows with 📦 HD Combo badge)
```

## Support Files

1. **UNIFIED-ORDERS-GUIDE.md** - Complete detailed guide
2. **pgadmin-quick-queries.sql** - 20 useful SQL queries
3. **unified-orders-migration.sql** - Migration script
4. **run-unified-orders-migration.ps1** - Automated setup

## Success Indicators

✅ Migration successful if:
- No errors in pgAdmin execution
- Query shows new columns exist
- Views created successfully

✅ System working if:
- Cart order creates successfully
- Order appears in admin with correct badge
- Both order types visible in unified view
- Status filters work
- Stats cards show correct counts

## Contact/Issues

If you encounter issues:
1. Check **UNIFIED-ORDERS-GUIDE.md** Troubleshooting section
2. Verify all migration steps completed
3. Check browser console and server logs
4. Test with fresh cart order
5. Run diagnostic queries from pgadmin-quick-queries.sql

---

**Status**: Implementation Complete ✅  
**Next Action**: Run migration in pgAdmin  
**Expected Time**: 2-3 minutes  

Once migration is complete, your unified orders system will be fully functional!
