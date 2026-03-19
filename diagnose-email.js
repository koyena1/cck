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
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function run() {
  try {
    // Check the most recent order (order_id=97)
    const order = await pool.query(`
      SELECT order_id, order_number, customer_name, customer_email, customer_phone,
             order_token, products, total_amount, payment_method, payment_status, created_at
      FROM orders WHERE order_id = 97
    `);
    console.log('\n=== ORDER 97 ===');
    const o = order.rows[0];
    console.log('customer_email:', o.customer_email);
    console.log('customer_phone:', o.customer_phone);
    console.log('order_token:', o.order_token);
    console.log('order_number:', o.order_number);
    console.log('products field:', o.products ? JSON.stringify(o.products).substring(0, 200) : 'NULL');

    // Check order_items for order 97
    const items = await pool.query(`SELECT * FROM order_items WHERE order_id = 97`);
    console.log('\n=== order_items for order 97 ===');
    if (items.rows.length === 0) {
      console.log('NO ITEMS IN order_items TABLE!');
    } else {
      console.table(items.rows);
    }

    // Check SMTP env vars (just keys, not values for security)
    console.log('\n=== EMAIL CONFIG ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
    console.log('SMTP_PORT:', process.env.SMTP_PORT || '(not set)');
    console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : '(not set)');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : '(not set)');
    console.log('SMTP_FROM:', process.env.SMTP_FROM || '(not set)');
    console.log('EMAIL_DEV_MODE:', process.env.EMAIL_DEV_MODE || '(not set)');
    console.log('NEXT_PUBLIC_WEBSITE_URL:', process.env.NEXT_PUBLIC_WEBSITE_URL || '(not set)');
    console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL || '(not set)');

    // Check email_logs
    const emailLogs = await pool.query(`
      SELECT * FROM email_logs WHERE order_id = 97
    `).catch(() => ({ rows: [] }));
    console.log('\n=== email_logs for order 97 ===');
    if (emailLogs.rows.length === 0) {
      console.log('No email log entries found');
    } else {
      console.table(emailLogs.rows);
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}
run();
