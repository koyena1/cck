# HD Combo Products Database Setup Script
# Run this script in PostgreSQL to create the hd_combo_products table

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "HD Combo Products Database Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL (psql) is not found in PATH" -ForegroundColor Red
    Write-Host "Please install PostgreSQL or add it to your PATH" -ForegroundColor Yellow
    exit 1
}

# Database connection parameters
$DB_HOST = Read-Host "Enter database host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }

$DB_PORT = Read-Host "Enter database port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($DB_PORT)) { $DB_PORT = "5432" }

$DB_NAME = Read-Host "Enter database name (default: cctv_platform)"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "cctv_platform" }

$DB_USER = Read-Host "Enter database user (default: postgres)"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "postgres" }

Write-Host ""
Write-Host "Connecting to database..." -ForegroundColor Yellow
Write-Host "Host: $DB_HOST" -ForegroundColor Gray
Write-Host "Port: $DB_PORT" -ForegroundColor Gray
Write-Host "Database: $DB_NAME" -ForegroundColor Gray
Write-Host "User: $DB_USER" -ForegroundColor Gray
Write-Host ""

# Set environment variable for password prompt
$env:PGPASSWORD = Read-Host "Enter database password" -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD))

# Run the SQL schema file
Write-Host "Creating hd_combo_products table..." -ForegroundColor Yellow

$result = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "schema-hd-combo-products.sql" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully created hd_combo_products table!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Make sure your .env file has the DATABASE_URL configured" -ForegroundColor White
    Write-Host "   Example: DATABASE_URL=postgresql://user:password@localhost:5432/cctv_platform" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Start your Next.js development server:" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Access the admin panel:" -ForegroundColor White
    Write-Host "   http://localhost:3000/admin/categories/hd-combo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Add your first HD Combo product from the admin panel" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to create table" -ForegroundColor Red
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "- Database connection parameters are correct" -ForegroundColor White
    Write-Host "- Database exists and you have permissions" -ForegroundColor White
    Write-Host "- schema-hd-combo-products.sql file exists in current directory" -ForegroundColor White
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = $null

Write-Host "================================================" -ForegroundColor Cyan
