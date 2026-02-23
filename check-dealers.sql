-- Query to see all active dealers
SELECT 
    dealer_id, 
    full_name,
    business_name,
    email,
    phone_number,
    location,
    status,
    rating,
    completed_jobs,
    created_at
FROM dealers 
WHERE status = 'Active'
ORDER BY dealer_id;
