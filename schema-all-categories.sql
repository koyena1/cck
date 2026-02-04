-- Database Schema for All Product Categories
-- Run this script to create tables for all categories

-- 1. HD Combo Products
CREATE TABLE IF NOT EXISTS hd_combo_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    channels INTEGER NOT NULL,
    camera_type VARCHAR(50) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    hdd VARCHAR(50) NOT NULL,
    cable VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hd_combo_brand ON hd_combo_products(brand);
CREATE INDEX idx_hd_combo_active ON hd_combo_products(is_active);

-- 2. IP Combo Products
CREATE TABLE IF NOT EXISTS ip_combo_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    channels INTEGER NOT NULL,
    camera_type VARCHAR(50) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    hdd VARCHAR(50) NOT NULL,
    cable VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ip_combo_brand ON ip_combo_products(brand);
CREATE INDEX idx_ip_combo_active ON ip_combo_products(is_active);

-- 3. WiFi Camera Products
CREATE TABLE IF NOT EXISTS wifi_camera_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    connectivity VARCHAR(50) NOT NULL,
    night_vision BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wifi_camera_brand ON wifi_camera_products(brand);
CREATE INDEX idx_wifi_camera_active ON wifi_camera_products(is_active);

-- 4. 4G SIM Camera Products
CREATE TABLE IF NOT EXISTS sim_4g_camera_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    sim_support VARCHAR(50) NOT NULL,
    battery VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sim_4g_camera_brand ON sim_4g_camera_products(brand);
CREATE INDEX idx_sim_4g_camera_active ON sim_4g_camera_products(is_active);

-- 5. Solar Camera Products
CREATE TABLE IF NOT EXISTS solar_camera_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    solar_panel VARCHAR(50),
    battery VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_solar_camera_brand ON solar_camera_products(brand);
CREATE INDEX idx_solar_camera_active ON solar_camera_products(is_active);

-- 6. Body Worn Camera Products
CREATE TABLE IF NOT EXISTS body_worn_camera_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    battery_life VARCHAR(50),
    storage VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_body_worn_camera_brand ON body_worn_camera_products(brand);
CREATE INDEX idx_body_worn_camera_active ON body_worn_camera_products(is_active);

-- 7. HD Camera Products
CREATE TABLE IF NOT EXISTS hd_camera_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    camera_type VARCHAR(50) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    lens VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hd_camera_brand ON hd_camera_products(brand);
CREATE INDEX idx_hd_camera_active ON hd_camera_products(is_active);

-- 8. IP Camera Products
CREATE TABLE IF NOT EXISTS ip_camera_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    camera_type VARCHAR(50) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    poe BOOLEAN DEFAULT false,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT,
    specs TEXT[],
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ip_camera_brand ON ip_camera_products(brand);
CREATE INDEX idx_ip_camera_active ON ip_camera_products(is_active);
