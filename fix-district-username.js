// Fix username by removing trailing spaces
const { Pool } = require('pg');
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

async function fixUsername() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('\n🔧 Fixing usernames with trailing spaces...\n');
    
    const result = await pool.query(`
      UPDATE district_users 
      SET username = TRIM(username)
      WHERE username != TRIM(username)
      RETURNING district_user_id, username, email
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Fixed usernames:');
      console.table(result.rows);
    } else {
      console.log('✅ No usernames needed fixing\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixUsername();
