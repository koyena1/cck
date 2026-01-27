-- PostgreSQL Database Schema for CCTV Platform
-- Architecture: Admin Portal + Dealer Portal + Order Tracking
-- Run this in PostgreSQL (pgAdmin or psql)

-- Create database (run this first in postgres database)
-- CREATE DATABASE cctv_platform;

-- Connect to cctv_platform database, then run the following:

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS order_tracking_otps CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS amc_calls CASCADE;
DROP TABLE IF EXISTS account_transactions CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS combo_offers CASCADE;
DROP TABLE IF EXISTS dealers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- ========================================
-- ADMIN & AUTHENTICATION
-- ========================================

CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, tele_sales, field_sales, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin
INSERT INTO admins (username, email, password_hash, role) 
VALUES ('admin', 'admin@gmail.com', '123456789', 'admin');

-- Create Dealers Table
CREATE TABLE dealers (
    dealer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    business_name VARCHAR(200),
    business_address TEXT,
    gstin VARCHAR(50),
    registration_number VARCHAR(50),
    service_pin VARCHAR(6),  -- For 5-10km radius matching
    location VARCHAR(200),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending Approval',
    rating DECIMAL(3, 2) DEFAULT 0.00,
    completed_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
========================================
-- ========================================
-- PRODUCTS & CATALOG
-- ========================================

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),  -- DVR, NVR, Indoor_Camera, Outdoor_Camera, Storage, Cable, Accessory
    brand VARCHAR(50),
    tech_type VARCHAR(50), -- HD Non Audio, HD Audio, HD Smart Hybrid, HD Full Color
    pixel VARCHAR(10), -- 2MP, 5MP
    description TEXT,
    base_price DECIMAL(10, 2),
    dealer_price DECIMAL(10, 2),
    image_url VARCHAR(500),
    in_stock BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- COMBO OFFERS (Admin Controlled)
-- ========================================

