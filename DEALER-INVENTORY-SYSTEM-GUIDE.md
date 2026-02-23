# DEALER INVENTORY & TRANSACTION HISTORY SYSTEM

## Overview
This document describes the complete dealer inventory management and transaction history system implemented for the CCTV platform. This system enables dealers to:
1. Buy products and track their inventory
2. Sell only products they have in stock
3. View complete transaction history with filters
4. Download invoices for all transactions

## Database Schema

### 1. dealer_inventory Table
Tracks per-dealer product inventory.

```sql
CREATE TABLE dealer_inventory (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id),
    product_id INTEGER REFERENCES dealer_products(id),
    quantity_purchased INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    quantity_available INTEGER DEFAULT 0,  -- Auto-calculated
    last_purchase_date TIMESTAMP,
    last_sale_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealer_id, product_id)
);
```

**Key Features:**
- `quantity_available` is automatically calculated as: `quantity_purchased - quantity_sold`
- Unique constraint ensures one record per dealer-product combination
- Triggers automatically update timestamps and quantities

### 2. dealer_inventory_view
Provides easy access to inventory with product details.

```sql
CREATE VIEW dealer_inventory_view AS
SELECT 
    di.id, di.dealer_id, d.full_name as dealer_name,
    di.product_id, dp.company, dp.segment, dp.model_number,
    dp.description, dp.dealer_purchase_price, dp.dealer_sale_price,
    di.quantity_purchased, di.quantity_sold, di.quantity_available
FROM dealer_inventory di
JOIN dealers d ON di.dealer_id = d.dealer_id
JOIN dealer_products dp ON di.product_id = dp.id
WHERE di.quantity_available > 0;
```

## API Endpoints

### 1. GET /api/dealer-inventory
Fetch dealer's current inventory.

**Query Parameters:**
- `dealerId` (required): Dealer's ID

**Response:**
```json
{
  "success": true,
  "inventory": [
    {
      "id": 1,
      "dealer_id": 5,
      "product_id": 10,
      "company": "Hikvision",
      "model_number": "DS-2CD1023G0-I",
      "quantity_available": 25,
      "dealer_sale_price": 3200.00
    }
  ]
}
```

### 2. POST /api/dealer-transactions
Create a new purchase or sale transaction.

**Request Body:**
```json
{
  "dealerId": 5,
  "transactionType": "purchase",  // or "sale"
  "items": [
    {
      "productId": 10,
      "productName": "Hikvision IP Camera",
      "modelNumber": "DS-2CD1023G0-I",
      "quantity": 10,
      "unitPrice": 2800.00,
      "totalPrice": 28000.00
    }
  ],
  "notes": "Bulk purchase order"
}
```

**Key Behaviors:**
- For **PURCHASE**: Adds to dealer inventory
- For **SALE**: 
  - Validates dealer has sufficient stock
  - Returns error if insufficient inventory
  - Deducts from dealer inventory on success

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 123,
    "invoice_number": "DP-5-1708262400000",
    "total_amount": 28000.00,
    "gst_amount": 5040.00,
    "final_amount": 33040.00
  },
  "invoiceNumber": "DP-5-1708262400000"
}
```

### 3. GET /api/dealer-transactions
Fetch transaction history with optional filtering.

**Query Parameters:**
- `dealerId`: Filter by dealer
- `type`: Filter by transaction type ('purchase' or 'sale')
- `id`: Fetch specific transaction with items

**Response (List):**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 123,
      "transaction_type": "purchase",
      "invoice_number": "DP-5-1708262400000",
      "total_amount": 28000.00,
      "gst_amount": 5040.00,
      "final_amount": 33040.00,
      "payment_status": "completed",
      "created_at": "2026-02-18T10:30:00Z"
    }
  ]
}
```

**Response (Single with Items):**
```json
{
  "success": true,
  "transaction": {
    "id": 123,
    "dealer_name": "John Doe",
    "business_name": "Security Solutions Inc",
    "invoice_number": "DP-5-1708262400000"
  },
  "items": [
    {
      "product_name": "Hikvision IP Camera",
      "model_number": "DS-2CD1023G0-I",
      "quantity": 10,
      "unit_price": 2800.00,
      "total_price": 28000.00
    }
  ]
}
```

## User Interface

### 1. Dealer Pricing Page (/dealer/pricing)

**Three Tabs:**

#### Statistics Tab
Displays:
- Total Purchase Amount
- Total Sale Amount
- Total Profit

#### Buy Products Tab
- Shows all available dealer products
- Uses `dealer_purchase_price`
- Adds to dealer's inventory on purchase
- No stock restrictions

#### Sale Products Tab
- Shows ONLY products in dealer's inventory
- Uses `dealer_sale_price`
- Displays `quantity_available` for each product
- Prevents adding more than available stock
- Returns helpful error if no inventory exists

**Features:**
- Real-time search across company, model, segment, type
- Cart system with quantity management
- Automatic GST calculation (18%)
- Instant PDF invoice generation and download
- Auto-refresh inventory after transactions

### 2. Transaction History Page (/dealer/transactions)

**Summary Cards:**
- Total Transactions
- Buy Transactions Count
- Sale Transactions Count

**Filter Options:**
1. All Transactions
2. Buy Transactions Only
3. Sale Transactions Only

**Transaction Table Shows:**
- Date
- Invoice Number
- Transaction Type (Buy/Sale badge)
- Amount (subtotal)
- GST
- Total Amount
- Payment Status
- Download Invoice button

