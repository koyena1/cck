# Dealer Monitoring System - Quick Setup Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Dealer Monitoring & Alert System Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install NPM dependencies
Write-Host "[STEP 1/3] Installing NPM packages..." -ForegroundColor Yellow
npm install nodemailer
npm install --save-dev @types/nodemailer

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ NPM packages installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install NPM packages" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check for .env.local file
Write-Host "[STEP 2/3] Checking environment configuration..." -ForegroundColor Yellow

if (-Not (Test-Path ".env.local")) {
    Write-Host "! .env.local file not found. Creating template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# SMTP Email Configuration for Dealer Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com

# Base URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:3000
"@
    
    Set-Content -Path ".env.local" -Value $envTemplate
    Write-Host "✓ Created .env.local template file" -ForegroundColor Green
    Write-Host "! IMPORTANT: Please update .env.local with your SMTP credentials" -ForegroundColor Magenta
} else {
    Write-Host "✓ .env.local file exists" -ForegroundColor Green
    
    # Check if SMTP variables are present
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -notmatch "SMTP_HOST" -or $envContent -notmatch "SMTP_USER") {
        Write-Host "! SMTP configuration not found in .env.local" -ForegroundColor Yellow
        Write-Host "  Please add the following to your .env.local:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "SMTP_HOST=smtp.gmail.com" -ForegroundColor Gray
        Write-Host "SMTP_PORT=587" -ForegroundColor Gray
        Write-Host "SMTP_USER=your-email@gmail.com" -ForegroundColor Gray
        Write-Host "SMTP_PASSWORD=your-app-password" -ForegroundColor Gray
        Write-Host "SMTP_FROM=noreply@yourcompany.com" -ForegroundColor Gray
        Write-Host "NEXT_PUBLIC_BASE_URL=http://localhost:3000" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "✓ SMTP configuration found" -ForegroundColor Green
    }
}

Write-Host ""

# Step 3: Database setup instructions
Write-Host "[STEP 3/3] Database Migration" -ForegroundColor Yellow
Write-Host "Please run the SQL migration file manually:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1 - Using psql:" -ForegroundColor White
Write-Host '  psql -U your_username -d your_database -f add-dealer-monitoring-system.sql' -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2 - Using pgAdmin or Database Client:" -ForegroundColor White
Write-Host "  1. Open add-dealer-monitoring-system.sql" -ForegroundColor Gray
Write-Host "  2. Copy the entire contents" -ForegroundColor Gray
Write-Host "  3. Execute in your database" -ForegroundColor Gray
Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ NPM packages installed" -ForegroundColor Green
Write-Host "! Configure .env.local with SMTP credentials" -ForegroundColor Yellow
Write-Host "! Run database migration (add-dealer-monitoring-system.sql)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env.local with your email SMTP settings" -ForegroundColor White
Write-Host "2. Run the database migration SQL file" -ForegroundColor White
Write-Host "3. Restart the dev server: npm run dev" -ForegroundColor White
Write-Host "4. Test by sending a dealer alert from Admin portal" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: DEALER-MONITORING-SYSTEM-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
