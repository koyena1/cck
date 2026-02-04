# Example: Migrating Product Pages to Use Global Data

## Scenario
You have a product category page (e.g., HD Combo products) that needs to:
1. Filter by brands added in Quotation Management
2. Filter by channels added in Quotation Management
3. Auto-update when admin adds new options

---

## Before Migration (Hardcoded Filters)

```typescript
"use client";
import { useState } from "react";

// ❌ PROBLEM: Hardcoded values
const BRANDS = ["Hikvision", "CP Plus", "Dahua"];
const CHANNELS = [4, 8, 16];
const RESOLUTIONS = ["2MP", "5MP", "8MP"];

export default function HDComboPage() {
  const [selectedBrand, setSelectedBrand] = useState("");
  
  return (
    <div>
      <select onChange={(e) => setSelectedBrand(e.target.value)}>
        {BRANDS.map(brand => (
          <option key={brand} value={brand}>{brand}</option>
        ))}
      </select>
    </div>
  );
}
```

**Problems:**
- Admin adds "Sony" brand → Not visible here
- Admin adds 32-channel option → Not visible here
- Requires code changes for data updates
- Inconsistent across pages

---

## After Migration (Global Data)

```typescript
"use client";
import { useState, useEffect } from "react";
import { useGlobalQuotationData, extractBrandNames, extractChannelOptions } from "@/lib/useGlobalQuotationData";

export default function HDComboPage() {
  // ✅ SOLUTION: Fetch from global data
  const { data: quotationSettings, loading: loadingGlobalData } = useGlobalQuotationData();
  
  // Extract what you need
  const [brands, setBrands] = useState<string[]>([]);
  const [channelOptions, setChannelOptions] = useState<Array<{ value: number; label: string }>>([]);
  
  // Update when global data changes
  useEffect(() => {
    if (quotationSettings) {
      setBrands(extractBrandNames(quotationSettings));
      setChannelOptions(extractChannelOptions(quotationSettings));
    }
  }, [quotationSettings]);
  
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  
  return (
    <div>
      {/* Brand Filter */}
      <select 
        onChange={(e) => setSelectedBrand(e.target.value)}
        disabled={loadingGlobalData}
      >
        <option value="">All Brands</option>
        {brands.map(brand => (
          <option key={brand} value={brand}>{brand}</option>
        ))}
      </select>
      
      {/* Channel Filter */}
      <select 
        onChange={(e) => setSelectedChannel(Number(e.target.value))}
        disabled={loadingGlobalData}
      >
        <option value={0}>All Channels</option>
        {channelOptions.map(ch => (
          <option key={ch.value} value={ch.value}>{ch.label}</option>
        ))}
      </select>
    </div>
  );
}
```

**Benefits:**
- ✅ Admin adds "Sony" → Appears automatically
- ✅ Admin adds 32-channel → Appears automatically
- ✅ No code changes needed
- ✅ Consistent across all pages
- ✅ Real-time updates

---

## Advanced: Filter Sidebar with Global Data

```typescript
"use client";
import { useGlobalQuotationData } from "@/lib/useGlobalQuotationData";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

export default function ProductsWithFilters() {
  const { data, loading } = useGlobalQuotationData();
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [selectedPixels, setSelectedPixels] = useState<string[]>([]);
  
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };
  
  const handleChannelToggle = (channel: number) => {
    setSelectedChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };
  
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Filter Sidebar */}
      <aside className="col-span-3">
        <div className="space-y-6">
          {/* Brand Filters */}
          <div>
            <h3 className="font-bold mb-3">Brands</h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-2">
                {data?.brands.map(brand => (
                  <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedBrands.includes(brand.name)}
                      onCheckedChange={() => handleBrandToggle(brand.name)}
                    />
                    <span className="text-sm">{brand.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {/* Channel Filters */}
          <div>
            <h3 className="font-bold mb-3">Channels</h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-2">
                {data?.channels.map(channel => (
                  <label key={channel.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedChannels.includes(channel.channel_count)}
                      onCheckedChange={() => handleChannelToggle(channel.channel_count)}
                    />
                    <span className="text-sm">{channel.channel_count} Channel</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {/* Pixel/Resolution Filters */}
          <div>
            <h3 className="font-bold mb-3">Resolution</h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <div className="space-y-2">
                {data?.pixels.map(pixel => (
                  <label key={pixel.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox 
                      checked={selectedPixels.includes(pixel.name)}
                      onCheckedChange={() => {
                        setSelectedPixels(prev =>
                          prev.includes(pixel.name)
                            ? prev.filter(p => p !== pixel.name)
                            : [...prev, pixel.name]
                        );
                      }}
                    />
                    <span className="text-sm">{pixel.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Products Grid */}
      <main className="col-span-9">
        {/* Filter chips showing selected filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedBrands.map(brand => (
            <span key={brand} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {brand}
              <button 
                onClick={() => handleBrandToggle(brand)}
                className="ml-2 text-blue-900 hover:text-blue-700"
              >
                ×
              </button>
            </span>
          ))}
          {selectedChannels.map(ch => (
            <span key={ch} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              {ch} Channel
              <button 
                onClick={() => handleChannelToggle(ch)}
                className="ml-2 text-green-900 hover:text-green-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        
        {/* Your products list here */}
        <div className="grid grid-cols-3 gap-6">
          {/* Product cards */}
        </div>
      </main>
    </div>
  );
}
```

