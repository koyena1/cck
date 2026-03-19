# 🚀 QUICK START GUIDE - Proximity-Based Order Allocation

## ⚡ Get Started in 3 Steps

### Step 1: Ensure Dealer Coordinates Are Set ✅

Run this command to check and update dealer coordinates:

```bash
node update-dealer-coordinates.js
```

This will show dealers without coordinates and prompt you to add them.

**Quick Tip:** Get coordinates from Google Maps:
1. Go to https://www.google.com/maps
2. Search for the dealer address
3. Right-click on the location → Click the coordinates
4. Copy (first number = latitude, second = longitude)

---

### Step 2: Test Distance Calculation 🗺️

Verify the system works correctly:

```bash
node test-dealer-distances.js
```

You should see dealers sorted by distance from a test location (Kolkata by default).

**Expected Output:**
```
📍 Customer Location: Kolkata
   Coordinates: 22.5726, 88.3639

🏪 DEALERS SORTED BY DISTANCE:

1. ABC Electronics - 3.45 km away
2. XYZ Traders - 12.30 km away
3. PQR Store - 25.67 km away
```

---

### Step 3: Set Up Auto-Escalation (Optional) ⏰

**Windows Task Scheduler:**

1. Open Task Scheduler
2. Create Basic Task → Name: "CCTV Order Auto-Escalation"
3. Trigger: Hourly (or your preferred schedule)
4. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "D:\cctv-website\auto-escalation-cron-proximity.ps1"`
5. Save and Enable

**Manual Test:**
```bash
node auto-escalation-cron-proximity.js
```

---

## 🎯 How to Use

### When Customer Places Order:

The system **automatically**:
1. ✅ Finds the nearest dealer
2. ✅ Checks stock availability (if product order)
3. ✅ Sends request to dealer (6-hour deadline)
4. ✅ Tracks the request

### When Dealer Responds:

**Accept:**
- Order confirmed
- Inventory automatically reduced
- Customer notified

**Decline:**
- System finds next nearest dealer
- New request sent automatically
- Process repeats (max 3 dealers)
- If no dealers left → Escalated to admin

**No Response (Timeout):**
- Auto-escalation cron detects expired request
- Automatically moves to next dealer
- Logs the timeout

---

## 📊 Monitoring

### View Active Requests:
```sql
SELECT * FROM active_dealer_requests;
```

### View Allocation History for an Order:
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

---

## ⚙️ Configuration

### Change Response Timeout (default: 6 hours):
```sql
UPDATE order_allocation_settings 
SET setting_value = '12' 
WHERE setting_key = 'dealer_response_timeout_hours';
```

### Change Max Dealer Attempts (default: 3):
```sql
UPDATE order_allocation_settings 
SET setting_value = '5' 
WHERE setting_key = 'max_dealer_attempts';
```

### Enable/Disable Auto-Escalation:
```sql
UPDATE order_allocation_settings 
SET setting_value = 'true' 
WHERE setting_key = 'auto_escalate_enabled';
```

---

## 🐛 Common Issues

### Issue: "No dealers found"

**Solution:**
1. Check if dealers have coordinates:
   ```bash
   node check-dealers-schema.js
   ```
2. Add coordinates:
   ```bash
   node update-dealer-coordinates.js
   ```

### Issue: "Auto-escalation not working"

**Solution:**
1. Check if enabled:
   ```sql
   SELECT * FROM order_allocation_settings 
   WHERE setting_key = 'auto_escalate_enabled';
   ```
2. Test manually:
   ```bash
   node auto-escalation-cron-proximity.js
   ```

### Issue: "Dealer too far away"

**Solution:** This is expected! System finds nearest available dealer. To expand search:
```sql
-- Increase search radius (future feature)
UPDATE order_allocation_settings 
SET setting_value = '100' 
WHERE setting_key = 'distance_search_radius_km';
```

---

## 📞 Quick Commands Cheat Sheet

```bash
# Check dealer coordinates
node check-dealers-schema.js

# Update coordinates
node update-dealer-coordinates.js

# Test distance calculation
node test-dealer-distances.js

# Run auto-escalation
node auto-escalation-cron-proximity.js

# Manually assign order
node manually-assign-order-to-dealer.js
```

---

## 📚 Documentation

For detailed information, see:
- **[PROXIMITY-ALLOCATION-SYSTEM-GUIDE.md](PROXIMITY-ALLOCATION-SYSTEM-GUIDE.md)** - Complete system documentation
- **[PROXIMITY-ALLOCATION-IMPLEMENTATION-SUMMARY.md](PROXIMITY-ALLOCATION-IMPLEMENTATION-SUMMARY.md)** - Implementation details

---

## ✅ Checklist

Before going live, make sure:

- [ ] All dealers have `latitude` and `longitude` set
- [ ] All dealers have `serviceable_pincodes` or `service_pin` set
- [ ] Distance calculation tested and working
- [ ] Auto-escalation cron job configured (optional but recommended)
- [ ] Test order placed and allocated successfully
- [ ] Dealer accept/decline flow tested
- [ ] Monitoring queries work
- [ ] Backup settings recorded

---

## 🎉 You're Ready!

The proximity-based order allocation system is now active. Every new order will automatically:
- Go to the **nearest dealer**
- **Fallback** to next nearest if declined
- **Auto-escalate** on timeout
- Be **fully logged** for monitoring

**Happy allocating! 🚀**

---

**Need Help?** Check the logs:
```sql
SELECT * FROM order_allocation_log 
WHERE order_id = YOUR_ORDER_ID 
ORDER BY created_at DESC;
```
