# Setup Orders Database Table

Write-Host "Setting up Orders database table..." -ForegroundColor Green

# Database connection details
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "cctv_website"
$DB_USER = "postgres"

Write-Host "Enter PostgreSQL password:" -ForegroundColor Yellow
$DB_PASSWORD = Read-Host -AsSecureString
$DB_PASSWORD_Plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

# Find psql executable
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "Found PostgreSQL at: $path" -ForegroundColor Cyan
        break
    }
}

if (-not $psqlPath) {
    Write-Host "`npsql not found in common locations." -ForegroundColor Yellow
    Write-Host "Please run the SQL manually:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin or your PostgreSQL client" -ForegroundColor White
    Write-Host "2. Connect to database: $DB_NAME" -ForegroundColor White
    Write-Host "3. Execute the file: schema-orders.sql" -ForegroundColor White
    Write-Host "`nOr specify the full path to psql.exe:" -ForegroundColor Yellow
    $customPath = Read-Host "Enter psql.exe path (or press Enter to exit)"
    if ($customPath -and (Test-Path $customPath)) {
        $psqlPath = $customPath
    } else {
        exit 1
    }
}

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD_Plain

try {
    Write-Host "`nExecuting schema-orders.sql..." -ForegroundColor Cyan
    
    # Execute the SQL file
    & $psqlPath -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "schema-orders.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nOrders table created successfully!" -ForegroundColor Green
        Write-Host "✓ Table: orders" -ForegroundColor Green
        Write-Host "✓ Indexes created" -ForegroundColor Green
    } else {
        Write-Host "`nError creating orders table!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = ""
}

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host "You can now use the orders management system." -ForegroundColor Cyan
