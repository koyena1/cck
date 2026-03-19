# Setup Google Maps Location Picker
# This script applies the database migration for dealer location tracking

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Maps Location Picker Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is accessible
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Write-Host "Loading database configuration from $envFile" -ForegroundColor Green
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "Warning: .env.local not found. Using default values." -ForegroundColor Yellow
}

# Get database credentials
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "cctv_platform" }
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }

Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Host: $DB_HOST" -ForegroundColor White
Write-Host "  Port: $DB_PORT" -ForegroundColor White
Write-Host "  Database: $DB_NAME" -ForegroundColor White
Write-Host "  User: $DB_USER" -ForegroundColor White
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Apply database migration? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit
}

# Apply the migration
Write-Host ""
Write-Host "Applying migration: add-dealer-location-columns.sql" -ForegroundColor Yellow

$migrationFile = "add-dealer-location-columns.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

# Construct psql command
$env:PGPASSWORD = $env:DB_PASSWORD
$psqlCommand = "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationFile"

try {
    Invoke-Expression $psqlCommand
    Write-Host ""
    Write-Host "Migration applied successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "Migration failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Get a Google Maps API Key:" -ForegroundColor Yellow
Write-Host "   - Visit: https://console.cloud.google.com/google/maps-apis" -ForegroundColor White
Write-Host "   - Enable: Maps JavaScript API, Places API, Geocoding API" -ForegroundColor White
Write-Host ""
Write-Host "2. Add API key to .env.local:" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here" -ForegroundColor White
Write-Host ""
Write-Host "3. Restart your development server:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "4. Test the feature:" -ForegroundColor Yellow
Write-Host "   - Login to dealer portal" -ForegroundColor White
Write-Host "   - Navigate to Profile page" -ForegroundColor White
Write-Host "   - Click Edit Profile" -ForegroundColor White
Write-Host "   - Use the map to select location" -ForegroundColor White
Write-Host ""
Write-Host "For detailed documentation, see:" -ForegroundColor Yellow
Write-Host "   GOOGLE-MAPS-LOCATION-PICKER-GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
