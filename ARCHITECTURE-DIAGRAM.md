# HD Combo Admin System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ADMIN PANEL FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   ADMIN     │
    │   LOGIN     │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  SIDEBAR    │
    │  MENU       │
    └──────┬──────┘
           │
           ├─ A. Dashboard
           ├─ B. Orders
           ├─ C. Accounts
           ├─ D. Service Support
           ├─ E. Login
           │
           ▼
    ┌──────────────────┐
    │ F. CATEGORIES ▼  │ ◄── NEW MENU
    └──────┬───────────┘
           │
           ├─ HD Combo ◄────────────────┐
           ├─ IP Combo                  │
           ├─ WiFi Camera               │
           ├─ 4G SIM Camera             │ CLICK HERE
           ├─ Solar Camera              │
           └─ Body Worn Camera          │
                         ┌──────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │  HD COMBO ADMIN PAGE        │
           │  (/admin/categories/hd-combo│
           └─────────────┬───────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌────────┐      ┌────────┐      ┌────────┐
   │  ADD   │      │  EDIT  │      │ DELETE │
   │PRODUCT │      │PRODUCT │      │PRODUCT │
   └───┬────┘      └───┬────┘      └───┬────┘
       │               │               │
       └───────────┬───┴───────────────┘
                   │
                   ▼
          ┌────────────────┐
          │   API ROUTES   │
          │ /api/hd-combo- │
          │   products     │
          └────────┬───────┘
                   │
         ┌─────────┼─────────┐
         │         │         │
         ▼         ▼         ▼
      [POST]    [PUT]    [DELETE]
      [GET]
         │         │         │
         └─────────┼─────────┘
                   │
                   ▼
          ┌────────────────┐
          │   DATABASE     │
          │  PostgreSQL    │
          │ hd_combo_      │
          │  products      │
          └────────┬───────┘
                   │
                   │
┌──────────────────┴──────────────────────────────────────────────────────┐
│                        FRONTEND DISPLAY FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │    CUSTOMER VISITS           │
    │ /categories/hd-combo         │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │    FETCH PRODUCTS            │
    │ GET /api/hd-combo-products   │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │   FILTER: is_active = true   │
    │   (Only active products)     │
    └──────────────┬───────────────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │   DISPLAY PRODUCT CARDS      │
    │   - Same design maintained   │
    │   - Filters work             │
    │   - Animations work          │
    └──────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCT CARD STRUCTURE                            │
└─────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────┐
    │   ┌────────────────────────┐   │
    │   │                        │   │
    │   │    Product Image       │   │  ◄── image field
    │   │    (Hover Zoom)        │   │
    │   │                 [30%]  │   │  ◄── Discount badge
    │   └────────────────────────┘   │      (calculated)
    ├────────────────────────────────┤
    │  Hikvision 4CH DVR Kit         │  ◄── name field
    ├────────────────────────────────┤
    │  • 4CH DVR                     │
    │  • 4 Bullet Cameras 2MP        │  ◄── specs array
    │  • 1TB HDD                     │
    │  • 90m Cable                   │
    ├────────────────────────────────┤
    │  ★ 4.5  (128 Reviews)          │  ◄── rating, reviews
    ├────────────────────────────────┤
    │  ₹15,999    ₹22,000           │  ◄── price, original_price
    │  (Bold)     (Crossed)          │
    ├────────────────────────────────┤
    │  [View Details]  [Add to Cart] │
    └────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA OVERVIEW                            │
└─────────────────────────────────────────────────────────────────────────┘

    hd_combo_products
    ┌──────────────────┬──────────────┬────────────────────┐
    │ Column           │ Type         │ Description        │
    ├──────────────────┼──────────────┼────────────────────┤
    │ id               │ SERIAL       │ Auto-increment     │
    │ name             │ VARCHAR(255) │ Product name       │
    │ brand            │ VARCHAR(100) │ Brand name         │
    │ channels         │ INTEGER      │ 2, 4, 8, 16        │
    │ camera_type      │ VARCHAR(50)  │ Bullet, Dome, PTZ  │
    │ resolution       │ VARCHAR(20)  │ 2MP, 4MP, 5MP, 8MP │
    │ hdd              │ VARCHAR(50)  │ 500GB, 1TB, 2TB    │
    │ cable            │ VARCHAR(50)  │ 90m, 180m, 270m    │
    │ price            │ DECIMAL(10,2)│ Selling price      │
    │ original_price   │ DECIMAL(10,2)│ MRP                │
    │ image            │ TEXT         │ Base64 or URL      │
    │ specs            │ TEXT[]       │ Array of specs     │
    │ rating           │ DECIMAL(2,1) │ 0-5 stars          │
    │ reviews          │ INTEGER      │ Review count       │
    │ is_active        │ BOOLEAN      │ Visibility control │
    │ created_at       │ TIMESTAMP    │ Creation time      │
    │ updated_at       │ TIMESTAMP    │ Update time        │
    └──────────────────┴──────────────┴────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                        API ENDPOINTS SUMMARY                             │
└─────────────────────────────────────────────────────────────────────────┘

    GET    /api/hd-combo-products
           ├─ ?admin=true  → All products (admin)
           └─ (default)    → Only active products (frontend)

    POST   /api/hd-combo-products
           └─ Body: Product data → Create new product

    PUT    /api/hd-combo-products?id={id}
           └─ Body: Updated data → Update product

    DELETE /api/hd-combo-products?id={id}
           └─ Remove product from database


┌─────────────────────────────────────────────────────────────────────────┐
│                      FILE STRUCTURE OVERVIEW                             │
└─────────────────────────────────────────────────────────────────────────┘

    cctv-website/
    │
    ├── app/
    │   ├── admin/
    │   │   ├── layout.tsx ◄─────────────────── MODIFIED (Added Categories menu)
    │   │   └── categories/
    │   │       └── hd-combo/
    │   │           └── page.tsx ◄────────────── MODIFIED (Connected to DB)
    │   │
    │   ├── api/
    │   │   └── hd-combo-products/
    │   │       └── route.ts ◄────────────────── NEW (CRUD API)
    │   │
    │   └── categories/
    │       └── hd-combo/
    │           └── page.tsx ◄────────────────── MODIFIED (Fetches from DB)
    │
    ├── schema-hd-combo-products.sql ◄─────────── NEW (Database schema)
    ├── setup-hd-combo-db.ps1 ◄────────────────── NEW (Setup script)
    ├── test-setup.ps1 ◄───────────────────────── NEW (Test script)
    ├── HD-COMBO-ADMIN-GUIDE.md ◄──────────────── NEW (Full documentation)
    └── IMPLEMENTATION-SUMMARY.md ◄─────────────── NEW (Quick overview)


┌─────────────────────────────────────────────────────────────────────────┐
│                        VISIBILITY CONTROL                                │
└─────────────────────────────────────────────────────────────────────────┘

    Product Added in Admin
            │
            ▼
    ┌───────────────┐
    │  is_active?   │
    └───┬───────┬───┘
        │       │
    YES │       │ NO
        │       │
        ▼       ▼
    ┌─────┐  ┌──────┐
    │SHOW │  │ HIDE │
    │ ON  │  │ FROM │
    │FRONT│  │FRONT │
    │END  │  │ END  │
    └─────┘  └──────┘
        │       │
        │       └─── Still visible in admin panel
        │
        └─── Visible everywhere


┌─────────────────────────────────────────────────────────────────────────┐
│                          QUICK START STEPS                               │
└─────────────────────────────────────────────────────────────────────────┘

    Step 1: Setup Database
    ───────────────────────
    .\setup-hd-combo-db.ps1
    
    Step 2: Configure .env
    ───────────────────────
    DATABASE_URL=postgresql://user:pass@localhost:5432/cctv_platform
    
    Step 3: Start Server
    ───────────────────────
    npm run dev
    
    Step 4: Add Products
    ───────────────────────
    http://localhost:3000/admin/categories/hd-combo
    
    Step 5: View Frontend
    ───────────────────────
    http://localhost:3000/categories/hd-combo


┌─────────────────────────────────────────────────────────────────────────┐
│                         TROUBLESHOOTING                                  │
└─────────────────────────────────────────────────────────────────────────┘

    Problem: Products not showing on frontend
    Solution:
    ├─ Check if products are marked as "Active" in admin
    ├─ Verify API: http://localhost:3000/api/hd-combo-products
    └─ Check browser console for errors

    Problem: Database connection error
    Solution:
    ├─ Check if PostgreSQL is running
    ├─ Verify DATABASE_URL in .env
    └─ Test connection: psql -h localhost -U postgres -d cctv_platform

    Problem: Can't upload images
    Solution:
    ├─ Check file size (should be < 5MB)
    ├─ Verify file format (JPG, PNG, WebP)
    └─ Check browser console for errors


┌─────────────────────────────────────────────────────────────────────────┐
│                            SUCCESS!                                      │
│                                                                          │
│  Your HD Combo category is now fully admin-controlled!                  │
│  No code changes needed to manage products anymore! 🎉                  │
└─────────────────────────────────────────────────────────────────────────┘
```
