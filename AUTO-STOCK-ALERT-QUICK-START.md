# ⚡ QUICK START: Automatic Stock Alert System

## 🎯 What This Does

Automatically sends email alerts and notifications to dealers who:
- Haven't updated their stock in **10+ days**
- Have **low stock** (< 5 items) or **out-of-stock** items (0 items)
- Get **follow-up reminders every 5 days** until they update

Alerts **stop automatically** when dealers update their stock.

---

## 🚀 Setup (3 Steps)

### Step 1: Install Database Schema

```powershell
.\setup-auto-stock-alert.ps1
```

✅ Creates tables and views for tracking alerts

---

### Step 2: Test It

```powershell
node test-auto-stock-alert.js
```

✅ Verifies everything works correctly

---

### Step 3: Schedule Automatic Execution

```powershell
.\auto-stock-alert-scheduler.ps1
```

Choose option: **1** (Every 6 hours - Recommended)

✅ Sets up Windows Scheduled Task to run automatically

---

## 📊 How It Works

```
Day 0:  Dealer last updated stock
  ↓
Day 10: 🔔 INITIAL ALERT sent (email + notification)
  ↓
Day 15: 🔔 FOLLOW-UP ALERT sent
  ↓
Day 20: 🔔 FOLLOW-UP ALERT sent
  ↓
Day X:  Dealer updates stock → ✅ Alerts STOP
```

---

## 🎛️ Management

### View Logs
```powershell
Get-Content logs\auto-stock-alert.log -Tail 50
```

### Check Status
```powershell
Get-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours"
```

### Run Manually
```powershell
node auto-stock-alert-cron.js
```

### Disable Alerts
```powershell
Disable-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours"
```

### Enable Alerts
```powershell
Enable-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours"
```

---

## 📧 Email Configuration

Ensure your `.env` has:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@cctvwebsite.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

---

## ✅ What Dealers Receive

### 1. **Email Alert**
- Professional HTML email with urgent styling
- Shows days inactive, out-of-stock count, low-stock count
- Clear call-to-action button
- Instructions for updating stock

### 2. **Portal Notification**
- Appears in dealer's notification panel
- High/Urgent priority
- Same message as email
- Unread by default

---

## 🔍 Monitoring

### Check which dealers need alerts:
```sql
SELECT * FROM dealers_needing_auto_alert;
```

### View alert history:
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

---

## 🛠️ Troubleshooting

### No alerts being sent?

1. Check if dealers qualify:
   ```sql
   SELECT * FROM dealers_needing_auto_alert;
   ```

2. Check task status:
   ```powershell
   Get-ScheduledTask -TaskName "CCTVAutoStockAlert_6Hours" | Select-Object State
   ```

3. View logs:
   ```powershell
   Get-Content logs\auto-stock-alert.log -Tail 100
   ```

### Emails not sending?

1. Verify SMTP credentials in `.env`
2. Test manually: `node auto-stock-alert-cron.js`
3. Check email in spam folder

---

## 📚 Full Documentation

See [AUTOMATIC-STOCK-ALERT-SYSTEM.md](AUTOMATIC-STOCK-ALERT-SYSTEM.md) for complete details.

---

## 🎉 Done!

Your automatic stock alert system is now running. It will:
- Monitor dealer stock levels 24/7
- Send timely alerts automatically
- Stop when dealers update their stock
- Maintain complete audit trail

**No manual intervention required!** 🚀
