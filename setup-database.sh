#!/bin/bash

# Database Initialization Script for Production
# Run this on the Ubuntu server after PostgreSQL is installed

set -e

echo "================================================"
echo "CCTV Website - Database Setup"
echo "================================================"
echo ""

# Configuration
DB_NAME="cctv_quotation_db"
DB_USER="postgres"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "This script will:"
echo "1. Create the database: $DB_NAME"
echo "2. Import main schema"
echo "3. Import quotation settings schema"
echo "4. Verify tables were created"
echo ""

read -p "Enter PostgreSQL password for user '$DB_USER': " -s DB_PASSWORD
echo ""
echo ""

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "Database '$DB_NAME' already exists."
    read -p "Do you want to drop and recreate it? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
        echo "Dropping existing database..."
        sudo -u postgres psql -c "DROP DATABASE $DB_NAME;"
        echo "Creating database..."
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    else
        echo "Using existing database."
    fi
else
    echo "Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
fi

echo ""
echo "Setting password for user '$DB_USER'..."
sudo -u postgres psql -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"

echo ""
echo "Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo ""
echo "Importing main schema..."
if [ -f "$SCRIPT_DIR/schema.sql" ]; then
    sudo -u postgres psql -d $DB_NAME -f "$SCRIPT_DIR/schema.sql"
    echo "✓ Main schema imported"
else
    echo "⚠ Warning: schema.sql not found in $SCRIPT_DIR"
fi

echo ""
echo "Importing quotation settings schema..."
if [ -f "$SCRIPT_DIR/schema-quotation-settings.sql" ]; then
    sudo -u postgres psql -d $DB_NAME -f "$SCRIPT_DIR/schema-quotation-settings.sql"
    echo "✓ Quotation settings schema imported"
else
    echo "⚠ Warning: schema-quotation-settings.sql not found in $SCRIPT_DIR"
fi

echo ""
echo "Verifying tables..."
sudo -u postgres psql -d $DB_NAME -c "\dt"

echo ""
echo "================================================"
echo "Database setup completed!"
echo "================================================"
echo ""
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo ""
echo "IMPORTANT: Save your database password securely!"
echo "Add it to your .env.local file:"
echo "DB_PASSWORD=$DB_PASSWORD"
echo ""
