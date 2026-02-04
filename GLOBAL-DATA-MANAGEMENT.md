# Global Quotation Data Management System

## Overview
This system ensures that **all data added by admins in Quotation Management automatically appears everywhere** across the platform - in product listings, filters, configuration forms, and all related pages.

---

## Architecture

### Centralized Data Source
All quotation data (brands, channels, pixels, storage, cables, accessories) is stored in **PostgreSQL tables** defined in `schema-quotation-settings.sql`:

```
camera_types          → IP Camera, HD Camera, etc.
brands                → Hikvision, CP Plus, Dahua, etc.
channel_options       → 4Ch, 8Ch, 16Ch with features
pixel_options         → 2MP, 5MP, 8MP, etc.
camera_tech_types     → HD Non Audio, HD Audio, IP variants
storage_options       → 500GB, 1TB, 2TB, 4TB, etc.
cable_options         → 90M, 180M, 305M rolls (HD/IP)
accessories           → BNC Connectors, SMPS, DC Pins, etc.
quotation_settings    → Global settings (tax, discount, etc.)
```

### API Endpoint
**`GET /api/quotation-settings`** - Returns all active data from all tables
- Automatically fetches latest data
- No caching (always fresh)
- Used by all pages needing quotation data

---

## Global Data Hook

### `useGlobalQuotationData()`
Location: `lib/useGlobalQuotationData.ts`

**Usage:**
```typescript
import { useGlobalQuotationData } from '@/lib/useGlobalQuotationData';

function MyComponent() {
  const { data, loading, error, refresh } = useGlobalQuotationData();
  
  // Access brands
  const brands = data?.brands || [];
  
  // Access channels
  const channels = data?.channels || [];
  
  // Manual refresh if needed
  const handleRefresh = () => refresh();
}
```

**Returns:**
```typescript
{
  data: QuotationSettings | null;  // All quotation data
  loading: boolean;                // Loading state
  error: string | null;            // Error message if any
  refresh: () => void;             // Manual refresh function
}
```

**Available Data:**
```typescript
data.cameraTypes   // Camera types (IP, HD)
data.brands        // All brands with pricing
data.channels      // Channel options (4, 8, 16)
data.pixels        // Pixel options (2MP, 5MP, etc.)
data.techTypes     // Tech types (HD Audio, IP variants)
data.storage       // Storage options with prices
data.cables        // Cable options (HD/IP)
data.accessories   // Accessories with prices
data.settings      // Global settings
```

---

## Real-Time Synchronization

### Event System
Location: `lib/globalDataChangeEmitter.ts`

**How It Works:**
1. Admin adds/updates/deletes item in Quotation Management
2. System calls `notifyGlobalDataChange()`
3. All pages using `useGlobalQuotationData()` automatically refresh
4. Users see updated data immediately

**No page reloads needed!**

---

## Implementation Guide

### Step 1: Use Global Hook in Your Page
```typescript
"use client";
import { useGlobalQuotationData } from '@/lib/useGlobalQuotationData';

export default function ProductListPage() {
  const { data: quotationSettings, loading } = useGlobalQuotationData();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {quotationSettings?.brands.map(brand => (
        <div key={brand.id}>{brand.name}</div>
      ))}
    </div>
  );
}
```

### Step 2: Extract What You Need
```typescript
// Extract brand names
const brandNames = quotationSettings?.brands?.map(b => b.name) || [];

// Extract pixel options
const pixelOptions = quotationSettings?.pixels?.map(p => p.name) || [];

// Extract channel options
const channelOptions = quotationSettings?.channels?.map(ch => ({
  value: ch.channel_count,
  label: `${ch.channel_count} Channel`
})) || [];
```

### Step 3: Use in Filters
```typescript
// Brand filter dropdown
<select>
  {quotationSettings?.brands.map(brand => (
    <option key={brand.id} value={brand.name}>
      {brand.name}
    </option>
  ))}
</select>

// Pixel filter
<select>
  {quotationSettings?.pixels.map(pixel => (
    <option key={pixel.id} value={pixel.name}>
      {pixel.name}
    </option>
  ))}
</select>
```

---

## Admin Operations

### Location
**Admin Panel:** `/admin/quotation`

### Operations That Trigger Global Updates

#### Adding New Item
```typescript
const response = await fetch('/api/quotation-manage', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    table: 'brands',  // or 'channels', 'pixels', etc.
    name: 'New Brand',
    display_order: 5
  })
});

if (response.ok) {
  // Automatically triggers global refresh
  notifyGlobalDataChange();
}
```

#### Updating Item
```typescript
const response = await fetch('/api/quotation-manage', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 1,
    table: 'brands',
    name: 'Updated Brand Name'
  })
});

if (response.ok) {
  notifyGlobalDataChange();
}
```

#### Deleting Item
```typescript
const response = await fetch('/api/quotation-manage', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    id: 1, 
    table: 'brands' 
  })
});

if (response.ok) {
  notifyGlobalDataChange();
}
```

