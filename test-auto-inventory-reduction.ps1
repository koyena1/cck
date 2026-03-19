# Test Automatic Inventory Reduction Feature
# This script tests that dealer inventory is automatically reduced when a dealer accepts an order

Write-Host "`n🧪 TESTING AUTOMATIC INVENTORY REDUCTION`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Gray

Write-Host "📋 Running test script...`n" -ForegroundColor Yellow

node test-auto-inventory-reduction.js

Write-Host "`n✅ Test execution completed!`n" -ForegroundColor Green
