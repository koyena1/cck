/* eslint-disable no-console */
const { Client } = require('pg');

try {
  require('dotenv').config();
} catch {
  // optional
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const cols = await client.query(`
      SELECT c.table_schema, c.table_name, c.column_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema
       AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.data_type IN ('character varying','text','character')
    `);

    let hits = 0;
    for (const col of cols.rows) {
      const sql = `SELECT 1 FROM ${col.table_schema}.${col.table_name} WHERE ${col.column_name} ~* '\\m(east\\s+medinipur|east\\s+midnapore)\\M' LIMIT 1`;
      try {
        const result = await client.query(sql);
        if (result.rowCount > 0) {
          hits += 1;
          console.log(`HIT ${col.table_schema}.${col.table_name}.${col.column_name}`);
        }
      } catch {
        // Skip non-queryable edge cases
      }
    }

    console.log(`DB_MATCH_COUNT=${hits}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Verification failed:', error.message || error);
  process.exit(1);
});