---

## Real-World Example: HD Combo Page

### File: `app/categories/hd-combo/page.tsx`

```typescript
"use client";
import { useState, useEffect } from "react";
import { useGlobalQuotationData } from "@/lib/useGlobalQuotationData";

export default function HDComboPage() {
  // Global data hook
  const { data: globalData, loading: loadingGlobal } = useGlobalQuotationData();
  
  // Products from API
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic filter options from global data
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [availableChannels, setAvailableChannels] = useState<number[]>([]);
  
  // Filter selections
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  
  // Update filter options when global data loads
  useEffect(() => {
    if (globalData) {
      setAvailableBrands(globalData.brands.map(b => b.name));
      setAvailableChannels(globalData.channels.map(c => c.channel_count));
    }
  }, [globalData]);
  
  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/hd-combo-products');
      const data = await res.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter products based on selections
  const filteredProducts = products.filter(product => {
    const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const channelMatch = selectedChannels.length === 0 || selectedChannels.includes(product.channels);
    return brandMatch && channelMatch;
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Filters</h3>
        
        {/* Brand Filter */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Brands</h4>
          {loadingGlobal ? (
            <p className="text-sm text-gray-500">Loading brands...</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableBrands.map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    setSelectedBrands(prev =>
                      prev.includes(brand)
                        ? prev.filter(b => b !== brand)
                        : [...prev, brand]
                    );
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedBrands.includes(brand)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Channel Filter */}
        <div className="mb-6">
          <h4 className="font-semibold mb-2">Channels</h4>
          {loadingGlobal ? (
            <p className="text-sm text-gray-500">Loading channels...</p>
          ) : (
            <div className="flex gap-2">
              {availableChannels.map(ch => (
                <button
                  key={ch}
                  onClick={() => {
                    setSelectedChannels(prev =>
                      prev.includes(ch)
                        ? prev.filter(c => c !== ch)
                        : [...prev, ch]
                    );
                  }}
                  className={`px-4 py-2 rounded-lg border ${
                    selectedChannels.includes(ch)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {ch}CH
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p>No products match your filters</p>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className="border rounded-lg p-4">
              <h3 className="font-bold">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.brand} • {product.channels}CH</p>
              <p className="text-lg font-bold text-blue-600">₹{product.price}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## Testing the Integration

### Step 1: Open Product Page
```
http://localhost:3000/categories/hd-combo
```

### Step 2: Open Admin Panel (in another tab)
```
http://localhost:3000/admin/quotation
```

### Step 3: Add New Brand
1. In admin panel, click "Add Brand"
2. Enter "Sony"
3. Click Save
4. Check product page → "Sony" appears in filter immediately!

### Step 4: Add New Channel
1. In admin panel, click "Add Channel"
2. Enter "32"
3. Click Save
4. Check product page → "32CH" appears in filter!

---

## Key Takeaways

1. **Always use `useGlobalQuotationData()`** for dynamic options
2. **Never hardcode** brands, channels, pixels, etc.
3. **Handle loading states** while data fetches
4. **Provide fallbacks** for empty data
5. **Use helper functions** for common extractions
6. **Test admin changes** reflect immediately

---

## Migration Checklist

- [ ] Import `useGlobalQuotationData` hook
- [ ] Replace hardcoded arrays with hook data
- [ ] Add loading state handling
- [ ] Test filter updates when admin adds data
- [ ] Remove old hardcoded constants
- [ ] Document any custom filter logic
- [ ] Test with empty/null data scenarios
