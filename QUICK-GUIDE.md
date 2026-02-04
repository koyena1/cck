# Quick Reference - Category Management System

## 🚀 Quick Start

### Add a New Product
1. Go to `/admin/categories/<category-name>`
2. Click "Add Product" button
3. Fill in:
   - Product name
   - Brand (dropdown)
   - Category-specific fields
   - Price and original price
   - Upload image
   - Add specifications
   - Check "Active" checkbox
4. Click "Add Product"

### View Products on Frontend
Visit: `/categories/<category-name>`

## 📋 All Categories

| Category | Admin URL | Frontend URL | API Endpoint |
|----------|-----------|--------------|--------------|
| HD Combo | `/admin/categories/hd-combo` | `/categories/hd-combo` | `/api/hd-combo-products` |
| IP Combo | `/admin/categories/ip-combo` | `/categories/ip-combo` | `/api/ip-combo-products` |
| WiFi Camera | `/admin/categories/wifi-camera` | `/categories/wifi-camera` | `/api/wifi-camera-products` |
| 4G SIM Camera | `/admin/categories/4g-sim-camera` | `/categories/4g-sim-camera` | `/api/sim-4g-camera-products` |
| Solar Camera | `/admin/categories/solar-camera` | `/categories/solar-camera` | `/api/solar-camera-products` |
| Body Worn Camera | `/admin/categories/body-worn-camera` | `/categories/body-worn-camera` | `/api/body-worn-camera-products` |
| HD Camera | `/admin/categories/hd-camera` | `/categories/hd-camera` | `/api/hd-camera-products` |
| IP Camera | `/admin/categories/ip-camera` | `/categories/ip-camera` | `/api/ip-camera-products` |

## 🔧 Database Management

### Create All Tables
```bash
node migrate-all-categories.js
```

