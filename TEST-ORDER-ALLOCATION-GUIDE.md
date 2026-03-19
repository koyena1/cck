# 🧪 ORDER ALLOCATION TESTING GUIDE
## Testing: Nearest Dealer Selection Based on Location

---

## 📋 CURRENT SYSTEM STATUS

### How It Works Now:
1. ✅ **Pincode Matching**: Dealers with `service_pin` matching customer's pincode
2. ⚠️ **Distance Ranking**: Uses simple `ROW_NUMBER()` - NOT actual GPS distance
3. ✅ **Stock Verification**: Checks dealer inventory before allocation
4. ✅ **Auto-Escalation**: Times out after 6 hours, moves to next dealer

### The Issue:
The system currently uses `ROW_NUMBER()` instead of calculating **actual distance** using dealer's latitude/longitude coordinates. 

**Example Problem:**
- Customer at: 22.42°N, 87.32°E (Midnapore, 721637)
- Dealer A at: 22.50°N, 87.40°E (8km away) - Dealer ID: 5
- Dealer B at: 22.43°N, 87.33°E (2km away) - Dealer ID: 8

Currently, **Dealer A might get selected** (lower ID = lower row number) even though **Dealer B is closer**.

---

## 🎯 WHAT YOU NEED TO TEST

Test that orders go to the **geographically nearest dealer** first, regardless of:
- Dealer ID
- Registration date
- Alphabetical order

---

## 🛠️ STEP-BY-STEP TESTING PROCEDURE

### **Step 1: Prepare Test Dealers**

Create 3 dealers at different distances from a test location.

**Test Customer Location:** Midnapore, West Bengal (22.42°N, 87.32°E, PIN: 721637)

**Run this SQL to create test dealers:**

```sql
-- Delete any existing test dealers first
DELETE FROM dealers WHERE email LIKE '%testdealer%';

-- Test Dealer 1: Farthest (30km away)
INSERT INTO dealers (
  full_name, email, phone_number, business_name, business_address,
  service_pin, location, latitude, longitude,
  password_hash, status, rating
) VALUES (
  'Far Dealer', 'testdealer1@example.com', '9999999001', 
  'Far CCTV Store', 'Kharagpur, West Bengal',
  '721301', 'Kharagpur', 
  22.33, 87.23,  -- ~30km from customer
  'password123', 'Active', 4.5
);

-- Test Dealer 2: Nearest (5km away)
INSERT INTO dealers (
  full_name, email, phone_number, business_name, business_address,
  service_pin, location, latitude, longitude,
  password_hash, status, rating
) VALUES (
  'Near Dealer', 'testdealer2@example.com', '9999999002',
  'Near CCTV Store', 'Midnapore Town, West Bengal',
  '721101', 'Midnapore',
  22.43, 87.33,  -- ~5km from customer
  'password123', 'Active', 4.8
);

-- Test Dealer 3: Medium Distance (15km away)
INSERT INTO dealers (
  full_name, email, phone_number, business_name, business_address,
  service_pin, location, latitude, longitude,
  password_hash, status, rating
) VALUES (
  'Medium Dealer', 'testdealer3@example.com', '9999999003',
  'Medium CCTV Store', 'Panskura, West Bengal',
  '721139', 'Panskura',
  22.38, 87.45,  -- ~15km from customer
  'password123', 'Active', 4.2
);

-- Verify dealers were created
SELECT 
  dealer_id, 
  business_name, 
  location,
  latitude, 
  longitude,
  service_pin 
FROM dealers 
WHERE email LIKE '%testdealer%'
ORDER BY dealer_id;
```

---

### **Step 2: Add Test Products to Inventory**

