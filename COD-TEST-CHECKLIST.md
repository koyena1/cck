## 🔍 COD SYSTEM - COMPLETE TEST CHECKLIST

### ✅ SERVER ENVIRONMENT STATUS (As of now)
- **Email System**: CONFIGURED ✅
- **Email Mode**: PRODUCTION (real emails) ✅
- **Razorpay**: CONFIGURED ✅
- **SMTP**: protechtur@gmail.com via smtp.gmail.com ✅

---

### 📋 TEST PROCEDURE

#### **STEP 1: Test COD Calculation**
1. Go to: `http://localhost:3000`
2. Select any product and click "Buy Now"
3. **Select Installation** ✓ (₹5,000)
4. **Select AMC** ✓ (₹400-700)
5. Fill in customer details
6. Click "Cash on Delivery (COD)"

**Expected Result:**
You should see a confirmation dialog showing:
```
Products Total: ₹X
Extra COD Charges: ₹200
Base Amount: ₹(Products + Installation + AMC + 200)
Advance Payment: 10% of base amount
Pay on Delivery: Remaining amount
```

**✅ PASS** if Installation & AMC are included in Base Amount  
**❌ FAIL** if Base Amount only shows Products + ₹200

---

#### **STEP 2: Test Email Timing**
1. After confirming COD details, proceed with payment
2. Complete the advance payment via Razorpay
3. Check your email: `protechtur@gmail.com`

**Expected Result:**
- ❌ NO email should arrive BEFORE completing payment
- ✅ Email should arrive AFTER payment is verified (within 5-30 seconds)

**Email Should Contain:**
- Order confirmation message
- Order number
- Total amount
- Payment status
- Tracking link

---

#### **STEP 3: Verify in Database**
```sql
-- Check order was created with pending status
SELECT order_number, payment_status, payment_method, total_amount, created_at
FROM orders
WHERE payment_method = 'cod'
ORDER BY created_at DESC
LIMIT 1;

-- After payment, status should be 'Paid'
SELECT order_number, payment_status, payment_id, razorpay_order_id
FROM orders
WHERE payment_method = 'cod'
ORDER BY created_at DESC
LIMIT 1;

-- Check email was sent
SELECT order_id, recipient_email, email_type, email_status, sent_at
FROM email_logs
ORDER BY sent_at DESC
LIMIT 1;
```

---

### 🐛 TROUBLESHOOTING

#### **If Calculation is Wrong:**
Check file: `d:\cctv-website\app\buy-now\page.tsx`
Line 340-363: `calculateCODAdvancePayment()` function
Should include:
- ✓ Products total
- ✓ Installation (if selected)
- ✓ AMC (if selected)
- ✓ Extra COD charges

#### **If Email Not Arriving:**
1. Check terminal logs for:
   - "📧 Sending order confirmation email..."
   - "✅ Email sent successfully..."
2. Check spam folder in Gmail
3. Verify SMTP password hasn't expired
4. Check email_logs table in database

#### **If Payment Fails:**
1. Check Razorpay dashboard: https://dashboard.razorpay.com
2. Verify RAZORPAY_KEY_SECRET is correct
3. Check browser console for errors

---

### 📝 CODE CHANGES SUMMARY

#### **1. Fixed COD Calculation** (page.tsx)
```typescript
const calculateCODAdvancePayment = () => {
  if (!settings) return 0;
  
  let baseAmount = getProductsTotal();
  
  // ADD INSTALLATION
  if (withInstallation && settings.installationCost) {
    baseAmount += settings.installationCost;
  }
  
  // ADD AMC
  if (withAmc && amcMaterial && amcDuration) {
    const amcKey = `${amcMaterial}_${amcDuration}`;
    baseAmount += settings.amcOptions[amcKey] || 0;
  }
  
  // ADD EXTRA COD CHARGES
  baseAmount += settings.codAdvanceAmount;
  
  // CALCULATE ADVANCE
  return (baseAmount * settings.codPercentage) / 100;
};
```

#### **2. Fixed Email Timing** (guest-checkout route)
```typescript
// COD orders: Skip email at order creation
if (customerEmail && paymentMethod !== 'cod') {
  emailSent = await sendOrderConfirmationEmail({...});
}
```

#### **3. Added Email After Payment** (verify-payment route)
```typescript
// After payment verification for COD
if (order.payment_method === 'cod' && order.customer_email) {
  const emailSent = await sendOrderConfirmationEmail({
    orderNumber: order_number,
    paymentStatus: 'Advance Paid',
    ...
  });
}
```

---

### 🎯 WHAT TO TEST NOW

**Option A: Manual Test** (Recommended)
1. Go through STEP 1, 2, 3 above
2. Report back which step fails (if any)

**Option B: Tell me the specific issue**
- Is calculation wrong?
- Email not arriving?
- Payment not working?
- Something else?

---

Server is **RUNNING** ✅  
Configuration is **CORRECT** ✅  
Code changes are **APPLIED** ✅  

**Ready for testing!** 🚀
