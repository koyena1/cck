# Invoice Format Update Summary

## Overview
Updated the customer invoice format to include detailed seller/buyer information and GST breakdown while maintaining the blue/yellow PROTECHTUR design.

## Changes Made

### 1. Added Seller Details Section
All invoices now include a comprehensive seller section with:
- **Company Name**: PROTECHTUR
- **Billing Address**: CONTAI-I, CONTAI, HATABARI, Purba Medinipur, West Bengal, 721401
- **City**: East Midnapore
- **State**: West Bengal
- **Pin Code**: 721401
- **GSTIN No**: 19DNTPS0577P1ZO
- **Phone No**: +91-9999049135

### 2. Enhanced Buyer Details Section
- Renamed from "BILL TO" to "BUYER" with gray header background
- Includes: Name, Address, Pin Code, Phone No, GSTIN NO (field)
- Better formatted with proper spacing and line wrapping

### 3. GST Breakdown (18% Total)
Replaced single "Tax" line with detailed GST breakdown:
- **CGST Amount (9%)**: Half of total tax
- **SGST Amount (9%)**: Half of total tax
- Shows precise GST calculation for transparency

### 4. Updated Invoice Layout
- Added gray header bars for SELLER and BUYER sections
- Improved two-column layout with consistent spacing
- Maintains PROTECHTUR branding (blue/yellow color scheme)

## Files Modified

### Server-Side Invoice Generator
`lib/generate-invoice-pdf.ts`
- Added company constant definitions
- Replaced BILL TO section with SELLER/BUYER layout
- Added GST breakdown logic

### Customer Portal
`app/customer/dashboard/page.tsx`
- Added company constants at file top
- Updated invoice generation with SELLER/BUYER sections
- Implemented GST breakdown (CGST 9% + SGST 9%)

### Dealer Portal
`app/dealer/order-requests/page.tsx`
- Added company constants
- Updated customer invoice generation
- Added GST breakdown for dealer-downloaded invoices

### Admin Portal
`app/admin/orders/page.tsx`
- Added company constants
- Updated invoice generation with new format
- Implemented GST breakdown

## Design Elements Preserved
✅ Blue header background (RGB: 15, 23, 42)
✅ Yellow/gold text for company name (RGB: 250, 204, 21)
✅ "CUSTOMER INVOICE" title
✅ Item table with blue header
✅ Grand total with blue/yellow scheme
✅ Footer band with company information

## Invoice Structure Flow
1. **Header Band** (Blue/Yellow) - PROTECHTUR branding
2. **Invoice Metadata** - Invoice No, Order No, Date, Payment Status
3. **Seller Section** (Gray header) - Company details with GSTIN
4. **Buyer Section** (Gray header) - Customer details
5. **Items Table** - Products/services with quantities
6. **Totals Section** including:
   - Products Subtotal
   - Installation/AMC/Delivery Charges
   - **CGST Amount (9%)**
   - **SGST Amount (9%)**
   - Discounts (if any)
   - COD charges (if applicable)
7. **Grand Total** (Blue/Yellow band)
8. **Footer** - Support information

## Testing Recommendations
1. Generate an invoice from customer dashboard
2. Download invoice from dealer portal
3. Generate invoice from admin panel
4. Verify all invoices show:
   - Seller details with GSTIN
   - Buyer details properly formatted
   - GST split into CGST 9% + SGST 9%
   - Blue/yellow design intact

## Environment Variables (Optional)
You can customize company details via environment variables:
- `COMPANY_NAME` (default: Protechtur)
- `COMPANY_ADDRESS`
- `COMPANY_CITY`
- `COMPANY_STATE`
- `COMPANY_PINCODE`
- `COMPANY_GSTIN`
- `COMPANY_PHONE`

## Notes
- All existing functionality remains unchanged
- Only the invoice PDF format has been updated
- Database schema requires no changes
- Customer GSTIN field shown but typically blank (B2C transactions)
