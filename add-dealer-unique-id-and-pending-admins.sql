-- Migration: Add unique_dealer_id to dealers table and create pending_admins table
-- Run this in your PostgreSQL database

-- 1. Add unique_dealer_id column to dealers table (nullable, filled on approval)
ALTER TABLE dealers 
  ADD COLUMN IF NOT EXISTS unique_dealer_id VARCHAR(20) UNIQUE;

-- 2. Create pending_admins table for admin registration approval flow
CREATE TABLE IF NOT EXISTS pending_admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  status VARCHAR(20) DEFAULT 'Pending',   -- 'Pending', 'Approved', 'Rejected'
  requested_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100)
);
