$env:PGPASSWORD='Koyen@123'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d cctv_platform -f schema-camera-pricing.sql
Write-Host "Camera pricing table created successfully!" -ForegroundColor Green
