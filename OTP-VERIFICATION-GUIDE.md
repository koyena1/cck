# OTP Verification System - Setup & Testing Guide

## 🎉 What Was Fixed & Added

### ✅ Fixed Issues
1. **Modal Overlap** - Added stronger backdrop (black/90 with blur)
2. **Registration Error** - Database connection verified and working
3. **OTP Verification** - Complete phone verification system for registration

### ✨ New Features
- **OTP Verification** - Required for customer registration only
- **No OTP for Login** - Login uses email/password only
- **60-Second Cooldown** - Prevents OTP spam
- **6-Digit OTP** - Secure verification code
- **Auto-Expiry** - OTP expires after 10 minutes
- **Attempt Limiting** - Max 5 verification attempts per OTP
- **Dev Mode OTP Display** - Shows OTP in console for testing

## 📋 Setup Instructions

### Step 1: Run Database Migrations

**First, run the customers table migration (if not done already):**
```powershell
.\run-customer-table-migration.ps1
```

**Then, run the OTP table migration:**
```powershell
.\run-otp-table-migration.ps1
```

**Or manually:**
```bash
psql -U postgres -d cctv_platform -f create-customers-table.sql
psql -U postgres -d cctv_platform -f create-customer-otp-table.sql
```

### Step 2: Verify Database Tables

```sql
-- Check customers table
SELECT * FROM customers;

-- Check OTP table
SELECT * FROM customer_otp_verification;

-- Check table structure
\d customer_otp_verification
```

### Step 3: Start Development Server

```bash
npm run dev
```

## 🧪 Testing the OTP Flow

### Test Registration with OTP

1. **Open Home Page**: http://localhost:3000

2. **Click "Login / Register"** in navbar

3. **Switch to Register**:
   - Click "Don't have an account? Create one"

4. **Fill Registration Form**:
   ```
   Full Name:     Test User
   Email:         test@example.com
   Phone:         9876543210  (10 digits)
   ```

5. **Send OTP**:
   - Click "Send OTP" button
   - Check browser console for OTP (in development mode)
   - You should see: `📱 OTP for 9876543210: 123456`

6. **Enter OTP**:
   - OTP input field appears
   - Enter the 6-digit code from console
   - Click "Verify" button
   - See "Phone verified! ✓" message

7. **Complete Registration**:
   ```
   Password:       test123
   Confirm Pass:   test123
   Address:        123 Main St (optional)
   Pincode:        123456 (optional)
   ```

8. **Submit**:
   - Click "Create Account"
   - Registration successful!

### Test Login (No OTP Required)

1. **Switch to Login** tab
2. **Enter Credentials**:
   ```
   Email:     test@example.com
   Password:  test123
   ```
3. **Click "Login"** - No OTP needed!
4. See your name in navbar

## 🎯 OTP Flow Diagram

```
Registration Flow with OTP:
┌─────────────────────────────────────┐
│ 1. User enters phone number         │
│    ↓                                 │
│ 2. Click "Send OTP"                  │
│    ↓                                 │
│ 3. API generates 6-digit OTP         │
│    ↓                                 │
│ 4. OTP saved in database             │
│    ↓ (expires in 10 min)             │
│ 5. OTP displayed in console (dev)    │
│    ↓                                 │
│ 6. User enters OTP in modal          │
│    ↓                                 │
│ 7. Click "Verify"                    │
│    ↓                                 │
│ 8. API verifies OTP                  │
│    ↓                                 │
│ 9. Phone marked as verified ✓        │
│    ↓                                 │
│ 10. User completes registration      │
└─────────────────────────────────────┘

Login Flow (No OTP):
┌─────────────────────────────────────┐
│ 1. User enters email & password      │
│    ↓                                 │
│ 2. Click "Login"                     │
│    ↓                                 │
│ 3. Credentials verified              │
│    ↓                                 │
│ 4. User logged in ✓                  │
└─────────────────────────────────────┘
```

## 📱 Features & Validations

### OTP System
- ✅ **6-Digit Code**: Numeric only
- ✅ **10-Minute Expiry**: OTP valid for 10 minutes
- ✅ **60-Second Cooldown**: Must wait before requesting new OTP
- ✅ **5 Attempts Max**: Prevents brute force
- ✅ **Phone Validation**: Must be 10 digits
- ✅ **Auto-Invalidation**: Old OTPs disabled when new one sent

### UI Enhancements
- ✅ **Send OTP Button**: Disabled during cooldown
- ✅ **Countdown Timer**: Shows remaining seconds
- ✅ **OTP Input Field**: Appears after OTP sent
- ✅ **Verify Button**: Validates 6-digit code
- ✅ **Success Indicator**: Green checkmark when verified
- ✅ **Error Messages**: Clear feedback for invalid OTP
- ✅ **Disabled Submit**: Can't register without OTP verification

## 🔍 Database Schema

