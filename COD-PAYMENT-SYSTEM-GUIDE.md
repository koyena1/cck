# COD Payment System with Configurable Advance Payment

## Overview

The COD (Cash on Delivery) payment system now supports configurable advance payments based on a percentage of the total order amount (including extra COD charges). This system helps prevent fraudulent COD orders while providing flexibility to customers.

## How It Works

### For Customers (Frontend)

1. **Selecting COD on Buy Now Page**
   - When a customer goes to the Buy Now page and fills in their details
   - They see a detailed COD information card showing:
     - Product total amount
     - Extra COD charges (configurable)
     - Total base amount (Product + COD charges)
     - Advance payment required (percentage-based)
     - Balance to be paid on delivery

2. **COD Advance Payment Calculation**
   ```
   Products Total = Sum of all product prices
   Extra COD Amount = Configurable from admin (e.g., ₹200)
   Base Amount = Products Total + Extra COD Amount
   Advance Payment = Base Amount × (COD Percentage / 100)
   Pay on Delivery = Total Order Amount - Advance Payment
   ```

3. **Payment Flow**
   - Customer clicks "COD (Cash on Delivery)" button
   - System shows a confirmation dialog with breakdown
   - Upon confirmation, order is created in database
   - COD Advance Payment dialog opens
   - Customer pays the advance amount via Razorpay
   - Order is confirmed
   - Remaining amount is collected on delivery

### For Admins (Backend)

Admins can configure two key parameters from the Admin Panel:

1. **Extra COD Amount (₹)**
   - Additional charge applied when customer selects COD
   - Default: ₹200
   - Purpose: Cover additional COD processing costs

2. **COD Advance Payment Percentage (%)**
   - Percentage of (Product Total + Extra COD Amount) to be paid in advance
   - Default: 10%
   - Range: 0-100%
   - Purpose: Ensure buyer commitment and reduce fraud

## Implementation Details

### Database Schema

**Table:** `installation_settings`

New columns:
- `cod_advance_amount` (DECIMAL(10, 2)): Extra COD charges amount
- `cod_percentage` (DECIMAL(5, 2)): Percentage for advance payment

### API Endpoints

**GET/POST `/api/installation-settings`**

Request body (POST):
```json
{
  "installationCost": 5000,
  "codAdvanceAmount": 200,
  "codPercentage": 10,
  "amcOptions": {
    "with_1year": 400,
    "with_2year": 700,
    "without_1year": 250,
    "without_2year": 200
  }
}
```

Response:
```json
{
  "success": true,
  "settings": {
    "installationCost": 5000,
    "codAdvanceAmount": 200,
    "codPercentage": 10,
    "amcOptions": { ... }
  }
}
```

### Frontend Components

1. **Buy Now Page (`app/buy-now/page.tsx`)**
   - Fetches COD settings from API
   - Displays COD information card
   - Calculates advance payment dynamically
   - Shows confirmation dialog before proceeding

2. **COD Advance Dialog (`components/CODAdvanceDialog.tsx`)**
   - Receives calculated advance amount as prop
   - Integrates with Razorpay for payment
   - Shows breakdown of payment distribution

3. **Admin Settings Page (`app/admin/installation-settings/page.tsx`)**
   - Input field for Extra COD Amount
   - Input field for COD Percentage (0-100%)
   - Saves settings to database

## Example Calculation

### Scenario
- Product Price: ₹10,000
- Installation: ₹5,000 (if selected)
- AMC: ₹400 (if selected)
- Extra COD Amount: ₹200 (from admin settings)
- COD Percentage: 10% (from admin settings)

### Calculation
1. Products Total = ₹10,000
2. Add Installation (if selected) = ₹10,000 + ₹5,000 = ₹15,000
3. Add AMC (if selected) = ₹15,000 + ₹400 = ₹15,400
4. **Total Order Amount = ₹15,400**

For COD:
5. Base Amount = Products Total + Extra COD Amount = ₹10,000 + ₹200 = ₹10,200
6. Advance Payment = ₹10,200 × 10% = ₹1,020
7. Pay on Delivery = ₹15,400 - ₹1,020 = ₹14,380

## Setup Instructions

### 1. Database Migration

Run the migration script to add the new column:

```powershell
.\run-cod-percentage-migration.ps1
```

Or manually run the SQL:
```sql
ALTER TABLE installation_settings
ADD COLUMN IF NOT EXISTS cod_percentage DECIMAL(5, 2) DEFAULT 10.00;

UPDATE installation_settings 
SET cod_percentage = 10.00 
WHERE cod_percentage IS NULL;
```

### 2. Configure Settings

1. Navigate to **Admin Panel > Installation Settings**
2. Set **Extra COD Amount** (e.g., 200)
3. Set **COD Advance Payment Percentage** (e.g., 10)
4. Click **Save Settings**

### 3. Test the Flow

1. Go to any product page
2. Click **Buy Now**
3. Fill in customer details
4. Review the COD information card
5. Click **COD (Cash on Delivery)**
6. Confirm the payment breakdown
7. Complete the advance payment via Razorpay
8. Verify order is created successfully

## Benefits

1. **Fraud Prevention**: Advance payment ensures buyer commitment
2. **Flexible Configuration**: Admins can adjust charges based on business needs
3. **Transparency**: Customers see clear breakdown before confirming
4. **Professional**: Uses Razorpay for secure advance payments
5. **User-Friendly**: Clear messaging and intuitive flow

## Files Modified

### Backend
- `app/api/installation-settings/route.ts` - Added COD percentage support
- `add-cod-percentage-column.sql` - Database migration script
- `run-cod-percentage-migration.ps1` - Migration runner script

### Frontend
- `app/buy-now/page.tsx` - Added COD calculation and info card
- `components/CODAdvanceDialog.tsx` - Updated messaging
- `app/admin/installation-settings/page.tsx` - Added percentage input field

## Support

For issues or questions:
1. Check that migration ran successfully
2. Verify settings are saved in admin panel
3. Check browser console for API errors
4. Verify Razorpay integration is working

## Future Enhancements

- Different COD charges for different product categories
- Tiered percentages based on order value
- Regional COD charge variations
- Analytics dashboard for COD conversion rates
