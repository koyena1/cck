const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432,
});

async function testEscalation() {
  await client.connect();

  try {
    console.log('🧪 Testing Admin Escalation Flow\n');
    console.log('═══════════════════════════════════════════════\n');

    // Scenario 1: Check orders pending admin review
    const adminReviewOrders = await client.query(`
      SELECT 
        order_id,
        order_number,
        customer_name,
        status,
        pincode,
        total_amount,
        created_at
      FROM orders
      WHERE status = 'Pending Admin Review'
      ORDER BY created_at DESC
    `);

    console.log('📊 SCENARIO 1: Orders Currently Pending Admin Review');
    console.log('─────────────────────────────────────────────────');
    if (adminReviewOrders.rows.length > 0) {
      adminReviewOrders.rows.forEach((order, i) => {
        console.log(`\n${i + 1}. Order: ${order.order_number}`);
        console.log(`   Customer: ${order.customer_name}`);
        console.log(`   PIN: ${order.pincode}`);
        console.log(`   Amount: RS ${order.total_amount}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
      });
    } else {
      console.log('✅ No orders pending admin review (good!)');
    }

    // Scenario 2: Check if there are expired dealer requests
    console.log('\n\n📊 SCENARIO 2: Expired Dealer Requests (Need Escalation)');
    console.log('─────────────────────────────────────────────────');
    const expiredRequests = await client.query(`
      SELECT 
        dor.id,
        dor.order_id,
        o.order_number,
        dor.dealer_id,
        d.business_name,
        dor.request_status,
        dor.response_deadline,
        dor.created_at
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      JOIN dealers d ON dor.dealer_id = d.dealer_id
      WHERE dor.request_status = 'pending'
        AND dor.response_deadline < NOW()
      ORDER BY dor.response_deadline ASC
    `);

    if (expiredRequests.rows.length > 0) {
      console.log(`⚠️ Found ${expiredRequests.rows.length} expired requests:\n`);
      expiredRequests.rows.forEach((req, i) => {
        console.log(`${i + 1}. Order ${req.order_number} → Dealer: ${req.business_name}`);
        console.log(`   Deadline: ${new Date(req.response_deadline).toLocaleString()}`);
        console.log(`   Status: ${req.request_status}`);
      });
      console.log('\n💡 Run auto-escalation: GET /api/auto-escalate-orders');
    } else {
      console.log('✅ No expired requests');
    }

    // Scenario 3: Check allocation logs for escalations
    console.log('\n\n📊 SCENARIO 3: Recent Escalation History');
    console.log('─────────────────────────────────────────────────');
    const escalationLogs = await client.query(`
      SELECT 
        aol.order_id,
        o.order_number,
        aol.log_type,
        aol.message,
        aol.details,
        aol.created_at
      FROM order_allocation_log aol
      JOIN orders o ON aol.order_id = o.order_id
      WHERE aol.log_type IN ('escalated_to_admin', 'expired', 'request_sent')
      ORDER BY aol.created_at DESC
      LIMIT 10
    `);

    if (escalationLogs.rows.length > 0) {
      escalationLogs.rows.forEach((log, i) => {
        console.log(`\n${i + 1}. [${log.log_type.toUpperCase()}] ${log.order_number}`);
        console.log(`   ${log.message}`);
        console.log(`   Time: ${new Date(log.created_at).toLocaleString()}`);
        if (log.details) {
          try {
            const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
            if (details.dealers_tried) {
              console.log(`   Dealers Tried: ${details.dealers_tried}`);
            }
            if (details.reason) {
              console.log(`   Reason: ${details.reason}`);
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
      });
    } else {
      console.log('No recent escalation events');
    }

    // Scenario 4: Show current allocation stats
    console.log('\n\n📊 SCENARIO 4: Overall Allocation Statistics');
    console.log('─────────────────────────────────────────────────');
    
    const stats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Pending Admin Review') as admin_review,
        COUNT(*) FILTER (WHERE status = 'Awaiting Dealer Confirmation') as awaiting_dealer,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed,
        COUNT(*) FILTER (WHERE assigned_dealer_id IS NOT NULL) as assigned,
        COUNT(*) FILTER (WHERE assigned_dealer_id IS NULL) as unassigned
      FROM orders
    `);

    const stat = stats.rows[0];
    console.log(`🚨 Orders Pending Admin Review: ${stat.admin_review}`);
    console.log(`⏳ Orders Awaiting Dealer Confirmation: ${stat.awaiting_dealer}`);
    console.log(`📦 Pending Orders: ${stat.pending}`);
    console.log(`✅ Completed Orders: ${stat.completed}`);
    console.log(`👥 Assigned to Dealers: ${stat.assigned}`);
    console.log(`❌ Unassigned: ${stat.unassigned}`);

    // Test auto-escalation API
    console.log('\n\n🚀 SCENARIO 5: Testing Auto-Escalation API');
    console.log('─────────────────────────────────────────────────');
    
    try {
      const response = await fetch('http://localhost:3000/api/auto-escalate-orders', {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Auto-escalation API responded:');
        console.log(`   Processed: ${result.processed} requests`);
        console.log(`   Escalated to dealers: ${result.escalated_to_dealers}`);
        console.log(`   Escalated to admin: ${result.escalated_to_admin}`);
        
        if (result.admin_escalations && result.admin_escalations.length > 0) {
          console.log('\n   📝 Orders sent to admin:');
          result.admin_escalations.forEach((esc, i) => {
            console.log(`      ${i + 1}. ${esc.order_number} (${esc.dealers_tried} dealers tried)`);
          });
        }
      } else {
        console.log('⚠️ Auto-escalation API returned error:', response.status);
      }
    } catch (error) {
      console.log('⚠️ Auto-escalation API not responding (is server running?)');
      console.log('   Error:', error.message);
    }

    console.log('\n\n═══════════════════════════════════════════════');
    console.log('✅ Test Complete!');
    console.log('\n💡 To set up auto-escalation cron job:');
    console.log('   Windows Task Scheduler: Run auto-escalation-cron.ps1 every hour');
    console.log('   Linux Cron: 0 * * * * curl http://localhost:3000/api/auto-escalate-orders');
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

testEscalation();
