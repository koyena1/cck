# ========================================
# SETUP AUTOMATIC STOCK ALERT SYSTEM
# This script sets up the database schema for automatic stock alerts
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUTOMATIC STOCK ALERT SYSTEM SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    exit 1
}

$DATABASE_URL = $env:DATABASE_URL

if (-not $DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL not found in environment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running SQL migration..." -ForegroundColor Yellow

# Run the SQL migration using psql
$sqlFile = "add-automatic-stock-alert-system.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

# Execute SQL file
try {
    $env:PGPASSWORD = ($DATABASE_URL -split ':' | Select-Object -Last 1) -split '@' | Select-Object -First 1
    $dbInfo = $DATABASE_URL -replace 'postgres://.*@', '' -split '/'
    $dbHost = ($dbInfo[0] -split ':')[0]
    $dbPort = ($dbInfo[0] -split ':')[1]
    $database = $dbInfo[1]
    $username = (($DATABASE_URL -split '://')[1] -split ':')[0]

    Write-Host "Connecting to database: $database@$dbHost" -ForegroundColor Gray
    
    Get-Content $sqlFile | psql -h $dbHost -p $dbPort -U $username -d $database -f - 2>&1 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "SQL migration completed successfully" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "SQL migration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Yellow

# Check if table was created
$checkScript = @"
SELECT COUNT(*) as count 
FROM information_schema.tables 
WHERE table_name = 'dealer_auto_alert_history'
"@

try {
    $result = $checkScript | psql -h $dbHost -p $dbPort -U $username -d $database -t -A 2>&1
    
    if ($result -match '1') {
        Write-Host "Table 'dealer_auto_alert_history' created" -ForegroundColor Green
    } else {
        Write-Host "Table creation verification failed" -ForegroundColor Red
    }
} catch {
    Write-Host "WARNING: Could not verify table creation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the cron job manually:" -ForegroundColor White
Write-Host "   node auto-stock-alert-cron.js" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Schedule automatic execution:" -ForegroundColor White
Write-Host "   .\auto-stock-alert-scheduler.ps1" -ForegroundColor Gray
Write-Host ""
