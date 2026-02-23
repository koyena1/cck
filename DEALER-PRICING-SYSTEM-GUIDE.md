# DEALER PRODUCT PRICING SYSTEM - COMPLETE GUIDE

## Overview
This system provides comprehensive dealer product pricing management, including Excel-based bulk uploads, percentage-based price adjustments, dealer purchase/sale functionality, and invoice generation.

---

## 🚀 SETUP INSTRUCTIONS

### 1. Database Setup
Run the following command to create all necessary database tables:

```bash
# Using PostgreSQL command line or pgAdmin
psql -U your_username -d your_database_name -f schema-dealer-pricing.sql
```

Or run the migration using Node.js:

```bash
node setup-dealer-pricing-db.js
```

### 2. Generate Sample Excel Template
Create the sample Excel template for admins:

```bash
node generate-dealer-pricing-template.js
```

This will create a file at `public/templates/dealer-product-pricing-template.xlsx`

### 3. Install Required Dependencies
Ensure you have the xlsx package installed:

```bash
npm install xlsx
```

---

## 📋 FEATURES IMPLEMENTED

### **ADMIN PANEL**

#### 1. Dealer Product Pricing (`/admin/dealers/product-pricing`)

**Access**: Admin Panel → Dealers (Dropdown) → Product Pricing

**Features**:
- ✅ **Excel Upload**: Drag & drop or browse to upload pricing Excel files
  - Automatically creates new products or updates existing ones based on model number
  - Tracks upload history and errors
  - Shows success/failure statistics

- ✅ **Sample Template Download**: 
  - Click "Download Sample Template" button
  - Includes 3 sheets:
    - Instructions: How to fill the Excel
    - Product Pricing Data: Sample data with examples
    - Empty Template: Ready-to-use template

- ✅ **Bulk Price Adjustment**:
  - Filter by:
    - All Products
    - Segment (e.g., IP Camera, HD Camera, DVR, NVR)
    - Company (e.g., Hikvision, CP Plus, Dahua)
    - Product Type (e.g., Bullet Camera, Dome Camera)
  - Price Type:
    - Both Prices (Purchase + Sale)
    - Purchase Price only
    - Sale Price only
  - Percentage input:
    - Positive values increase prices (e.g., 10 = +10%)
    - Negative values decrease prices (e.g., -5 = -5%)

- ✅ **Product Management**:
  - View all dealer products in a table
  - See company, segment, model, prices, and stock
  - Delete products
  - Statistics dashboard (total products, companies, segments, active products)

#### 2. Dealer Invoices (`/admin/dealers/invoices`)

**Access**: Admin Panel → Dealers (Dropdown) → Dealer Invoices

**Features**:
- ✅ View all dealer invoices (purchases and sales)
- ✅ Filter by transaction type
- ✅ Statistics:
  - Total invoices
  - Purchase invoices count
  - Sale invoices count
  - Total amount
- ✅ Invoice details view with:
  - Dealer information
  - All items with quantities and prices
  - Subtotal, GST, and final amount
  - Payment status and method
  - Notes
- ✅ Download invoice as text file

### **DEALER PORTAL**

#### 3. Pricing Section (`/dealer/pricing`)

**Access**: Dealer Portal → Pricing

**Features**:

**a) Statistics Tab** (View Only):
- ✅ Total Purchase Amount with transaction count
- ✅ Total Sale Amount with transaction count
- ✅ Total Profit (Sale - Purchase)
- Dealers CANNOT edit these values

**b) Buy Products Tab**:
- ✅ Browse all available products
- ✅ See dealer purchase prices
- ✅ Add products to cart
- ✅ Adjust quantities
- ✅ View cart with subtotal, GST (18%), and total
- ✅ Generate purchase invoice
- ✅ Download invoice
- ✅ Stock automatically updated after purchase

**c) Sale Products Tab**:
- ✅ Browse all available products
- ✅ See dealer sale prices
- ✅ Add products to cart
- ✅ Adjust quantities
- ✅ View cart with subtotal, GST (18%), and total
- ✅ Generate sale invoice
- ✅ Download invoice

---

## 📊 DATABASE SCHEMA

### Tables Created:

1. **dealer_products**
   - Master table for all dealer products
   - Contains: company, segment, model_number, product_type, description, specifications
   - Prices: base_price, dealer_purchase_price, dealer_sale_price
   - Stock: stock_quantity, in_stock, is_active

2. **dealer_product_price_history**
   - Tracks all price changes for audit
   - Records: old prices, new prices, who changed, change type

3. **dealer_transactions**
   - All purchase/sale transactions
   - Invoice number, amounts, GST, payment status
   - Links to dealers table

4. **dealer_transaction_items**
   - Line items for each transaction
   - Product details, quantities, prices

5. **dealer_pricing_upload_log**
   - Logs all Excel uploads
   - Success/failure statistics
   - Error details

---

## 🎯 EXCEL FILE FORMAT

### Required Columns:

