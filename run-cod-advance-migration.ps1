# Run COD Advance Column Migration
# This script adds the cod_advance_amount column to the installation_settings table

Write-Host "🔧 Running COD Advance Amount Migration..." -ForegroundColor Cyan

# Read DATABASE_URL from .env.local
$envFile = Get-Content .env.local
$databaseUrl = ($envFile | Select-String "DATABASE_URL=").ToString().Replace("DATABASE_URL=", "").Trim()

if ([string]::IsNullOrEmpty($databaseUrl)) {
    Write-Host "❌ DATABASE_URL not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database URL found" -ForegroundColor Green

# Run the SQL migration
Write-Host "📝 Executing SQL migration..." -ForegroundColor Yellow

# Run psql command
$result = psql $databaseUrl -f add-cod-advance-column.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Summary:" -ForegroundColor Cyan
    Write-Host "  - Added 'cod_advance_amount' column to installation_settings table" -ForegroundColor White
    Write-Host "  - Default value set to ₹200" -ForegroundColor White
    Write-Host "  - Admins can now configure COD advance amount from admin portal" -ForegroundColor White
} else {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Run the SQL manually using pgAdmin or psql:" -ForegroundColor Yellow
    Write-Host "   psql `"$databaseUrl`" -f add-cod-advance-column.sql" -ForegroundColor Gray
}
