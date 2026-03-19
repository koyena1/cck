# PROXIMITY-BASED ORDER ALLOCATION SYSTEM

## 🎯 Overview

This system automatically allocates customer orders to the **nearest dealer** based on geographic distance (latitude/longitude) and automatically escalates to the next nearest dealer if the first dealer declines or doesn't respond within the deadline.

---

## 🔄 How It Works

### 1. **Order Placement**
When a customer places an order:
- The system captures customer location (pincode, address, coordinates if available)
- Order details are saved to the database
- The order allocation process is triggered automatically

### 2. **Dealer Selection Algorithm**
The system finds eligible dealers using:

#### For Product Orders:
- ✅ Active dealer status
- ✅ Has all required products in stock
- ✅ Services the customer's pincode (if specified)
- ✅ Has valid latitude/longitude coordinates
- 📏 Sorted by actual distance (Haversine formula)

#### For Quotation/Installation Orders:
- ✅ Active dealer status
- ✅ Services the customer's pincode (if specified)
- ✅ Has valid latitude/longitude coordinates
- 📏 Sorted by actual distance

### 3. **Allocation Flow**

```
Customer Places Order
        ↓
Find Nearest Dealer (with stock if product order)
        ↓
Send Request to Dealer → Deadline: 6 hours
        ↓
    ┌───┴───┐
    │       │
Accept    Decline/Timeout
    │       │
    ↓       ↓
Confirmed   Find Next Nearest Dealer
    │       │
    ↓       ↓
 SUCCESS    Repeat (max 3 dealers)
            │
            ↓
        No More Dealers?
            │
            ↓
    Escalate to Admin
```

### 4. **Distance Calculation**
- Uses **Haversine formula** to calculate actual distance between coordinates
- Formula: `distance = 2 * R * arcsin(√(sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)))`
- Where R = 6371 km (Earth's radius)
- Returns distance in kilometers with 2 decimal precision

### 5. **Auto-Escalation**
- Runs every hour via cron job
- Finds expired pending requests (past deadline)
- Automatically reallocates to next nearest dealer
- Escalates to admin if max attempts reached

---

## 📁 File Structure

### Core Components:

```
lib/
  distance-calculator.ts         # Distance calculation utilities

app/api/
  order-allocation/
    route.ts                      # Initial order allocation
  reallocate-order/
    route.ts                      # Reallocation to next dealer
  dealer-order-response/
    route.ts                      # Dealer accept/decline endpoint

auto-escalation-cron-proximity.js   # Auto-escalation script
auto-escalation-cron-proximity.ps1  # PowerShell wrapper
```

### Database Tables:

```
dealers                         # Dealer information with lat/lng
dealer_order_requests          # Tracks order assignments
order_allocation_log           # Complete audit trail
order_allocation_settings      # System configuration
dealer_inventory               # Stock management
```

---

## 🚀 API Endpoints

### 1. **POST /api/order-allocation**
Allocates order to nearest dealer

**Request:**
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
  "dealer_id": 5,
  "dealer_name": "ABC Electronics",
  "distance_km": 3.45,
  "response_deadline": "2026-02-26T18:00:00Z",
  "timeout_hours": 6,
  "dealers_available": 5
}
```

### 2. **POST /api/dealerorder-response**
Dealer accepts or declines order

**Request:**
```json
{
  "requestId": 45,
  "dealerId": 5,
  "action": "decline",
  "notes": "Out of stock temporarily",
  "declineReason": "Stock unavailable"
}
```

**Response (Declined with Reallocation):**
```json
{
  "success": true,
  "action": "declined",
  "reallocated": true,
  "next_dealer": "XYZ Traders",
  "distance_km": 7.2,
  "dealers_tried": 2
}
```

### 3. **POST /api/reallocate-order**
Manually trigger reallocation

**Request:**
```json
{
  "orderId": 123,
  "previousDealerId": 5,
  "previousSequence": 1
}
```

**Response:**
```json
{
  "success": true,
  "reallocated": true,
  "dealer_id": 8,
  "dealer_name": "New Dealer",
  "distance_km": 5.67,
  "sequence": 2
}
```

---

## ⚙️ Configuration

### System Settings (in `order_allocation_settings` table):

| Setting | Default | Description |
|---------|---------|-------------|
| `dealer_response_timeout_hours` | 6 | Hours dealer has to respond |
| `max_dealer_attempts` | 3 | Max dealers to try before admin escalation |
| `auto_escalate_enabled` | true | Enable automatic escalation |
| `require_stock_verification` | true | Verify stock before allocation |
| `distance_search_radius_km` | 50 | Max search radius (not currently enforced) |

### Update Settings:
```sql
UPDATE order_allocation_settings 
SET setting_value = '12' 
WHERE setting_key = 'dealer_response_timeout_hours';
```

---

## 🤖 Auto-Escalation Cron Job

### Setup (Windows Task Scheduler):

1. Open Task Scheduler
2. Create Basic Task
3. Name: "CCTV Order Auto-Escalation"
4. Trigger: Daily at a specific time (or hourly)
5. Action: Start a program
6. Program: `powershell.exe`
7. Arguments: `-ExecutionPolicy Bypass -File "D:\cctv-website\auto-escalation-cron-proximity.ps1"`

### Manual Run:
```powershell
# PowerShell
.\auto-escalation-cron-proximity.ps1

