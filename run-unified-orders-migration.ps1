# ============================================
# Unified Orders Migration Setup Script
# For use with pgAdmin or psql
# ============================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Unified Orders Migration" -ForegroundColor Yellow
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "This script will guide you through running the unified orders migration." -ForegroundColor White
Write-Host "The migration will:" -ForegroundColor White
Write-Host "  1. Add new columns to existing orders table" -ForegroundColor Green
Write-Host "  2. Support both product cart and quotation orders" -ForegroundColor Green
Write-Host "  3. Create convenient views for each order type" -ForegroundColor Green
Write-Host ""

# Database connection details
$defaultHost = "localhost"
$defaultPort = "5432"
$defaultDatabase = "cctv_platform"
$defaultUser = "postgres"

Write-Host "Enter your PostgreSQL connection details:" -ForegroundColor Yellow
Write-Host "(Press Enter to use default values in brackets)`n" -ForegroundColor Gray

$host = Read-Host "Host [$defaultHost]"
if ([string]::IsNullOrWhiteSpace($host)) { $host = $defaultHost }

$port = Read-Host "Port [$defaultPort]"
if ([string]::IsNullOrWhiteSpace($port)) { $port = $defaultPort }

$database = Read-Host "Database [$defaultDatabase]"
if ([string]::IsNullOrWhiteSpace($database)) { $database = $defaultDatabase }

$user = Read-Host "Username [$defaultUser]"
if ([string]::IsNullOrWhiteSpace($user)) { $user = $defaultUser }

$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   Connection Summary" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Host:     $host" -ForegroundColor White
Write-Host "Port:     $port" -ForegroundColor White
Write-Host "Database: $database" -ForegroundColor White
Write-Host "User:     $user" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Proceed with migration? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "`nMigration cancelled." -ForegroundColor Red
    exit
}

# Find psql executable
Write-Host "`nSearching for PostgreSQL installation..." -ForegroundColor Cyan

$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe"
)

$psqlExe = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlExe = $path
        Write-Host "Found PostgreSQL at: $psqlExe" -ForegroundColor Green
        break
    }
}

if (-not $psqlExe) {
    Write-Host "`npsql not found in common locations." -ForegroundColor Red
    Write-Host "You have two options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Use pgAdmin (Recommended)" -ForegroundColor Cyan
    Write-Host "  1. Open pgAdmin" -ForegroundColor White
    Write-Host "  2. Connect to your database: $database" -ForegroundColor White
    Write-Host "  3. Open Query Tool (Tools -> Query Tool)" -ForegroundColor White
    Write-Host "  4. Open the file: unified-orders-migration.sql" -ForegroundColor White
    Write-Host "  5. Click Execute (F5)" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Manually provide psql path" -ForegroundColor Cyan
    $manualPath = Read-Host "Enter full path to psql.exe (or press Enter to use pgAdmin)"
    
    if ([string]::IsNullOrWhiteSpace($manualPath)) {
        Write-Host "`nPlease use pgAdmin to run: unified-orders-migration.sql" -ForegroundColor Yellow
        Write-Host "Press any key to open the migration file location..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        explorer.exe (Split-Path -Parent $PSCommandPath)
        exit
    }
    
    $psqlExe = $manualPath
}

# Set environment variable for password
$env:PGPASSWORD = $passwordPlain

# Run migration
Write-Host "`nRunning migration..." -ForegroundColor Cyan
$sqlFile = Join-Path (Split-Path -Parent $PSCommandPath) "unified-orders-migration.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "Error: Migration file not found at $sqlFile" -ForegroundColor Red
    exit
}

try {
    & $psqlExe -h $host -p $port -U $user -d $database -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n============================================" -ForegroundColor Green
        Write-Host "   Migration Completed Successfully!" -ForegroundColor Yellow
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your orders table now supports:" -ForegroundColor White
        Write-Host "  ✓ Product cart orders (order_type='product_cart')" -ForegroundColor Green
        Write-Host "  ✓ HD combo/quotation orders (existing types)" -ForegroundColor Green
        Write-Host "  ✓ Unified admin view for all orders" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "  1. Test creating an order from your cart" -ForegroundColor White
        Write-Host "  2. Check admin panel to see both order types" -ForegroundColor White
        Write-Host "  3. Verify order details display correctly" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "`nMigration failed. Check the error messages above." -ForegroundColor Red
    }
} catch {
    Write-Host "`nError running migration: $_" -ForegroundColor Red
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
