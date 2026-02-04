# Base Component Pricing Implementation Guide

## Overview
This implementation adds a comprehensive component-based pricing structure where the final quotation price is calculated by adding:
1. **Camera Type Price** (IP or HD base price)
2. **Brand Price** (different prices for HD and IP cameras)
3. **Channel Price** (DVR/NVR cost based on channel count)
4. **Pixel Price** (resolution premium for 2MP, 5MP, 8MP)
5. **Camera Tech Type Price** (Dome, Bullet, PTZ prices)
6. **Storage Price**
7. **Cable Price**
8. **Accessories Price**
9. **Installation Price**

## Step 1: Database Setup

**Run this SQL script in your PostgreSQL database:**

```sql
-- File: update-base-pricing-columns.sql
```

This script will:
- Add `price` column to `camera_types` table (IP/HD base prices)
- Add `hd_price` and `ip_price` columns to `brands` table
- Add `price` column to `channel_options` table (DVR/NVR costs)
- Add `price` column to `pixel_options` table (resolution premiums)
- Set default values for all prices

**To execute:**
```powershell
# Connect to your PostgreSQL database
psql -U your_username -d your_database -f update-base-pricing-columns.sql
```

## Step 2: Admin Panel - Base Pricing Tab

**Location:** Admin Portal → Pricing Management → Base Pricing Tab

The admin panel now includes a new "Base Pricing" tab (first tab) with 4 sections:

### 1. Camera Type Pricing
- Set base prices for IP and HD camera types
- Example: IP = ₹500, HD = ₹300

### 2. Brand Pricing
- Set different prices per brand for HD and IP cameras
- Example: 
  - Hikvision HD = ₹300, IP = ₹500
  - Dahua HD = ₹250, IP = ₹450
  - CP Plus HD = ₹200, IP = ₹400

### 3. DVR/NVR Channel Pricing
- Set prices for different channel counts
- Example:
  - 4 CH = ₹3,500
  - 8 CH = ₹5,500
  - 16 CH = ₹9,500
  - 32 CH = ₹15,000

### 4. Pixel/Resolution Pricing
- Set premium prices for higher resolutions
- Example:
  - 2MP = ₹0 (base resolution)
  - 5MP = ₹200 (premium)
  - 8MP = ₹400 (premium)

## Step 3: Price Calculation Logic

**Frontend Calculation (app/page.tsx):**

```
Total Price = 
  Camera Type Price +           // ₹500 (IP) or ₹300 (HD)
  Brand Price +                 // ₹500 (Hikvision IP)
  Channel Price +               // ₹5,500 (8CH DVR)
  (Tech Type + Pixel) × Qty +   // (₹800 Dome + ₹200 5MP) × 4 = ₹4,000
  Storage Price +               // ₹2,500 (2TB)
  Cable Price +                 // ₹1,200
  Accessories Price +           // ₹500
  Installation Price            // ₹1,600 (4 cameras × ₹400)
─────────────────────────────────
  = ₹16,200
```

## Step 4: How to Use

### For Admin:
1. Login to Admin Portal
2. Navigate to **Pricing Management**
3. Click **Base Pricing** tab (first tab)
4. Set prices for:
   - Camera Types (IP/HD)
   - Brands (HD and IP prices separately)
   - Channels (4CH, 8CH, 16CH, 32CH)
   - Pixels (2MP, 5MP, 8MP)
5. Click **Update** button next to each entry to save

### For Customers:
- The frontend quotation calculator automatically fetches all prices from the admin panel
- Prices are additive: selecting IP camera + Hikvision brand = IP base price + Hikvision IP price
- Real-time price updates when admin changes values

## Files Modified

### 1. app/admin/pricing/page.tsx
- Added new "Base Pricing" tab with 4 pricing sections
- Added `handleUpdateQuotationPrice()` function for camera type, channel, and pixel pricing
- Added `handleUpdateBrandPrice()` function for brand HD/IP pricing
- Updated TabsList to include 7 tabs (was 6)

### 2. app/api/quotation-manage/route.ts
- Extended PUT handler to support price-only updates
- Added logic for updating `camera_types.price`, `channel_options.price`, `pixel_options.price`
- Added logic for updating `brands.hd_price` and `brands.ip_price` separately

