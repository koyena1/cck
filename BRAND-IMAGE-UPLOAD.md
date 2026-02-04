# Brand Image Upload Feature

## Overview
Admins can now upload brand logos/images when adding or editing brands in the Quotation Management panel. The system automatically manages display order based on entry sequence.

---

## Features Implemented

### 1. **Brand Image Upload**
- Upload brand logos (PNG, JPG, WebP supported)
- Image preview before saving
- Images stored in `/public/brands/` directory
- Database stores image URL/path

### 2. **Auto-Generated Display Order**
- Display order automatically assigned: 1, 2, 3, 4...
- Based on entry order (when brand is added)
- **Not manually editable** - ensures consistent ordering
- Existing brands retain their order

### 3. **Smart Image Display**
- **Frontend with images**: Categories page brand grid
- **Admin panel only**: Brand name + logo display
- **Other locations**: Only brand name (dropdowns, filters, forms)

---

## Database Changes

### Migration File: `add-brand-image-column.sql`

```sql
ALTER TABLE brands ADD COLUMN image_url TEXT;
```

Run this migration:
```bash
# On production server
sudo -u postgres psql -d cctv_platform -f add-brand-image-column.sql
```

### Updated Schema
```sql
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  image_url TEXT,              -- NEW: Stores uploaded image path
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Admin Panel Usage

### Adding a New Brand

1. **Navigate to Admin Panel**
   - Go to `/admin/quotation`
   - Click "Brands" tab

2. **Click "Add Brand" Button**
   - Modal opens

3. **Fill in Details**
   - **Name**: Enter brand name (e.g., "Sony")
   - **Brand Logo/Image**: Click "Choose File" and select image
   - **Preview**: Image preview appears after selection
   - **Display Order**: Auto-generated (not shown - automatic)

4. **Click "Add Item"**
   - Image uploads to `/public/brands/`
   - Brand saved with image URL
   - Display order auto-assigned (e.g., 6 if 5 brands exist)
   - Global refresh triggered

### Editing an Existing Brand

1. **Click Edit Icon** on brand row

2. **Update Details**
   - Change name if needed
   - Upload new image (optional)
   - Previous image shown as preview
   - Display order: **Not editable** (automatic)

3. **Click "Save Changes"**
   - New image uploaded if selected
   - Database updated
   - Global refresh triggered

---

## File Upload System

### API Endpoint: `/api/upload`

**Request:**
```typescript
POST /api/upload
Content-Type: multipart/form-data

FormData:
- file: <image file>
- folder: "brands"
```

**Response:**
```json
{
  "success": true,
  "url": "/brands/1738608123456-sony-logo.png",
  "filename": "1738608123456-sony-logo.png"
}
```

### File Storage
- **Location**: `/public/brands/`
- **Naming**: `{timestamp}-{original-name}.{ext}`
- **Example**: `1738608123456-hikvision.png`
- **Access**: Direct URL like `/brands/1738608123456-hikvision.png`

---

## Image Display Logic

### Where Brand Images ARE Displayed

#### 1. Categories Page (`/categories`)
```typescript
// Brand grid with logos
{brands.map(brand => (
  <div className="brand-card">
    <Image src={brand.logo} alt={brand.name} />
    <span>{brand.name}</span>
  </div>
))}
```

#### 2. Admin Quotation Panel (`/admin/quotation`)
```typescript
// Brand table with logos
<td className="px-6 py-4">
  {item.image_url ? (
    <Image src={item.image_url} alt={item.name} width={64} height={64} />
  ) : (
    <div>No Logo</div>
  )}
</td>
<td>{item.name}</td>
```

### Where ONLY Brand Names Are Displayed

#### 1. Quotation Form Dropdown
```typescript
<select>
  {brands.map(brand => (
    <option value={brand}>{brand}</option>  // Name only
  ))}
</select>
```

#### 2. Product Filters
```typescript
<Checkbox label={brand.name} />  // Name only
```

#### 3. Product Cards
```typescript
<p className="brand">{product.brand}</p>  // Name only
```

#### 4. Order Details
```typescript
<div>Brand: {order.brand}</div>  // Name only
```

---

## Display Order System

### How It Works

1. **On Brand Creation**
```typescript
// Get max display order
const maxOrder = brands.reduce((max, b) => Math.max(max, b.display_order), 0);

// Auto-assign next number
const newOrder = maxOrder + 1;
```

2. **Sequence Example**
```
Existing brands:
- Hikvision: display_order = 1
- CP Plus: display_order = 2
- Dahua: display_order = 3

Admin adds "Sony":
→ Auto-assigned: display_order = 4

