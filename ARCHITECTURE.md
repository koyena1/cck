# System Architecture - Unified Orders

## 🗺️ Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTIONS                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
        ┌───────────────────┐      ┌───────────────────┐
        │  CATEGORY PAGES   │      │ QUOTATION FORM    │
        │  (HD, IP, WiFi)   │      │  (HD Combo)       │
        └────────┬──────────┘      └────────┬──────────┘
                 │                          │
                 │ Add to Cart              │ Submit Quotation
                 ▼                          │
        ┌───────────────────┐              │
        │   CART SIDEBAR    │              │
        └────────┬──────────┘              │
                 │                          │
                 │ Proceed to Checkout      │
                 ▼                          │
        ┌───────────────────┐              │
        │  CART CHECKOUT    │              │
        │  (Review Items)   │              │
        └────────┬──────────┘              │
                 │                          │
                 │ Buy Now (localStorage)   │
                 ▼                          │
        ┌───────────────────┐              │
        │    BUY NOW PAGE   │              │
        │  (Customer Form)  │              │
        │  - Name           │              │
        │  - Email          │              │
        │  - Phone          │              │
        │  - Address        │              │
        │  - City/State     │              │
        │  - Pin Code       │              │
        │  - Installation?  │              │
        │  - AMC?           │              │
        └────────┬──────────┘              │
                 │                          │
                 │ Click COD/Razorpay       │
                 ▼                          ▼
        ┌────────────────────────────────────────┐
        │         POST /api/orders               │
        │    (order_type='product_cart')         │
        └────────┬───────────────────────────────┘
                 │
                 │                          
        ┌────────────────────────────────────────┐
        │     POST /api/leads (existing)         │
        │   (order_type='hd_combo')              │
        └────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                      DATABASE: orders TABLE                     │
│                                                                 │
│  ┌──────────────────────┐        ┌──────────────────────┐     │
│  │  PRODUCT CART ORDERS │        │  QUOTATION ORDERS    │     │
│  │  order_type:         │        │  order_type:         │     │
│  │  'product_cart'      │        │  'hd_combo'          │     │
│  │                      │        │  'quotation'         │     │
│  │  Fields:             │        │  Fields:             │     │
│  │  - products (JSONB)  │        │  - combo_id          │     │
│  │  - products_total    │        │  - camera_type       │     │
│  │  - with_amc          │        │  - brand             │     │
│  │  - amc_cost          │        │  - channels          │     │
│  │  - landmark          │        │  - indoor_cameras    │     │
│  │                      │        │  - outdoor_cameras   │     │
│  └──────────────────────┘        └──────────────────────┘     │
│                                                                 │
│  Common Fields (Both Types):                                   │
│  - order_id, order_number, customer_name, phone, email         │
│  - installation_address, city, state, pincode                  │
│  - total_amount, status, payment_method, created_at            │
└────────────────────────────────────────────────────────────────┘
                 │
                 │ GET /api/orders (fetches ALL orders)
                 ▼
┌────────────────────────────────────────────────────────────────┐
│                    ADMIN ORDERS PANEL                           │
│  /admin/orders                                                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  📊 STATS CARDS                                         │   │
│  │  Total: 150 | Pending: 25 | In Progress: 15 | Done: 110│   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  🔍 FILTERS                                             │   │
│  │  [All] [Today] [Pending] [In Progress] [Completed]     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  📋 ORDER LIST                                          │   │
│  │                                                         │   │
│  │  ┌────────────────────────────────────────────┐        │   │
│  │  │ 🛒 Cart | John Doe | ₹17,000 | Pending    │        │   │
│  │  │ ORD-20250203-0001 | 9876543210             │        │   │
│  │  └────────────────────────────────────────────┘        │   │
│  │                                                         │   │
│  │  ┌────────────────────────────────────────────┐        │   │
│  │  │ 📦 HD Combo | Jane Smith | ₹25,000 | Done │        │   │
│  │  │ ORD-20250202-0015 | 9123456789             │        │   │
│  │  └────────────────────────────────────────────┘        │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

## 🔑 Key Components

### Frontend (User-Facing)
1. **Category Pages** (`app/categories/*/page.tsx`)
   - Display products
   - "Add to Cart" button
   - Uses CartContext

2. **Cart Sidebar** (`components/cart-sidebar.tsx`)
   - Shows cart items
   - Quantity display
   - "Proceed to Checkout" button

3. **Cart Checkout** (`app/cart-checkout/page.tsx`)
   - Review cart items
   - Shows total with quantities
   - "Buy Now" button
   - Uses localStorage to pass data

4. **Buy Now Page** (`app/buy-now/page.tsx`)
   - Customer details form (8 fields)
   - Installation options
   - AMC options
   - Payment buttons (COD/Razorpay)
   - Form validation

### Backend (API)
1. **POST /api/orders** (`app/api/orders/route.ts`)
   - Creates cart orders
   - Sets order_type='product_cart'
   - Validates data
   - Returns order confirmation

2. **GET /api/orders** (`app/api/orders/route.ts`)
   - Fetches ALL orders (both types)
   - Returns unified list
   - Used by admin panel

