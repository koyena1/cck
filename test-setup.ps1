# Quick Test Script for HD Combo Admin System
# This script helps you quickly test if everything is working

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  HD Combo Admin System - Quick Test               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if database schema file exists
Write-Host "Test 1: Checking database schema file..." -ForegroundColor Yellow
if (Test-Path "schema-hd-combo-products.sql") {
    Write-Host "  ✓ schema-hd-combo-products.sql found" -ForegroundColor Green
} else {
    Write-Host "  ✗ schema-hd-combo-products.sql NOT found" -ForegroundColor Red
    exit 1
}

# Test 2: Check if API route exists
Write-Host "Test 2: Checking API route file..." -ForegroundColor Yellow
if (Test-Path "app\api\hd-combo-products\route.ts") {
    Write-Host "  ✓ API route file found" -ForegroundColor Green
} else {
    Write-Host "  ✗ API route file NOT found" -ForegroundColor Red
    exit 1
}

# Test 3: Check if admin page exists
Write-Host "Test 3: Checking admin page..." -ForegroundColor Yellow
if (Test-Path "app\admin\categories\hd-combo\page.tsx") {
    Write-Host "  ✓ Admin page found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Admin page NOT found" -ForegroundColor Red
    exit 1
}

# Test 4: Check if frontend page exists
Write-Host "Test 4: Checking frontend page..." -ForegroundColor Yellow
if (Test-Path "app\categories\hd-combo\page.tsx") {
    Write-Host "  ✓ Frontend page found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Frontend page NOT found" -ForegroundColor Red
    exit 1
}

# Test 5: Check if .env file exists
Write-Host "Test 5: Checking environment file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "  ✓ .env file found" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "  ✓ DATABASE_URL found in .env" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ DATABASE_URL not found in .env" -ForegroundColor Yellow
        Write-Host "    Please add: DATABASE_URL=postgresql://user:password@localhost:5432/cctv_platform" -ForegroundColor Gray
    }
} elseif (Test-Path ".env.local") {
    Write-Host "  ✓ .env.local file found" -ForegroundColor Green
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "DATABASE_URL") {
        Write-Host "  ✓ DATABASE_URL found in .env.local" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ DATABASE_URL not found in .env.local" -ForegroundColor Yellow
        Write-Host "    Please add: DATABASE_URL=postgresql://user:password@localhost:5432/cctv_platform" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠ No .env or .env.local file found" -ForegroundColor Yellow
    Write-Host "    Please create .env file with DATABASE_URL" -ForegroundColor Gray
}

# Test 6: Check if node_modules exists
Write-Host "Test 6: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  ✓ node_modules found" -ForegroundColor Green
} else {
    Write-Host "  ⚠ node_modules not found" -ForegroundColor Yellow
    Write-Host "    Run: npm install" -ForegroundColor Gray
}

# Test 7: Check if PostgreSQL is accessible
Write-Host "Test 7: Checking PostgreSQL..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "  ✓ PostgreSQL (psql) found in PATH" -ForegroundColor Green
} else {
    Write-Host "  ⚠ PostgreSQL (psql) not found in PATH" -ForegroundColor Yellow
    Write-Host "    Make sure PostgreSQL is installed" -ForegroundColor Gray
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Test Summary                                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "All critical files are in place! ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "1. Setup Database (if not done yet):" -ForegroundColor White
Write-Host "   .\setup-hd-combo-db.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Install Dependencies (if needed):" -ForegroundColor White
Write-Host "   npm install" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start Development Server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Access Admin Panel:" -ForegroundColor White
Write-Host "   http://localhost:3000/admin/login" -ForegroundColor Gray
Write-Host "   Then: Categories → HD Combo" -ForegroundColor Gray
Write-Host ""
Write-Host "5. View Frontend:" -ForegroundColor White
Write-Host "   http://localhost:3000/categories/hd-combo" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For detailed documentation, see:" -ForegroundColor Cyan
Write-Host "   - HD-COMBO-ADMIN-GUIDE.md (Complete guide)" -ForegroundColor Gray
Write-Host "   - IMPLEMENTATION-SUMMARY.md (Quick overview)" -ForegroundColor Gray
Write-Host ""
Write-Host "Good luck! 🚀" -ForegroundColor Green
Write-Host ""
