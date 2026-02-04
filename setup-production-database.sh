#!/bin/bash
# Production Database Setup Script for CCTV Website
# Run this on your production server: bash setup-production-database.sh

echo "========================================"
echo "CCTV Website - Production DB Setup"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "ERROR: .env.local file not found!"
    echo "Please create .env.local with your database credentials"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

echo "Database Configuration:"
echo "  Host: ${DB_HOST:-localhost}"
echo "  Port: ${DB_PORT:-5432}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql command not found!"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "Found psql: $(which psql)"
echo ""

# Function to execute SQL file
execute_sql_file() {
    local FILE=$1
    local DESCRIPTION=$2
    
    echo "Running: $DESCRIPTION"
    echo "  File: $FILE"
    
    if [ ! -f "$FILE" ]; then
        echo "  [SKIP] File not found"
        echo ""
        return 0
    fi
    
    PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME -f $FILE 2>&1
    
    if [ $? -eq 0 ]; then
        echo "  [SUCCESS] ✓"
    else
        echo "  [ERROR] Failed to execute $FILE"
        return 1
    fi
    echo ""
}

echo "========================================"
echo "Starting Database Setup..."
echo "========================================"
echo ""

# Execute all schema files in order
execute_sql_file "schema.sql" "Core Schema (admins, dealers, orders)"
execute_sql_file "schema-all-categories.sql" "All Product Categories (8 tables)"
execute_sql_file "schema-hd-combo-products.sql" "HD Combo Products"
execute_sql_file "schema-camera-pricing.sql" "Camera Pricing"
execute_sql_file "schema-enhanced-pricing.sql" "Enhanced Pricing"
execute_sql_file "schema-quotation-settings.sql" "Quotation Settings"
execute_sql_file "update-base-pricing-columns.sql" "Base Pricing Columns"
execute_sql_file "add-channel-pricing.sql" "Channel Pricing"
execute_sql_file "add-complete-pricing-structure.sql" "Complete Pricing"
execute_sql_file "add-dynamic-brand-pricing.sql" "Dynamic Brand Pricing"
execute_sql_file "add-auto-brand-pricing-triggers.sql" "Auto Pricing Triggers"
execute_sql_file "insert-channels.sql" "Insert Channel Options"

echo "========================================"
echo "Database Setup Complete!"
echo "========================================"
echo ""

# Verify tables
echo "Verifying tables..."
PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME -c "\dt" 

echo ""
echo "Checking critical tables:"
for table in "solar_camera_products" "ip_combo_products" "hd_combo_products" "wifi_camera_products"; do
    COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table'")
    if [ "$COUNT" = "1" ]; then
        echo "  ✓ $table exists"
    else
        echo "  ✗ $table MISSING"
    fi
done

echo ""
echo "Setup complete! Test your application now."