### 3. app/page.tsx
- Added 3 new memoized price objects:
  - `CAMERA_TYPE_PRICES` - Maps camera type name to price
  - `BRAND_PRICES` - Maps brand name to { hd: price, ip: price }
  - `PIXEL_PRICES` - Maps pixel name (2MP, 5MP, 8MP) to premium price
- Updated `totalPrice` calculation to include all component prices additively
- Changed pixel pricing from hardcoded 1.5x multiplier to database-driven premiums

### 4. update-base-pricing-columns.sql (NEW)
- SQL migration script to add price columns to tables
- Includes default price values for testing

## Pricing Strategy Examples

### Budget Package (HD System)
- Camera Type: HD = ₹300
- Brand: CP Plus HD = ₹200
- Channel: 4CH = ₹3,500
- Cameras: 4 × (Dome ₹600 + 2MP ₹0) = ₹2,400
- Storage: 1TB = ₹1,500
- Total: **₹7,900**

### Premium Package (IP System)
- Camera Type: IP = ₹500
- Brand: Hikvision IP = ₹500
- Channel: 8CH = ₹5,500
- Cameras: 8 × (Bullet ₹800 + 5MP ₹200) = ₹8,000
- Storage: 4TB = ₹4,500
- Total: **₹19,000**

## Troubleshooting

### Prices showing ₹0
- Check if SQL migration script was executed
- Verify prices are set in Admin Panel → Base Pricing tab
- Check browser console for API errors

### Prices not updating
- Clear browser cache
- Check if `fetchQuotationSettings()` is being called
- Verify PostgreSQL connection in lib/db.ts

### Wrong prices being used
- Check if brand has both HD and IP prices set
- Verify camera type is selected (IP or HD)
- Check calculation logic in app/page.tsx lines 370-420

## API Endpoints

### GET /api/quotation-settings
Returns all pricing data including:
```json
{
  "cameraTypes": [{ "id": 1, "name": "IP Camera", "price": 500 }],
  "brands": [{ "id": 1, "name": "Hikvision", "hd_price": 300, "ip_price": 500 }],
  "channels": [{ "id": 1, "channel_count": 4, "price": 3500 }],
  "pixels": [{ "id": 1, "name": "2MP", "price": 0 }]
}
```

### PUT /api/quotation-manage
Update individual component prices:
```json
// Update camera type price
{ "table": "camera_types", "id": 1, "price": 500 }

// Update brand prices
{ "table": "brands", "id": 1, "hd_price": 300, "ip_price": 500 }

// Update channel price
{ "table": "channel_options", "id": 1, "price": 3500 }

// Update pixel price
{ "table": "pixel_options", "id": 1, "price": 200 }
```

## Testing Checklist

- [ ] Run SQL migration script successfully
- [ ] Login to Admin Panel
- [ ] Navigate to Pricing Management → Base Pricing
- [ ] Set prices for all 4 sections (Camera Type, Brand, Channel, Pixel)
- [ ] Click Update buttons to save
- [ ] Open frontend quotation calculator
- [ ] Select camera type (IP/HD)
- [ ] Select brand (Hikvision, Dahua, etc.)
- [ ] Select channels (4CH, 8CH, etc.)
- [ ] Add cameras and verify total price includes all components
- [ ] Verify price changes when switching between IP and HD
- [ ] Verify different brands show different prices

## Future Enhancements

1. **Bulk Update for Base Pricing** - Add bulk adjustment for component prices
2. **Price History** - Track price changes over time
3. **Regional Pricing** - Different prices for different cities/states
4. **Dynamic Multipliers** - Make 5MP multiplier (1.5x) configurable
5. **Price Validation** - Add min/max price constraints
6. **Export Pricing** - Download pricing data as CSV/Excel

## Support

For issues or questions:
1. Check PostgreSQL logs for database errors
2. Check browser console (F12) for frontend errors
3. Check Next.js logs for API errors
4. Verify all files were modified correctly

---
**Last Updated:** 2024
**Version:** 1.0
