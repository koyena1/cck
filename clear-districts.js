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

async function clearDistricts() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const districts = ['North 24 Parganas', 'Purba Medinipur'];
    const result = await pool.query(
      `UPDATE dealers
       SET district = NULL, state = NULL
       WHERE district = ANY($1::text[])`,
      [districts]
    );

    console.log(`Cleared district/state for ${result.rowCount} dealer(s).`);
  } catch (error) {
    console.error('Error clearing districts:', error);
  } finally {
    await pool.end();
  }
}

clearDistricts();
