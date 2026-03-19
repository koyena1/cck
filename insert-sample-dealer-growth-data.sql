-- Insert sample dealer transaction data for January and February 2026
-- This will populate real data for the Growth chart

-- Ensure we have at least one dealer to work with
DO $$
DECLARE
    sample_dealer_id INTEGER;
BEGIN
    -- Get the first dealer ID (or create a sample one if none exists)
    SELECT dealer_id INTO sample_dealer_id FROM dealers LIMIT 1;
    
    IF sample_dealer_id IS NULL THEN
        RAISE NOTICE 'No dealers found in the database. Please create a dealer first.';
    ELSE
        -- Insert January 2026 transactions
        
        -- Sales in January 2026 (Profit)
        INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
        VALUES 
        (sample_dealer_id, 'sale', '2026-01-05 10:30:00', 'INV-JAN-001', 25000.00, 4500.00, 29500.00, 'completed', 'online', 'CCTV Installation - Customer A'),
        (sample_dealer_id, 'sale', '2026-01-12 14:20:00', 'INV-JAN-002', 18000.00, 3240.00, 21240.00, 'completed', 'cash', 'Camera System - Customer B'),
        (sample_dealer_id, 'sale', '2026-01-18 11:45:00', 'INV-JAN-003', 32000.00, 5760.00, 37760.00, 'completed', 'online', 'Complete Security Setup - Customer C'),
        (sample_dealer_id, 'sale', '2026-01-25 16:00:00', 'INV-JAN-004', 15000.00, 2700.00, 17700.00, 'completed', 'upi', 'DVR System - Customer D'),
        (sample_dealer_id, 'sale', '2026-01-28 09:30:00', 'INV-JAN-005', 22000.00, 3960.00, 25960.00, 'completed', 'online', 'IP Cameras - Customer E');
        
        -- Purchases in January 2026 (Loss/Costs)
        INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
        VALUES 
        (sample_dealer_id, 'purchase', '2026-01-03 10:00:00', 'PUR-JAN-001', 8000.00, 1440.00, 9440.00, 'completed', 'online', 'Stock purchase - Cameras'),
        (sample_dealer_id, 'purchase', '2026-01-10 15:30:00', 'PUR-JAN-002', 12000.00, 2160.00, 14160.00, 'completed', 'bank_transfer', 'Stock purchase - DVR Systems'),
        (sample_dealer_id, 'purchase', '2026-01-20 11:00:00', 'PUR-JAN-003', 6500.00, 1170.00, 7670.00, 'completed', 'online', 'Stock purchase - Cables & Accessories'),
        (sample_dealer_id, 'purchase', '2026-01-27 14:00:00', 'PUR-JAN-004', 4000.00, 720.00, 4720.00, 'completed', 'cash', 'Tools and Equipment');
        
        -- Sales in February 2026 (Profit)
        INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
        VALUES 
        (sample_dealer_id, 'sale', '2026-02-02 10:15:00', 'INV-FEB-001', 28000.00, 5040.00, 33040.00, 'completed', 'online', 'Office Security System - Customer F'),
        (sample_dealer_id, 'sale', '2026-02-08 13:30:00', 'INV-FEB-002', 19500.00, 3510.00, 23010.00, 'completed', 'upi', 'Home CCTV Setup - Customer G'),
        (sample_dealer_id, 'sale', '2026-02-15 11:00:00', 'INV-FEB-003', 35000.00, 6300.00, 41300.00, 'completed', 'online', 'Commercial Installation - Customer H'),
        (sample_dealer_id, 'sale', '2026-02-22 16:45:00', 'INV-FEB-004', 16000.00, 2880.00, 18880.00, 'completed', 'cash', 'Wireless Camera System - Customer I'),
        (sample_dealer_id, 'sale', '2026-02-26 10:30:00', 'INV-FEB-005', 24000.00, 4320.00, 28320.00, 'completed', 'online', 'NVR System - Customer J');
        
        -- Purchases in February 2026 (Loss/Costs)
        INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
        VALUES 
        (sample_dealer_id, 'purchase', '2026-02-05 09:30:00', 'PUR-FEB-001', 9000.00, 1620.00, 10620.00, 'completed', 'online', 'Stock purchase - IP Cameras'),
        (sample_dealer_id, 'purchase', '2026-02-12 14:00:00', 'PUR-FEB-002', 11000.00, 1980.00, 12980.00, 'completed', 'bank_transfer', 'Stock purchase - NVR Units'),
        (sample_dealer_id, 'purchase', '2026-02-18 10:30:00', 'PUR-FEB-003', 5500.00, 990.00, 6490.00, 'completed', 'online', 'Stock purchase - Accessories'),
        (sample_dealer_id, 'purchase', '2026-02-25 15:00:00', 'PUR-FEB-004', 3500.00, 630.00, 4130.00, 'completed', 'cash', 'Maintenance Costs');
        
        RAISE NOTICE 'Sample growth data inserted successfully for dealer ID: %', sample_dealer_id;
        RAISE NOTICE 'January 2026: 5 sales, 4 purchases';
        RAISE NOTICE 'February 2026: 5 sales, 4 purchases';
    END IF;
END $$;

-- Verify the inserted data
SELECT 
    TO_CHAR(transaction_date, 'Month YYYY') as month_year,
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(final_amount) as total_amount
FROM dealer_transactions
WHERE EXTRACT(YEAR FROM transaction_date) = 2026
    AND EXTRACT(MONTH FROM transaction_date) IN (1, 2)
GROUP BY TO_CHAR(transaction_date, 'Month YYYY'), transaction_type
ORDER BY MIN(transaction_date), transaction_type;
