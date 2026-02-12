# Setup Guest Checkout System
# PowerShell Script for Windows

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Guest Checkout System Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    if (Test-Path ".env.local") {
        $envFile = ".env.local"
    } else {
        Write-Host "❌ No .env or .env.local file found!" -ForegroundColor Red
        Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        $envFile = ".env"
    }
} else {
    $envFile = ".env"
}

Write-Host "✓ Using environment file: $envFile" -ForegroundColor Green
Write-Host ""

# Step 1: Database Migration
Write-Host "Step 1: Database Migration" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host ""

# Load database credentials
$content = Get-Content $envFile
$dbUser = ($content | Select-String "DB_USER=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
$dbName = ($content | Select-String "DB_NAME=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
$dbHost = ($content | Select-String "DB_HOST=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })
$dbPort = ($content | Select-String "DB_PORT=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value })

if (-Not $dbUser) { $dbUser = "postgres" }
if (-Not $dbName) { $dbName = "cctv_platform" }
if (-Not $dbHost) { $dbHost = "localhost" }
if (-Not $dbPort) { $dbPort = "5432" }

Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Host: $dbHost" -ForegroundColor Gray
Write-Host "  Port: $dbPort" -ForegroundColor Gray
Write-Host "  User: $dbUser" -ForegroundColor Gray
Write-Host "  Database: $dbName" -ForegroundColor Gray
Write-Host ""

$runMigration = Read-Host "Run database migration? (Y/N)"

if ($runMigration -eq "Y" -or $runMigration -eq "y") {
    Write-Host "Running migration..." -ForegroundColor Yellow
    
    # Check if psql is available
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue
    
    if ($psqlPath) {
        # Run migration using psql
        $env:PGPASSWORD = Read-Host "Enter database password for $dbUser" -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($env:PGPASSWORD)
        $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        $env:PGPASSWORD = $plainPassword
        
        psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "add-guest-checkout-system.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Database migration failed!" -ForegroundColor Red
            Write-Host "Please run the migration manually using pgAdmin or psql" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  psql command not found!" -ForegroundColor Yellow
        Write-Host "Please run the migration manually:" -ForegroundColor Yellow
        Write-Host "  1. Open pgAdmin" -ForegroundColor Gray
        Write-Host "  2. Open Query Tool for your database" -ForegroundColor Gray
        Write-Host "  3. Open file: add-guest-checkout-system.sql" -ForegroundColor Gray
        Write-Host "  4. Execute the query" -ForegroundColor Gray
    }
} else {
    Write-Host "⏭️  Skipping database migration" -ForegroundColor Yellow
    Write-Host "Remember to run it manually later!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Install Dependencies" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host ""

$installDeps = Read-Host "Install email dependencies (nodemailer)? (Y/N)"

if ($installDeps -eq "Y" -or $installDeps -eq "y") {
    Write-Host "Installing nodemailer..." -ForegroundColor Yellow
    npm install nodemailer
    npm install --save-dev @types/nodemailer
    Write-Host "✓ Dependencies installed!" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping dependency installation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Configure Email Settings" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Yellow
Write-Host ""

$configureEmail = Read-Host "Configure email settings now? (Y/N)"

if ($configureEmail -eq "Y" -or $configureEmail -eq "y") {
    Write-Host ""
    Write-Host "Email Configuration:" -ForegroundColor Cyan
    
    # Check current settings
    $currentContent = Get-Content $envFile -Raw
    
    if ($currentContent -match "EMAIL_DEV_MODE=") {
        Write-Host "✓ Email settings already exist in $envFile" -ForegroundColor Green
        Write-Host "Current EMAIL_DEV_MODE: " -NoNewline -ForegroundColor Gray
        if ($currentContent -match "EMAIL_DEV_MODE=true") {
            Write-Host "true (Development Mode - emails logged to console)" -ForegroundColor Yellow
        } else {
            Write-Host "false (Production Mode - emails sent via SMTP)" -ForegroundColor Green
        }
    } else {
        Write-Host "Adding email configuration to $envFile..." -ForegroundColor Yellow
        
        $emailConfig = @"

# Email Configuration (Guest Checkout)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
EMAIL_DEV_MODE=true
NEXT_PUBLIC_COMPANY_NAME=CCTV Store
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
"@
        
        Add-Content -Path $envFile -Value $emailConfig
        Write-Host "✓ Email configuration added to $envFile" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📧 Email Setup Instructions:" -ForegroundColor Cyan
    Write-Host "  1. Open $envFile" -ForegroundColor Gray
    Write-Host "  2. Update SMTP_USER with your Gmail address" -ForegroundColor Gray
    Write-Host "  3. Generate Gmail App Password:" -ForegroundColor Gray
    Write-Host "     - Go to Google Account Settings" -ForegroundColor DarkGray
    Write-Host "     - Enable 2-Factor Authentication" -ForegroundColor DarkGray
    Write-Host "     - Security → App Passwords" -ForegroundColor DarkGray
    Write-Host "     - Generate password for 'Mail'" -ForegroundColor DarkGray
    Write-Host "  4. Update SMTP_PASS with generated password" -ForegroundColor Gray
    Write-Host "  5. Set EMAIL_DEV_MODE=false for production" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping email configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify database migration was successful" -ForegroundColor Gray
Write-Host "  2. Configure email settings in $envFile" -ForegroundColor Gray
Write-Host "  3. Restart your Next.js development server" -ForegroundColor Gray
Write-Host "  4. Test guest checkout at /buy-now" -ForegroundColor Gray
Write-Host "  5. Test order tracking at /guest-track-order" -ForegroundColor Gray
Write-Host "  6. Check admin panel at /admin/orders" -ForegroundColor Gray
Write-Host ""

Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "  Read GUEST-CHECKOUT-SYSTEM-GUIDE.md for complete details" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Start Development Server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
