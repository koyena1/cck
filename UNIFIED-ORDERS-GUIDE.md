# Unified Orders System - Implementation Guide

## Overview

Your CCTV platform now has a **unified orders system** that handles orders from multiple sources:

1. **Product Cart Orders** - When users buy from product categories (HD Camera, IP Camera, WiFi Camera, etc.)
2. **Quotation Orders** - When users request HD combo quotations through the quotation form
3. **Future Order Types** - System is extensible for additional order sources

All orders are stored in a **single `orders` table** and displayed together in the admin panel.

---

## Database Changes

### Existing Table Structure
The `orders` table already existed with these columns:
- `order_id`, `order_number`, `customer_name`, `customer_phone`, `customer_email`
- `order_type` - Distinguishes order sources (hd_combo, quotation, product_cart, etc.)
- `installation_address`, `pincode`, `city`, `state`
- `combo_id`, `camera_type`, `brand`, `channels`, `dvr_model`
- `indoor_cameras`, `outdoor_cameras` (JSONB for quotation details)
- `storage_size`, `cable_option`
- `includes_accessories`, `includes_installation`
- `subtotal`, `installation_charges`, `delivery_charges`, `tax_amount`, `discount_amount`
- `total_amount`, `status`, `payment_method`, `payment_status`
- `assigned_dealer_id`, `expected_delivery_date`, `created_at`, `updated_at`

### New Columns Added
```sql
products              JSONB         -- Array of cart products for product_cart orders
products_total        NUMERIC(10,2) -- Subtotal of products
with_amc              BOOLEAN       -- AMC service opted
amc_details           JSONB         -- AMC plan details
amc_cost              NUMERIC(10,2) -- AMC service cost
landmark              VARCHAR(255)  -- Address landmark
```

### New Views Created
- `product_cart_orders` - Filters only cart-based orders
- `quotation_orders` - Filters only quotation/HD combo orders

---

## API Endpoints

### POST /api/orders
Creates a new product cart order

**Request Body:**
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "landmark": "Near City Mall",
  "products": [
    {
      "id": 1,
      "name": "HD Camera 2MP",
      "price": 2500,
      "quantity": 4,
      "category": "hd-camera"
    }
  ],
  "productsTotal": 10000,
  "withInstallation": true,
  "installationCost": 2000,
  "withAmc": true,
  "amcDetails": {
    "plan": "yearly",
    "duration": 12
  },
  "amcCost": 5000,
  "totalAmount": 17000,
  "paymentMethod": "cod",
  "status": "Pending"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "order_id": 123,
    "order_number": "ORD-20250203-0001",
    "customer_name": "John Doe",
    "status": "Pending",
    "created_at": "2025-02-03T10:30:00Z"
  }
}
```

### GET /api/orders
Fetches all orders (both types)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "order_id": 123,
      "order_type": "product_cart",
      "customer_name": "John Doe",
      "status": "Pending",
      "total_amount": 17000,
      ...
    },
    {
      "order_id": 122,
      "order_type": "hd_combo",
      "customer_name": "Jane Smith",
      "status": "Completed",
      "total_amount": 25000,
      ...
    }
  ]
}
```

### PATCH /api/orders
Updates order status

**Request Body:**
```json
{
  "id": 123,
  "status": "in-progress"
}
```

---

## Order Flow

### Product Cart Orders Flow
1. User adds products to cart from category pages
2. User clicks "Proceed to Checkout" → Goes to [Cart Checkout](app/cart-checkout/page.tsx)
3. User clicks "Buy Now" → Redirected to [Buy Now](app/buy-now/page.tsx)
4. User fills customer details form (name, email, phone, address, city, state, pincode, landmark)
5. User selects installation & AMC options
6. User clicks "Razorpay" or "COD" button
7. Order created with `order_type = 'product_cart'`
8. Cart cleared, user shown success message

### Quotation Orders Flow (Existing)
1. User goes to quotation page
2. User configures HD combo (channels, brand, cameras, etc.)
3. System calculates price
4. User submits quotation
5. Order created with `order_type = 'hd_combo'` or `'quotation'`

---

## Admin Panel Integration

### Orders Management Page
Location: `app/admin/orders/page.tsx`

**Features:**
- **Unified View** - Shows all orders regardless of type
- **Order Type Badge** - Visual indicator:
  - 🛒 Cart - Product cart orders
  - 📦 HD Combo - HD combo quotations
  - 📋 Quotation - General quotations
- **Status Filters** - All, Today, Pending, In Progress, Completed
- **Stats Cards** - Total Orders, Pending, In Progress, Completed
- **Order Details** - Customer info, phone, address, total amount
- **Case-Insensitive Status** - Handles both "Pending" and "pending"

**Status Colors:**
- Pending → Yellow
- In Progress → Blue
- Completed → Green
- Cancelled → Red
- Assigned → Purple
- Delivered → Green

---

## Migration Steps

### Option 1: Using PowerShell Script (Automated)
```powershell
# Run from project root
.\run-unified-orders-migration.ps1
```

