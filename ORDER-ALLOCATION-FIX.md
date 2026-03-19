# Order Allocation Fix - Product ID Mismatch Issue

## Problem Summary
Order PR-110326-020 was stuck as "Pending Admin Review" even though 5 dealers had the product (CP-UVR-0401E1-CS) in stock.

## Root Cause
The system has **TWO separate product tables**:

1. **`products`** table - Customer-facing product catalog
   - Referenced by `order_items.product_id`
   - Contains products that customers order

2. **`dealer_products`** table - Dealer-specific product catalog  
   - Referenced by `dealer_inventory.product_id`
   - Contains products that dealers stock

### The Bug
The order allocation API was trying to match:
- Order products (using `product_id` from `products` table)
- Against dealer inventory (using `product_id` from `dealer_products` table)

**These are DIFFERENT ID spaces!** So matches always failed even when dealers had the product.

## The Fix
Changed matching logic from **product IDs** to **product names/model numbers**:

### Before (Broken):
```sql
-- Get order product IDs from products table
array_agg(oi.product_id) as product_ids

-- Try to match against dealer_products IDs ❌ MISMATCH
WHERE di.product_id = ANY($2::INTEGER[])
```

### After (Fixed):
```sql
-- Get order product NAMES
array_agg(oi.item_name) as product_names

-- Match against dealer_products model_number ✅ CORRECT
JOIN dealer_products dp ON di.product_id = dp.id
WHERE dp.model_number = ANY($2::TEXT[])
```

## Files Changed
1. **app/api/order-allocation/route.ts**
   - Line 26: Changed from `product_ids` to `product_names`
   - Line 107-139: Updated dealer matching query to join `dealer_products` and match by `model_number`
   - Lines 159-243: Updated logging to use `uniqueProductNames` instead of `uniqueProductIds`

## Verification Results
### Test Query Results:
**OLD Logic (by product_id):** 0 dealers found ❌  
**NEW Logic (by model_number):** 5 dealers found ✅

### Dealers with Product CP-UVR-0401E1-CS:
- **Dealer 3 (Protechtur)** - Pincode 721636 (Exact match!) - 50 units
- Dealer 4 (pp) - Pincode 721635 - 3 units
- Dealer 5 (Dealing) - Pincode 721637 - 20 units
- Dealer 8 (entrepreneur) - No pincode - 1 unit
- Dealer 9 (auwsmb) - No pincode - 3 units

## Order PR-110326-020 Status
✅ **Successfully Allocated!**
- **Assigned to:** Dealer 3 (Protechtur)
- **Distance:** 0.00 km (same pincode: 721636)
- **Status Changed:** "Pending Admin Review" → "Dealer Pending"
- **Request ID:** 54
- **Products Available:** 50 units in stock

## Impact
This fix affects **ALL future orders**. Previously, NO orders could be automatically allocated to dealers because of this product ID mismatch. Now the system correctly:

1. Reads order item names from orders
2. Matches them to dealer product model numbers
3. Finds dealers with inventory
4. Assigns to nearest dealer with all products in stock

## Next Steps
- Monitor new orders to ensure allocation works correctly
- Consider adding model_number index to dealer_products for better performance
- Consider consolidating product tables or adding proper ID mapping in future refactor