Give all dealers the same product stock (so stock isn't a deciding factor):

```sql
-- Get product IDs (adjust if your products table has different IDs)
-- For this test, we'll use product_id = 1 (or any existing product)

-- Add stock to all test dealers
INSERT INTO dealer_inventory (dealer_id, product_id, quantity_available, quantity_reserved)
SELECT 
  d.dealer_id,
  1 as product_id,  -- Change this to an actual product_id from your products table
  100 as quantity_available,
  0 as quantity_reserved
FROM dealers d
WHERE d.email LIKE '%testdealer%';

-- Verify inventory
SELECT 
  di.dealer_id,
  d.business_name,
  di.product_id,
  di.quantity_available
FROM dealer_inventory di
JOIN dealers d ON di.dealer_id = d.dealer_id
WHERE d.email LIKE '%testdealer%';
```

---

### **Step 3: Create Test Order**

Create an order from a customer near Midnapore:

```sql
-- Create test order
INSERT INTO orders (
  customer_name, customer_phone, customer_email,
  order_type, installation_address, 
  pincode, city, state,
  latitude, longitude,  -- Customer's exact location
  total_amount, status, payment_method, payment_status
) VALUES (
  'Test Customer', '9876543210', 'testcustomer@example.com',
  'installation', '123 Test Street, Midnapore',
  '721637', 'Midnapore', 'West Bengal',
  22.42, 87.32,  -- Customer GPS coordinates
  25000, 'Pending', 'cod', 'Pending'
)
RETURNING order_id, order_number;

-- Note the order_id returned!
```

---

### **Step 4: Add Order Items**

```sql
-- Replace :order_id with the actual order_id from Step 3
INSERT INTO order_items (
  order_id, item_type, item_name, product_id, quantity, unit_price, total_price
) VALUES (
  :order_id,  -- Use actual order_id
  'Product',
  'Test CCTV Camera',
  1,  -- Same product_id as in inventory
  2,  -- Quantity
  5000,
  10000
);
```

---

### **Step 5: Trigger Order Allocation**

Now test the allocation system:

```sql
-- Call the allocation function manually OR use the API
-- Using API (recommended):

-- HTTP POST to: http://localhost:3000/api/order-allocation
-- Body: { "orderId": YOUR_ORDER_ID }
```

**Using Node.js test script:**

Create `test-allocation.js`:

```javascript
const orderIdToTest = 123; // Replace with actual order_id

fetch('http://localhost:3000/api/order-allocation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId: orderIdToTest })
})
.then(res => res.json())
.then(data => {
  console.log('\n🎯 ALLOCATION RESULT:');
  console.log('===================================');
  console.log('Success:', data.success);
  console.log('Allocated:', data.allocated);
  console.log('Dealer Name:', data.dealer_name);
  console.log('Dealer ID:', data.dealer_id);
  console.log('Dealers Available:', data.dealers_available);
  console.log('Message:', data.message);
  console.log('===================================\n');
})
.catch(err => console.error('Error:', err));
```

Run: `node test-allocation.js`

---

### **Step 6: Verify Which Dealer Got the Order**

Check which dealer was selected:

```sql
-- Check order assignment
SELECT 
  o.order_id,
  o.order_number,
  o.customer_name,
  o.pincode as customer_pincode,
  o.latitude as customer_lat,
  o.longitude as customer_lng,
  o.assigned_dealer_id,
  d.business_name as assigned_dealer,
  d.latitude as dealer_lat,
  d.longitude as dealer_lng,
  d.location as dealer_location,
  -- Calculate actual distance using Haversine formula
  earth_distance(
    ll_to_earth(o.latitude, o.longitude),
    ll_to_earth(d.latitude, d.longitude)
  ) / 1000 as distance_km,
  o.status
FROM orders o
LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
WHERE o.order_id = :order_id;

-- Check allocation log
SELECT * FROM order_allocation_log
WHERE order_id = :order_id
ORDER BY created_at DESC;

-- Check dealer requests
SELECT 
  dor.*,
  d.business_name,
  d.location
FROM dealer_order_requests dor
JOIN dealers d ON dor.dealer_id = d.dealer_id
WHERE dor.order_id = :order_id;
```

---

## ✅ EXPECTED TEST RESULTS

### **With Current System (WRONG):**
```
❌ Assigned to: "Far Dealer" (dealer_id might be lowest)
❌ Distance: ~30km
❌ Reason: ROW_NUMBER() ordering by dealer_id
```

### **With Distance-Based System (CORRECT):**
```
✅ Assigned to: "Near Dealer" 
✅ Distance: ~5km
✅ Reason: Calculated using GPS coordinates (Haversine formula)
```

---

## 🔧 THE FIX NEEDED

Update the `find_dealers_with_stock()` function to calculate real distances:

```sql
CREATE OR REPLACE FUNCTION find_dealers_with_stock(
    p_customer_pincode VARCHAR(10),
    p_customer_lat DECIMAL(10, 8),
    p_customer_lng DECIMAL(11, 8),
    p_product_ids INTEGER[],
    p_required_quantities INTEGER[]
)
RETURNS TABLE (
    dealer_id INTEGER,
    business_name VARCHAR(200),
    service_pin VARCHAR(6),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_km DECIMAL(10, 2),
    has_all_products BOOLEAN,
    stock_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH dealer_stock_check AS (
        SELECT 
            d.dealer_id,
            d.business_name,
            d.service_pin,
            d.latitude,
            d.longitude,
            -- Calculate REAL distance using Haversine formula
            -- (Requires PostGIS or earthdistance extension)
            earth_distance(
                ll_to_earth(p_customer_lat, p_customer_lng),
                ll_to_earth(d.latitude, d.longitude)
            ) / 1000 as distance_km,
            -- Stock checking logic (same as before)
            (
                SELECT COUNT(*) = array_length(p_product_ids, 1)
                FROM unnest(p_product_ids, p_required_quantities) 
                    WITH ORD INALITY AS requirements(product_id, required_qty, idx)
                LEFT JOIN dealer_inventory di 
                    ON di.dealer_id = d.dealer_id 
                    AND di.product_id = requirements.product_id
                WHERE di.quantity_available >= requirements.required_qty
            ) as has_all_products,
            -- Stock details
            (
                SELECT json_agg(json_build_object(
                    'product_id', di.product_id,
                    'available', di.quantity_available,
                    'required', req.required_qty,
                    'sufficient', di.quantity_available >= req.required_qty
                ))
                FROM unnest(p_product_ids, p_required_quantities) 
                    WITH ORDINALITY AS req(product_id, required_qty, idx)
                LEFT JOIN dealer_inventory di 
                    ON di.dealer_id = d.dealer_id 
                    AND di.product_id = req.product_id
            ) as stock_details
        FROM dealers d
        WHERE d.status = 'Active'
            AND d.latitude IS NOT NULL  -- Must have coordinates
            AND d.longitude IS NOT NULL
    )
    SELECT * FROM dealer_stock_check
    WHERE has_all_products = true
    ORDER BY distance_km ASC  -- NEAREST FIRST!
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 QUICK TEST COMMANDS

Save this as `test-allocation-script.sql`:

```sql
-- 1. Check test dealers exist
SELECT dealer_id, business_name, latitude, longitude 
FROM dealers 
WHERE email LIKE '%testdealer%';

-- 2. Check they have stock
SELECT d.dealer_id, d.business_name, di.product_id, di.quantity_available
FROM dealers d
JOIN dealer_inventory di ON d.dealer_id = di.dealer_id
WHERE d.email LIKE '%testdealer%';

-- 3. Create test order and get ID
INSERT INTO orders (
  customer_name, customer_phone, installation_address, 
  pincode, latitude, longitude, total_amount, status
) VALUES (
  'Test Customer', '9876543210', 'Midnapore Test',
  '721637', 22.42, 87.32, 25000, 'Pending'
)
RETURNING order_id;

-- 4. Add order item (replace :order_id)
INSERT INTO order_items (order_id, item_name, product_id, quantity, unit_price, total_price)
VALUES (:order_id, 'Test Camera', 1, 2, 5000, 10000);

-- 5. Check allocation result
SELECT 
  o.order_number,
  o.assigned_dealer_id,
  d.business_name,
  d.location,
  earth_distance(
    ll_to_earth(o.latitude, o.longitude),
    ll_to_earth(d.latitude, d.longitude)
  ) / 1000 as distance_km
FROM orders o
LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
WHERE o.order_id = :order_id;
```

---

## 🎯 SUCCESS CRITERIA

✅ **Test PASSES if:**
- Order goes to "Near Dealer" (5km away)
- `distance_km` in result is ~5km
- Allocation log shows "request_sent" to nearest dealer

❌ **Test FAILS if:**
- Order goes to "Far Dealer" or "Medium Dealer"
- Distance is > 10km
- Dealer selection ignores GPS coordinates

---

## 📞 SUPPORT

If you need help implementing the distance-based fix, let me know and I'll:
1. Enable PostGIS extension for distance calculations
2. Update the allocation function
3. Modify the API to pass customer coordinates
4. Add distance tracking to allocation logs

Would you like me to implement these fixes now?
