# AUTOMATIC STOCK ALERT SYSTEM

## Overview

This system automatically monitors dealer stock levels and sends alerts when dealers haven't updated their inventory for extended periods while having low or out-of-stock items.

## How It Works

### Alert Triggers

1. **Initial Alert (10 Days)**
   - Sent when a dealer hasn't updated stock in 10+ days
   - Only triggered if dealer has low stock (< 5 items) or out-of-stock items (0 items)
   - Creates notification in dealer portal
   - Sends email to dealer

2. **Follow-up Alerts (Every 5 Days)**
   - Sent every 5 days after the initial alert
   - Continues as long as stock remains unupdated and low/out-of-stock
   - Automatically stops when dealer updates inventory

### Stop Conditions

Alerts automatically stop when:
- Dealer updates their stock (any stock update)
- All items are in adequate stock (quantity >= 5)
- Dealer changes status to inactive

## System Components

### 1. Database Schema

**File:** `add-automatic-stock-alert-system.sql`

**Tables:**
- `dealer_auto_alert_history` - Tracks all automatic alerts sent
  - Records alert type (initial_10day, followup_5day)
  - Stores stock counts at time of alert
  - Links to notification and tracks email status

**Views:**
- `dealers_needing_auto_alert` - Identifies dealers requiring alerts
  - Checks days since last stock update
  - Verifies low/out-of-stock conditions
  - Determines if initial or follow-up alert needed

### 2. Cron Job Script

**File:** `auto-stock-alert-cron.js`

**Functions:**
- Queries `dealers_needing_auto_alert` view
- Generates personalized email HTML
- Creates notification in `dealer_notifications` table
- Sends email via SMTP
- Logs alert in `dealer_auto_alert_history`
- Provides detailed execution summary

### 3. Setup Scripts

**File:** `setup-auto-stock-alert.ps1`
- Installs database schema
- Verifies installation

**File:** `auto-stock-alert-scheduler.ps1`
- Creates Windows Scheduled Task
- Configurable intervals (6hr, 12hr, daily, custom)
- Auto-logging to `logs/auto-stock-alert.log`

## Installation

### Step 1: Database Setup

```powershell
.\setup-auto-stock-alert.ps1
```

This will:
- Create the `dealer_auto_alert_history` table
- Create the `dealers_needing_auto_alert` view
- Verify installation

### Step 2: Test the Cron Job

```powershell
node auto-stock-alert-cron.js
```

This runs the alert system once to verify it works correctly.

### Step 3: Schedule Automatic Execution

```powershell
.\auto-stock-alert-scheduler.ps1
```

Choose from scheduling options:
1. Every 6 hours (Recommended)
2. Every 12 hours
3. Once daily (9:00 AM)
4. Twice daily (9:00 AM & 6:00 PM)
5. Custom interval
6. Run once now (test)

## Configuration

### Email Settings

Ensure your `.env` file has the following:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@cctvwebsite.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Stock Thresholds

In the system, stock levels are categorized as:
- **Out of Stock:** quantity_available = 0
- **Low Stock:** 0 < quantity_available < 5
- **Adequate Stock:** quantity_available >= 5

## Alert Logic Flow

```
1. System checks all active dealers
2. For each dealer:
   - Get last stock update date
   - Count days since last update
   - Check if any items are low stock or out of stock
   
3. If days >= 10 AND (low stock OR out of stock):
   - Check if stock was updated since last alert
   - If YES → Send INITIAL alert
   - If NO → Check days since last alert
     - If >= 5 days → Send FOLLOW-UP alert
     - If < 5 days → Skip (too soon)
     
4. If dealer updates stock:
   - Next time system checks, it sees fresh update
   - No alert sent (resets the cycle)
```

## Email Content

The automated emails include:

- **Urgent visual design** with red/warning colors
- **Statistics dashboard** showing:
  - Days inactive
  - Out-of-stock count
  - Low-stock count
- **Clear call-to-action** with direct link to stock management
- **Actionable steps** for dealer
- **Frequency information** about future reminders

## Notifications

Dealers receive notifications in their portal:
- **Type:** Alert
- **Priority:** High (initial), Urgent (follow-ups)
- **Status:** Unread by default
- **Content:** Same as email message

## Monitoring

### View Scheduled Task

```powershell
Get-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours"
Get-ScheduledTaskInfo -TaskName "CCTVAutoStockAlert_6Hours"
```

