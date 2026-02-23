# Cascading Pricing Model - How It Works

## 📊 Pricing Flow

```
Base Price (MRP)
    ↓
    Apply Purchase Discount % (usually negative)
    ↓
Purchase Price (What dealer pays you)
    ↓
    Apply Sale Markup % (usually positive)
    ↓
Sale Price (What dealer charges customers)
```

## 🧮 Formulas

1. **Purchase Price** = Base Price + (Base Price × Purchase %)
2. **Sale Price** = Purchase Price + (Purchase Price × Sale %)

**Important**: Sale % is calculated FROM Purchase Price, NOT from Base Price!

## 💡 Example

### Scenario:
- **Base Price**: ₹1000 (your MRP)
- **Purchase %**: -20% (dealer gets 20% discount)
- **Sale %**: +15% (dealer adds 15% markup)

### Calculations:
1. **Purchase Price** = ₹1000 + (₹1000 × -20%) = ₹1000 - ₹200 = **₹800**
2. **Sale Price** = ₹800 + (₹800 × +15%) = ₹800 + ₹120 = **₹920**

### Dealer's Profit:
- Dealer buys at: ₹800
- Dealer sells at: ₹920
- Profit: ₹120 (15% on purchase price)

## 📈 Adjusting Prices

### When you change Purchase %:
If you change Purchase % from -20% to -15%:
- New Purchase Price = ₹1000 + (₹1000 × -15%) = **₹850**
- Sale Price recalculates = ₹850 + (₹850 × +15%) = **₹977.50**

Both prices update automatically!

### When you change Sale %:
If you change Sale % from +15% to +20%:
- Purchase Price stays = **₹800** (unchanged)
- New Sale Price = ₹800 + (₹800 × +20%) = **₹960**

Only sale price updates!

## 🔄 Bulk Percentage Adjustments

### In Admin Panel:
When you apply bulk adjustment (e.g., +5%), it **adds** to the existing percentage:

**Example 1**: Current Purchase % = -20%
- Apply adjustment: +5%
- New Purchase % = -20% + 5% = **-15%**
- Effect: Dealer now gets 15% discount instead of 20%
- Purchase price increases from ₹800 to ₹850

**Example 2**: Current Sale % = +15%
- Apply adjustment: +3%
- New Sale % = +15% + 3% = **+18%**
- Effect: Dealer's markup increases from 15% to 18%
- Sale price increases (dealer earns more profit)

## 📋 Typical Scenarios

### Scenario 1: Standard Trade Pricing
- Base: ₹5000
- Purchase %: **-25%** → Purchase: ₹3750
- Sale %: **+20%** → Sale: ₹4500
- Dealer Margin: ₹750

### Scenario 2: Premium Product (Lower Margins)
- Base: ₹10,000
- Purchase %: **-15%** → Purchase: ₹8500
- Sale %: **+10%** → Sale: ₹9350
- Dealer Margin: ₹850

### Scenario 3: Budget Product (Higher Volume, Lower Margins)
- Base: ₹800
- Purchase %: **-30%** → Purchase: ₹560
- Sale %: **+12%** → Sale: ₹627
- Dealer Margin: ₹67

## 🎯 Key Points

1. ✅ Purchase % is almost always **negative** (discount from base)
2. ✅ Sale % is usually **positive** (markup from purchase)
3. ✅ Sale price is calculated FROM purchase price, not base price
4. ✅ Changing base price updates both purchase and sale prices
5. ✅ Changing purchase % updates both purchase and sale prices
6. ✅ Changing sale % only updates sale price
7. ✅ All calculations happen automatically in the database

## 🔧 Database Trigger

The system uses a PostgreSQL trigger that automatically calculates prices whenever you:
- Upload an Excel file
- Apply bulk adjustments
- Manually update percentages

You never need to calculate the absolute prices yourself - just set the percentages!
