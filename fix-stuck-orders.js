const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Koyen@123@localhost:5432/cctv_platform' });

async function run() {
  // Create pincode_master table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pincode_master (
      pincode VARCHAR(6) PRIMARY KEY,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      district VARCHAR(100),
      state VARCHAR(100),
      office_name VARCHAR(200),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('pincode_master table ready');

  // Insert West Bengal pincodes (add more as needed)
  await pool.query(`
    INSERT INTO pincode_master (pincode, latitude, longitude, district, state, office_name) VALUES
      ('721636', 22.4200, 87.3200, 'East Medinipur', 'West Bengal', 'Tamluk'),
      ('721939', 22.4500, 87.3500, 'East Medinipur', 'West Bengal', 'Deypara'),
      ('700001', 22.5726, 88.3639, 'Kolkata', 'West Bengal', 'Kolkata GPO'),
      ('700135', 22.5200, 88.3700, 'Kolkata', 'West Bengal', 'Kolkata South'),
      ('700160', 22.5400, 88.3900, 'Kolkata', 'West Bengal', 'Kolkata North'),
      ('711101', 22.5800, 88.3200, 'Howrah', 'West Bengal', 'Howrah'),
      ('721152', 22.3200, 87.2100, 'Paschim Medinipur', 'West Bengal', 'Midnapore'),
      ('721301', 22.4700, 87.4200, 'East Medinipur', 'West Bengal', 'Haldia')
    ON CONFLICT (pincode) DO UPDATE SET
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude
  `);
  console.log('Pincode coordinates inserted/updated');

  // Now fix all stuck orders:
  // Orders with pending requests where deadline has expired
  const stuckOrders = await pool.query(`
    SELECT DISTINCT o.order_id, o.order_number, o.status, o.assigned_dealer_id,
           o.pincode,
           dor.id AS request_id, dor.dealer_id, dor.request_sequence, dor.response_deadline
    FROM orders o
    JOIN dealer_order_requests dor ON dor.order_id = o.order_id
    WHERE dor.request_status = 'pending'
      AND dor.response_deadline < NOW()
      AND o.status = 'Awaiting Dealer Confirmation'
    ORDER BY o.order_id
  `);
  console.log('Stuck orders:', JSON.stringify(stuckOrders.rows, null, 2));

  for (const order of stuckOrders.rows) {
    console.log(`\nProcessing stuck order ${order.order_number} (ID ${order.order_id})...`);

    // Mark the pending request as expired
    await pool.query(`
      UPDATE dealer_order_requests
      SET request_status = 'expired', expired_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [order.request_id]);

    // Add status history entry for the expiry
    await pool.query(`
      INSERT INTO order_status_history (order_id, status, remarks, created_at)
      VALUES ($1, 'Dealer Timeout', $2, $3)
    `, [order.order_id,
      `Dealer request expired after timeout (request #${order.request_sequence})`,
      order.response_deadline]);

    // Get all dealers already contacted for this order
    const contacted = await pool.query(
      'SELECT dealer_id FROM dealer_order_requests WHERE order_id = $1',
      [order.order_id]
    );
    const contactedIds = contacted.rows.map(r => r.dealer_id);

    // Get timeout setting
    const settings = await pool.query(
      "SELECT setting_value FROM order_allocation_settings WHERE setting_key = 'dealer_response_timeout_hours'"
    );
    const timeoutHours = parseInt(settings.rows[0]?.setting_value || '6');

    // Max attempts
    const maxSettings = await pool.query(
      "SELECT setting_value FROM order_allocation_settings WHERE setting_key = 'max_dealer_attempts'"
    );
    const maxAttempts = parseInt(maxSettings.rows[0]?.setting_value || '3');

    const nextSequence = order.request_sequence + 1;

    if (nextSequence > maxAttempts) {
      // Escalate to admin
      await pool.query(`
        UPDATE orders SET status = 'Pending Admin Review', assigned_dealer_id = NULL WHERE order_id = $1
      `, [order.order_id]);
      await pool.query(`
        INSERT INTO order_status_history (order_id, status, remarks, created_at)
        VALUES ($1, 'Pending Admin Review', 'Max dealer attempts reached - manual assignment required', CURRENT_TIMESTAMP)
      `, [order.order_id]);
      console.log(`  Order ${order.order_number}: escalated to admin (max attempts)`);
      continue;
    }

    // Get next nearest dealer (by distance from customer pincode)
    const nextDealers = await pool.query(`
      SELECT 
        d.dealer_id, d.business_name, d.unique_dealer_id,
        d.latitude, d.longitude, d.service_pin, d.serviceable_pincodes,
        pm.latitude AS cust_lat, pm.longitude AS cust_lng,
        CASE 
          WHEN d.latitude IS NOT NULL AND pm.latitude IS NOT NULL THEN
            ROUND((6371 * acos(LEAST(1, 
              cos(radians(pm.latitude)) * cos(radians(d.latitude::NUMERIC)) *
              cos(radians(d.longitude::NUMERIC) - radians(pm.longitude)) +
              sin(radians(pm.latitude)) * sin(radians(d.latitude::NUMERIC))
            )))::NUMERIC, 2)
          ELSE 9999
        END AS distance_km
      FROM dealers d
      LEFT JOIN pincode_master pm ON pm.pincode = $1
      WHERE d.status = 'Active'
        AND d.dealer_id != ALL($2::INTEGER[])
        AND (
          d.serviceable_pincodes LIKE '%' || $1 || '%'
          OR d.service_pin = $1
        )
      ORDER BY distance_km ASC
      LIMIT 1
    `, [order.pincode, contactedIds]);

    if (nextDealers.rows.length === 0) {
      // No more dealers - escalate to admin
      await pool.query(`
        UPDATE orders SET status = 'Pending Admin Review', assigned_dealer_id = NULL WHERE order_id = $1
      `, [order.order_id]);
      await pool.query(`
        INSERT INTO order_status_history (order_id, status, remarks, created_at)
        VALUES ($1, 'Pending Admin Review', 'No more available dealers in area - manual assignment required', CURRENT_TIMESTAMP)
      `, [order.order_id]);
      console.log(`  Order ${order.order_number}: no dealers available, escalated to admin`);
      continue;
    }

    const nextDealer = nextDealers.rows[0];
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + timeoutHours);

    // Insert new dealer request
    await pool.query(`
      INSERT INTO dealer_order_requests (
        order_id, dealer_id, request_sequence, request_status,
        stock_verified, stock_available,
        response_deadline, dealer_distance_km, customer_pincode, dealer_service_pin
      )
      VALUES ($1, $2, $3, 'pending', false, false, $4, $5, $6, $7)
    `, [order.order_id, nextDealer.dealer_id, nextSequence, deadline,
        nextDealer.distance_km, order.pincode, nextDealer.service_pin]);

    // Update order
    await pool.query(`
      UPDATE orders
      SET assigned_dealer_id = $1, assigned_at = CURRENT_TIMESTAMP,
          status = 'Awaiting Dealer Confirmation'
      WHERE order_id = $2
    `, [nextDealer.dealer_id, order.order_id]);

    // Status history
    await pool.query(`
      INSERT INTO order_status_history (order_id, status, remarks, created_at)
      VALUES ($1, 'Awaiting Dealer Confirmation', $2, CURRENT_TIMESTAMP)
    `, [order.order_id,
      `Auto-reassigned to #${nextDealer.unique_dealer_id} ${nextDealer.business_name} (${nextDealer.distance_km} km) after previous dealer timeout`]);

    // Allocation log
    await pool.query(`
      INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
      VALUES ($1, $2, 'request_sent', 'Auto-escalated to next nearest dealer after timeout', $3)
    `, [order.order_id, nextDealer.dealer_id, JSON.stringify({
      sequence: nextSequence,
      distance_km: nextDealer.distance_km,
      reason: 'deadline_expired'
    })]);

    console.log(`  Order ${order.order_number}: reassigned to #${nextDealer.unique_dealer_id} ${nextDealer.business_name} (${nextDealer.distance_km} km), deadline: ${deadline.toISOString()}`);
  }

  console.log('\nDone. Summary:');
  const after = await pool.query(`
    SELECT order_id, order_number, status, assigned_dealer_id FROM orders
    WHERE order_id IN (SELECT DISTINCT order_id FROM dealer_order_requests)
    ORDER BY order_id DESC LIMIT 8
  `);
  after.rows.forEach(r => console.log(`  ${r.order_number}: ${r.status} (dealer ${r.assigned_dealer_id})`));

  await pool.end();
}
run().catch(e => { console.error(e.message); pool.end(); });
