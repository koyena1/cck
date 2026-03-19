# Dealer Monitoring & Alert System Setup Guide

## Overview
This system enables admins to monitor dealer stock updates and send alerts to dealers who haven't updated their inventory in 10+ days.

## Features Implemented

### 1. Admin Portal - Dealer Management
- **View Dealer Details**: Click on any dealer name to see complete details including:
  - Dealer information (name, contact, location, GSTIN)
  - Current stock/inventory
  - Stock update history (last 50 updates)
  - Days since last stock update
  - Alert if dealer hasn't updated stock for 10+ days

- **Send Alerts**: Admin can send notifications to dealers
  - Pre-defined templates for common scenarios
  - Email option (sends to dealer's registered email)
  - Priority levels (low, normal, high, urgent)
  - Alert types (info, warning, alert, success)

### 2. Dealer Portal - Notifications
- New "Notifications" section in dealer navigation
- Shows all alerts and messages from admin
- Real-time unread count
- Mark as read/delete functionality
- Auto-refresh every 30 seconds
- Email notifications (if enabled by admin)

### 3. Backend Features
- **Stock Update Tracking**: Automatically logs every stock change
- **Days Since Update**: Calculates inactive dealers
- **Email Service**: Sends formatted emails to dealers
- **Database Views**: Pre-built queries for dealer analytics

## Installation Steps

### Step 1: Install Dependencies
```powershell
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Step 2: Run Database Migration
Execute the SQL file to create necessary tables and functions:

```powershell
# Using psql command line
psql -U your_username -d your_database -f add-dealer-monitoring-system.sql

# OR using a database client (pgAdmin, DBeaver, etc.)
# Copy and execute the contents of add-dealer-monitoring-system.sql
```

This creates:
- `dealer_stock_updates` table
- `dealer_notifications` table
- Database functions for tracking
- Views for analytics
- Triggers for automatic logging

### Step 3: Configure Email Service
Add the following environment variables to your `.env.local` file:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Base URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**For Gmail users:**
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Use the App Password (not your regular password)

**For other email providers:**
- Update SMTP_HOST and SMTP_PORT accordingly
- Consult your email provider's SMTP settings

### Step 4: Verify Installation
1. Start your development server:
   ```powershell
   npm run dev
   ```

2. Test as Admin:
   - Go to Admin → Dealer Management
   - Click on any dealer name
   - Verify dealer details modal appears
   - Click "Send Alert" button
   - Send a test notification

3. Test as Dealer:
   - Login as a dealer
   - Navigate to "Notifications" in the sidebar
   - Verify the notification appears
   - Check dealer's email inbox for the email

## Database Schema

### dealer_stock_updates
Tracks every time a dealer modifies their inventory:
- `dealer_id`: Reference to dealer
- `product_id`: Product being updated
- `previous_quantity`: Stock before update
- `new_quantity`: Stock after update
- `quantity_change`: Difference (calculated)
- `update_type`: 'purchase', 'sale', or 'adjustment'
- `updated_at`: Timestamp of update

### dealer_notifications
Stores all notifications sent to dealers:
- `dealer_id`: Recipient dealer
- `title`: Notification title
- `message`: Full message text
- `type`: 'info', 'warning', 'alert', 'success'
- `priority`: 'low', 'normal', 'high', 'urgent'
- `is_read`: Read status
- `sent_via_email`: Whether email was sent
- `created_at`: When notification was created

## API Endpoints

### GET /api/dealers/[id]
Fetch detailed dealer information including stock history
- **Response**: Dealer info, current stock, update history, stats

### POST /api/dealers/[id]/alert
Send an alert to a specific dealer
- **Body**: `{ title, message, type, priority, sendEmail }`
- **Response**: Success status, email sent confirmation

### GET /api/dealer/notifications
Fetch notifications for logged-in dealer
- **Query**: `dealerId`
- **Response**: List of notifications, unread count

### PATCH /api/dealer/notifications
Mark notification as read
- **Body**: `{ notificationId, dealerId }`

### DELETE /api/dealer/notifications
Delete a notification
- **Query**: `notificationId`, `dealerId`

## Usage Guide

### For Admins

#### Viewing Dealer Details
1. Navigate to Admin → Dealer Management
2. Click on any dealer's name (it's clickable and turns yellow on hover)
3. View dealer information, stock levels, and update history

#### Sending Alerts
1. From dealer details modal, click "Send Alert"
2. OR click "Send Reminder Alert" if dealer is inactive (10+ days)
3. Choose a template or write custom message
4. Select alert type and priority
5. Check "Also send via email" to email the dealer
6. Click "Send Alert"

#### Finding Inactive Dealers
Dealers with 10+ days since last stock update will show:
- Red alert banner in dealer details
- Warning message with days count
- Quick "Send Reminder Alert" button

### For Dealers

#### Viewing Notifications
1. Click "Notifications" in sidebar
2. View all alerts from admin
3. Filter by all/unread/read
4. See unread count badge

#### Managing Notifications
- Click "Mark as read" on individual notifications
- Click "Mark all as read" to clear all unread
- Delete notifications you no longer need
- Check email for important alerts

## Troubleshooting

### Email not sending
1. Verify SMTP credentials in `.env.local`
2. Check SMTP port (587 for TLS, 465 for SSL)
3. For Gmail: Ensure App Password is used, not regular password
4. Check server logs for detailed error messages

### Notifications not appearing
1. Verify dealer is logged in
2. Check browser console for errors
3. Verify `dealerId` is in localStorage
4. Check database for notification records

### Stock updates not tracking
1. Verify trigger is installed (check SQL logs)
2. Ensure `dealer_inventory` table exists
3. Test by manually updating stock in dealer portal
4. Check `dealer_stock_updates` table for logs

## Database Views for Analytics

### dealers_needing_alert
Pre-built view showing all dealers who need stock update reminders:
```sql
SELECT * FROM dealers_needing_alert;
```

Returns:
- Dealer info
- Days since last update
- Total products
- Total stock available

### dealer_stock_update_history
Complete history of all stock updates:
```sql
SELECT * FROM dealer_stock_update_history
WHERE dealer_id = 1
ORDER BY updated_at DESC;
```

## Future Enhancements

Possible additions:
- [ ] Automated alerts (cron job for dealers inactive 10+ days)
- [ ] SMS notifications via Twilio
- [ ] Push notifications for web
- [ ] Notification templates management
- [ ] Dealer response/acknowledgment system
- [ ] Analytics dashboard for stock trends
- [ ] Export dealer reports to PDF/Excel

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed errors
3. Verify all environment variables are set
4. Ensure database migrations ran successfully
