# Invoice & Allocation System Fixes - March 12, 2026

## Issues Fixed

### ✅ Issue 1: Invoice Shows Combined Product Price
**Problem:** Invoices were showing separate line items for Product and Installation/AMC
- Example: CP-UVC-T1100L2 (₹1,100) + Installation Service (₹3,000) = Two lines

**Solution:** For NEW orders, installation and AMC charges are now combined into the product price
- Example: CP-UVC-T1100L2 (with Installation) = ₹4,100 = One line

**Files Changed:**
- `app/api/orders/route.ts` - Regular checkout orders
- `app/api/guest-checkout/route.ts` - Guest checkout orders
- `app/customer/dashboard/page.tsx` - Customer invoice display
- `app/admin/orders/page.tsx` - Admin invoice display

**Impact:**
- ✅ NEW orders: Displays combined price with label "(with Installation)" or "(with AMC)"
- ⚠️ OLD orders: Still show separate items (database already has separate rows)

---

### ✅ Issue 2: Order Allocation Ignores Service Items
**Problem:** The allocation system was treating "Installation Service" and "AMC" as products and trying to find dealers with these items in their inventory. This caused all orders with installation/AMC to fail allocation and get stuck in "Pending Admin Review".

**Root Cause:**
```sql
-- OLD: Fetched ALL order items (products AND services)
array_agg(oi.item_name) as product_names

-- This included: ["CP-UVC-T1100L2", "Installation Service"]
-- System tried to find dealers with BOTH in stock → Failed!
```

**Solution:** Allocation now:
1. Only fetches items where `item_type = 'Product'` (excludes services)
2. Extracts model numbers from product names (removes "(with Installation)" suffix)
3. Matches only actual product model numbers against dealer inventory

**Files Changed:**
- `app/api/order-allocation/route.ts`

**Code Changes:**
```typescript
// OLD query - included services
array_agg(oi.item_name) as product_names

// NEW query - only products
array_agg(oi.item_name) FILTER (WHERE oi.item_type = 'Product') as product_names

// Extract model numbers (remove suffixes)
const productModelNumbers = uniqueProductNames.map((name: string) => {
  const match = name.match(/^([^(]+)/);
  return match ? match[1].trim() : name.trim();
});
// Example: "CP-UVC-T1100L2 (with Installation)" → "CP-UVC-T1100L2"
```

**Impact:**
- ✅ NEW orders: Will allocate correctly to dealers with product in stock
- ✅ OLD stuck orders: Can now be manually re-allocated using admin panel
- ✅ Order PR-110326-022: Successfully allocated to dealer "Protechtur" after fix

---

### ✅ Issue 3: Delivery & COD Charges in Invoices
**Problem:** Delivery charges and COD service charges were not showing in invoices

**Solution:** Invoices now display:
- Delivery Charges (if applicable)
- COD Service Charges (if payment method is COD)

**Files Changed:**
- `app/customer/dashboard/page.tsx`
- `app/admin/orders/page.tsx`

**Invoice Example (COD order with installation):**
```
S.No 1: CP-UVC-T1100L2 (with Installation) → ₹4,100

Breakdown:
  Products Subtotal:     ₹4,100
  Delivery Charges:      ₹50      (if applicable)
  IGST Amount (18%):     ₹738
  COD Service Charges:   ₹150     (extra COD handling fee)
  ───────────────────────────────
  GRAND TOTAL:           ₹5,038
```

---

## What's Different for Old Orders?

**Order PR-110326-022 (and other old orders):**

### Database Storage (Cannot Change):
- order_items table has: 
  - Row 1: CP-UVC-T1100L2 (Product) - ₹1,100
  - Row 2: Installation Service (Service) - ₹3,000

### What Will Display:
- **Admin Panel "Items Ordered"**: Shows 2 rows (as stored in database)
- **Invoice PDF**: Shows 2 rows (generated from database rows)
- **Payment Breakdown**: Shows separate Installation Charges line

This is expected and correct for old orders. Only NEW orders going forward will have the combined display.

---

## What's Different for New Orders?

**Any order created after this fix:**

### Database Storage:
- order_items table has:
  - Row 1: CP-UVC-T1100L2 (with Installation) (Product) - ₹4,100

### What Will Display:
- **Admin Panel "Items Ordered"**: Shows 1 row with combined price
- **Invoice PDF**: Shows 1 row with combined price
- **Payment Breakdown**: Still shows separate Installation Charges (for accounting/admin clarity)

---

## How to Handle Stuck Orders

If you have other orders stuck in "Pending Admin Review" due to this bug:

### Option 1: Manual Re-allocation via Admin Panel
1. Open the order in admin panel
2. Click "Manually Assign to Dealer" button
3. System will find dealers with product in stock
4. Select dealer and assign

### Option 2: Trigger Automatic Re-allocation
Use the fixed allocation API to retry allocation for stuck orders:
```javascript
// Example script
const orderId = 111; // Replace with actual order ID
fetch('http://localhost:3000/api/order-allocation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId })
});
```

---

## Testing Recommendations

1. **Test New Order Flow:**
   - Place a new order with installation
   - Verify invoice shows combined price
   - Verify order gets allocated to dealer automatically

2. **Test COD Orders:**
   - Place COD order
   - Verify COD service charges appear in invoice

3. **Test Manual Allocation:**
   - Find any "Pending Admin Review" orders
   - Use admin panel to manually assign to dealer
   - Verify it works correctly

---

## Summary

✅ **Fixed:** Invoice display combines installation/AMC with product price (new orders)
✅ **Fixed:** Order allocation no longer treats services as products  
✅ **Fixed:** Delivery and COD charges show in invoices
✅ **Verified:** Order PR-110326-022 successfully allocated after fix

⚠️ **Note:** Old orders will continue to show separate items (database cannot be retroactively changed without migration)

---

Date: March 12, 2026
Fixed by: GitHub Copilot
