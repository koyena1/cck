# HD Combo Admin Backend Implementation Guide

This document explains the complete implementation of the admin-controlled HD Combo product management system.

## 🎯 Overview

The HD Combo category now has a fully functional admin backend where you can:
- ✅ Add new HD Combo products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Upload product images
- ✅ Manage product specifications
- ✅ Set prices and discounts
- ✅ Control product visibility (Active/Inactive)
- ✅ Products are automatically displayed on the frontend

## 📁 Files Created/Modified

### New Files Created:
1. **`schema-hd-combo-products.sql`** - Database schema for HD Combo products
2. **`setup-hd-combo-db.ps1`** - PowerShell script to setup the database
3. **`app/api/hd-combo-products/route.ts`** - API endpoints for CRUD operations
4. **`HD-COMBO-ADMIN-GUIDE.md`** - This documentation file

### Modified Files:
1. **`app/admin/layout.tsx`** - Added "Categories" menu with HD Combo and other categories
2. **`app/admin/categories/hd-combo/page.tsx`** - Updated to work with database
3. **`app/categories/hd-combo/page.tsx`** - Updated to fetch products from database

## 🗄️ Database Schema

The `hd_combo_products` table includes:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key (auto-increment) |
| `name` | VARCHAR(255) | Product name |
| `brand` | VARCHAR(100) | Brand name (Hikvision, CP Plus, etc.) |
| `channels` | INTEGER | Number of channels (2, 4, 8, 16) |
| `camera_type` | VARCHAR(50) | Type of camera (Bullet, Dome, PTZ) |
| `resolution` | VARCHAR(20) | Resolution (2MP, 4MP, 5MP, 8MP) |
| `hdd` | VARCHAR(50) | Hard disk size (500GB, 1TB, 2TB, 4TB) |
| `cable` | VARCHAR(50) | Cable length (90m, 180m, 270m) |
| `price` | DECIMAL(10,2) | Selling price |
| `original_price` | DECIMAL(10,2) | Original/MRP price |
| `image` | TEXT | Base64 image or URL |
| `specs` | TEXT[] | Array of specifications |
| `rating` | DECIMAL(2,1) | Product rating (0-5) |
| `reviews` | INTEGER | Number of reviews |
| `is_active` | BOOLEAN | Product visibility status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## 🚀 Setup Instructions

### Step 1: Database Setup

1. Make sure PostgreSQL is installed and running
2. Open PowerShell in the project directory
3. Run the setup script:
   ```powershell
   .\setup-hd-combo-db.ps1
   ```
4. Follow the prompts to enter your database credentials
   - Host: `localhost` (default)
   - Port: `5432` (default)
   - Database: `cctv_platform` (or your database name)
   - User: `postgres` (or your username)
   - Password: (your database password)

### Step 2: Environment Variables

Make sure your `.env` or `.env.local` file has the database connection:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/cctv_platform
```

Replace `username`, `password`, and `cctv_platform` with your actual values.

### Step 3: Start the Application

```bash
npm run dev
```

## 📋 How to Use

### Accessing the Admin Panel

1. Navigate to: `http://localhost:3000/admin/login`
2. Log in with your admin credentials
3. Click on **"F. CATEGORIES"** in the sidebar
4. Click on **"HD Combo"** from the dropdown

### Adding a New Product

1. Click the **"Add Product"** button (top right)
2. Fill in all the required fields:
   - **Product Name** (e.g., "Hikvision 4CH DVR Complete Kit")
   - **Brand** (Select from dropdown)
   - **Channels** (2, 4, 8, or 16)
   - **Camera Type** (Bullet, Dome, or PTZ)
   - **Resolution** (2MP, 3MP, 4MP, 5MP, 8MP)
   - **Hard Disk** (500GB, 1TB, 2TB, 4TB)
   - **Cable Length** (90m, 180m, 270m)
   - **Price** (Selling price)
   - **Original Price** (MRP/Original price)
   - **Rating** (0-5 stars)
   - **Reviews Count** (Number of reviews)
