# PowerShell script to run OTP table migration

Write-Host "Starting OTP Verification Table Migration..." -ForegroundColor Cyan

# Database connection details (update these with your actual credentials)
$env:PGPASSWORD = "Koyen@123"  # Your PostgreSQL password
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "cctv_platform"
$dbUser = "postgres"

# SQL file path
$sqlFile = "create-customer-otp-table.sql"

# Check if SQL file exists
if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

Write-Host "Running OTP table migration from: $sqlFile" -ForegroundColor Yellow

try {
    # Run the SQL file using psql
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ OTP verification table created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Migration completed. You can now test OTP verification." -ForegroundColor Green
    } else {
        Write-Host "✗ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Error running migration: $_" -ForegroundColor Red
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = $null
