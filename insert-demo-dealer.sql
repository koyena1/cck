-- Insert a demo dealer for testing the pricing portal
-- This dealer will be used if no dealer is logged in

INSERT INTO dealers (
    dealer_id,
    full_name, 
    business_name, 
    email, 
    phone_number, 
    business_address, 
    location, 
    service_pin,
    gstin,
    registration_number,
    password_hash,
    status,
    rating,
    completed_jobs
) 
VALUES (
    1,
    'Demo Dealer',
    'Northern Dealer Center',
    'dealer@example.com',
    '9876543210',
    '123 Main Street, Commercial Area',
    'Delhi',
    '110001',
    'DEMO1234567890',
    'REG123456',
    '$2a$10$dummyhashedpassword1234567890123456789012',
    'Active',
    4.5,
    150
)
ON CONFLICT (dealer_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    business_name = EXCLUDED.business_name,
    status = 'Active';

-- Verify the dealer was created
SELECT dealer_id, full_name, business_name, email, status FROM dealers WHERE dealer_id = 1;
