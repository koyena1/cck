# District-Wise Dealer Location Management Portal

## Overview
This system enables district-level management of dealers and orders with role-based access control. Only admins can create district users, and each district user can only view and manage dealers/orders in their assigned district.

---

## 🏗️ System Architecture

### Database Tables

#### 1. `district_users`
Stores district-level user accounts created by admin.

**Key Columns:**
- `district_user_id` - Primary key
- `username`, `email`, `password_hash` - Authentication
- `district`, `state` - Geographic assignment
- `can_view_dealers`, `can_view_orders`, `can_contact_dealers` - Permissions
- `created_by` - References admin who created the user
- `last_login` - Track user activity

#### 2. `district_user_activity_log`
Tracks all activities performed by district users for auditing.

**Key Columns:**
- `activity_type` - login, view_dealer, view_order, etc.
- `description` - Human-readable activity description
- `metadata` - JSON data for additional context
- `ip_address` - User's IP address

#### 3. `dealers` table (updated)
Added columns:
- `district` - District where dealer operates
- `state` - State where dealer operates

---

## 🚀 Setup Instructions

### 1. Install Dependencies

First, check if bcrypt is installed. If not, install it:

```bash
npm install bcrypt
```

### 2. Run Database Migration

Execute the SQL migration to create tables and views:

**Option A: Using PowerShell Script**
```powershell
node run-district-management-setup.js
```

**Option B: Using pgAdmin**
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Copy contents of `add-district-management-system.sql`
5. Execute the query

### 3. Update Existing Dealers with District Info

Run these queries to assign districts to existing dealers:

```sql
-- Example: Update dealers based on PIN codes
UPDATE dealers 
SET district = 'Mumbai City', state = 'Maharashtra' 
WHERE service_pin LIKE '400%';

UPDATE dealers 
SET district = 'Delhi', state = 'Delhi' 
WHERE service_pin LIKE '110%';

-- Or update individually
UPDATE dealers 
SET district = 'YourDistrict', state = 'YourState' 
WHERE dealer_id = 1;
```

### 4. Start Development Server

```bash
npm run dev
```

---

## 📱 User Access

### Admin Access

**URL:** `http://localhost:3000/admin/district-management`

**Features:**
- Create district users with username/password
- Assign districts to users
- Set permissions (view dealers, view orders, contact dealers)
- View district-wise statistics
- Activate/deactivate users
- Delete users

**Creating a District User:**
1. Click "Create District User" button
2. Fill in:
   - Username (unique)
   - Email
   - Password (min 8 characters)
   - Full Name
   - Phone Number (optional)
   - State (dropdown)
   - District (text input)
   - Permissions (checkboxes)
3. Click "Create User"

### District Portal Access

**URL:** `http://localhost:3000/district-portal/login`

**Login Credentials:**
- Username: (created by admin)
- Password: (created by admin)

**Dashboard Features:**
1. **Overview Tab:**
   - District statistics
   - Total dealers, orders, revenue
   - Recent activity
   - User permissions display

2. **Dealers Tab** (if permission granted):
   - List all dealers in district
   - View dealer details (name, contact, address)
   - Filter by status (Active, Pending, Rejected)
   - See dealer ratings and completed jobs
   - Contact information (if permission granted)

3. **Orders Tab** (if permission granted):
   - All orders assigned to dealers in district
   - Order details, status, amounts
   - Filter by order status
   - Customer information
   - Dealer assignments

---

## 🔐 Security Features

### Authentication
- Password hashing using bcrypt (10 rounds)
- Session token generation on login
- Automatic session validation

### Authorization
- Role-based access control
- Admin-only user creation
- Permission-based feature access
- District-level data isolation

### Activity Logging
- All login attempts logged
- Activity tracking with timestamps
- IP address recording
- Audit trail for compliance

---

## 📊 API Endpoints

### Admin APIs

#### 1. District Users Management
```
GET  /api/admin/district-users        - List all district users
POST /api/admin/district-users        - Create new district user
PATCH /api/admin/district-users       - Update user status/permissions
DELETE /api/admin/district-users      - Delete district user
```

#### 2. District Statistics
```
GET /api/admin/district-stats         - Get district-wise dealer and order stats
```

### District Portal APIs

#### 1. Authentication
```
POST /api/district-portal/login       - Login with username/password
```

#### 2. Data Access
```
GET /api/district-portal/dealers?district={name}    - Get dealers in district
GET /api/district-portal/orders?district={name}     - Get orders in district
```

---

## 🎨 UI Components Used