### View Logs

```powershell
Get-Content logs\auto-stock-alert.log -Tail 50
```

### Check Dealers Needing Alerts

```sql
SELECT * FROM dealers_needing_auto_alert;
```

### View Alert History

```sql
SELECT 
  d.full_name,
  daah.alert_type,
  daah.days_since_update,
  daah.alert_sent_at,
  daah.email_sent
FROM dealer_auto_alert_history daah
JOIN dealers d ON daah.dealer_id = d.dealer_id
ORDER BY daah.alert_sent_at DESC
LIMIT 20;
```

## Management Commands

### Disable Scheduled Task

```powershell
Disable-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours"
```

### Enable Scheduled Task

```powershell
Enable-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours"
```

### Remove Scheduled Task

```powershell
Unregister-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours" -Confirm:$false
```

### Run Manually

```powershell
node auto-stock-alert-cron.js
```

## Troubleshooting

### No Alerts Being Sent

1. **Check if dealers qualify:**
   ```sql
   SELECT * FROM dealers_needing_auto_alert;
   ```

2. **Check scheduled task status:**
   ```powershell
   Get-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours" | Select-Object State
   ```

3. **View recent logs:**
   ```powershell
   Get-Content logs\auto-stock-alert.log -Tail 100
   ```

### Emails Not Sending

1. **Verify SMTP credentials in `.env`**
2. **Check email logs in cron output**
3. **Test SMTP connection:**
   ```javascript
   const nodemailer = require('nodemailer');
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASSWORD
     }
   });
   transporter.verify((error, success) => {
     if (error) console.log(error);
     else console.log('SMTP Ready');
   });
   ```

### Alerts Sending Too Frequently

The system has built-in rate limiting:
- Initial alerts only after 10 days of inactivity
- Follow-ups only every 5 days minimum
- Stops automatically when stock is updated

If you need to adjust timing:
1. Edit the view `dealers_needing_auto_alert` in the SQL file
2. Change the day thresholds (10, 5)
3. Re-run `setup-auto-stock-alert.ps1`

## Testing

### Create Test Scenario

```sql
-- Make a dealer inactive for testing
UPDATE dealers 
SET status = 'Active' 
WHERE dealer_id = 1;

-- Add low stock items for dealer
UPDATE dealer_inventory 
SET quantity_available = 2 
WHERE dealer_id = 1 
LIMIT 3;

-- Manually set old stock update (simulate 15 days ago)
UPDATE dealer_stock_updates 
SET updated_at = CURRENT_TIMESTAMP - INTERVAL '15 days'
WHERE dealer_id = 1;
```

### Run Test

```powershell
node auto-stock-alert-cron.js
```

Check:
1. Console output for alert details
2. `dealer_notifications` table for new notification
3. Dealer email inbox for alert email
4. `dealer_auto_alert_history` for logged entry

## Architecture

```
┌─────────────────────────────────────────────┐
│   Windows Scheduled Task / Cron Job        │
│   (Runs every 6/12/24 hours)               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   auto-stock-alert-cron.js                 │
│   • Queries dealers_needing_auto_alert     │
│   • Generates email content                │
│   • Sends emails via SMTP                  │
│   • Creates notifications                  │
│   • Logs alert history                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   Database Views & Tables                  │
│                                             │
│   dealers_needing_auto_alert (View)       │
│   ├─ Checks last_stock_update              │
│   ├─ Counts days_since_update             │
│   ├─ Checks low/out of stock              │
│   └─ Determines alert timing              │
│                                             │
│   dealer_auto_alert_history (Table)       │
│   └─ Tracks all sent alerts               │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   Output                                    │
│   • dealer_notifications table             │
│   • Email to dealer                        │
│   • Dealer portal notification             │
│   • Alert history log                      │
└─────────────────────────────────────────────┘
```

## Benefits

1. **Automated Monitoring:** No manual intervention required
2. **Proactive Alerts:** Dealers are reminded before problems escalate
3. **Improved Stock Health:** Encourages regular inventory updates
4. **Better Order Fulfillment:** Dealers maintain adequate stock levels
5. **Audit Trail:** Complete history of all alerts sent
6. **Smart Timing:** Respects dealer actions and stops when appropriate

## Future Enhancements

- SMS alerts integration
- Customizable thresholds per dealer
- Dashboard showing alert effectiveness
- Dealer response tracking
- Integration with automatic order suggestions
