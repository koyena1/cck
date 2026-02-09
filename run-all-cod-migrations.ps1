# Complete COD System Setup - Run this to set up everything
# This script will:
# 1. Create installation_settings table if it doesn't exist
# 2. Add cod_advance_amount column
# 3. Add cod_percentage column

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "     COD Payment System - Complete Setup                " -ForegroundColor Cyan  
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# Read DATABASE_URL from .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

$databaseUrl = (Get-Content $envFile | Select-String "DATABASE_URL=").ToString().Replace("DATABASE_URL=", "").Trim().Trim('"')

if ([string]::IsNullOrEmpty($databaseUrl)) {
    Write-Host "[ERROR] DATABASE_URL not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Database connection found" -ForegroundColor Green
Write-Host ""

# Create complete migration SQL - save directly to file to avoid PowerShell parsing issues
$tempFile = "temp_migration.sql"

$sqlContent = @'
-- Step 1: Create installation_settings table if it does not exist
CREATE TABLE IF NOT EXISTS installation_settings (
    id SERIAL PRIMARY KEY,
    installation_cost DECIMAL(10, 2) DEFAULT 5000.00,
    amc_options JSONB DEFAULT '{"with_1year": 400, "with_2year": 700, "without_1year": 250, "without_2year": 200}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add cod_advance_amount column if it does not exist
ALTER TABLE installation_settings
ADD COLUMN IF NOT EXISTS cod_advance_amount DECIMAL(10, 2) DEFAULT 200.00;

-- Step 3: Add cod_percentage column if it does not exist  
ALTER TABLE installation_settings
ADD COLUMN IF NOT EXISTS cod_percentage DECIMAL(5, 2) DEFAULT 10.00;

-- Step 4: Insert default record if table is empty
INSERT INTO installation_settings (installation_cost, cod_advance_amount, cod_percentage, amc_options)
SELECT 5000.00, 200.00, 10.00, '{"with_1year": 400, "with_2year": 700, "without_1year": 250, "without_2year": 200}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM installation_settings);

-- Step 5: Update existing records with default COD values if they are NULL
UPDATE installation_settings 
SET cod_advance_amount = 200.00 
WHERE cod_advance_amount IS NULL;

UPDATE installation_settings 
SET cod_percentage = 10.00 
WHERE cod_percentage IS NULL;

-- Step 6: Add helpful comments
COMMENT ON COLUMN installation_settings.cod_advance_amount IS 'Extra COD charges added to order total (default: Rs.200)';
COMMENT ON COLUMN installation_settings.cod_percentage IS 'Percentage of (product amount + extra COD amount) that must be paid in advance for COD orders (default: 10 percent)';

-- Verification query
SELECT 
    installation_cost as "Installation Cost",
    cod_advance_amount as "COD Extra Charges", 
    cod_percentage as "COD Advance Percent",
    amc_options as "AMC Options"
FROM installation_settings
LIMIT 1;
'@

# Save to temporary file
$sqlContent | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "[INFO] Running database migrations..." -ForegroundColor Yellow
Write-Host ""

# Execute migration
try {
    $result = psql $databaseUrl -f $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=========================================================" -ForegroundColor Green
        Write-Host "         MIGRATION SUCCESSFUL!                          " -ForegroundColor Green
        Write-Host "=========================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "[INFO] What was done:" -ForegroundColor Cyan
        Write-Host "  - Created installation_settings table" -ForegroundColor White
        Write-Host "  - Added cod_advance_amount column (default: Rs.200)" -ForegroundColor White
        Write-Host "  - Added cod_percentage column (default: 10 percent)" -ForegroundColor White
        Write-Host "  - Inserted default settings" -ForegroundColor White
        Write-Host ""
        Write-Host "[SUCCESS] Your COD payment system is ready!" -ForegroundColor Green
        Write-Host ""
        Write-Host "[NEXT STEPS]" -ForegroundColor Cyan
        Write-Host "  1. Go to Admin Panel > Pricing (or Installation Settings)" -ForegroundColor White
        Write-Host "  2. Scroll to 'COD Advance Amount' and 'COD Advance Percentage' fields" -ForegroundColor White
        Write-Host "  3. Set your desired values" -ForegroundColor White
        Write-Host "  4. Click 'Save Settings'" -ForegroundColor White
        Write-Host "  5. Test COD payment on Buy Now page" -ForegroundColor White
        Write-Host ""
        Write-Host $result
    } else {
        Write-Host ""
        Write-Host "[ERROR] Migration failed!" -ForegroundColor Red
        Write-Host $result
        Write-Host ""
        Write-Host "[TIP] Try running manually in pgAdmin:" -ForegroundColor Yellow
        Write-Host "   Copy the SQL from temp_migration.sql and execute it" -ForegroundColor Gray
    }
} catch {
    Write-Host ""
    Write-Host "[ERROR] $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "[ALTERNATIVE METHOD]" -ForegroundColor Yellow
    Write-Host "   1. Open pgAdmin" -ForegroundColor Gray
    Write-Host "   2. Open Query Tool" -ForegroundColor Gray
    Write-Host "   3. Copy-paste the SQL from temp_migration.sql" -ForegroundColor Gray
    Write-Host "   4. Execute the query" -ForegroundColor Gray
} finally {
    # Clean up temp file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
