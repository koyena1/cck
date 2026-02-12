# Guest Checkout System - Complete Guide

## 🎯 Overview

This guest checkout system allows users to purchase products without creating an account. After completing an order, customers receive an email with a unique tracking token to monitor their order status.

## ✨ Features

### 1. **Guest Checkout (No Login Required)**
- Users can browse products without authentication
- Simple checkout form with customer details
- Support for both COD and Razorpay payments
- Optional installation and AMC services

### 2. **Order Confirmation Email**
- Automatic email sent after order placement
- Contains unique tracking token (format: TRK-YYYYMMDD-XXXXXXXX)
- Includes direct link to order tracking page
- Beautiful HTML email template with order details

### 3. **Guest Order Tracking**
- Dedicated tracking page at `/guest-track-order`
- Enter tracking token to view order status
- Real-time order status updates
- View order items, payment status, and delivery information
- Track order timeline with status history

### 4. **Admin Panel Integration**
- Guest orders visible in admin dashboard
- Special "Guest Order" badge for easy identification
- Display order tracking token in admin panel
- Filter orders by guest/registered users
- Full order management capabilities

## 📋 Setup Instructions

### Step 1: Database Setup

Run the database migration to add guest checkout support:

```powershell
# Using PowerShell
psql -U postgres -d cctv_quotation_db -f add-guest-checkout-system.sql

# OR using pgAdmin
# 1. Open pgAdmin
# 2. Connect to your database
# 3. Open Query Tool
# 4. Copy contents of add-guest-checkout-system.sql
# 5. Execute the query
```

This migration will:
- Add `order_token` column to orders table
- Add `is_guest_order` flag
- Create email logs table
- Set up automatic token generation
- Create views for guest order tracking

### Step 2: Install Email Dependencies

Install nodemailer for sending emails:

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Step 3: Configure Email Settings

Update your `.env` or `.env.local` file with email configuration:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Dev Mode (set to true for testing, false for production)
EMAIL_DEV_MODE=true

# Company Details
NEXT_PUBLIC_COMPANY_NAME=Your CCTV Store
NEXT_PUBLIC_WEBSITE_URL=https://yourdomain.com
```

#### Getting Gmail App Password:
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate app password for "Mail"
5. Use generated password in SMTP_PASS

### Step 4: Verify Installation

Test the guest checkout system:

1. **Browse Products**:
   - Visit `/categories`
   - Select any product
   - Click "Buy Now"

2. **Guest Checkout**:
   - Fill in customer details (no login required)
   - Select payment method (COD/Razorpay)
   - Complete the order

3. **Check Email**:
   - If `EMAIL_DEV_MODE=true`: Check console logs for email
   - If `EMAIL_DEV_MODE=false`: Check customer email inbox

4. **Track Order**:
   - Visit `/guest-track-order`
   - Enter tracking token from email
   - View order status and details

5. **Admin Panel**:
   - Login to admin panel
   - Go to Orders section
   - Click "Guest Orders" filter
   - View guest orders with tracking tokens

## 🔧 API Endpoints

### 1. Create Guest Order
```typescript
POST /api/guest-checkout

Body:
{
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "customerEmail": "john@example.com",
  "installationAddress": "123 Main St",
  "pincode": "400001",
  "city": "Mumbai",
  "state": "Maharashtra",
  "productName": "HD Camera",
  "productPrice": 5000,
  "quantity": 1,
  "subtotal": 5000,
  "totalAmount": 5000,
  "paymentMethod": "cod"
}

Response:
{
  "success": true,
  "order": {
    "orderId": 1,
    "orderNumber": "ORD-20260212-0001",
    "orderToken": "TRK-20260212-ABC12345",
    "totalAmount": 5000,
    "paymentStatus": "Pending",
    "trackingUrl": "http://localhost:3000/guest-track-order?token=TRK-20260212-ABC12345",
    "emailSent": true
  }
}
```

### 2. Track Guest Order
```typescript
POST /api/guest-track-order

Body:
{
  "orderToken": "TRK-20260212-ABC12345"
}