All components are from `@/components/ui`:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Badge` - Status indicators
- `Button` - Actions and navigation

Icons from `lucide-react`:
- `Users`, `MapPin`, `Package`, `Activity`, etc.

---

## 📝 Example Usage Workflow

### Scenario: Setting up district management for Mumbai

1. **Admin: Create District User**
   ```
   Go to: /admin/district-management
   
   Fill form:
   - Username: mumbai_manager
   - Email: mumbai@example.com
   - Password: SecurePass123
   - Full Name: Rajesh Kumar
   - State: Maharashtra
   - District: Mumbai City
   - Permissions: ✓ All enabled
   
   Result: User account created
   ```

2. **Admin: Assign Districts to Dealers**
   ```sql
   UPDATE dealers 
   SET district = 'Mumbai City', state = 'Maharashtra' 
   WHERE service_pin LIKE '400%';
   ```

3. **District User: Login and View**
   ```
   Go to: /district-portal/login
   
   Login with:
   - Username: mumbai_manager
   - Password: SecurePass123
   
   Dashboard shows:
   - All dealers in Mumbai City
   - All orders assigned to Mumbai dealers
   - District statistics
   ```

---

## 🔍 Database Views

### `district_dealer_stats`
Aggregated statistics per district:
- Total dealers
- Active/pending counts
- Average rating
- Total completed jobs

### `district_order_stats`
Aggregated order data per district:
- Total/pending/completed orders
- Total order value

**Usage:**
```sql
SELECT * FROM district_dealer_stats WHERE state = 'Maharashtra';
SELECT * FROM district_order_stats WHERE district = 'Mumbai City';
```

---

## 🛠️ Customization

### Adding Custom Permissions
Edit `district_users` table and add columns:
```sql
ALTER TABLE district_users 
ADD COLUMN can_approve_dealers BOOLEAN DEFAULT false;
```

Update UI in:
- `app/admin/district-management/page.tsx` (form)
- `app/district-portal/dashboard/page.tsx` (features)

### Adding More States/Districts
States list is in: `app/admin/district-management/page.tsx`

Edit the `indianStates` array to add/modify states.

### Custom Activity Logging
Use the `log_district_user_activity` function:
```sql
SELECT log_district_user_activity(
  1,                              -- district_user_id
  'custom_action',                -- activity_type
  'User performed action',        -- description
  '{"key": "value"}'::jsonb,     -- metadata
  '192.168.1.1'                   -- ip_address
);
```

---

## 🐛 Troubleshooting

### Issue: "bcrypt is not defined"
**Solution:** Install bcrypt
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### Issue: Login fails with valid credentials
**Check:**
1. User is marked as `is_active = true`
2. Password was hashed correctly during creation
3. Database connection is working
4. Check browser console for errors

### Issue: No dealers showing in portal
**Check:**
1. Dealers have `district` and `state` columns populated
2. District name matches exactly (case-sensitive)
3. User has `can_view_dealers = true` permission

### Issue: Orders not visible
**Check:**
1. Orders are assigned to dealers (`assigned_dealer_id` is set)
2. Those dealers have the correct district
3. User has `can_view_orders = true` permission

---

## 📈 Performance Optimization

Indexes created automatically:
- `idx_dealers_district` - Fast dealer lookups by district
- `idx_dealers_state` - State-level queries
- `idx_district_users_district` - User lookups
- `idx_district_users_active` - Active user filtering

For large datasets, consider:
1. Pagination in API responses
2. Lazy loading in UI
3. Caching frequently accessed data

---

## 🔄 Future Enhancements

Potential features to add:
1. **Export Data:** Export dealers/orders to Excel
2. **Advanced Filters:** Date range, amount range, etc.
3. **Dashboard Analytics:** Charts and graphs
4. **Real-time Updates:** WebSocket for live data
5. **Mobile App:** React Native version
6. **Email Notifications:** Alert on new orders
7. **Multi-district Access:** Allow users to manage multiple districts

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check database logs for SQL errors
4. Review activity logs: `SELECT * FROM district_user_activity_log;`

---

## ✅ Checklist

- [ ] Database migration completed
- [ ] Dealers updated with district/state
- [ ] Admin can access district management page
- [ ] District user account created
- [ ] District user can login to portal
- [ ] District user can view dealers
- [ ] District user can view orders
- [ ] Activity logging working
- [ ] All permissions tested

---

**System Created:** February 2026  
**Version:** 1.0  
**Database:** PostgreSQL  
**Framework:** Next.js 14+ (App Router)  
**Authentication:** bcrypt + session tokens
