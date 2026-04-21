/* eslint-disable no-console */
const { Client } = require('pg');

try {
  require('dotenv').config();
} catch {
  // optional
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const checks = [
      {
        label: 'pincode_master.district',
        query: "SELECT DISTINCT district FROM pincode_master WHERE district ~* '\\m(east\\s+medinipur|east\\s+midnapore)\\M' LIMIT 20",
      },
      {
        label: 'portal_notifications.recipient_key',
        query: "SELECT DISTINCT recipient_key FROM portal_notifications WHERE recipient_key ~* '\\m(east\\s+medinipur|east\\s+midnapore)\\M' LIMIT 20",
      },
      {
        label: 'support_tickets.district',
        query: "SELECT DISTINCT district FROM support_tickets WHERE district ~* '\\m(east\\s+medinipur|east\\s+midnapore)\\M' LIMIT 20",
      },
    ];

    for (const check of checks) {
      const result = await client.query(check.query);
      console.log(`--- ${check.label}`);
      console.log(result.rows);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Inspect failed:', error.message || error);
  process.exit(1);
});