3. **PATCH /api/orders** (`app/api/orders/route.ts`)
   - Updates order status
   - Used for order management

4. **POST /api/leads** (Existing - `app/api/leads/route.ts`)
   - Creates quotation orders
   - Sets order_type='hd_combo' or 'quotation'
   - Already working, no changes needed

### Admin Panel
1. **Orders Management** (`app/admin/orders/page.tsx`)
   - Unified view of all orders
   - Order type badges (🛒/📦/📋)
   - Status filters
   - Stats cards
   - Case-insensitive filtering

### Database
1. **orders Table** (Enhanced)
   - Stores both order types
   - order_type column distinguishes source
   - Common fields shared
   - Type-specific fields used as needed

## 📊 Database Schema (Simplified)

```sql
orders
├── order_id (PK)
├── order_number
├── order_type ←────── Distinguishes order source
│                      'product_cart' | 'hd_combo' | 'quotation'
├── customer_name
├── customer_phone
├── customer_email
├── installation_address
├── pincode
├── city
├── state
├── landmark ←────────── NEW (for cart orders)
│
├── [Cart Order Fields]
│   ├── products ←────── NEW (JSONB array of cart items)
│   ├── products_total ← NEW
│   ├── with_amc ←────── NEW
│   ├── amc_details ←─── NEW
│   └── amc_cost ←────── NEW
│
├── [Quotation Order Fields]
│   ├── combo_id
│   ├── camera_type
│   ├── brand
│   ├── channels
│   ├── dvr_model
│   ├── indoor_cameras (JSONB)
│   ├── outdoor_cameras (JSONB)
│   ├── storage_size
│   └── cable_option
│
├── [Common Financial Fields]
│   ├── includes_installation
│   ├── installation_charges
│   ├── subtotal
│   ├── total_amount
│   ├── payment_method
│   └── payment_status
│
├── [Status & Tracking]
│   ├── status (Pending/In Progress/Completed/Cancelled)
│   ├── assigned_dealer_id
│   ├── created_at
│   └── updated_at
```

## 🔄 Order Status Flow

```
Cart Order Lifecycle:
─────────────────────
Pending → In Progress → Completed
   │            │            │
   └────────────┴────────────┴──→ Cancelled

Status Meanings:
- Pending: Just created, awaiting processing
- In Progress: Being processed/shipped
- Completed: Delivered and closed
- Cancelled: Order cancelled

Admin can update status using PATCH /api/orders
```

## 🎨 Admin UI Visual Structure

```
┌───────────────────────────────────────────────────────────┐
│  Orders Management                                         │
│  Manage all customer orders, allocations, delivery status │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  [ All Orders ]  [ Today ]  [ Pending ]                   │
│  [ In Progress ] [ Completed ]         [🔍 Search... ]    │
│                                                            │
├────────────┬────────────┬────────────┬────────────────────┤
│  Total     │  Pending   │ In Progress│   Completed        │
│   150      │    25      │     15     │      110           │
└────────────┴────────────┴────────────┴────────────────────┘
│                                                            │
│  Showing 150 order(s)                                     │
├───────────────────────────────────────────────────────────┤
│  📦  John Doe          🛒 Cart    [Pending]               │
│      9876543210        Mumbai - 400001        ₹17,000     │
│      ORD-20250203-0001 | 03-Feb-2025    [View Details]    │
├───────────────────────────────────────────────────────────┤
│  📦  Jane Smith        📦 HD Combo [Completed]            │
│      9123456789        Delhi - 110001         ₹25,000     │
│      ORD-20250202-0015 | 02-Feb-2025    [View Details]    │
├───────────────────────────────────────────────────────────┤
│  ... more orders ...                                       │
└───────────────────────────────────────────────────────────┘
```

## 🔐 Order Type Identification

### In Database
```sql
SELECT order_id, order_type FROM orders;

order_id | order_type
---------|-------------
123      | product_cart    ← From category pages
124      | hd_combo        ← From quotation
125      | product_cart    ← From category pages
126      | quotation       ← From quotation form
```

### In Admin Panel
- 🛒 Cart badge → order_type = 'product_cart'
- 📦 HD Combo badge → order_type = 'hd_combo'
- 📋 Quotation badge → order_type = 'quotation'

## 🎯 Integration Points

### Where Order Types Connect
1. **Database Level** - Same table, different order_type values
2. **API Level** - GET /api/orders returns all types
3. **Admin UI Level** - Single list with type badges
4. **Status Management** - Shared status values work for both

### Where They're Separate
1. **Creation Path** - Different forms and validation
2. **Data Fields** - Type-specific columns used differently
3. **Display Details** - Different info shown based on type

## 📈 Future Enhancements

Possible additions to system:
- Order details modal
- Status updates from admin
- Email notifications
- SMS alerts
- Payment gateway integration
- Invoice generation
- Customer order tracking
- Dealer assignment UI
- Delivery scheduling
- Analytics dashboard

---

**This architecture provides a unified, scalable system for managing all order types in your CCTV platform.**
