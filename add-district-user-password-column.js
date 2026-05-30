const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (!key || rest.length === 0) return;
    process.env[key.trim()] = rest.join('=').trim();
  });
}

loadEnv();

async function addPasswordColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query('ALTER TABLE district_users ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
    console.log('Added password column (if missing).');
  } catch (error) {
    console.error('Error adding password column:', error);
  } finally {
    await pool.end();
  }
}

addPasswordColumn();
