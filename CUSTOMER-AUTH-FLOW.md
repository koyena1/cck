# Customer Authentication Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         HOME PAGE                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              NAVBAR (navbar.tsx)                    │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │  Login / Register  (Click to open modal) │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │    CUSTOMER AUTH MODAL (customer-auth-modal.tsx)   │    │
│  │                                                      │    │
│  │   ┌─────────────┐       ┌──────────────┐          │    │
│  │   │   LOGIN     │  <──> │   REGISTER   │          │    │
│  │   │   FORM      │       │    FORM      │          │    │
│  │   └──────┬──────┘       └──────┬───────┘          │    │
│  └──────────┼─────────────────────┼──────────────────┘    │
│             │                     │                         │
└─────────────┼─────────────────────┼─────────────────────────┘
              │                     │
              ▼                     ▼
    ┌─────────────────┐   ┌──────────────────┐
    │  POST /api/auth │   │  POST /api/auth  │
    │  /customer/login│   │ /customer/register│
    └────────┬────────┘   └────────┬─────────┘
             │                     │
             ▼                     ▼
    ┌──────────────────────────────────────┐
    │      PostgreSQL Database             │
    │                                       │
    │  ┌────────────────────────────┐     │
    │  │    customers table          │     │
    │  ├────────────────────────────┤     │
    │  │ customer_id (PK)            │     │
    │  │ full_name                   │     │
    │  │ email (UNIQUE)              │     │
    │  │ phone_number                │     │
    │  │ password_hash               │     │
    │  │ address                     │     │
    │  │ pincode                     │     │
    │  │ is_active                   │     │
    │  │ created_at                  │     │
    │  └────────────────────────────┘     │
    └──────────────────────────────────────┘
```

## User Flow

### Registration Flow
```
1. User lands on Home Page
                │
2. Clicks "Login / Register" in Navbar
                │
3. Modal opens (default: Login view)
                │
4. Clicks "Don't have an account? Create one"
                │
5. Switches to Registration Form
                │
6. Fills in form:
   - Full Name
   - Email
   - Phone
   - Password
   - Confirm Password
   - Address (optional)
   - Pincode (optional)
                │
7. Clicks "Create Account"
                │
8. POST request to /api/auth/customer/register
                │
9. Server validates & creates customer in DB
                │
10. Success message shown
                │
11. Auto-switches to Login after 2 seconds
```

### Login Flow
```
1. User on Login view in modal
                │
2. Enters email & password
                │
3. Clicks "Login"
                │
4. POST request to /api/auth/customer/login
                │
5. Server validates credentials
                │
6. Returns customer data & token
                │
7. Token saved to localStorage:
   - customerToken
   - customerName
   - customerEmail
                │
8. Success message shown
                │
9. Modal closes after 1 second
                │
10. Page refreshes
                │
11. Navbar shows customer name + logout button
```

### Logged-In State
```
┌─────────────────────────────────────────┐
│            NAVBAR (Logged In)            │
│  ┌────────────────────────────────┐    │
│  │  👤 John Doe    [Logout Icon]   │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Logout Flow
```
1. Click Logout Icon
                │
2. localStorage cleared:
   - customerToken removed
   - customerName removed
   - customerEmail removed
                │
3. Page refreshes
                │
4. Navbar shows "Login / Register" again
```

## Key Features

### ✅ Implemented
- [x] Modal-based authentication (no page navigation)
- [x] Registration with validation
- [x] Login with session management
- [x] Logout functionality
- [x] Customer name display in navbar
- [x] Mobile responsive design
- [x] Error handling & validation
- [x] Success messages
- [x] Auto-switch from register to login
- [x] localStorage session persistence
- [x] Separate from dealer/admin auth

### Separation of Concerns

**Customer Auth** (Modal on Home Page)
- Path: Modal on `/` (home page)
- Users: Regular customers
- API: `/api/auth/customer/login` & `/api/auth/customer/register`
- DB Table: `customers`
- After Login: Stay on home page

**Dealer/Admin Auth** (Separate Page)
- Path: `/login` page
- Users: Dealers & Admins
- API: `/api/auth/login` & `/api/auth/register`
- DB Tables: `dealers` & `admins`
- After Login: Redirect to dashboard

## Security Notes

### Current Implementation (Development)
- Plain text password storage
- Simple token generation
- localStorage for session

### Production Requirements
- ⚠️ Hash passwords with bcrypt
- ⚠️ Use JWT tokens with expiration
- ⚠️ HTTP-only cookies instead of localStorage
- ⚠️ HTTPS only
- ⚠️ Rate limiting on auth endpoints
- ⚠️ Email verification
- ⚠️ CSRF protection
