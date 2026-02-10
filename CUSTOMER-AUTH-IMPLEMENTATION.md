# Customer Authentication System Implementation Guide

## Overview
This implementation adds a complete customer login/registration system that appears as a modal dialog on the home page navbar. The system is separate from the existing dealer/admin authentication and keeps customers on the home page after login.

## What Was Implemented

### 1. Database Schema
**File**: `create-customers-table.sql`

Created a new `customers` table with the following structure:
- `customer_id` (Primary Key)
- `full_name` (Required)
- `email` (Unique, Required)
- `phone_number` (Required)
- `password_hash` (Required)
- `address` (Optional)
- `pincode` (Optional)
- `is_active` (Boolean, default true)
- `email_verified` (Boolean, default false)
- `created_at` & `updated_at` (Timestamps)

Includes indexes on `email` and `phone_number` for faster lookups.

### 2. Customer Authentication Modal
**File**: `components/customer-auth-modal.tsx`

A modern, responsive modal component featuring:
- **Login Form**: Email and password
- **Registration Form**: Full name, email, phone, password, confirm password, address (optional), pincode (optional)
- **Toggle Between Login/Register**: Seamless switching
- **Form Validation**: Client-side validation for password match, minimum length, etc.
- **Error Handling**: Clear error messages for failed operations
- **Success Messages**: Confirmation messages for successful operations
- **Dark Theme**: Matches the existing design with gradient backgrounds
- **Link to Dealer/Admin Login**: Option to navigate to `/login` for dealers/admins

### 3. Navbar Integration
**File**: `components/navbar.tsx`

Updated navbar to:
- **Display Modal Trigger**: "Login / Register" button opens the modal instead of navigating to `/login`
- **Show Customer Info**: After login, displays customer name with logout button
- **Session Management**: Uses localStorage to persist customer session
- **Logout Functionality**: Clears session and refreshes page
- **Mobile Support**: Full mobile menu integration with same functionality

Key changes:
- Added `CustomerAuthModal` import
- Added state management for modal visibility and customer session
- Added `useEffect` to check localStorage for existing session
- Added logout handler
- Replaced Link to `/login` with modal trigger buttons

### 4. API Routes

#### Customer Login API
**File**: `app/api/auth/customer/login/route.ts`

- **Endpoint**: `POST /api/auth/customer/login`
- **Request Body**: `{ email, password }`
- **Response**: Returns customer data and authentication token
- **Security**: Checks `is_active` status, validates credentials
- **Error Handling**: Proper HTTP status codes and error messages

#### Customer Register API
**File**: `app/api/auth/customer/register/route.ts`

- **Endpoint**: `POST /api/auth/customer/register`
- **Request Body**: `{ fullName, email, phone, password, address, pincode }`
- **Validation**: Checks for required fields, password length, duplicate emails
- **Response**: Returns success message and new customer data
- **Error Handling**: Handles unique constraint violations and validation errors

### 5. Migration Script
**File**: `run-customer-table-migration.ps1`

PowerShell script to automate database migration:
- Connects to PostgreSQL database
- Runs the customer table SQL script
- Provides colored console output for success/failure
- Includes error handling

## Setup Instructions

### Step 1: Run Database Migration

1. Open PowerShell in the project root directory
2. Update database credentials in `run-customer-table-migration.ps1`:
   ```powershell
   $env:PGPASSWORD = "your_postgres_password"
   $dbHost = "localhost"
   $dbPort = "5432"
   $dbName = "cctv_platform"
   $dbUser = "postgres"
   ```

3. Run the migration:
   ```powershell
   .\run-customer-table-migration.ps1
   ```

   Or manually run the SQL file in pgAdmin or psql:
   ```bash
   psql -U postgres -d cctv_platform -f create-customers-table.sql
   ```

### Step 2: Verify Installation

1. Check that the `customers` table was created:
   ```sql
   SELECT * FROM customers;
   ```

2. Verify the indexes:
   ```sql
   \d customers
   ```

### Step 3: Test the Application

1. Start your development server (if not already running):
   ```bash
   npm run dev
   ```

