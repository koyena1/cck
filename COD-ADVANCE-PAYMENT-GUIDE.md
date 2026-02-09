# COD Advance Payment System - Implementation Guide

## Overview
Implemented a Cash on Delivery (COD) advance payment system where customers must pay a configurable advance amount via Razorpay before placing COD orders.

## What Was Implemented

### 1. Database Schema
**File:** `add-cod-advance-column.sql`
- Added `cod_advance_amount` column to `installation_settings` table
- Default value: ₹200
- Allows admins to configure the advance payment amount

**To apply migration:**
```powershell
.\run-cod-advance-migration.ps1
```

Or manually:
```powershell
psql "YOUR_DATABASE_URL" -f add-cod-advance-column.sql
```

### 2. Backend API Updates
**File:** `app/api/installation-settings/route.ts`
- Updated GET endpoint to return `codAdvanceAmount`
- Updated POST endpoint to save `codAdvanceAmount`
- Default fallback value: ₹200

### 3. Admin Portal Configuration
**File:** `app/admin/installation-settings/page.tsx`
- Added "COD Advance Amount" field
- Admin can configure the amount customers must pay in advance for COD orders
- Changes are saved to database and reflected immediately

**Access:** Navigate to Admin Portal → Installation & AMC Settings

### 4. COD Advance Payment Dialog
**File:** `components/CODAdvanceDialog.tsx`
- Beautiful, user-friendly dialog popup
- Shows explanation why advance payment is required
- Displays order total, advance amount, and balance to pay on delivery
- Integrated with Razorpay for secure payment processing
- Supports both development mode (auto-approval) and production mode

### 5. Buy Now Page Integration
**File:** `app/buy-now/page.tsx`
- Modified COD button behavior
- When user clicks "COD (Cash on Delivery)":
  1. Validates customer form
  2. Creates order in database
  3. Shows COD advance payment dialog
  4. Processes Razorpay payment for advance amount
  5. On success, confirms order and redirects

## User Flow

### Customer Experience
1. Customer fills out order form
2. Clicks "COD (Cash on Delivery)" button
3. **Popup appears** with message:
   - "Why do I need to pay in advance?"
   - Shows order total: ₹X,XXX
   - Shows advance payment required: ₹200 (or configured amount)
   - Shows balance to pay on delivery: ₹X,XXX - ₹200
4. Customer clicks "Pay ₹200 Now" button
5. Razorpay payment gateway opens
6. Customer completes payment
7. Success message: "COD advance payment successful! Your order is confirmed. Pay the remaining amount on delivery."
8. Redirects to home page

### Admin Experience
1. Navigate to Admin Portal → Installation & AMC Settings
2. See "COD Advance Amount (₹)" field
3. Enter desired amount (e.g., 200, 500, 1000)
4. Click "Save Settings"
5. New amount immediately applies to all new COD orders

## Features Implemented

✅ **Configurable Advance Amount** - Admin can set any amount  
✅ **Razorpay Integration** - Secure payment processing  
✅ **User-Friendly Dialog** - Clear explanation and breakdown  
✅ **Order Tracking** - Links payment to specific order number  
✅ **Development Mode** - Auto-approve for testing  
✅ **Production Ready** - Real Razorpay payment flow  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Error Handling** - Graceful fallbacks and user feedback  

## Technical Details

### Payment Flow
1. **Order Creation**: Order saved to database with status "pending"
2. **Advance Payment**: Separate Razorpay order created with suffix "_ADVANCE"
3. **Payment Verification**: Standard Razorpay signature verification
4. **Order Confirmation**: On success, order is confirmed

### Payment Notes
Each advance payment includes metadata:
- `orderNumber`: Links payment to order
- `customerName`: Customer identification
- `phone`: Contact information
- `paymentType`: "COD_ADVANCE" for tracking

### Security
- Razorpay signature verification
- HTTPS encryption
- No stored card details
- PCI DSS compliant

## Configuration

### Environment Variables
No new environment variables required. Uses existing Razorpay configuration:
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Your Razorpay key
- `RAZORPAY_KEY_SECRET` - Your Razorpay secret
- `RAZORPAY_DEV_MODE` - Set to 'true' for testing

### Development Mode
Set `RAZORPAY_DEV_MODE=true` in `.env.local` to:
- Skip actual Razorpay payment
- Auto-approve payments
- Test the complete flow without real payments

## Testing

### Test the Feature
1. Run migration: `.\run-cod-advance-migration.ps1`
2. Start dev server: `npm run dev`
3. Navigate to any product
4. Click "Buy Now" or "Add to Cart" → "Proceed to Checkout"
5. Fill out customer details
6. Click "COD (Cash on Delivery)"
7. Observe popup with advance payment requirement
8. Test payment flow (dev mode or real payment)

### Admin Configuration Test
1. Go to Admin Portal → Installation & AMC Settings
2. Change "COD Advance Amount" to different value (e.g., 500)
3. Save settings
4. Create new order with COD
5. Verify popup shows updated amount

## Files Modified/Created

### New Files
- `add-cod-advance-column.sql` - Database migration
- `run-cod-advance-migration.ps1` - Migration runner script
- `components/CODAdvanceDialog.tsx` - Dialog component

### Modified Files
- `app/api/installation-settings/route.ts` - API endpoints
- `app/admin/installation-settings/page.tsx` - Admin UI
- `app/buy-now/page.tsx` - Buy now page integration

## Troubleshooting

### Dialog doesn't appear
- Check browser console for errors
- Verify settings are loaded: Check Network tab for `/api/installation-settings`
- Ensure state variables are initialized

### Payment fails
- Check Razorpay credentials in `.env.local`
- Verify Razorpay dashboard for test/live mode
- Check server logs for error messages

### Amount not updating
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Verify database column exists: `SELECT cod_advance_amount FROM installation_settings;`

## Future Enhancements (Optional)

- [ ] Email notification with advance payment receipt
- [ ] SMS confirmation of order with balance due
- [ ] Different advance amounts based on order value (percentage-based)
- [ ] Admin dashboard to track COD advance payments
- [ ] Refund mechanism for cancelled orders
- [ ] Advance payment as wallet balance for future orders

## Support

For issues or questions:
1. Check browser console for JavaScript errors
2. Check server logs for API errors
3. Verify database migration was successful
4. Test in development mode first

---

**Implementation Date:** February 8, 2026  
**Version:** 1.0  
**Status:** ✅ Complete and Ready for Production