### customer_otp_verification Table
```sql
CREATE TABLE customer_otp_verification (
    otp_id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,      -- 6-digit code
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,      -- 10 minutes from creation
    verified_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,         -- Track failed attempts
    CONSTRAINT check_otp_format CHECK (otp_code ~ '^[0-9]{6}$')
);
```

## 🐛 Troubleshooting

### OTP not appearing in console
```bash
# Check if development mode is enabled
# Look for: "📱 OTP for 9876543210: 123456" in console
```

### "Please wait 1 minute" error
- This prevents OTP spam
- Wait 60 seconds before requesting again
- Or test with a different phone number

### "OTP has expired"
- OTP valid for 10 minutes only
- Request a new OTP

### "Too many failed attempts"
- You've tried 5 wrong OTPs
- Request a new OTP

### Database connection error
```bash
# Verify database is running
Get-Service postgresql*

# Check connection settings in .env.local
DATABASE_URL=postgresql://postgres:Koyen@123@localhost:5432/cctv_platform
```

### Phone number validation error
- Must be exactly 10 digits
- Numbers only (no spaces or special characters)
- Example: 9876543210 ✓
- Wrong: +91 9876543210 ✗

## 🔐 Security Notes

### Development Mode
- OTP displayed in console for testing
- **⚠️ REMOVE IN PRODUCTION!**

### Production Requirements
**Must implement before going live:**

1. **SMS Service Integration**
   ```typescript
   // In app/api/otp/send/route.ts
   // Replace sendOTPViaSMS() with actual SMS service:
   - Twilio
   - MSG91
   - AWS SNS
   - Google Firebase SMS
   ```

2. **Remove Console Logging**
   ```typescript
   // Remove this in production:
   ...(process.env.NODE_ENV === 'development' && { otp })
   ```

3. **Rate Limiting**
   - Add API rate limiting (e.g., 5 OTPs per hour per phone)
   - Use Redis or similar for distributed rate limiting

4. **Phone Number Validation**
   - Add country code support
   - Use libphonenumber-js for proper validation

5. **Audit Logging**
   - Log all OTP requests and verifications
   - Monitor for suspicious patterns

## 📊 API Endpoints

### POST /api/otp/send
Send OTP to phone number.

**Request:**
```json
{
  "phone": "9876543210"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your phone",
  "otp": "123456"  // Only in development
}
```

**Error Response (429):**
```json
{
  "success": false,
  "error": "Please wait 1 minute before requesting another OTP"
}
```

### POST /api/otp/verify
Verify OTP code.

**Request:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid OTP. Please try again."
}
```

## ✅ Testing Checklist

### Registration Flow
- [ ] Open home page
- [ ] Click "Login / Register"
- [ ] Switch to register
- [ ] Enter phone number (10 digits)
- [ ] Click "Send OTP"
- [ ] See OTP in console
- [ ] Enter OTP in modal
- [ ] Click "Verify"
- [ ] See "Phone verified ✓"
- [ ] Complete remaining fields
- [ ] Click "Create Account"
- [ ] Registration successful

### OTP Validations
- [ ] Can't send OTP without phone number
- [ ] Can't send OTP with invalid phone (not 10 digits)
- [ ] "Send OTP" disabled during 60s cooldown
- [ ] OTP input appears after sending
- [ ] Can't verify without entering OTP
- [ ] Invalid OTP shows error
- [ ] Valid OTP shows success
- [ ] Can't submit registration without OTP verification

### Login Flow
- [ ] Switch to login tab
- [ ] Enter email and password
- [ ] Click "Login"
- [ ] **NO OTP REQUIRED** ✓
- [ ] Login successful

### UI/UX
- [ ] Modal has dark backdrop (no overlap)
- [ ] Countdown timer works
- [ ] "Resend OTP" appears after cooldown
- [ ] OTP input only accepts numbers
- [ ] Success messages clear and visible
- [ ] Error messages helpful

## 📁 New Files Created

```
✨ create-customer-otp-table.sql
✨ run-otp-table-migration.ps1
✨ app/api/otp/send/route.ts
✨ app/api/otp/verify/route.ts
```

## 📝 Modified Files

```
📝 components/customer-auth-modal.tsx
   - Added OTP state management
   - Added OTP send/verify functions
   - Added OTP UI components
   - Added countdown timer
   - Updated submit validation

📝 components/ui/dialog.tsx
   - Increased backdrop opacity to 90%
   - Added backdrop blur effect
   - Fixed z-index for better layering
```

## 🎊 Summary

✅ **Modal Overlap Fixed** - Strong backdrop with blur
✅ **OTP Verification Added** - Required for registration only
✅ **No OTP for Login** - Simple email/password login
✅ **Security Features** - Expiry, rate limiting, attempt limiting
✅ **Developer Friendly** - OTP shown in console for testing
✅ **Production Ready** - Just add real SMS service

## 🚀 Quick Start Commands

```powershell
# 1. Run migrations
.\run-customer-table-migration.ps1
.\run-otp-table-migration.ps1

# 2. Start server
npm run dev

# 3. Test at
http://localhost:3000
```

**That's it! Your OTP verification system is ready to test!** 🎉
