# INTELLIGENT ORDER ALLOCATION SYSTEM

## Overview

This system automatically routes customer orders to the nearest dealer with stock availability. If a dealer doesn't respond within the specified timeframe (default: 6 hours), the order automatically escalates to the next available dealer. If no dealer has stock, the order is sent to the admin panel.

---

## Key Features

### ✅ **Automatic Stock Verification**
- System checks dealer inventory before sending requests
- Only dealers with sufficient stock receive order requests
- Real-time stock availability checking

### ⏰ **Timeline-Based Escalation**
- Configurable response deadline (default: 6 hours) - Automatic escalation to next dealer on timeout
- No manual intervention required

### 📍 **Location-Based Routing**
- Orders route to dealers in customer's area (by PIN code)
- Prioritizes nearest dealers first
- Distance-aware allocation

### 🔄 **Multi-Level Fallback**
- Tries multiple dealers (up to 3 by default)
- Escalates to admin if no dealer accepts
- Complete audit trail of allocation process

### 📊 **Stock Integration**
- Reads from dealer inventory system
- Auto-updates when dealers buy/sell products
- Real-time availability

---

## Database Schema

### **Tables Created:**

1. **dealer_order_requests** - Tracks allocation to dealers
2. **order_allocation_log** - Complete audit trail
3. **order_allocation_settings** - Configurable settings

### **Views Created:**

1. **active_dealer_requests** - Currently active requests
2. **dealer_order_queue** - Pending requests for dealer portal

### **Functions Created:**

1. **find_dealers_with_stock()** - Finds dealers with required inventory

---

## Installation & Setup

### Step 1: Run Database Migration

```bash
psql -U postgres -d cctv_platform -f add-order-allocation-system.sql
```

Or using Node.js:

```javascript
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setupOrderAllocation() {
  const sql = fs.readFileSync('add-order-allocation-system.sql', 'utf8');
  await pool.query(sql);
  console.log('✅ Order allocation system installed!');
  await pool.end();
}

setupOrderAllocation();
```

### Step 2: Configure Settings

Default settings are auto-created. Modify if needed:

```sql
UPDATE order_allocation_settings 
SET setting_value = '8'  -- Change timeout to 8 hours
WHERE setting_key = 'dealer_response_timeout_hours';

UPDATE order_allocation_settings 
SET setting_value = '5'  -- Try up to 5 dealers
WHERE setting_key = 'max_dealer_attempts';
```

### Step 3: Set Up Auto-Escalation (Required!)

The system needs a scheduled task to check for expired requests every hour.

**Option A: Using cron (Linux/Mac)**

```bash
# Open crontab
crontab -e

# Add this line (runs every hour)
0 * * * * curl http://localhost:3000/api/auto-escalate-orders
```

**Option B: Using Windows Task Scheduler**

Create a PowerShell script `check-expired-orders.ps1`:

```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/auto-escalate-orders" -Method GET
```

Schedule it to run every hour via Task Scheduler.

**Option C: Using Node.js cron job**

Install node-cron:
```bash
npm install node-cron
```

Create `cron-jobs.js` in project root:
```javascript
const cron = require('node-cron');

// Run every hour
cron.schedule('0 * * * *', async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auto-escalate-orders');
    const data = await response.json();
    console.log(`[${new Date().toISOString()}] Auto-escalation:`, data);
  } catch (error) {
    console.error('Auto-escalation failed:', error);
  }
});

console.log('Cron job started - checking expired orders every hour');
```

Add to your server startup or run separately.

---

## How It Works

### **Order Placement Flow:**

```
1. Customer places order with PIN code
   ↓
2. System extracts product requirements
   ↓
3. Finds dealers in customer's area
   ↓
4. Checks each dealer's stock inventory
   ↓
5. Sends request to 1st dealer with stock
   ↓
6. Sets response deadline (6 hours)
   ↓
7. Waits for dealer response
```

### **Dealer Response Scenarios:**

**Scenario A: Dealer Accepts (Within Deadline)**
```
✅ Order status → "Allocated"
✅ Order assigned to that dealer
✅ Other pending requests cancelled
✅ Dealer can proceed with delivery
```

**Scenario B: Dealer Declines**
```
❌ Request marked as "declined"
🔄 System finds next dealer with stock
📤 Sends request to next dealer
⏰ New 6-hour deadline set
```