Response:
{
  "success": true,
  "order": {
    "order_id": 1,
    "order_number": "ORD-20260212-0001",
    "order_token": "TRK-20260212-ABC12345",
    "customer_name": "John Doe",
    "status": "Pending",
    "payment_status": "Pending",
    "total_amount": 5000,
    "items": [...],
    "statusHistory": [...]
  }
}
```

## 🎨 Frontend Pages

### 1. Buy Now Page
**Path**: `/buy-now`
- Customer details form
- Product selection
- Payment method (COD/Razorpay)
- Installation & AMC options
- **No login required for guest checkout**

### 2. Guest Order Tracking
**Path**: `/guest-track-order`
**Query Param**: `?token=TRK-20260212-ABC12345`

Features:
- Search by tracking token
- View order details
- Track order status
- View payment information
- See delivery timeline
- Contact support

### 3. Admin Orders Panel
**Path**: `/admin/orders`

New Features:
- "Guest Orders" filter button
- Guest order badge
- Display tracking token
- Guest order count in stats
- Full order management

## 📧 Email Templates

The system sends professional HTML emails with:
- Order confirmation details
- Unique tracking token
- Direct tracking link
- Order summary with items
- Payment information
- Expected delivery date
- Contact information

### Email Dev Mode
When `EMAIL_DEV_MODE=true`:
- Emails are logged to console
- No actual emails sent
- Perfect for development/testing

## 🔐 Security Features

1. **Token Security**:
   - Unique random tokens generated
   - Format: TRK-YYYYMMDD-RANDOM8
   - Collision detection and retry

2. **Data Validation**:
   - Email format validation
   - Required field checks
   - SQL injection prevention via parameterized queries

3. **Guest Order Isolation**:
   - Separate view for guest orders
   - Limited data exposure in tracking API
   - Admin-only full order access

## 📊 Database Schema

### Orders Table Additions
```sql
- order_token: VARCHAR(100) UNIQUE
- is_guest_order: BOOLEAN
- tracking_link_sent: BOOLEAN
- customer_id: INTEGER (nullable for guest orders)
```

### Email Logs Table
```sql
- email_log_id: SERIAL PRIMARY KEY
- order_id: INTEGER
- recipient_email: VARCHAR(100)
- email_type: VARCHAR(50)
- email_status: VARCHAR(50)
- sent_at: TIMESTAMP
```

### Views
- `guest_order_tracking`: Safe view for public access
- `admin_orders_view`: Complete view with customer & dealer info

## 🚀 Usage Guide

### For Customers:

1. **Place Order**:
   - Browse products
   - Click "Buy Now"
   - Fill details (no signup needed)
   - Complete payment

2. **Track Order**:
   - Check email for tracking token
   - Visit tracking page
   - Enter token
   - View order status

### For Admin:

1. **View Guest Orders**:
   - Login to admin panel
   - Go to Orders section
   - Click "👤 Guest Orders" filter

2. **Manage Orders**:
   - View all order details
   - Update order status
   - Assign to dealers
   - Track delivery

3. **Email Tracking**:
   - Check if confirmation email was sent
   - Resend emails if needed

## 🐛 Troubleshooting

### Email Not Sending:
1. Check `EMAIL_DEV_MODE` setting
2. Verify SMTP credentials
3. Check Gmail app password
4. Review error logs in console
5. Test with dev mode first

### Order Token Not Working:
1. Verify token format (TRK-YYYYMMDD-XXXXXXXX)
2. Check if order exists in database
3. Ensure is_guest_order flag is true
4. Check tracking API logs

### Admin Panel Not Showing Guest Orders:
1. Run database migration
2. Check if order has is_guest_order=true
3. Clear browser cache
4. Refresh orders list

## 📝 Notes

- Guest orders are fully functional without customer accounts
- Customers can create accounts later and link orders
- All order management features work for guest orders
- Email system is optional but highly recommended
- Tracking tokens are permanent and secure

## 🔄 Future Enhancements

Potential improvements:
- SMS notifications with tracking link
- WhatsApp order updates
- Guest to registered user conversion
- Order history access via email OTP
- Multiple order tracking at once

## 📞 Support

For issues or questions:
1. Check console logs for errors
2. Review database migration status
3. Verify environment variables
4. Test with EMAIL_DEV_MODE=true first
5. Check admin panel for order visibility

---

**System Status**: ✅ Fully Operational
**Last Updated**: February 12, 2026
**Version**: 1.0.0
