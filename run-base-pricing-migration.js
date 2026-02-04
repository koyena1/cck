// Run Base Pricing Migration Script
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected!\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'update-base-pricing-columns.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running SQL migration...\n');
    
    // Split by semicolon and run each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().startsWith('select')) {
        // Execute SELECT and show results
        const result = await pool.query(statement);
        console.log('📊 Verification Results:');
        console.table(result.rows);
      } else {
        // Execute other statements
        await pool.query(statement);
        console.log(`✅ Executed: ${statement.substring(0, 60)}...`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNow you can:');
    console.log('1. Refresh your admin panel');
    console.log('2. Go to Pricing Management → Base Pricing tab');
    console.log('3. Update prices and click the Update buttons\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Fix: Check your database credentials in .env.local');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Fix: Make sure the database exists');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Fix: Make sure PostgreSQL is running');
    }
  } finally {
    await pool.end();
  }
}

runMigration();
