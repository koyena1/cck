const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

async function deleteUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Deleting all district users...');
    const result = await pool.query('DELETE FROM district_users');
    console.log(`Successfully deleted ${result.rowCount} users.`);
  } catch (error) {
    console.error('Error deleting users:', error);
  } finally {
    await pool.end();
  }
}

deleteUsers();