3. **Upload Product Image**:
   - Click "Upload Image" button
   - Select an image from your computer
   - Preview will appear
4. **Add Specifications**:
   - Enter specifications one by one
   - Click "+ Add Specification" for more
   - Remove unwanted specs with the X button
5. **Set Product Status**:
   - Check "Active" to display on frontend
   - Uncheck to hide from frontend
6. Click **"Add Product"** to save

### Editing a Product

1. Find the product in the table
2. Click the **Edit icon (pencil)** in the Actions column
3. Update the desired fields
4. Click **"Update Product"** to save changes

### Deleting a Product

1. Find the product in the table
2. Click the **Delete icon (trash)** in the Actions column
3. Confirm the deletion
4. Product will be permanently removed

### Product Visibility

- **Active Products**: Visible on the frontend HD Combo page
- **Inactive Products**: Hidden from frontend, only visible in admin panel
- Toggle the "Active" checkbox when adding/editing to control visibility

## 🎨 Frontend Display

Products are automatically displayed on the frontend at:
`http://localhost:3000/categories/hd-combo`

### Features:
- ✅ **Advanced Filters**: Brand, Channels, Camera Type, Resolution, HDD, Cable, Price Range
- ✅ **Product Cards**: Same design as before (images, ratings, prices, discount badges)
- ✅ **Real-time Updates**: Changes in admin panel immediately reflect on frontend
- ✅ **Only Active Products**: Inactive products are automatically hidden
- ✅ **Responsive Design**: Works on all screen sizes
- ✅ **Smooth Animations**: Framer Motion animations maintained

### Product Card Details:
Each product card displays:
- Product image with hover zoom effect
- Discount percentage badge (if original price is higher)
- Product name
- All specifications as bullet points
- Rating with star icon
- Review count
- Current price (large and bold)
- Original price (crossed out)
- "View Details" and "Add to Cart" buttons

## 🔒 Security Notes

1. **Admin Authentication**: Make sure your admin routes are protected
2. **Image Upload**: Images are stored as base64 in database (consider using cloud storage for production)
3. **Database**: Use environment variables for database credentials
4. **API Endpoints**: Consider adding authentication middleware to API routes

## 📊 Categories Menu

The admin sidebar now includes a **"F. CATEGORIES"** section with:

1. **HD Combo** (implemented)
2. **IP Combo** (ready for future implementation)
3. **WiFi Camera** (ready for future implementation)
4. **4G SIM Camera** (ready for future implementation)
5. **Solar Camera** (ready for future implementation)
6. **Body Worn Camera** (ready for future implementation)

To implement other categories, follow the same pattern:
1. Create a database table (similar to `hd_combo_products`)
2. Create API endpoints (similar to `/api/hd-combo-products`)
3. Create admin page (similar to `/admin/categories/hd-combo`)
4. Update frontend category page to fetch from database

## 🐛 Troubleshooting

### Database Connection Error
- Check if PostgreSQL is running
- Verify DATABASE_URL in `.env` file
- Ensure database exists and user has permissions

### Products Not Showing on Frontend
- Check if products are marked as "Active" in admin panel
- Verify API endpoint is working: `http://localhost:3000/api/hd-combo-products`
- Check browser console for errors

### Image Upload Not Working
- Check file size (large files may cause issues)
- Verify file is a valid image format (JPG, PNG, WebP)
- Check browser console for errors

### API Errors
- Check database connection
- Verify table exists: Run `\dt` in psql
- Check PostgreSQL logs for errors

## 📞 Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Check the terminal/console for server errors
3. Verify database connection and table structure
4. Ensure all dependencies are installed: `npm install`

## 🎉 Success!

You now have a fully functional admin backend for managing HD Combo products! The same pattern can be applied to all other product categories.

### Key Benefits:
✅ No need to modify code to add/edit products
✅ Non-technical staff can manage products
✅ Real-time updates to frontend
✅ Complete control over product visibility
✅ Easy to scale to other categories
✅ Maintains the beautiful card design

---

**Implementation Date**: February 1, 2026
**System**: Admin-Controlled Product Management
**Status**: ✅ Fully Functional
