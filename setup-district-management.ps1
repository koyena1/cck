# District Management System Setup Script
# Run this to set up the complete district management portal

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  District Management System Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if bcrypt is installed
Write-Host "[1/4] Checking dependencies..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json

if ($packageJson.dependencies.PSObject.Properties.Name -notcontains "bcrypt") {
    Write-Host "  -> bcrypt not found. Installing..." -ForegroundColor Yellow
    npm install bcrypt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK bcrypt installed successfully" -ForegroundColor Green
    } else {
        Write-Host "  ERROR Failed to install bcrypt" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  OK bcrypt already installed" -ForegroundColor Green
}

Write-Host ""

# Step 2: Run database migration
Write-Host "[2/4] Running database migration..." -ForegroundColor Yellow
node run-district-management-setup.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Database migration completed" -ForegroundColor Green
} else {
    Write-Host "  ERROR Migration failed. Check your database connection." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Display access URLs
Write-Host "[3/4] Access URLs:" -ForegroundColor Yellow
Write-Host "  -> Admin Portal: http://localhost:3000/admin/district-management" -ForegroundColor Cyan
Write-Host "  -> District Portal: http://localhost:3000/district-portal/login" -ForegroundColor Cyan

Write-Host ""

# Step 4: Next steps
Write-Host "[4/4] Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update dealers with district information" -ForegroundColor White
Write-Host "     Run in pgAdmin:" -ForegroundColor Gray
Write-Host "     UPDATE dealers SET district = 'YourDistrict', state = 'YourState' WHERE dealer_id = X;" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Create district users via admin panel" -ForegroundColor White
Write-Host "     Go to admin/district-management" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test login with created credentials" -ForegroundColor White
Write-Host "     Go to district-portal/login" -ForegroundColor Gray

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run npm run dev to start the development server" -ForegroundColor Yellow
Write-Host ""
