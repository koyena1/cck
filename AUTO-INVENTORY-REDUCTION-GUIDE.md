# Automatic Inventory Reduction System

## Overview
When a dealer accepts an order, the system **automatically reduces** the dealer's inventory for the products in that order. This ensures real-time stock accuracy and prevents overselling.

---

## How It Works

### 1. **Order Creation & Allocation**
- Customer places an order with products
- System automatically allocates order to nearest dealer with sufficient stock
- Order status: `"Awaiting Dealer Confirmation"`

### 2. **Dealer Accepts Order**
- Dealer reviews the order request
- Dealer clicks "Accept" button
- **Automatic Process Triggered:**
  1. ✅ Order status updated to `"Allocated"`
  2. ✅ **Inventory automatically reduced** for each product
  3. ✅ `quantity_sold` incremented in `dealer_inventory` table
  4. ✅ `quantity_available` auto-calculated (purchased - sold)
  5. ✅ `last_sale_date` updated to current timestamp
  6. ✅ Inventory reduction logged in order allocation log

### 3. **Inventory Calculation**
```sql
quantity_available = quantity_purchased - quantity_sold
```

When dealer accepts order:
- `quantity_sold` increases by order quantity
- `quantity_available` decreases automatically (via trigger)

---

## Database Changes

### Modified API Endpoint
**File:** `app/api/dealer-order-response/route.ts`

**New Logic Added:**
```javascript
// Get order items
const orderItemsResult = await pool.query(`
  SELECT oi.product_id, oi.quantity, oi.item_name
  FROM order_items oi
  WHERE oi.order_id = $1 AND oi.product_id IS NOT NULL
`, [orderRequest.order_id]);

// Reduce inventory for each product
for (const item of orderItemsResult.rows) {
  await pool.query(`
    UPDATE dealer_inventory 
    SET quantity_sold = quantity_sold + $1,
        last_sale_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE dealer_id = $2 AND product_id = $3
  `, [item.quantity, dealerId, item.product_id]);
}
```

---

## Response Format

### API Response (Enhanced)
```json
{
  "success": true,
  "action": "accepted",
  "message": "Order ORD-001 accepted successfully",
  "order_id": 123,
  "inventory_reduced": true,
  "items_processed": 3,
  "inventory_details": [
    {
      "product_id": 45,
      "product_name": "4MP IP Camera",
      "quantity_reduced": 2,
      "previous_stock": 50,
      "new_stock": 48
    },
    {
      "product_id": 67,
      "product_name": "8CH NVR",
      "quantity_reduced": 1,
      "previous_stock": 20,
      "new_stock": 19
    }
  ]
}
```

---

## Example Flow

### Before Order Acceptance
```
Dealer Inventory:
├─ 4MP IP Camera (Product ID: 45)
│  ├─ Purchased: 50
│  ├─ Sold: 0
│  └─ Available: 50
│
└─ 8CH NVR (Product ID: 67)
   ├─ Purchased: 20
   ├─ Sold: 0
   └─ Available: 20
```

### Order Details
```
Order #ORD-001
├─ 4MP IP Camera × 2
└─ 8CH NVR × 1
```

### After Order Acceptance
```
Dealer Inventory:
├─ 4MP IP Camera (Product ID: 45)
│  ├─ Purchased: 50
│  ├─ Sold: 2  ← INCREASED
│  └─ Available: 48  ← AUTO-CALCULATED
│
└─ 8CH NVR (Product ID: 67)
   ├─ Purchased: 20
   ├─ Sold: 1  ← INCREASED
   └─ Available: 19  ← AUTO-CALCULATED
```

---

## Console Logs

The system provides detailed console logs for monitoring:

```
📦 Processing inventory reduction for 2 items
✅ Reduced stock for 4MP IP Camera (Product ID: 45): 50 → 48
✅ Reduced stock for 8CH NVR (Product ID: 67): 20 → 19
✅ Inventory reduced for 2 products
```

### Warning Messages
```
⚠️ Warning: Product XYZ (ID: 123) not found in dealer inventory
```

---

## Logging & Audit Trail

### Order Allocation Log
Every inventory reduction is logged in the `order_allocation_log` table:

```sql
INSERT INTO order_allocation_log (
  order_id, 
  dealer_id, 
  log_type, 
  message, 
  details
)
VALUES (
  123,
  456,
  'inventory_reduced',
  'Dealer inventory automatically reduced',
  '{
    "items_processed": 2,
    "inventory_updates": [...]
  }'
)
```

---

## Benefits

✅ **Real-Time Accuracy** - Inventory always reflects actual available stock  
✅ **Prevents Overselling** - Dealers can't accept more orders than stock available  
✅ **Automated Process** - No manual intervention required  
✅ **Full Audit Trail** - Every change is logged with timestamp  
✅ **Transparent Reporting** - API returns detailed inventory changes  

---

## Testing

### Test Script
Run the test script to verify functionality:

```powershell
# PowerShell
.\test-auto-inventory-reduction.ps1

# Or directly with Node.js
node test-auto-inventory-reduction.js
```

### Test Coverage
- ✅ Verifies inventory before acceptance
- ✅ Simulates dealer accepting order
- ✅ Confirms inventory reduction
- ✅ Validates calculations
- ✅ Checks order status update

---

## Edge Cases Handled

### 1. **Product Not in Inventory**
If a product in the order is not found in dealer's inventory:
- Warning logged to console
- Order still accepted
- Only available products have inventory reduced

### 2. **Zero Stock After Acceptance**
```
quantity_available = 0 (purchased: 10, sold: 10)
```
- Stock goes to zero
- Dealer won't receive new order requests for this product
- Dealer can purchase more stock to replenish

### 3. **Quotation Orders (No Products)**
- Orders with `product_id = NULL` are skipped
- Inventory reduction only applies to product orders
- Installation/quotation orders don't affect inventory

---

## Future Enhancements

### Possible Additions:
1. **Stock Alerts** - Notify dealer when stock goes below threshold
2. **Auto-Restock** - Suggest reordering when stock is low
3. **Inventory Reservation** - Reserve stock when order is pending (before acceptance)
4. **Stock History** - Track all inventory movements
5. **Bulk Operations** - Handle multiple orders simultaneously

---

## Related Files

- `/app/api/dealer-order-response/route.ts` - Main implementation
- `/app/api/order-allocation/route.ts` - Order allocation logic
- `/app/api/dealer-inventory/route.ts` - Manual inventory management
- `/add-dealer-inventory-system.sql` - Database schema
- `test-auto-inventory-reduction.js` - Test script

---

## Database Schema

### dealer_inventory Table
```sql
CREATE TABLE dealer_inventory (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id),
    product_id INTEGER REFERENCES dealer_products(id),
    quantity_purchased INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    quantity_available INTEGER DEFAULT 0,  -- Auto-calculated
    last_purchase_date TIMESTAMP,
    last_sale_date TIMESTAMP,             -- Updated on order acceptance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealer_id, product_id)
);
```

### Automatic Trigger
```sql
CREATE TRIGGER trigger_update_dealer_inventory_timestamp
BEFORE UPDATE ON dealer_inventory
FOR EACH ROW
EXECUTE FUNCTION update_dealer_inventory_timestamp();

-- This trigger automatically:
-- 1. Updates updated_at timestamp
-- 2. Calculates quantity_available = quantity_purchased - quantity_sold
```

---

## Summary

✨ **Everything happens automatically!**

When a dealer accepts an order:
1. Order status → `"Allocated"`
2. Inventory → **Automatically reduced**
3. Audit log → **Automatically created**
4. Calculations → **Automatically updated**

No manual intervention needed! 🎉