CREATE TABLE combo_offers (
    combo_id SERIAL PRIMARY KEY,
    combo_name VARCHAR(200) NOT NULL,
    combo_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    camera_type VARCHAR(10), -- IP, HD
    brand VARCHAR(50),
    channels INTEGER, -- 4, 8, 16
    indoor_cameras INTEGER DEFAULT 0,
    outdoor_cameras INTEGER DEFAULT 0,
    storage_size VARCHAR(20), -- 500GB, 1TB, 2TB, 4TB
    includes_cable BOOLEAN DEFAULT false,
    includes_accessories BOOLEAN DEFAULT false,
    includes_installation BOOLEAN DEFAULT false,
    original_price DECIMAL(10, 2),
    combo_price DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ORDERS MANAGEMENT
-- ========================================

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL, -- Format: ORD-20260125-0001
    
    -- Customer Information (No login required)
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    customer_email VARCHAR(100),
    
    -- Order Details
    order_type VARCHAR(20) NOT NULL, -- combo, customize
    combo_id INTEGER REFERENCES combo_offers(combo_id),
    
    -- Address & Location
    installation_address TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    
    -- Technical Requirements (for customize orders)
    camera_type VARCHAR(10), -- IP, HD
    brand VARCHAR(50),
    channels INTEGER,
    dvr_model VARCHAR(100),
    indoor_cameras JSONB, -- {type: qty} structure
    outdoor_cameras JSONB,
    storage_size VARCHAR(20),
    cable_option VARCHAR(50),
    includes_accessories BOOLEAN DEFAULT false,
    includes_installation BOOLEAN DEFAULT false,
    
    -- Pricing
    subtotal DECIMAL(10, 2),
    installation_charges DECIMAL(10, 2) DEFAULT 0,
    delivery_charges DECIMAL(10, 2) DEFAULT 0,
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Order Status & Assignment
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Verified, Allocated, In_Transit, Delivered, Installation_Pending, Completed, Cancelled
    assigned_dealer_id INTEGER REFERENCES dealers(dealer_id),
    assigned_at TIMESTAMP,
    
    -- Delivery & Installation
    expected_delivery_date DATE,
    actual_delivery_date TIMESTAMP,
    installation_date TIMESTAMP,
    installation_notes TEXT,
    
    -- Financial
    payment_status VARCHAR(50) DEFAULT 'Pending', -- Pending, Advance_Paid, Paid, Refunded
    payment_method VARCHAR(50),
    advance_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Feedback & Rating
    customer_feedback TEXT,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    
    -- Metadata
    created_by INTEGER REFERENCES admins(admin_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items (Bill of Materials)
CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id),
    item_type VARCHAR(50), -- DVR, Camera, Storage, Cable, Accessory, Installation
    item_name VARCHAR(200) NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Status History (Tracking)
CREATE TABLE order_status_history (
    history_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    remarks TEXT,
    updated_by INTEGER REFERENCES admins(admin_id),
    updated_by_dealer INTEGER REFERENCES dealers(dealer_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Tracking OTP System
CREATE TABLE order_tracking_otps (
    otp_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SERVICE SUPPORT
-- ========================================

-- Site Visit Requests
CREATE TABLE service_requests (
    request_id SERIAL PRIMARY KEY,
    request_type VARCHAR(50) NOT NULL, -- Site_Visit, Material_Request, Support
    order_id INTEGER REFERENCES orders(order_id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    requirement_details TEXT,
    quotation_amount DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Allocated, In_Progress, Completed, Cancelled
    assigned_dealer_id INTEGER REFERENCES dealers(dealer_id),
    allocation_date TIMESTAMP,
    visit_date TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AMC (Annual Maintenance Contract) Calls
CREATE TABLE amc_calls (
    amc_id SERIAL PRIMARY KEY,
    call_type VARCHAR(50) NOT NULL, -- Paid_Call, AMC_Call
    order_id INTEGER REFERENCES orders(order_id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    address TEXT NOT NULL,
    issue_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Scheduled, In_Progress, Resolved, Closed
    assigned_dealer_id INTEGER REFERENCES dealers(dealer_id),
    scheduled_date TIMESTAMP,
    resolution_date TIMESTAMP,
    service_charges DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    technician_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ACCOUNTS & FINANCIAL
-- ========================================

CREATE TABLE account_transactions (
    transaction_id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL, -- Sales, Purchase, Payment, Payout, Debit_Note, Credit_Note
    order_id INTEGER REFERENCES orders(order_id),
    dealer_id INTEGER REFERENCES dealers(dealer_id),
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    description TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES admins(admin_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Orders
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pincode ON orders(pincode);
CREATE INDEX idx_orders_assigned_dealer ON orders(assigned_dealer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Dealers
CREATE INDEX idx_dealers_email ON dealers(email);
CREATE INDEX idx_dealers_status ON dealers(status);
CREATE INDEX idx_dealers_pincodes ON dealers USING GIN(service_pincodes);

-- OTP Tracking
CREATE INDEX idx_otp_order_phone ON order_tracking_otps(order_number, phone_number);
CREATE INDEX idx_otp_expires ON order_tracking_otps(expires_at);

-- Service Requests
CREATE INDEX idx_service_status ON service_requests(status);
CREATE INDEX idx_service_pincode ON service_requests(pincode);

-- AMC Calls
CREATE INDEX idx_amc_status ON amc_calls(status);
CREATE INDEX idx_amc_customer_phone ON amc_calls(customer_phone);

-- Transactions
CREATE INDEX idx_transactions_type ON account_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON account_transactions(transaction_date DESC);

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    today_date TEXT;
    order_count INTEGER;
    new_order_number TEXT;
BEGIN
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO order_count
    FROM orders
    WHERE order_number LIKE 'ORD-' || today_date || '-%';
    
    new_order_number := 'ORD-' || today_date || '-' || LPAD(order_count::TEXT, 4, '0');
    
    NEW.order_number := new_order_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION generate_order_number();

-- Function to update order updated_at
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
CREATE TRIGGER trg_update_order_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_timestamp(vice_pin);
CREATE INDEX idx_dealers_status ON dealers(status);
CREATE INDEX idx_customer_leads_pincode ON customer_leads(pincode);
CREATE INDEX idx_customer_leads_status ON customer_leads(status);
CREATE INDEX idx_customers_email ON customers(email);

-- Display all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
