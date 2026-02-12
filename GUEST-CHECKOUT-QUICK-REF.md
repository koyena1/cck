# 🚀 Guest Checkout Quick Reference

## Common Commands

### Database Setup
```powershell
# Run migration
psql -U postgres -d cctv -f add-guest-checkout-system.sql

# Via pgAdmin: Open Query Tool → Load file → Execute
```

### Install Dependencies
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### Run Setup Script
```powershell
.\setup-guest-checkout.ps1
```

---

## 🔗 Important URLs

| Page | URL | Purpose |
|------|-----|---------|
| Guest Checkout | `/buy-now` | Purchase without login |
| Order Tracking | `/guest-track-order` | Track with token |
| Admin Orders | `/admin/orders` | Manage all orders |

---

## 📧 Email Settings (.env)

### Development Mode (Testing)
```env
EMAIL_DEV_MODE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=not-needed-in-dev
```

### Production Mode (Live)
```env
EMAIL_DEV_MODE=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
NEXT_PUBLIC_WEBSITE_URL=https://yourdomain.com
```

---

## 🎯 Test Flow

1. **Place Guest Order**:
   ```
   /buy-now → Fill details → Pay → Get token
   ```

2. **Track Order**:
   ```
   /guest-track-order → Enter token → View status
   ```

3. **Admin View**:
   ```
   /admin/orders → Click "Guest Orders" → Manage
   ```

---

## 🔑 Tracking Token Format

```
TRK-20260212-ABC12345
│   │        │
│   │        └─ Random 8 chars
│   └────────── Date (YYYYMMDD)
└────────────── Prefix
```

---

## 📊 Database Tables

### orders
- `order_token` - Unique tracking token
- `is_guest_order` - Boolean flag
- `tracking_link_sent` - Email sent status

### email_logs
- Tracks all sent emails
- Status: pending, sent, failed

---

## 🔧 API Endpoints

### Create Guest Order
```typescript
POST /api/guest-checkout
Body: {
  customerName, customerPhone, customerEmail,
  installationAddress, pincode, city,
  totalAmount, paymentMethod
}
```

### Track Order
```typescript
POST /api/guest-track-order
Body: { orderToken: "TRK-20260212-ABC12345" }
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sending | Check `EMAIL_DEV_MODE` and SMTP credentials |
| Token not found | Verify database migration completed |
| Admin not showing | Run migration, clear cache, refresh |
| Dependencies error | Run `npm install` |

---

## 📝 Files Modified

- `lib/email.ts` - Email system
- `app/api/guest-checkout/route.ts` - Checkout API
- `app/api/guest-track-order/route.ts` - Tracking API
- `app/guest-track-order/page.tsx` - Tracking page
- `app/admin/orders/page.tsx` - Admin panel
- `add-guest-checkout-system.sql` - Database schema
- `.env` - Configuration

---

## 💡 Quick Tips

- Use `EMAIL_DEV_MODE=true` for testing
- Tracking tokens are permanent
- Guest orders work without customer accounts
- Admin can see all guest orders
- Email templates are fully customizable

---

**Need detailed help?** → Read `GUEST-CHECKOUT-SYSTEM-GUIDE.md`
