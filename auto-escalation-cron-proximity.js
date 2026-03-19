/**
 * Auto-Escalation Cron Job
 * Automatically escalates orders to next dealer when response deadline expires
 * Run this script every hour using a cron job or task scheduler
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

async function autoEscalateExpiredOrders() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log(`🤖 Auto-Escalation Cron Job Started at ${new Date().toISOString()}`);
    console.log('='repeat(70));

    // Check if auto-escalation is enabled
    const settingsResult = await pool.query(`
      SELECT setting_value FROM order_allocation_settings 
      WHERE setting_key = 'auto_escalate_enabled'
    `);

    const autoEscalateEnabled = settingsResult.rows[0]?.setting_value === 'true';

    if (!autoEscalateEnabled) {
      console.log('⏸️  Auto-escalation is disabled in settings. Exiting...');
      return;
    }

    // Find expired pending requests
    const expiredRequestsResult = await pool.query(`
      SELECT 
        dor.id as request_id,
        dor.order_id,
        dor.dealer_id,
        dor.request_sequence,
        o.order_number,
        d.business_name as dealer_name,
        dor.response_deadline,
        EXTRACT(EPOCH FROM (NOW() - dor.response_deadline)) / 3600 as hours_expired
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      JOIN dealers d ON dor.dealer_id = d.dealer_id
      WHERE dor.request_status = 'pending'
        AND dor.response_deadline < NOW()
      ORDER BY dor.response_deadline ASC
    `);

    const expiredRequests = expiredRequestsResult.rows;

    if (expiredRequests.length === 0) {
      console.log('✅ No expired requests found. All dealers responded on time!');
      return;
    }

    console.log(`\n⏰ Found ${expiredRequests.length} expired request(s):\n`);

    let escalatedCount = 0;
    let failedCount = 0;

    // Process each expired request
    for (const request of expiredRequests) {
      console.log(`\n📦 Processing Order: ${request.order_number}`);
      console.log(`   Dealer: ${request.dealer_name} (ID: ${request.dealer_id})`);
      console.log(`   Sequence: ${request.request_sequence}`);
      console.log(`   Expired: ${Math.round(request.hours_expired)} hours ago`);

      try {
        await pool.query('BEGIN');

        // Mark request as expired
        await pool.query(`
          UPDATE dealer_order_requests
          SET request_status = 'expired',
              expired_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [request.request_id]);

        // Log expiration
        await pool.query(`
          INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
          VALUES ($1, $2, 'expired', 'Dealer response deadline expired', $3)
        `, [request.order_id, request.dealer_id, JSON.stringify({
          request_id: request.request_id,
          sequence: request.request_sequence,
          hours_expired: Math.round(request.hours_expired)
        })]);

        await pool.query('COMMIT');

        // Trigger reallocation
        console.log(`   🔄 Triggering reallocation...`);

        const reallocationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/reallocate-order`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: request.order_id,
              previousDealerId: request.dealer_id,
              previousSequence: request.request_sequence
            })
          }
        );

        const reallocationData = await reallocationResponse.json();

        if (reallocationData.success) {
          if (reallocationData.reallocated) {
            console.log(`   ✅ Escalated to: ${reallocationData.dealer_name} (${reallocationData.distance_km}km away)`);
            escalatedCount++;
          } else if (reallocationData.escalated_to_admin) {
            console.log(`   ⚠️  Escalated to admin panel (${reallocationData.dealers_tried} dealers tried)`);
            escalatedCount++;
          }
        } else {
          console.log(`   ❌ Reallocation failed: ${reallocationData.error}`);
          failedCount++;
        }

      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`   ❌ Error processing request ${request.request_id}:`, error.message);
        failedCount++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Expired: ${expiredRequests.length}`);
    console.log(`   Successfully Escalated: ${escalatedCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`\n✅ Auto-Escalation Cron Job Completed at ${new Date().toISOString()}\n`);

  } catch (error) {
    console.error('❌ Fatal error in auto-escalation cron:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cron job
autoEscalateExpiredOrders()
  .then(() => {
    console.log('Cron job finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cron job failed:', error);
    process.exit(1);
  });