### Check Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%_products';
```

### View Products in a Category
```sql
SELECT * FROM hd_combo_products;
SELECT * FROM ip_combo_products;
-- etc.
```

## 🎨 Category-Specific Fields

### HD Combo & IP Combo
- Channels: 2, 4, 8, 16
- Camera Type: Bullet, Dome, PTZ
- Resolution: 2MP, 3MP, 4MP, 5MP, 8MP
- HDD: 500GB, 1TB, 2TB, 4TB
- Cable: 60m - 270m

### WiFi Camera
- Resolution
- Connectivity: WiFi, 2.4GHz, 5GHz
- Night Vision: Yes/No

### 4G SIM Camera
- Resolution
- SIM Support: 4G, 3G
- Battery: mAh capacity

### Solar Camera
- Resolution
- Solar Panel: Wattage
- Battery: mAh capacity

### Body Worn Camera
- Resolution: 1080P, 4K
- Battery Life: Hours
- Storage: GB capacity

### HD Camera
- Camera Type: Bullet, Dome, PTZ
- Resolution
- Lens: mm size

### IP Camera
- Camera Type: Bullet, Dome, PTZ
- Resolution
- PoE Support: Yes/No

## 💡 Common Brands

- Hikvision
- CP Plus
- Dahua
- Prama
- Secureye
- Zebronics
- Daichi
- Godrej

## 🐛 Common Issues

### Products Not Showing on Frontend?
**Check:**
1. Is `is_active` set to `true`?
2. Does the product have an image?
3. Is the API returning data? (Check browser console)
4. Is Next.js server running?

**Fix:**
```sql
-- Make product active
UPDATE <table_name> SET is_active = true WHERE id = <product_id>;
```

### Can't Upload Image?
**Check:**
- File is an image format (JPG, PNG, WebP)
- File size is reasonable (<5MB)
- Browser console for errors

**Note:** Images are stored as base64 in the database

### API Returning Error?
**Check:**
1. Database connection (PostgreSQL running?)
2. Table exists (`node migrate-all-categories.js`)
3. Environment variables in `.env.local`

## 📝 API Examples

### Get All Active Products
```javascript
fetch('/api/hd-combo-products')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Get All Products (Admin)
```javascript
fetch('/api/hd-combo-products?admin=true')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Add Product
```javascript
fetch('/api/hd-combo-products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'HD Combo Kit',
    brand: 'Hikvision',
    channels: 4,
    camera_type: 'Bullet',
    resolution: '2MP',
    hdd: '1TB',
    cable: '90 Meter',
    price: 15000,
    original_price: 20000,
    image: 'data:image/jpeg;base64,...',
    specs: ['Night Vision', 'Weatherproof'],
    rating: 4.5,
    reviews: 10,
    is_active: true
  })
});
```

### Update Product
```javascript
fetch('/api/hd-combo-products?id=1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...updatedData })
});
```

### Delete Product
```javascript
fetch('/api/hd-combo-products?id=1', {
  method: 'DELETE'
});
```

## 🎯 Testing Checklist

### For Each Category:

**Admin Panel:**
- [ ] Navigate to admin page
- [ ] Click "Add Product"
- [ ] Fill all required fields
- [ ] Upload an image
- [ ] Add specifications
- [ ] Save product
- [ ] Verify product in table
- [ ] Edit product
- [ ] Toggle active/inactive
- [ ] Delete product

**Frontend:**
- [ ] Navigate to category page
- [ ] Verify product displays
- [ ] Check image loads
- [ ] Verify brand and name
- [ ] Check price display
- [ ] Test "Show More" button
- [ ] Test "Show Less" button
- [ ] Verify discount badge
- [ ] Check responsive design

## 🔐 Security Notes

- Admin routes protected by AdminAuthGuard
- Frontend only shows active products
- Admin can see all products (including inactive)
- No product data is hardcoded
- All data from database

## 📊 Database Tables

```
cctv_platform (database)
├── hd_combo_products
├── ip_combo_products
├── wifi_camera_products
├── sim_4g_camera_products
├── solar_camera_products
├── body_worn_camera_products
├── hd_camera_products
└── ip_camera_products
```

## 🚨 Emergency Commands

### Reset All Tables
```bash
node migrate-all-categories.js
```
⚠️ **Warning:** This will delete all existing products!

### Backup Before Reset
```bash
# In PostgreSQL
pg_dump cctv_platform > backup.sql

# Restore if needed
psql cctv_platform < backup.sql
```

## 📱 Responsive Breakpoints

- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns
- Large Desktop (xl): 4 columns

## ✨ Features Summary

✅ **8 Categories** - HD Combo, IP Combo, WiFi, 4G SIM, Solar, Body Worn, HD, IP
✅ **Admin Control** - Add, Edit, Delete, Activate/Deactivate
✅ **Image Upload** - Base64 storage with preview
✅ **Specifications** - Dynamic spec management
✅ **Show More/Less** - Expandable product details
✅ **Responsive Design** - Mobile-first approach
✅ **Database-Driven** - PostgreSQL backend
✅ **Type-Safe** - TypeScript throughout
✅ **REST API** - Full CRUD operations
✅ **Uniform Design** - Consistent across categories

## 🎓 For Developers

### Add a New Category
1. Add table schema to `schema-all-categories.sql`
2. Create API route in `app/api/<category>-products/route.ts`
3. Add admin page in `app/admin/categories/<category>/page.tsx`
4. Create/update frontend page in `app/categories/<category>/page.tsx`
5. Add menu item to admin layout
6. Run migration script

### File Locations
```
Database: schema-all-categories.sql
API: app/api/*-products/route.ts
Admin: app/admin/categories/*/page.tsx
Frontend: app/categories/*/page.tsx
Layout: app/admin/layout.tsx
```

## 🔗 Related Documentation

- `ALL-CATEGORIES-COMPLETE.md` - Full implementation details
- `HD-COMBO-ADMIN-GUIDE.md` - Original HD Combo guide
- `IMPLEMENTATION-SUMMARY.md` - Technical summary

---

**Need Help?** Check the full documentation in `ALL-CATEGORIES-COMPLETE.md`
