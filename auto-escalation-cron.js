// Auto-Escalation Cron Job
// This script should run every hour to check for expired dealer requests
// and automatically escalate them to the next dealer or admin

const schedule = require('node-cron');

// Run every hour (at minute 0)
schedule.schedule('0 * * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Running auto-escalation check...`);
  
  try {
    const response = await fetch('http://localhost:3000/api/auto-escalate-orders');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Processed ${data.processed} expired requests`);
      
      if (data.escalated_to_dealers > 0) {
        console.log(`   → ${data.escalated_to_dealers} escalated to next dealer`);
      }
      
      if (data.escalated_to_admin > 0) {
        console.log(`   → ${data.escalated_to_admin} escalated to admin panel`);
      }
      
      if (data.processed === 0) {
        console.log('   ℹ No expired requests found');
      }
    } else {
      console.error('❌ Auto-escalation failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error running auto-escalation:', error.message);
  }
});

console.log('🤖 Auto-escalation cron job started');
console.log('📅 Schedule: Every hour at minute 0');
console.log('⏰ Next run will be at the top of the next hour\n');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping auto-escalation cron job...');
  process.exit(0);
});