---

## Pages Already Using Global Data

✅ **Homepage** (`app/page.tsx`)
- Quotation form brands dropdown
- Camera type selection
- Channel options
- Pixel options
- Storage selection
- Cable options

✅ **Quotation Management Page** (`app/quotation-management/page.tsx`)
- Complete quotation configurator
- All options synced with database

✅ **Categories Page** (`app/categories/page.tsx`)
- Brand grid (dynamically populated)
- Auto-updates when admin adds new brands

✅ **Admin Quotation Panel** (`app/admin/quotation/page.tsx`)
- Manages all quotation data
- Triggers global updates on changes

---

## Migration Checklist for Other Pages

If you have pages that still use hardcoded data, follow this:

### Before (Hardcoded):
```typescript
const BRANDS = ["Hikvision", "CP Plus", "Dahua"];
```

### After (Global):
```typescript
import { useGlobalQuotationData } from '@/lib/useGlobalQuotationData';

function MyPage() {
  const { data } = useGlobalQuotationData();
  const brands = data?.brands?.map(b => b.name) || [];
  
  return <div>{/* Use brands */}</div>;
}
```

---

## Benefits

### 1. **Single Source of Truth**
- All data comes from database
- No duplicate hardcoded arrays
- Consistency across entire platform

### 2. **Real-Time Updates**
- Admin adds brand → Appears everywhere instantly
- No cache invalidation needed
- No page reloads required

### 3. **Easy Maintenance**
- Update data in one place (admin panel)
- Changes propagate automatically
- No code changes needed for data updates

### 4. **Scalability**
- Add 100 new brands → Works automatically
- Add new product categories → Instant visibility
- No deployment needed for data changes

### 5. **Developer Friendly**
- Single hook: `useGlobalQuotationData()`
- TypeScript support
- Helper functions included

---

## Helper Functions

### Extract Brand Names
```typescript
import { extractBrandNames } from '@/lib/useGlobalQuotationData';

const brandNames = extractBrandNames(quotationSettings);
// Returns: ['Hikvision', 'CP Plus', 'Dahua', ...]
```

### Extract Camera Types
```typescript
import { extractCameraTypes } from '@/lib/useGlobalQuotationData';

const cameraTypes = extractCameraTypes(quotationSettings);
// Returns: ['IP Camera', 'HD Camera']
```

### Extract Pixel Options
```typescript
import { extractPixelOptions } from '@/lib/useGlobalQuotationData';

const pixels = extractPixelOptions(quotationSettings);
// Returns: ['2MP', '5MP', '8MP']
```

### Extract Channel Options
```typescript
import { extractChannelOptions } from '@/lib/useGlobalQuotationData';

const channels = extractChannelOptions(quotationSettings);
// Returns: [{ value: 4, label: '4 Channels' }, ...]
```

---

## Testing

### Test Admin Add Operation
1. Go to `/admin/quotation`
2. Add a new brand (e.g., "Sony")
3. Check `/categories` page → Brand appears immediately
4. Check quotation form → Brand in dropdown instantly

### Test Admin Delete Operation
1. Delete a brand from admin panel
2. All pages update automatically
3. Filters remove deleted option
4. No errors or broken references

### Test Real-Time Sync
1. Open two browser tabs:
   - Tab 1: `/admin/quotation`
   - Tab 2: `/categories`
2. Add brand in Tab 1
3. Tab 2 updates automatically (may need to trigger event)

---

## Performance

- **Initial Load:** Single API call per page
- **Updates:** Event-driven (no polling)
- **Caching:** Disabled for fresh data
- **Network:** Minimal - only fetches when needed

---

## Future Enhancements

### Planned Features
- [ ] WebSocket support for instant cross-tab sync
- [ ] Optimistic UI updates
- [ ] Data versioning
- [ ] Audit trail for admin changes
- [ ] Bulk import/export
- [ ] API rate limiting
- [ ] Offline support with IndexedDB

---

## Troubleshooting

### Data Not Updating?
1. Check browser console for errors
2. Verify `/api/quotation-settings` returns data
3. Ensure `notifyGlobalDataChange()` is called after admin operations
4. Check network tab for API calls

### Old Data Showing?
1. Clear browser cache
2. Check `cache: 'no-store'` in fetch calls
3. Verify database has latest data
4. Check `is_active = true` in database records

### Page Not Using Global Data?
1. Import `useGlobalQuotationData` hook
2. Replace hardcoded arrays with hook data
3. Handle loading state
4. Add fallback for empty data

---

## Contact

For issues or questions about the global data system, check:
- Database schema: `schema-quotation-settings.sql`
- API endpoint: `app/api/quotation-settings/route.ts`
- Hook implementation: `lib/useGlobalQuotationData.ts`
- Event emitter: `lib/globalDataChangeEmitter.ts`