**Invoice Download:**
- Fetches complete transaction details
- Generates professional PDF with:
  - Invoice header
  - Dealer details
  - Itemized product list
  - GST and total calculations
  - Automatic filename: `{invoiceNumber}.pdf`

## Business Logic & Rules

### Inventory Management
1. **Purchase Flow:**
   ```
   Dealer selects products → Adds to cart → Generates invoice
   → Creates transaction record → Updates dealer_inventory
   → Increases quantity_purchased
   ```

2. **Sale Flow:**
   ```
   Dealer views inventory → Selects products → Validates stock
   → Adds to cart (up to available qty) → Generates invoice
   → Creates transaction record → Updates dealer_inventory
   → Increases quantity_sold, decreases quantity_available
   ```

3. **Stock Validation:**
   - Sales are blocked if `quantity_available < requested quantity`
   - Clear error message shows how many units are available
   - Cart prevents adding more items than in stock

### Invoice Generation
- **Prefix Codes:**
  - `DP-`: Dealer Purchase
  - `DS-`: Dealer Sale
- **Format:** `{PREFIX}-{dealerId}-{timestamp}`
- **Example:** `DP-5-1708262400000`

### GST Calculation
- Fixed at **18%**
- Applied to all transactions
- Formula: `final_amount = total_amount + (total_amount * 0.18)`

## Key Files Modified/Created

### Database
1. `add-dealer-inventory-system.sql` - Schema definition
2. `run-dealer-inventory-setup.js` - Setup script

### API Routes
1. `app/api/dealer-inventory/route.ts` - Inventory management
2. `app/api/dealer-transactions/route.ts` - Transaction handling (updated)

### Frontend Pages
1. `app/dealer/pricing/page.tsx` - Updated for inventory support
2. `app/dealer/transactions/page.tsx` - New transaction history page
3. `app/dealer/layout.tsx` - Added Transactions menu item

## Testing Checklist

### Dealer Purchase Flow
- [ ] Browse available products
- [ ] Add products to cart
- [ ] Adjust quantities
- [ ] Generate invoice
- [ ] Verify inventory increased
- [ ] Download PDF invoice

### Dealer Sale Flow
- [ ] Switch to Sale tab
- [ ] Verify only inventory items shown
- [ ] Try adding more than available (should error)
- [ ] Add valid quantity to cart
- [ ] Generate invoice
- [ ] Verify inventory decreased
- [ ] Check transaction appears in history

### Transaction History
- [ ] View all transactions
- [ ] Filter by Buy transactions
- [ ] Filter by Sale transactions
- [ ] Download invoice for old transaction
- [ ] Verify PDF contains all details

### Edge Cases
- [ ] Dealer with no inventory views Sale tab
- [ ] Attempt to sell 0 quantity item
- [ ] Attempt to sell more than available
- [ ] Multiple purchases of same product
- [ ] Multiple sales of same product

## Future Enhancements

1. **Payment Integration**
   - Track payment status
   - Support partial payments
   - Payment reminders

2. **Reporting**
   - Monthly/yearly reports
   - Profit analysis
   - Best-selling products
   - Stock alerts

3. **Bulk Operations**
   - Import transactions from CSV
   - Bulk stock updates
   - Batch invoice generation

4. **Notifications**
   - Email invoice on generation
   - Low stock alerts
   - Payment due reminders

5. **Return/Exchange**
   - Handle product returns
   - Adjust inventory accordingly
   - Credit notes generation

## Support & Troubleshooting

### Common Issues

**Q: Sale tab shows "No products in inventory"**
A: Dealer needs to purchase products first using the Buy tab.

**Q: Cannot add item to cart in Sale tab**
A: Check if dealer has sufficient quantity_available for that product.

**Q: Invoice download fails**
A: Ensure transaction ID exists and transaction has items.

**Q: Inventory not updating after purchase**
A: Check dealer_inventory table for the dealer_id and product_id combination.

### Database Queries for Debugging

```sql
-- Check dealer inventory
SELECT * FROM dealer_inventory_view WHERE dealer_id = ?;

-- Check specific transaction
SELECT * FROM dealer_transactions WHERE id = ?;

-- Check transaction items
SELECT * FROM dealer_transaction_items WHERE transaction_id = ?;

-- Inventory discrepancies
SELECT 
    di.*,
    (SELECT SUM(quantity) FROM dealer_transaction_items dti 
     JOIN dealer_transactions dt ON dti.transaction_id = dt.id 
     WHERE dt.dealer_id = di.dealer_id 
     AND dti.product_id = di.product_id 
     AND dt.transaction_type = 'purchase') as total_purchased,
    (SELECT SUM(quantity) FROM dealer_transaction_items dti 
     JOIN dealer_transactions dt ON dti.transaction_id = dt.id 
     WHERE dt.dealer_id = di.dealer_id 
     AND dti.product_id = di.product_id 
     AND dt.transaction_type = 'sale') as total_sold
FROM dealer_inventory di;
```

## Conclusion

This system provides complete inventory management for dealers with:
✅ Automated inventory tracking per dealer
✅ Stock validation before sales
✅ Complete transaction history
✅ Filterable transaction views
✅ Invoice regeneration for all past transactions
✅ Professional PDF invoices
✅ Real-time inventory updates
✅ GST compliance

The system ensures dealers can only sell what they own, maintains accurate inventory records, and provides full transaction auditability.