Admin adds "Bosch":
→ Auto-assigned: display_order = 5
```

3. **UI Behavior**
- Display order field **hidden** in Add Brand modal
- Display order field **disabled** in Edit Brand modal
- Table shows order number (read-only badge)
- Message: "Display order will be auto-generated based on entry sequence"

---

## Code Changes Summary

### Files Modified

1. **`app/admin/quotation/page.tsx`**
   - Added `imageFile` and `imagePreview` state
   - Added `handleImageChange()` function
   - Auto-generate display order in `handleAdd()`
   - Image upload in `handleAdd()` and `handleEdit()`
   - Updated brands table UI with image column
   - Added file input in Add/Edit modals for brands
   - Hidden display order field for brands

2. **`app/api/upload/route.ts`** (NEW)
   - File upload endpoint
   - Saves to `/public/brands/`
   - Returns URL path

3. **`app/api/quotation-manage/route.ts`**
   - Updated POST to handle `image_url`
   - Updated PUT to handle `image_url`
   - Separate case for brands with image

4. **`app/categories/page.tsx`**
   - Updated to use `brand.image_url` from database
   - Fallback to hardcoded logos if no image uploaded
   - Fallback to default.png if neither exists

5. **`lib/useGlobalQuotationData.ts`**
   - Added `image_url?: string` to brands type

6. **`schema-quotation-settings.sql`**
   - Added `image_url TEXT` column to brands table

7. **`add-brand-image-column.sql`** (NEW)
   - Migration file to add image_url column

---

## Testing

### Test Case 1: Add Brand with Image

**Steps:**
1. Go to `/admin/quotation`
2. Click "Brands" tab
3. Click "Add Brand"
4. Enter name: "Sony"
5. Upload image: `sony-logo.png`
6. Check preview appears
7. Click "Add Item"

**Expected:**
- ✅ Brand added with image_url
- ✅ Display order = (max + 1)
- ✅ Image saved to `/public/brands/`
- ✅ Categories page shows Sony with logo
- ✅ Quotation dropdown shows "Sony" (name only)

### Test Case 2: Edit Brand Image

**Steps:**
1. Click edit on existing brand
2. Upload new image
3. Click "Save Changes"

**Expected:**
- ✅ New image uploaded
- ✅ Display order unchanged
- ✅ Categories page shows new logo
- ✅ Global data refreshed

### Test Case 3: Add Brand Without Image

**Steps:**
1. Add brand without uploading image
2. Check categories page

**Expected:**
- ✅ Brand added successfully
- ✅ Categories page shows "No Logo" placeholder or fallback
- ✅ Quotation dropdown shows brand name

---

## Image Requirements

### Recommended Specifications
- **Format**: PNG (transparent background preferred)
- **Size**: 200x200px to 400x400px
- **File size**: < 500KB
- **Aspect ratio**: Square (1:1) works best
- **Background**: Transparent or white

### Supported Formats
- PNG (recommended)
- JPG/JPEG
- WebP
- SVG (as image file)

---

## Troubleshooting

### Image Not Displaying

**Check:**
1. File uploaded successfully? (Check `/public/brands/` folder)
2. Database has `image_url` value? (Check brands table)
3. URL path correct? (Should start with `/brands/`)
4. Image file accessible? (Try direct URL in browser)

**Fix:**
```sql
-- Check image URLs in database
SELECT id, name, image_url FROM brands;

-- Update manually if needed
UPDATE brands SET image_url = '/brands/correct-image.png' WHERE id = 1;
```

### Display Order Issues

**Reset Display Order:**
```sql
-- Reorder all brands sequentially
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_order
  FROM brands
)
UPDATE brands 
SET display_order = ranked.new_order
FROM ranked
WHERE brands.id = ranked.id;
```

### Upload Fails

**Check permissions:**
```bash
# Ensure public/brands directory is writable
chmod 755 public/brands/
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Run migration: `add-brand-image-column.sql`
- [ ] Create `/public/brands/` directory
- [ ] Set directory permissions (755)
- [ ] Test image upload on staging
- [ ] Verify existing brands work without images
- [ ] Test image display on categories page

### Deployment Steps

1. **Database Migration**
```bash
sudo -u postgres psql -d cctv_platform -f add-brand-image-column.sql
```

2. **Create Upload Directory**
```bash
mkdir -p public/brands
chmod 755 public/brands
```

3. **Deploy Code**
```bash
npm run build
pm2 restart cctv-website
```

4. **Test**
- Add brand with image
- Check categories page
- Verify global refresh works

---

## Future Enhancements

Potential improvements:
- [ ] Image compression on upload
- [ ] Multiple image sizes (thumbnail, full)
- [ ] Image cropping tool
- [ ] Bulk brand import with images
- [ ] CDN integration for images
- [ ] Image validation (size, format)
- [ ] Drag-and-drop display order reordering
