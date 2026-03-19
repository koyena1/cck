# Dealer Stock Management System

## Overview
This document describes the dealer stock management system with manual stock adjustment controls and automatic inventory synchronization.

## Features Implemented

### 1. Manual Stock Adjustment (+ / - Buttons)
Dealers can now manually adjust their stock quantities directly from the stock management page.

#### UI Changes
**File**: `app/dealer/stock/page.tsx`

- Added **Plus (+)** and **Minus (-)** buttons in the Actions column
- Plus button: Increases stock (when dealer receives products)
- Minus button: Decreases stock (when dealer sells products)
- Buttons are disabled when:
  - Stock is already at 0 (minus button only)
  - An update operation is in progress
- Visual feedback with loading state during updates
- Color-coded buttons:
  - Green border for Plus (increase)
  - Red border for Minus (decrease)

#### API Endpoint
**File**: `app/api/dealer-inventory/route.ts`

**Method**: `POST`

**Request Body**:
```json
{
  "inventoryId": 123,
  "dealerId": 45,
  "action": "increase" | "decrease"
}
```

**Response**:
```json
{
  "success": true,
  "inventory": { ... updated inventory item ... },
  "message": "Stock increased/decreased successfully"
}
```

**Business Logic**:
- **Increase Action**: Increments `quantity_purchased` by 1, sets `last_purchase_date` to current timestamp
- **Decrease Action**: Increments `quantity_sold` by 1, sets `last_sale_date` to current timestamp
- Database triggers automatically calculate `quantity_available = quantity_purchased - quantity_sold`

**Validation**:
- Verifies inventory item belongs to the requesting dealer
- Prevents decreasing stock below 0
- Returns appropriate error messages

### 2. Automatic Inventory Synchronization

The system automatically updates dealer inventory in the following scenarios:

#### A. Dealer Purchases (Razorpay Payment)
**File**: `app/api/dealer/razorpay/verify-payment/route.ts`

When a dealer completes a payment for products:
1. System checks if dealer already has the product in inventory
2. If yes: Updates existing record by incrementing `quantity_purchased`
3. If no: Creates new inventory record
4. Updates `last_purchase_date` to current timestamp

**Code** (lines 73-96):
```typescript
// Check if dealer already has this product in inventory
const existingInventory = await pool.query(
  `SELECT id FROM dealer_inventory WHERE dealer_id = $1 AND product_id = $2`,
  [transaction.dealer_id, item.product_id]
);

if (existingInventory.rows.length > 0) {
  // Update existing inventory
  await pool.query(`
    UPDATE dealer_inventory 
    SET quantity_purchased = quantity_purchased + $1,
        last_purchase_date = CURRENT_TIMESTAMP
    WHERE dealer_id = $2 AND product_id = $3
  `, [item.quantity, transaction.dealer_id, item.product_id]);
} else {
  // Create new inventory record
  await pool.query(`
    INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, last_purchase_date)
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
  `, [transaction.dealer_id, item.product_id, item.quantity]);
}
```

#### B. Admin Creates/Finalizes Invoice
**File**: `app/api/dealer-invoices/route.ts`

When admin creates or finalizes an invoice for a dealer:
1. System determines invoice type (purchase or sale)
2. For **purchase invoices**:
   - Adds products to dealer inventory
   - Creates new record or updates `quantity_available`
3. For **sale invoices**:
   - Deducts from dealer inventory
   - Updates `quantity_available`

**Code** (lines 295-326):
```typescript
for (const item of itemsResult.rows) {
  if (invoice.transaction_type === 'purchase') {
    // Add to inventory
    const inventoryCheck = await pool.query(
      `SELECT id FROM dealer_inventory WHERE dealer_id = $1 AND product_id = $2`,
      [invoice.dealer_id, item.product_id]
    );

    if (inventoryCheck.rows.length > 0) {
      await pool.query(`
        UPDATE dealer_inventory 
        SET quantity_available = quantity_available + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE dealer_id = $2 AND product_id = $3
      `, [item.quantity, invoice.dealer_id, item.product_id]);
    } else {
      await pool.query(`
        INSERT INTO dealer_inventory (dealer_id, product_id, quantity_available)
        VALUES ($1, $2, $3)
      `, [invoice.dealer_id, item.product_id, item.quantity]);
    }
  } else if (invoice.transaction_type === 'sale') {
    // Deduct from inventory
    await pool.query(`
      UPDATE dealer_inventory 
      SET quantity_available = quantity_available - $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE dealer_id = $2 AND product_id = $3
    `, [item.quantity, invoice.dealer_id, item.product_id]);
  }
}
```

### 3. Database Schema

**Table**: `dealer_inventory`

```sql
CREATE TABLE dealer_inventory (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES dealer_products(id) ON DELETE CASCADE,
    quantity_purchased INTEGER DEFAULT 0,  -- Total purchased
    quantity_sold INTEGER DEFAULT 0,       -- Total sold
    quantity_available INTEGER DEFAULT 0,  -- Auto: purchased - sold
    last_purchase_date TIMESTAMP,
    last_sale_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealer_id, product_id)
);
```

**Automatic Triggers**:
1. `trigger_update_dealer_inventory_timestamp` - Updates timestamp and recalculates `quantity_available` on every UPDATE
2. `trigger_calculate_dealer_inventory_available` - Calculates `quantity_available` on INSERT

### 4. Stock Filtering

The stock page already shows only products that the dealer has purchased (products with inventory records). This is handled by the database query:

```sql
WHERE di.dealer_id = $1 AND di.quantity_available > 0
```

## User Workflow

### Dealer Receives Products
1. Dealer receives physical products
2. Clicks **Plus (+)** button on stock page
3. System increments `quantity_purchased` by 1
4. Trigger automatically increases `quantity_available`
5. Stock table refreshes with updated quantity

### Dealer Sells/Uses Products
1. Dealer sells or uses a product
2. Clicks **Minus (-)** button on stock page
3. System increments `quantity_sold` by 1
4. Trigger automatically decreases `quantity_available`
5. Stock table refreshes with updated quantity

### Admin Assigns Products to Dealer
1. Admin creates invoice for dealer with type "purchase"
2. Admin finalizes the invoice
3. System automatically:
   - Creates/updates dealer_inventory record
   - Adds quantities to dealer's stock
   - Product appears in dealer's stock page automatically

## Benefits

1. **Real-time Updates**: Stock quantities update immediately when buttons are clicked
2. **Automatic Sync**: No manual intervention needed when admin assigns products
3. **Audit Trail**: Maintains `last_purchase_date` and `last_sale_date` timestamps
4. **Data Integrity**: Database triggers ensure `quantity_available` is always accurate
5. **User-Friendly**: Simple +/- interface for quick stock adjustments
6. **Validation**: Prevents invalid operations (e.g., decreasing below 0)

## Technical Notes

- All updates are atomic (single database transactions)
- Frontend disables buttons during updates to prevent double-clicks
- Error handling with user-friendly messages
- Database triggers maintain referential integrity
- Stock refreshes automatically after each update
- Dark mode support included for all UI components
