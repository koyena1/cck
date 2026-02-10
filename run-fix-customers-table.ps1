# PowerShell script to fix customers table (add missing columns)
# Fixes the "column address does not exist" error

Write-Host "🔧 Fixing Customers Table..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your database credentials." -ForegroundColor Yellow
    exit 1
}

# Run the Node.js script
Write-Host "Running fix script..." -ForegroundColor Yellow
node fix-customers-table.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Fix completed successfully!" -ForegroundColor Green
    Write-Host "You can now test customer registration again." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Fix failed. Please check the error messages above." -ForegroundColor Red
}
