/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

try {
  require('dotenv').config();
} catch {
  // dotenv is optional
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set.');
  }

  const sqlPath = path.resolve(__dirname, '..', 'normalize-east-to-purba-medinipur.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('District normalization completed: East Medinipur -> Purba Medinipur');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Normalization failed:', error.message || error);
  process.exit(1);
});
