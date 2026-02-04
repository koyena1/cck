# Check if order_tracking_otps table exists
$env:PGPASSWORD = "1234"
$dbCheck = @"
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'order_tracking_otps'
) as table_exists;

-- Check table structure if exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'order_tracking_otps'
ORDER BY ordinal_position;

-- Check if there are any orders with phone number 6294880595
SELECT COUNT(*) as order_count, customer_phone 
FROM orders 
WHERE customer_phone = '6294880595'
GROUP BY customer_phone;
"@

Write-Host "Checking database setup..." -ForegroundColor Cyan
$dbCheck | & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d cctv_platform -f -

Write-Host "`nIf table doesn't exist, run:" -ForegroundColor Yellow
Write-Host "psql -U postgres -d cctv_platform -f update-otp-table.sql" -ForegroundColor Cyan
