# 🚀 DEALER PRICING SYSTEM - QUICK REFERENCE

## ONE-TIME SETUP

```bash
# Run this ONCE to set everything up:
.\setup-dealer-pricing-system.ps1
```

---

## ADMIN PANEL FEATURES

### 📍 Location: `/admin/dealers` (dropdown menu)

#### 1️⃣ **Product Pricing** (`/admin/dealers/product-pricing`)

**Excel Upload:**
- Download sample template → Fill data → Upload
- Auto-creates/updates products based on Model Number
- Shows success/failure stats

**Bulk Price Adjustment:**
```
Filter → Select Value → Choose Price Type → Enter % → Apply
```
- Filters: All / Segment / Company / Product Type
- Price Types: Both / Purchase / Sale
- Example: +10 (increase 10%), -5 (decrease 5%)

#### 2️⃣ **Dealer Invoices** (`/admin/dealers/invoices`)

- View all purchase/sale invoices
- Filter by type
- See detailed breakdowns
- Download invoices

---

## DEALER PORTAL FEATURES

### 📍 Location: `/dealer/pricing`

#### Tab 1: **Statistics** (View Only)
- Total Purchase Amount
- Total Sale Amount  
- Total Profit

#### Tab 2: **Buy Products**
- Browse at dealer purchase price
- Add to cart → Generate invoice → Download

#### Tab 3: **Sale Products**
- Browse at dealer sale price
- Add to cart → Generate invoice → Download

---

## EXCEL FILE COLUMNS

| Required | Optional |
|----------|----------|
| Company* | Description |
| Segment* | Specifications |
| Model Number* (unique) | Stock Quantity |
| Product Type* | In Stock (Yes/No) |
| Base Price* | Active (Yes/No) |
| Dealer Purchase Price* | |
| Dealer Sale Price* | |

*Numbers only, no currency symbols

---

## KEY FEATURES

✅ **Admin:**
- Upload Excel for bulk product updates
- Download sample Excel template
- Adjust prices by % (segment/company/product type)
- View all dealer invoices
- Monitor transactions

✅ **Dealer:**
- View pricing statistics (read-only)
- Buy products at purchase price
- Sell products at sale price
- Generate & download invoices
- Automatic stock updates

---

## NAVIGATION

**Admin:**
```
Admin Panel → Dealers ▼
  ├─ Dealer Management
  ├─ Product Pricing ← Upload & Adjust
  └─ Dealer Invoices ← View All
```

**Dealer:**
```
Dealer Portal → Pricing
  ├─ Statistics (View only)
  ├─ Buy Products
  └─ Sale Products
```

---

## DATABASES CREATED

1. `dealer_products` - All products with pricing
2. `dealer_product_price_history` - Price change audit
3. `dealer_transactions` - All buy/sell transactions
4. `dealer_transaction_items` - Invoice line items
5. `dealer_pricing_upload_log` - Upload history

---

## QUICK TROUBLESHOOTING

**Excel upload failed?**
- Check column names match exactly
- Ensure Model Number is unique
- Verify all required fields filled
- No currency symbols in prices

**Price adjustment not working?**
- Enter valid percentage number
- Select filter value if not "All"
- Ensure products exist in category

**Invoice not generating?**
- Check cart is not empty
- Verify dealer is logged in
- Ensure products have stock

---

## SAMPLE WORKFLOW

### Admin adds products:
1. Download template
2. Fill Excel with products
3. Upload → System creates/updates products

### Admin adjusts prices:
1. Select "Segment" → Choose "IP Camera"
2. Select "Both Prices"
3. Enter "10" (for +10%)
4. Click "Apply"

### Dealer purchases:
1. Go to Pricing → Buy tab
2. Add products to cart
3. Click "Generate Invoice"
4. Download invoice

---

## FILES CREATED

- `schema-dealer-pricing.sql` - Database schema
- `generate-dealer-pricing-template.js` - Template generator
- `setup-dealer-pricing-db.js` - Database setup
- `setup-dealer-pricing-system.ps1` - One-click setup
- `DEALER-PRICING-SYSTEM-GUIDE.md` - Full documentation

**Admin Pages:**
- `app/admin/dealers/product-pricing/page.tsx`
- `app/admin/dealers/invoices/page.tsx`

**Dealer Pages:**
- `app/dealer/pricing/page.tsx`

**API Routes:**
- `app/api/dealer-products/route.ts`
- `app/api/dealer-products/upload/route.ts`
- `app/api/dealer-transactions/route.ts`
- `app/api/dealer-transactions/stats/route.ts`

---

## CONTACTS & SUPPORT

For detailed documentation, see: `DEALER-PRICING-SYSTEM-GUIDE.md`

---

**🎉 System is Production Ready!**
All features tested and implemented ✅