# Or directly with Node
node auto-escalation-cron-proximity.js
```

### What It Does:
- Finds all pending requests past their deadline
- Marks them as 'expired'
- Triggers reallocation to next dealer
- Logs all actions
- Shows summary report

---

## 📊 Database Schema

### Key Columns in `dealers`:
```sql
dealer_id          INTEGER PRIMARY KEY
latitude           DECIMAL(10, 8)      -- Geographic latitude
longitude          DECIMAL(11, 8)      -- Geographic longitude
service_pin        VARCHAR(6)          -- Primary service pincode
serviceable_pincodes TEXT              -- Comma-separated list
status             VARCHAR(50)         -- 'Active', 'Inactive'
```

### Key Columns in `dealer_order_requests`:
```sql
id                  SERIAL PRIMARY KEY
order_id            INTEGER             -- References orders
dealer_id           INTEGER             -- References dealers
request_sequence    INTEGER             -- 1st, 2nd, 3rd dealer
request_status      VARCHAR(50)         -- pending/accepted/declined/expired
dealer_distance_km  DECIMAL(10, 2)      -- Calculated distance
customer_pincode    VARCHAR(10)         -- Customer's pincode
response_deadline   TIMESTAMP           -- Auto-calculated deadline
```

---

## 🔍 Monitoring & Logs

### View Active Requests:
```sql
SELECT * FROM active_dealer_requests;
```

### View Allocation History:
```sql
SELECT * FROM order_allocation_log 
WHERE order_id = 123 
ORDER BY created_at DESC;
```

### Check Expired Requests:
```sql
SELECT * FROM dealer_order_requests
WHERE request_status = 'pending'
  AND response_deadline < NOW();
```

### Dealer Performance:
```sql
SELECT 
  d.business_name,
  COUNT(CASE WHEN dor.request_status = 'accepted' THEN 1 END) as accepted,
  COUNT(CASE WHEN dor.request_status = 'declined' THEN 1 END) as declined,
  COUNT(CASE WHEN dor.request_status = 'expired' THEN 1 END) as expired,
  AVG(dealer_distance_km) as avg_distance_km
FROM dealer_order_requests dor
JOIN dealers d ON dor.dealer_id = d.dealer_id
GROUP BY d.business_name;
```

---

## 🎛️ Admin Controls

### Manually Assign Order:
```javascript
// Use manually-assign-order-to-dealer.js
// Edit orderId and dealerId in the script
node manually-assign-order-to-dealer.js
```

### Cancel Allocation:
```sql
UPDATE dealer_order_requests 
SET request_status = 'cancelled' 
WHERE order_id = 123 AND request_status = 'pending';
```

### Reset Order for Reallocation:
```sql
-- Cancel all requests
UPDATE dealer_order_requests 
SET request_status = 'cancelled' 
WHERE order_id = 123;

-- Reset order status
UPDATE orders 
SET status = 'Pending', 
    assigned_dealer_id = NULL 
WHERE order_id = 123;

-- Then trigger allocation again via API
```

---

## 🐛 Troubleshooting

### Issue: Dealers missing latitude/longitude
**Solution:**
```sql
-- Check dealers without coordinates
SELECT dealer_id, business_name, location 
FROM dealers 
WHERE latitude IS NULL OR longitude IS NULL;

-- Add coordinates manually
UPDATE dealers 
SET latitude = 22.5726, longitude = 88.3639 
WHERE dealer_id = 3;
```

### Issue: No dealers found
**Reasons:**
1. No dealers have required stock
2. No dealers service the customer's pincode
3. No dealers have valid coordinates
4. All dealers are inactive

**Solution:** Check dealer setup and relax constraints if needed

### Issue: Auto-escalation not running
**Check:**
```powershell
# Test the script manually
node auto-escalation-cron-proximity.js

# Check if auto-escalation is enabled
# In database:
SELECT * FROM order_allocation_settings 
WHERE setting_key = 'auto_escalate_enabled';
```

---

## 📈 Future Enhancements

### 1. **Pincode Geocoding**
Add a pincodes table with coordinates:
```sql
CREATE TABLE pincode_master (
  pincode VARCHAR(6) PRIMARY KEY,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  district VARCHAR(100),
  state VARCHAR(100)
);
```

### 2. **Real-time Notifications**
- SMS/Email to dealer when request assigned
- Push notifications for mobile app
- WhatsApp integration

### 3. **Advanced Analytics**
- Dealer response time tracking
- Distance vs acceptance rate analysis
- Heat map of serviceable areas
- Predictiveallocation based on historical data

### 4. **Dynamic Timeout**
- Adjust timeout based on time of day
- Shorter timeout during business hours
- Longer timeout at night/weekends

### 5. **Multi-factor Scoring**
Instead of pure distance, score dealers on:
- Distance (weight: 40%)
- Rating (weight: 30%)
- Historical acceptance rate (weight: 20%)
- Response time (weight: 10%)

---

## ✅ Testing Checklist

- [ ] Place order with valid customer coordinates
- [ ] Verify nearest dealer receives request
- [ ] Test dealer acceptance flow
- [ ] Test dealer decline flow → auto-reallocation
- [ ] Test timeout expiration → auto-escalation
- [ ] Test max attempts → admin escalation
- [ ] Test quotation order allocation (no stock check)
- [ ] Test product order allocation (with stock check)
- [ ] Run manual escalation cron job
- [ ] Verify all logs recorded correctly

---

## 📞 Support

For issues or questions:
1. Check allocation logs: `SELECT * FROM order_allocation_log WHERE order_id = ?`
2. Check dealer requests: `SELECT * FROM dealer_order_requests WHERE order_id = ?`
3. Review system settings: `SELECT * FROM order_allocation_settings`

---

**Last Updated:** February 26, 2026
**Version:** 1.0.0
