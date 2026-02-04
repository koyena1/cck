// Production Database Setup Script for CCTV Website
// Run this on your production server: node setup-production-database.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && value) process.env[key] = value;
    }
  });
}

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

console.log('\n========================================');
console.log('CCTV Website - Production DB Setup');
console.log('========================================\n');

console.log('Database Configuration:');
console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`  Port: ${process.env.DB_PORT || '5432'}`);
console.log(`  Database: ${process.env.DB_NAME}`);
console.log(`  User: ${process.env.DB_USER}\n`);

// SQL files to execute in order
const sqlFiles = [
  { file: 'schema.sql', description: 'Core Schema (admins, dealers, orders)' },
  { file: 'schema-all-categories.sql', description: 'All Product Categories (8 tables)' },
  { file: 'schema-hd-combo-products.sql', description: 'HD Combo Products' },
  { file: 'schema-camera-pricing.sql', description: 'Camera Pricing' },
  { file: 'schema-enhanced-pricing.sql', description: 'Enhanced Pricing' },
  { file: 'schema-quotation-settings.sql', description: 'Quotation Settings' },
  { file: 'update-base-pricing-columns.sql', description: 'Base Pricing Columns' },
  { file: 'add-channel-pricing.sql', description: 'Channel Pricing' },
  { file: 'add-complete-pricing-structure.sql', description: 'Complete Pricing' },
  { file: 'add-dynamic-brand-pricing.sql', description: 'Dynamic Brand Pricing' },
  { file: 'add-auto-brand-pricing-triggers.sql', description: 'Auto Pricing Triggers' },
  { file: 'insert-channels.sql', description: 'Insert Channel Options' },
];

async function executeSQLFile(filePath, description) {
  console.log(`Running: ${description}`);
  console.log(`  File: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log('  [SKIP] File not found\n');
    return true;
  }
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log('  [SUCCESS] ✓\n');
    return true;
  } catch (error) {
    console.log('  [ERROR] ✗');
    console.error(`  ${error.message}`);
    if (error.code) console.error(`  Code: ${error.code}`);
    if (error.detail) console.error(`  Detail: ${error.detail}`);
    console.log('');
    return false;
  }
}

async function setupDatabase() {
  console.log('========================================');
  console.log('Starting Database Setup...');
  console.log('========================================\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const { file, description } of sqlFiles) {
    const filePath = path.join(__dirname, file);
    const success = await executeSQLFile(filePath, description);
    if (success) successCount++;
    else failCount++;
  }
  
  console.log('========================================');
  console.log('Database Setup Complete!');
  console.log('========================================\n');
  
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failCount}\n`);
  
  // Verify critical tables
  console.log('Verifying critical tables...\n');
  
  const criticalTables = [
    'solar_camera_products',
    'ip_combo_products',
    'hd_combo_products',
    'wifi_camera_products',
    'sim_4g_camera_products',
    'body_worn_camera_products',
    'hd_camera_products',
    'ip_camera_products'
  ];
  
  let allTablesExist = true;
  
  for (const table of criticalTables) {
    try {
      const result = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)`,
        [table]
      );
      
      if (result.rows[0].exists) {
        console.log(`  ✓ ${table} exists`);
      } else {
        console.log(`  ✗ ${table} MISSING`);
        allTablesExist = false;
      }
    } catch (error) {
      console.log(`  ✗ ${table} ERROR: ${error.message}`);
      allTablesExist = false;
    }
  }
  
  console.log('');
  
  // List all tables
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Total tables in database: ${result.rows.length}\n`);
  } catch (error) {
    console.error('Error listing tables:', error.message);
  }
  
  if (allTablesExist) {
    console.log('✓ All critical tables exist!');
    console.log('\nYou can now deploy your application.\n');
  } else {
    console.log('✗ Some tables are missing!');
    console.log('\nPlease check the errors above and fix them.\n');
  }
  
  await pool.end();
}

setupDatabase().catch(error => {
  console.error('Fatal error:', error);
  pool.end();
  process.exit(1);
});
