// Check password hash for district user
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

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

async function checkUser() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    const username = 'Purba';
    const testPassword = '123456789';
    
    console.log(`\n🔍 Checking user: ${username}\n`);
    
    const result = await pool.query(
      'SELECT district_user_id, username, email, is_active, password_hash FROM district_users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found:');
    console.log(`   - ID: ${user.district_user_id}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Active: ${user.is_active}`);
    console.log(`   - Password Hash: ${user.password_hash.substring(0, 30)}...`);
    
    // Test password
    console.log(`\n🔐 Testing password: "${testPassword}"`);
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`   - Password Match: ${isValid ? '✅ YES' : '❌ NO'}`);
    
    if (!isValid) {
      console.log('\n💡 The stored password hash does not match the password you\'re trying.');
      console.log('   You may need to reset the password or check what password was used during creation.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