| Column Name | Type | Required | Description |
|------------|------|----------|-------------|
| Company | Text | Yes | Brand name (e.g., Hikvision, CP Plus) |
| Segment | Text | Yes | Product category (IP Camera, HD Camera, DVR, NVR) |
| Model Number | Text | Yes | **MUST BE UNIQUE** - Used to identify products |
| Product Type | Text | Yes | Specific type (Bullet Camera, Dome Camera, PTZ) |
| Description | Text | No | Brief product description |
| Specifications | Text | No | Technical specifications |
| Base Price | Number | Yes | MRP or list price (numbers only) |
| Dealer Purchase Price | Number | Yes | Price dealer pays (numbers only) |
| Dealer Sale Price | Number | Yes | Recommended dealer selling price (numbers only) |
| Stock Quantity | Number | No | Available stock quantity |
| In Stock | Yes/No | No | Whether product is in stock |
| Active | Yes/No | No | Whether product should be visible |

### Important Notes:
- If Model Number exists → Updates existing product
- If Model Number is new → Creates new product
- No currency symbols (₹, $) - numbers only
- Yes/No values for In Stock and Active fields

---

## 🔄 WORKFLOW

### Admin Workflow:

1. **Initial Setup**:
   - Download sample Excel template
   - Fill in product data
   - Upload Excel file
   - System creates/updates products

2. **Price Adjustments**:
   - Select filter type (all, segment, company, product type)
   - Choose specific value (if not "all")
   - Select price type (both, purchase, sale)
   - Enter percentage (+ to increase, - to decrease)
   - Click Apply

3. **Monitor Invoices**:
   - View all dealer transactions
   - Filter by type (purchase/sale)
   - View invoice details
   - Download invoices

### Dealer Workflow:

1. **View Statistics**:
   - Check total purchase amount
   - Check total sale amount
   - See profit margin

2. **Purchase Products** (Buy Tab):
   - Browse products at purchase price
   - Add to cart
   - Adjust quantities
   - Generate invoice
   - Download invoice

3. **Sell Products** (Sale Tab):
   - Browse products at sale price
   - Add to cart
   - Adjust quantities
   - Generate invoice
   - Download invoice

---

## 🔐 SECURITY

- Admin features require admin authentication
- Dealer features require dealer authentication and active status
- Price history tracked for all changes
- Upload logs maintain audit trail

---

## 📞 SAMPLE DATA

The system includes sample data for:
- Hikvision IP Cameras
- CP Plus HD Cameras
- Dahua IP Cameras and NVRs
- Various DVRs

Sample prices range from ₹880 to ₹6,500

---

## 🛠️ TROUBLESHOOTING

### Excel Upload Issues:
- Ensure column names match exactly (case-insensitive)
- Check for duplicate model numbers
- Verify all required fields are filled
- Check upload log for specific errors

### Price Adjustment Issues:
- Ensure percentage is a valid number
- Select appropriate filter value
- Verify products exist in selected category

### Invoice Generation Issues:
- Ensure dealer ID is set in localStorage
- Check cart has items
- Verify products have stock

---

## 📝 API ENDPOINTS

### Dealer Products:
- `GET /api/dealer-products` - Fetch all products
- `POST /api/dealer-products` - Create/update product
- `PUT /api/dealer-products` - Bulk price adjustment
- `DELETE /api/dealer-products?id={id}` - Delete product
- `POST /api/dealer-products/upload` - Upload Excel

### Dealer Transactions:
- `GET /api/dealer-transactions` - Fetch transactions
- `GET /api/dealer-transactions?id={id}` - Fetch transaction details
- `POST /api/dealer-transactions` - Create transaction
- `PATCH /api/dealer-transactions` - Update payment status
- `GET /api/dealer-transactions/stats?dealerId={id}` - Fetch stats

---

## ✅ TESTING CHECKLIST

### Admin Panel:
- [ ] Upload Excel file successfully
- [ ] Download sample template
- [ ] Adjust prices by segment
- [ ] Adjust prices by company
- [ ] Adjust prices by product type
- [ ] View all products
- [ ] Delete a product
- [ ] View all invoices
- [ ] Filter invoices by type
- [ ] View invoice details
- [ ] Download invoice

### Dealer Portal:
- [ ] View statistics
- [ ] Browse products in Buy tab
- [ ] Add products to cart
- [ ] Adjust quantities
- [ ] Generate purchase invoice
- [ ] Download purchase invoice
- [ ] Browse products in Sale tab
- [ ] Generate sale invoice
- [ ] Download sale invoice

---

## 📈 FUTURE ENHANCEMENTS (Optional)

1. Advanced filtering in product list
2. Export products to Excel
3. Bulk product import from CSV
4. Price change notifications
5. Invoice PDF generation
6. Payment integration
7. Stock alerts
8. Price history charts
9. Dealer-specific pricing
10. Multi-currency support

---

## 🎉 SUMMARY

This system provides:
- ✅ Excel-based bulk product upload
- ✅ Sample template download
- ✅ Percentage-based price adjustments
- ✅ Segment/Company/Product type filtering
- ✅ Dealer purchase functionality
- ✅ Dealer sale functionality
- ✅ Automatic invoice generation
- ✅ Invoice download
- ✅ Admin invoice monitoring
- ✅ Complete audit trail
- ✅ Stock management

All requested features are fully implemented and ready to use!
