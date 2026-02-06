# Razorpay Integration Setup Guide

## 🔧 Complete Setup Steps

### 1. Database Schema Update

Run these SQL commands in your PostgreSQL database to add payment tracking columns:

```sql
-- Add Razorpay payment tracking columns
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
```

### 2. Get Razorpay Credentials

1. Sign up at https://razorpay.com/
2. Go to Settings → API Keys
3. Generate API Keys (Test or Live mode)
4. Copy your:
   - Key ID (e.g., `rzp_test_xxxxxxxxxxx`)
   - Key Secret (keep this secret!)

### 3. Update .env File

Add your Razorpay credentials to `.env`:

```env
# Razorpay Credentials
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_secret_key_here

# Database Configuration (if not already added)
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_NAME=cctv
DB_HOST=localhost
DB_PORT=5432
DB_SSL=false
```

### 4. Restart Development Server

```bash
npm run dev
```

## ✅ What Was Implemented

### Backend API Routes:
1. **/api/razorpay/create-order** - Creates Razorpay order
2. **/api/razorpay/verify-payment** - Verifies payment signature
3. **/api/orders** - Saves order to database (updated)

### Frontend Changes:
1. **buy-now/page.tsx** - Full Razorpay checkout integration
   - Creates order in database first
   - Initializes Razorpay payment
   - Verifies payment on success
   - Updates order status

### Database Columns Added:
- `payment_id` - Stores Razorpay payment ID after successful payment
- `razorpay_order_id` - Stores Razorpay order ID created for payment

## 🧪 Testing

### Test Mode (Development):
1. Use test credentials from Razorpay dashboard
2. Test cards:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
3. Any CVV: 123
4. Any future expiry date

### Flow:
1. Go to buy-now page
2. Fill in customer details
3. Click "Pay with Razorpay"
4. Razorpay popup opens
5. Complete test payment
6. On success: Order marked as paid in database

## 🚨 Important Notes

1. **Never commit** your `.env` file to git
2. **Test thoroughly** before going live
3. **Switch to live keys** only when ready for production
4. **Webhook setup** (optional) for better reliability:
   - Go to Razorpay Dashboard → Webhooks
   - Add webhook URL: `your-domain.com/api/razorpay/webhook`
   - Select events: `payment.captured`, `payment.failed`

## 🔒 Security Checklist

- ✅ API keys stored in .env (not in code)
- ✅ Payment verification using signature
- ✅ Server-side order validation
- ✅ HTTPS required for production

## 📱 How It Works

1. **User clicks "Pay with Razorpay"**
   ↓
2. **Frontend creates order in database** (status: pending)
   ↓
3. **Call `/api/razorpay/create-order`** with amount
   ↓
4. **Razorpay returns order_id**
   ↓
5. **Razorpay popup opens** for payment
   ↓
6. **User completes payment**
   ↓
7. **Razorpay sends response** (payment_id, order_id, signature)
   ↓
8. **Frontend calls `/api/razorpay/verify-payment`**
   ↓
9. **Server verifies signature** (security check)
   ↓
10. **Update order** payment_status = 'Paid' ✅

## 🛠️ Troubleshooting

### "Key ID not configured" error:
- Check NEXT_PUBLIC_RAZORPAY_KEY_ID in .env
- Restart dev server after adding env vars

### Payment fails:
- Check console for errors
- Verify API keys are correct
- Ensure database columns exist

### Payment succeeds but order not updated:
- Check `/api/razorpay/verify-payment` logs
- Verify signature validation
- Check database connection

## 📞 Support

For Razorpay issues:
- Docs: https://razorpay.com/docs/
- Support: https://razorpay.com/support/