2. Navigate to the home page (http://localhost:3000)

3. Click on "Login / Register" in the navbar

4. The customer authentication modal should appear

## Testing Checklist

### Registration Flow
- [ ] Click "Login / Register" in navbar
- [ ] Modal opens with login form by default
- [ ] Click "Don't have an account? Create one"
- [ ] Fill in registration form:
  - Full Name: John Doe
  - Email: john@example.com
  - Phone: 1234567890
  - Password: test123
  - Confirm Password: test123
  - Address: 123 Main St (optional)
  - Pincode: 123456 (optional)
- [ ] Click "Create Account"
- [ ] Success message appears
- [ ] Form automatically switches to login after 2 seconds

### Login Flow
- [ ] Enter registered email and password
- [ ] Click "Login"
- [ ] Success message appears
- [ ] Modal closes after 1 second
- [ ] Page refreshes showing customer name in navbar
- [ ] Logout button appears next to name

### Logout Flow
- [ ] Click logout icon (power button)
- [ ] Customer session cleared
- [ ] Page refreshes
- [ ] "Login / Register" button reappears

### Mobile Testing
- [ ] Open mobile view (< 768px width)
- [ ] Click hamburger menu
- [ ] "Login / Register" button appears at bottom
- [ ] Modal opens on click
- [ ] All forms work correctly
- [ ] After login, customer name and logout appear in mobile menu

### Error Handling
- [ ] Try to register with existing email → "Email already registered"
- [ ] Try to login with wrong password → "Invalid email or password"
- [ ] Try to register with password < 6 chars → "Password must be at least 6 characters"
- [ ] Try to register with mismatched passwords → "Passwords do not match"

## Important Notes

### Dealer/Admin Login Unchanged
- The existing dealer and admin login system at `/login` remains completely intact
- The `/admin/login` route is also unchanged
- Customers have a separate authentication flow from dealers/admins

### Session Management
- Customer sessions are stored in `localStorage`:
  - `customerToken`: Authentication token
  - `customerName`: Customer's full name
  - `customerEmail`: Customer's email
- Session persists across page refreshes
- Session is cleared on logout

### Security Considerations (Production)

⚠️ **Important**: The current implementation uses plain text password storage for demonstration. For production:

1. **Hash Passwords**: Use bcrypt to hash passwords
   ```typescript
   import bcrypt from 'bcrypt'
   const hashedPassword = await bcrypt.hash(password, 10)
   ```

2. **JWT Tokens**: Implement proper JWT-based authentication
   ```typescript
   import jwt from 'jsonwebtoken'
   const token = jwt.sign({ customerId }, process.env.JWT_SECRET, { expiresIn: '7d' })
   ```

3. **HTTP-Only Cookies**: Store tokens in HTTP-only cookies instead of localStorage

4. **Rate Limiting**: Add rate limiting to prevent brute force attacks

5. **Email Verification**: Implement email verification flow

6. **HTTPS**: Ensure all requests are made over HTTPS in production

## File Structure

```
cctv-website/
├── app/
│   └── api/
│       └── auth/
│           └── customer/
│               ├── login/
│               │   └── route.ts (NEW)
│               └── register/
│                   └── route.ts (NEW)
├── components/
│   ├── navbar.tsx (MODIFIED)
│   └── customer-auth-modal.tsx (NEW)
├── create-customers-table.sql (NEW)
└── run-customer-table-migration.ps1 (NEW)
```

## API Documentation

### POST /api/auth/customer/register
Register a new customer account.

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securepassword",
  "address": "123 Main St", // optional
  "pincode": "123456" // optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful! You can now login.",
  "customer": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  }
}
```

**Error Response (400/409/500):**
```json
{
  "success": false,
  "error": "Email already registered"
}
```

### POST /api/auth/customer/login
Authenticate a customer.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "customer_1_1234567890",
  "customer": {
    "id": 1,
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "pincode": "123456"
  }
}
```

**Error Response (401/500):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify `customer-auth-modal.tsx` is in the `components` folder
- Ensure `dialog.tsx` component exists in `components/ui/`

### Database errors
- Verify PostgreSQL is running
- Check database name and credentials
- Ensure `customers` table was created successfully
- Check PostgreSQL logs for detailed error messages

### Authentication not working
- Check browser console for API errors
- Verify API routes are in correct folders
- Check that `lib/db.ts` exports `getPool` function
- Ensure database connection is configured correctly

### Session not persisting
- Check if localStorage is enabled in browser
- Verify localStorage keys are being set correctly
- Check browser console for errors during token storage

## Future Enhancements

Potential improvements for the customer authentication system:

1. **Email Verification**: Send verification emails after registration
2. **Password Reset**: Forgot password functionality
3. **Social Login**: Google, Facebook OAuth integration
4. **Profile Management**: Customer dashboard to update profile
5. **Order History**: View past orders (if applicable)
6. **Address Book**: Save multiple shipping addresses
7. **Two-Factor Authentication**: Enhanced security with 2FA
8. **Remember Me**: Extended session duration option
9. **Account Deletion**: GDPR-compliant account removal

## Support

If you encounter any issues:
1. Check this guide's troubleshooting section
2. Review browser console for errors
3. Check PostgreSQL logs
4. Verify all files were created correctly
5. Ensure dependencies are installed (`npm install`)

## Summary

✅ Customer authentication system fully implemented
✅ Separate from dealer/admin login
✅ Modal-based UI on home page
✅ Customers stay on home page after login
✅ Full mobile support
✅ Proper error handling and validation
✅ Easy to test and deploy