The script will:
1. Prompt for database connection details
2. Auto-detect PostgreSQL installation
3. Run the migration SQL file
4. Show success confirmation

### Option 2: Using pgAdmin (Manual)
1. Open pgAdmin
2. Connect to database: `cctv_platform`
3. Right-click database → Query Tool
4. Open file: `unified-orders-migration.sql`
5. Click Execute (F5)
6. Check for success message

### Option 3: Using psql Command Line
```bash
psql -h localhost -p 5432 -U postgres -d cctv_platform -f unified-orders-migration.sql
```

---

## Testing Checklist

### Before Migration
- [ ] Backup your database
- [ ] Note existing order count: `SELECT COUNT(*) FROM orders;`
- [ ] Verify quotation orders exist

### After Migration
- [ ] Check new columns added: `SELECT * FROM orders LIMIT 1;`
- [ ] Verify existing orders unchanged
- [ ] Test views: `SELECT * FROM product_cart_orders;`

### Cart Order Testing
- [ ] Add products to cart from category page
- [ ] Proceed to cart checkout
- [ ] Click "Buy Now"
- [ ] Fill all customer details
- [ ] Select installation option
- [ ] Select AMC option
- [ ] Click "COD" button
- [ ] Verify order created with `order_type = 'product_cart'`
- [ ] Check cart cleared after order
- [ ] View order in admin panel

### Admin Panel Testing
- [ ] Open admin orders page
- [ ] Verify both order types visible
- [ ] Check order type badges display correctly
- [ ] Test status filters (All, Pending, In Progress, Completed)
- [ ] Verify stats cards show correct counts
- [ ] Check order details display properly

---

## Order Type Mapping

| Order Source | order_type Value | Used For |
|--------------|-----------------|----------|
| Cart Products | `product_cart` | User buys from category pages |
| HD Combo | `hd_combo` | User requests HD combo quotation |
| Quotation Form | `quotation` | General quotation requests |
| IP Combo | `ip_combo` | IP camera combo orders |

---

## Column Mapping Reference

### Cart Orders Use:
- `customer_name`, `customer_phone`, `customer_email`
- `installation_address` (maps to form's "address")
- `pincode`, `city`, `state`, `landmark`
- `products` (JSONB array)
- `products_total`
- `includes_installation`, `installation_charges`
- `with_amc`, `amc_details`, `amc_cost`
- `total_amount`, `payment_method`, `payment_status`, `status`

### Quotation Orders Use:
- `customer_name`, `customer_phone`, `customer_email`
- `installation_address`, `pincode`, `city`, `state`
- `combo_id`, `camera_type`, `brand`, `channels`, `dvr_model`
- `indoor_cameras`, `outdoor_cameras` (JSONB)
- `storage_size`, `cable_option`
- `includes_accessories`, `includes_installation`
- `subtotal`, `installation_charges`, `delivery_charges`, `tax_amount`, `discount_amount`
- `total_amount`, `status`, `assigned_dealer_id`

---

## Troubleshooting

### Orders not showing in admin panel
1. Check API endpoint: Open browser console → Network tab
2. Verify response from `/api/orders`
3. Check database: `SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;`

### Cart orders not creating
1. Check browser console for errors
2. Verify form validation passes
3. Check API response in Network tab
4. Verify database connection in API route

### Migration fails
1. Check PostgreSQL is running
2. Verify database name is `cctv_platform`
3. Ensure user has ALTER TABLE permissions
4. Check for conflicting column names

### Order type badge not showing
1. Verify `order_type` column exists
2. Check admin page console for errors
3. Ensure orders have `order_type` value set

---

## Future Enhancements

### Planned Features
- [ ] Order details modal with full product list
- [ ] Status update from admin panel
- [ ] Dealer assignment interface
- [ ] Order tracking for customers
- [ ] Email notifications
- [ ] Invoice generation
- [ ] Payment integration with Razorpay

### Database Optimizations
- [ ] Add indexes on frequently queried columns
- [ ] Archive old completed orders
- [ ] Add full-text search on customer details

---

## Files Modified/Created

### New Files
- `unified-orders-migration.sql` - Database migration script
- `run-unified-orders-migration.ps1` - Migration automation script
- `UNIFIED-ORDERS-GUIDE.md` - This documentation

### Modified Files
- `app/api/orders/route.ts` - Updated to use unified orders table
- `app/admin/orders/page.tsx` - Added order type badges, case-insensitive filters

### Existing Files (No Changes)
- `app/buy-now/page.tsx` - Customer form already implemented
- `app/cart-checkout/page.tsx` - Cart display working
- `components/cart-context.tsx` - Cart management functional
- `app/api/leads/route.ts` - Quotation orders endpoint (unchanged)

---

## Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Verify all migration steps completed
3. Check browser and server console logs
4. Test with a fresh cart order

---

**Migration completed successfully! 🎉**

Your unified orders system is now ready to handle orders from both product categories and quotations in a single admin interface.
