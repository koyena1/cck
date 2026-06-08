# Post-Payment Order Visibility Debug Guide

## Quick Diagnostics

### Step 1: Check if Orders Exist in Database
Run this SQL in your database client to see recent orders:
```sql
-- Show last 10 orders (all statuses)
SELECT 
  order_id,
  order_number,
  customer_email,
  customer_name,
  payment_status,
  status,
  created_at,
  is_guest_order
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

**Expected outcome:** You should see your test orders here, regardless of payment status.

---

### Step 2: Check Email Logs
```sql
-- Show email sending history
SELECT 
  email_id,
  order_id,
  recipient_email,
  email_type,
  email_status,
  error_message,
  sent_at
FROM email_logs
ORDER BY sent_at DESC
LIMIT 20;
```

**Expected outcome:** 
- If email_status = 'sent': Email was sent successfully
- If email_status = 'failed': Email failed; check error_message column
- If no rows: Emails aren't being logged at all

---

### Step 3: Check Payment Verification Calls
```sql
-- Show order status updates (payment verification events)
SELECT 
  order_id,
  order_number,
  status,
  created_at
FROM order_status_history
WHERE status IN ('Paid', 'Advance Paid')
ORDER BY created_at DESC
LIMIT 20;
```

**Expected outcome:** Should see status changes to 'Paid' or 'Advance Paid' after payment

---

### Step 4: Verify Order Items Are Saved
```sql
-- Check if order items exist for a specific order
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.item_name,
  oi.quantity,
  oi.hsn_code,
  oi.item_type
FROM order_items oi
WHERE oi.order_id = 180  -- Replace with your order ID
ORDER BY oi.id;
```

**Expected outcome:** Should show 1+ rows with product details

---

### Step 5: Browser Network Tab Check
1. Go to buy-now page and complete a checkout
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Complete the payment/checkout
5. Look for API calls:
   - POST `/api/guest-checkout` or `/api/orders` → Should show **201 or 200** response
   - POST `/api/razorpay/verify-payment` → Should show **200** response

**Expected:** Both should return `{ success: true, order: {...} }`

---

### Step 6: Server Logs Check
Look at your server console/logs for:
- ❌ "Error creating order:" messages
- ❌ "Error sending post-payment confirmation email" messages
- ✅ "Order created successfully" messages
- ✅ "Order allocation" messages

---

## Most Likely Issues (in order of probability)

### Issue #1: Email Not Being Sent
**Symptoms:** 
- Orders appear in database ✓
- Orders appear in admin ✓
- But no confirmation email ✗

**Fix:**
1. Check `.env` for email config:
   ```
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   SMTP_FROM_EMAIL=
   ```
2. Test SMTP connection
3. Check email_logs table for "failed" entries

### Issue #2: Order Not Found After Payment
**Symptoms:**
- Checkout completes
- Payment shows as completed on Razorpay
- Order doesn't appear anywhere

**Root Cause:** Payment verification route can't find the order (order_number mismatch)

**Check:**
```sql
-- See if order exists with the order_number sent to /api/razorpay/verify-payment
SELECT order_id, order_number FROM orders WHERE order_number = 'PR-YYMMDD-XXX';
```

### Issue #3: Guest Orders Hidden by Filter
**Symptoms:**
- Orders exist in database
- But admin panel filters them out

**Check:**
```sql
-- Are orders marked as guest orders?
SELECT order_id, is_guest_order, order_type FROM orders WHERE order_id = 180;
```

If `is_guest_order = true`, admin might be filtering them.

### Issue #4: Schema Columns Missing
**Symptoms:** HSN code, GST fields not storing

**Check:**
```sql
-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'hsn_code';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name = 'customer_gstin';
```

---

## Next Steps

1. **Run Step 1 SQL above** and tell me:
   - How many orders exist?
   - What are their order_numbers and emails?
   - What payment_status do they have?

2. **Run Step 2 SQL** and tell me:
   - Are emails being logged?
   - Any "failed" statuses?

3. **Provide a specific order ID** that failed
   - I can trace it through all the checks

---

## If Still Stuck

Provide me:
- [x] Recent order ID or order number
- [x] Customer email used
- [x] Payment method (Razorpay/COD)
- [x] Error from browser console (if any)
- [x] Result from Step 1 SQL (orders in database?)
- [x] Result from Step 2 SQL (emails logged?)
