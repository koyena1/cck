# Dealer Pricing System - Complete Setup Script
# This script sets up the entire dealer pricing system

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEALER PRICING SYSTEM SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup Database
Write-Host "Step 1: Setting up database tables..." -ForegroundColor Yellow
node setup-dealer-pricing-db.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Database setup failed!" -ForegroundColor Red
    Write-Host "Please check your database connection and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Generate Excel Template
Write-Host "Step 2: Generating sample Excel template..." -ForegroundColor Yellow
node generate-dealer-pricing-template.js

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Template generation failed!" -ForegroundColor Red
    Write-Host "Please check if the xlsx package is installed." -ForegroundColor Red
    Write-Host "Run: npm install xlsx" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Success Summary
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "What was done:" -ForegroundColor Cyan
Write-Host "   - Created dealer_products table" -ForegroundColor Green
Write-Host "   - Created dealer_product_price_history table" -ForegroundColor Green
Write-Host "   - Created dealer_transactions table" -ForegroundColor Green
Write-Host "   - Created dealer_transaction_items table" -ForegroundColor Green
Write-Host "   - Created dealer_pricing_upload_log table" -ForegroundColor Green
Write-Host "   - Generated sample Excel template" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "ADMIN PANEL:" -ForegroundColor Yellow
Write-Host "   1. Navigate to: Admin Panel -> Dealers (dropdown) -> Product Pricing"
Write-Host "   2. Click Download Sample Template button"
Write-Host "   3. Fill the Excel with your product pricing"
Write-Host "   4. Upload the Excel file"
Write-Host ""
Write-Host "   Or adjust prices using percentage changes:" -ForegroundColor Gray
Write-Host "   - Filter by Segment/Company/Product Type" -ForegroundColor Gray
Write-Host "   - Enter percentage (positive to increase, negative to decrease)" -ForegroundColor Gray
Write-Host "   - Click Apply" -ForegroundColor Gray
Write-Host ""
Write-Host "   View all dealer invoices at:" -ForegroundColor Gray
Write-Host "   - Admin Panel -> Dealers (dropdown) -> Dealer Invoices" -ForegroundColor Gray
Write-Host ""

Write-Host "DEALER PORTAL:" -ForegroundColor Yellow
Write-Host "   1. Navigate to: Dealer Portal -> Pricing"
Write-Host "   2. View your statistics (Purchase / Sale / Profit)"
Write-Host "   3. Use Buy Products tab to purchase at dealer price"
Write-Host "   4. Use Sale Products tab to sell at dealer price"
Write-Host "   5. Generate and download invoices"
Write-Host ""

Write-Host "For detailed documentation see:" -ForegroundColor Cyan
Write-Host "   DEALER-PRICING-SYSTEM-GUIDE.md"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Your Dealer Pricing System is ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