**Scenario C: Dealer Doesn't Respond (Timeout)**
```
⏱️ Response deadline passes
🤖 Auto-escalation job runs every hour
⏰ Marks request as "expired"
🔄 Automatically sends to next dealer
📝 Logs escalation event
```

**Scenario D: No Dealers Have Stock**
```
❌ No dealer found with required products
⬆️ Order escalated to admin panel
📊 Admin can arrange from manufacturer
```

### **Stock Verification Process:**

```sql
-- System checks dealer's inventory
SELECT quantity_available 
FROM dealer_inventory
WHERE dealer_id = ? AND product_id = ?

-- If quantity_available >= required_quantity
-- → Stock sufficient ✅
-- → Send order request

-- If quantity_available < required_quantity
-- → Stock insufficient ❌
-- → Skip this dealer, try next
```

---

## API Endpoints

### 1. **Allocate Order to Dealers**

**POST** `/api/order-allocation`

```json
{
  "orderId": 123
}
```

**Response:**
```json
{
  "success": true,
  "allocated": true,
  "request_id": 45,
  "dealer_id": 3,
  "dealer_name": "ABC Security Solutions",
  "response_deadline": "2026-02-24T12:00:00Z",
  "timeout_hours": 6,
  "dealers_available": 3,
  "message": "Order request sent to ABC Security Solutions"
}
```

### 2. **Dealer Response (Accept/Decline)**

**POST** `/api/dealer-order-response`

```json
{
  "requestId": 45,
  "dealerId": 3,
  "action": "accept",  // or "decline"
  "notes": "Will deliver within 24 hours"
}
```

**Response (Accept):**
```json
{
  "success": true,
  "action": "accepted",
  "message": "Order #ORD-001 accepted successfully",
  "order_id": 123
}
```

**Response (Decline):**
```json
{
  "success": true,
  "action": "declined",
  "escalated": true,
  "message": "Request declined. Order escalated to next dealer: XYZ Security",
  "next_dealer": "XYZ Security"
}
```

### 3. **Get Pending Requests for Dealer**

**GET** `/api/dealer-order-response?dealerId=3`

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "request_id": 45,
      "order_number": "ORD-001",
      "customer_name": "John Doe",
      "total_amount": 25000,
      "hours_remaining": 4.5,
      "order_items": [...]
    }
  ],
  "count": 1
}
```

### 4. **Auto-Escalate Expired Requests** (Cron Job)

**GET** `/api/auto-escalate-orders`

**Response:**
```json
{
  "success": true,
  "processed": 2,
  "escalated_to_dealers": 1,
  "escalated_to_admin": 1,
  "escalations": [...],
  "message": "Processed 2 expired requests"
}
```

---

## Dealer Portal Interface

### **Order Requests Page** (`/dealer/order-requests`)

Features:
- ✅ Real-time pending requests
- ⏰ Countdown timers
- 🔴 Urgent badges (<2 hours remaining)
- ✅ Accept/Decline buttons
- 📝 Notes/reason input
- 🔄 Auto-refresh every 30 seconds

View Shows:
- Customer details (name, phone, address, PIN)
- Order items and quantities
- Total order value
- Response deadline
- Time remaining
- Stock verification status

---

## Configuration Options

```sql
-- Response timeout (hours dealer has to accept)
UPDATE order_allocation_settings 
SET setting_value = '6'
WHERE setting_key = 'dealer_response_timeout_hours';

-- Max dealers to try before admin escalation
UPDATE order_allocation_settings 
SET setting_value = '3'
WHERE setting_key = 'max_dealer_attempts';

-- Enable/disable auto-escalation
UPDATE order_allocation_settings 
SET setting_value = 'true'
WHERE setting_key = 'auto_escalate_enabled';

-- Distance search radius (km)
UPDATE order_allocation_settings 
SET setting_value = '50'
WHERE setting_key = 'distance_search_radius_km';
```

---

## Integration with Customer Order Placement

### Update your order creation endpoint:

```typescript
// After creating order in database
const orderResult = await pool.query(`INSERT INTO orders (...) RETURNING order_id`);
const orderId = orderResult.rows[0].order_id;

// Trigger automatic allocation
const allocationResponse = await fetch('/api/order-allocation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ orderId })
});

