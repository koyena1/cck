# ============================================
# Referral System - Database Verification Script
# Run this AFTER executing add-referral-system.sql
# ============================================

Write-Host "`n🔍 CHECKING REFERRAL SYSTEM DATABASE SETUP..." -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Database connection parameters - MODIFY THESE
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "your_database_name"  # ⚠️ CHANGE THIS
$DB_USER = "your_username"        # ⚠️ CHANGE THIS

Write-Host "📋 Database: $DB_NAME" -ForegroundColor Yellow
Write-Host "👤 User: $DB_USER`n" -ForegroundColor Yellow

# Set PostgreSQL password environment variable
Write-Host "⚠️  You will be prompted for your PostgreSQL password" -ForegroundColor Yellow
Write-Host ""

# SQL query to check all tables and columns
$checkQuery = @"
-- Check customers table columns
SELECT 'customers_columns' as check_type,
       COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'customers'
  AND column_name IN ('referral_id', 'reward_points', 'first_order_completed', 'mystery_box_claimed')

UNION ALL

-- Check referral_transactions table
SELECT 'referral_transactions_table' as check_type,
       COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'referral_transactions'

UNION ALL

-- Check reward_transactions table
SELECT 'reward_transactions_table' as check_type,
       COUNT(*) as count
FROM information_schema.tables
WHERE table_name = 'reward_transactions'

UNION ALL

-- Check orders table columns
SELECT 'orders_columns' as check_type,
       COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('referral_code_used', 'referral_discount', 'points_redeemed', 'is_first_order')

UNION ALL

-- Check triggers
SELECT 'triggers' as check_type,
       COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_referral_id'

UNION ALL

-- Check functions
SELECT 'functions' as check_type,
       COUNT(*) as count
FROM information_schema.routines
WHERE routine_name = 'generate_referral_id';
"@

# Save query to temp file
$tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
$checkQuery | Out-File -FilePath $tempFile -Encoding UTF8

try {
    # Execute query
    Write-Host "🔄 Running verification checks...`n" -ForegroundColor Cyan
    
    $result = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $tempFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CONNECTED TO DATABASE SUCCESSFULLY`n" -ForegroundColor Green
        Write-Host $result
        
        # Parse results
        Write-Host "`n📊 VERIFICATION RESULTS:" -ForegroundColor Cyan
        Write-Host "========================`n" -ForegroundColor Cyan
        
        if ($result -match "customers_columns.*4") {
            Write-Host "✅ Customers table: All 4 new columns added" -ForegroundColor Green
        } else {
            Write-Host "❌ Customers table: Missing columns" -ForegroundColor Red
        }
        
        if ($result -match "referral_transactions_table.*1") {
            Write-Host "✅ Referral Transactions table: Created" -ForegroundColor Green
        } else {
            Write-Host "❌ Referral Transactions table: NOT FOUND" -ForegroundColor Red
        }
        
        if ($result -match "reward_transactions_table.*1") {
            Write-Host "✅ Reward Transactions table: Created" -ForegroundColor Green
        } else {
            Write-Host "❌ Reward Transactions table: NOT FOUND" -ForegroundColor Red
        }
        
        if ($result -match "orders_columns.*4") {
            Write-Host "✅ Orders table: All 4 new columns added" -ForegroundColor Green
        } else {
            Write-Host "❌ Orders table: Missing columns" -ForegroundColor Red
        }
        
        if ($result -match "triggers.*1") {
            Write-Host "✅ Trigger: Auto-generate referral ID trigger created" -ForegroundColor Green
        } else {
            Write-Host "❌ Trigger: NOT FOUND" -ForegroundColor Red
        }
        
        if ($result -match "functions.*1") {
            Write-Host "✅ Function: generate_referral_id() function created" -ForegroundColor Green
        } else {
            Write-Host "❌ Function: NOT FOUND" -ForegroundColor Red
        }
        
        # Additional checks
        Write-Host "`n🔍 ADDITIONAL CHECKS:" -ForegroundColor Cyan
        Write-Host "=====================`n" -ForegroundColor Cyan
        
        # Check if customers have referral IDs
        $customerCheckQuery = "SELECT COUNT(*) FROM customers WHERE referral_id IS NOT NULL;"
        $customerCount = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c $customerCheckQuery 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $count = $customerCount.Trim()
            Write-Host "✅ Customers with referral IDs: $count" -ForegroundColor Green
            if ([int]$count -eq 0) {
                Write-Host "   ℹ️  No customers yet (this is normal for new setup)" -ForegroundColor Yellow
            }
        }
        
        Write-Host "`n🎉 DATABASE SETUP VERIFICATION COMPLETE!" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Green
        
    } else {
        Write-Host "❌ FAILED TO CONNECT TO DATABASE" -ForegroundColor Red
        Write-Host "Error: $result" -ForegroundColor Red
        Write-Host "`nPlease check:" -ForegroundColor Yellow
        Write-Host "  1. Database name is correct" -ForegroundColor Yellow
        Write-Host "  2. Username is correct" -ForegroundColor Yellow
        Write-Host "  3. PostgreSQL is running" -ForegroundColor Yellow
        Write-Host "  4. Password is correct`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nMake sure psql is installed and in your PATH" -ForegroundColor Yellow
} finally {
    # Clean up temp file
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}

Write-Host "`n📝 Next Steps:" -ForegroundColor Cyan
Write-Host "=============`n" -ForegroundColor Cyan
Write-Host "1. If all checks passed (✅), your system is ready!" -ForegroundColor White
Write-Host "2. Test by registering a new user" -ForegroundColor White
Write-Host "3. Check /customer/dashboard to see referral code" -ForegroundColor White
Write-Host "4. Refer to REFERRAL-SYSTEM-QUICK-SETUP.md for testing guide`n" -ForegroundColor White

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
