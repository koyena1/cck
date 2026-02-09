# Run COD Percentage Migration
# This script adds the cod_percentage column to the installation_settings table

Write-Host "🚀 Starting COD Percentage Migration..." -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set DATABASE_URL first:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL="postgresql://username:password@host:port/database"' -ForegroundColor Gray
    exit 1
}

Write-Host "📝 Database URL found" -ForegroundColor Green
Write-Host "📂 Running migration script: add-cod-percentage-column.sql" -ForegroundColor Yellow
Write-Host ""

# Run the SQL migration
try {
    $result = psql $env:DATABASE_URL -f "add-cod-percentage-column.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Migration Summary:" -ForegroundColor Cyan
        Write-Host "  - Added cod_percentage column to installation_settings table" -ForegroundColor White
        Write-Host "  - Default value set to 10.00" -ForegroundColor White
        Write-Host "  - Updated existing records with default value" -ForegroundColor White
        Write-Host ""
        Write-Host $result
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 COD Percentage system is now ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Go to Admin -> Installation Settings" -ForegroundColor White
Write-Host "  2. Configure the Extra COD Amount and COD Percentage" -ForegroundColor White
Write-Host "  3. Test the COD flow on the Buy Now page" -ForegroundColor White
Write-Host ""