const allocation = await allocationResponse.json();

if (allocation.escalated_to_admin) {
  // No dealer has stock - notify admin
  console.log('Order sent to admin - no dealer stock available');
} else {
  // Order sent to dealer
  console.log(`Order sent to ${allocation.dealer_name}`);
}
```

---

## Monitoring & Logs

### View Allocation History:

```sql
-- Complete allocation journey for an order
SELECT * FROM order_allocation_log
WHERE order_id = 123
ORDER BY created_at;

-- Active requests across all orders
SELECT * FROM active_dealer_requests;

-- Expired requests needing escalation
SELECT * FROM dealer_order_requests
WHERE request_status = 'pending'
  AND response_deadline < NOW();
```

### Dealer Performance Analytics:

```sql
-- Dealer acceptance rates
SELECT 
  d.business_name,
  COUNT(*) FILTER (WHERE dor.request_status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE dor.request_status = 'declined') as declined,
  COUNT(*) FILTER (WHERE dor.request_status = 'expired') as expired,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE dor.request_status = 'accepted') / 
    COUNT(*), 
    2
  ) as acceptance_rate
FROM dealer_order_requests dor
JOIN dealers d ON dor.dealer_id = d.dealer_id
GROUP BY d.business_name
ORDER BY acceptance_rate DESC;
```

---

## Troubleshooting

### Issue: Orders not allocating

**Check:**
1. Dealer has stock: `SELECT * FROM dealer_inventory WHERE dealer_id = ?`
2. Dealer is active: `SELECT status FROM dealers WHERE dealer_id = ?`
3. Dealer service PIN matches: `SELECT service_pin FROM dealers`

### Issue: Auto-escalation not working

**Check:**
1. Cron job is running
2. API is accessible: `curl http://localhost:3000/api/auto-escalate-orders`
3. Check logs in `order_allocation_log`

### Issue: Dealer not receiving requests

**Check:**
1. Stock availability: Dealer must have ALL required products
2. Service area: Dealer's `service_pin` should match customer PIN
3. Dealer status: Must be 'Active'

---

## Testing

### 1. **Test Order Allocation:**

```javascript
// Create test order
const testOrder = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customer_name: 'Test Customer',
    customer_pincode: '700001',
    items: [{ product_id: 10, quantity: 2 }]
  })
});

// Allocate to dealer
const allocation = await fetch('/api/order-allocation', {
  method: 'POST',
  body: JSON.stringify({ orderId: testOrder.order_id })
});
```

### 2. **Test Dealer Acceptance:**

```javascript
const response = await fetch('/api/dealer-order-response', {
  method: 'POST',
  body: JSON.stringify({
    requestId: 45,
    dealerId: 3,
    action: 'accept'
  })
});
```

### 3. **Test Auto-Escalation:**

```bash
# Manually update a request to be expired
UPDATE dealer_order_requests 
SET response_deadline = NOW() - INTERVAL '1 hour'
WHERE id = 45;

# Trigger auto-escalation
curl http://localhost:3000/api/auto-escalate-orders
```

---

## Stock Management Integration

The system reads from the **Stock Management** section (`/dealer/stock`):

- **Quantity Available** = Purchased - Sold
- Updates automatically on every purchase/sale
- Real-time stock verification before sending requests
- Prevents allocating orders to dealers without stock

---

## Security & Best Practices

1. ✅ Validate dealer authentication before accepting/declining
2. ✅ Log all allocation events for audit trail
3. ✅ Use database transactions for consistency
4. ✅ Set appropriate response timeouts based on business needs
5. ✅ Monitor dealer performance and acceptance rates
6. ✅ Notify dealers via SMS/email when new requests arrive (future enhancement)

---

## Future Enhancements

- [ ] Real-time notifications (SMS/Email) to dealers
- [ ] Geographic distance calculation (using lat/long)
- [ ] Dealer priority/rating system
- [ ] Customer order tracking page
- [ ] WhatsApp integration for notifications
- [ ] Mobile app for dealers

---

## Support

For issues or questions, check:
- Database logs: `order_allocation_log`
- Request status: `dealer_order_requests`
- Active requests: `active_dealer_requests` view

---

**System Status:** ✅ Production Ready

**Last Updated:** February 23, 2026
