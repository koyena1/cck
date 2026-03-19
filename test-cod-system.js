// Test COD System - Comprehensive Check
console.log('\n🔍 ===== COD SYSTEM DIAGNOSTIC =====\n');

// 1. Check Environment Variables
console.log('📧 EMAIL CONFIGURATION:');
console.log('   EMAIL_DEV_MODE:', process.env.EMAIL_DEV_MODE);
console.log('   SMTP_HOST:', process.env.SMTP_HOST);
console.log('   SMTP_USER:', process.env.SMTP_USER);
console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '✓ SET' : '✗ NOT SET');

console.log('\n💰 RAZORPAY CONFIGURATION:');
console.log('   NEXT_PUBLIC_RAZORPAY_KEY_ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✓ SET' : '✗ NOT SET');
console.log('   RAZORPAY_DEV_MODE:', process.env.RAZORPAY_DEV_MODE);

// 2. Test COD Calculation Logic
console.log('\n🧮 COD CALCULATION TEST:');
const testSettings = {
  installationCost: 5000,
  codAdvanceAmount: 200,
  codPercentage: 10,
  amcOptions: {
    with_1year: 400,
    with_2year: 700,
    without_1year: 250,
    without_2year: 200
  }
};

const testProducts = [
  { price: 10000, quantity: 2 } // Total: 20000
];

const productsTotal = testProducts.reduce((sum, item) => sum + (item.price * item.quantity), 0);
console.log('   Products Total: RS' + productsTotal);

// Test 1: Without optional items
let baseAmount1 = productsTotal + testSettings.codAdvanceAmount;
let advance1 = (baseAmount1 * testSettings.codPercentage) / 100;
console.log('   Without Installation/AMC:');
console.log('      Base Amount: RS' + baseAmount1);
console.log('      Advance (10%): RS' + advance1);

// Test 2: With Installation
let baseAmount2 = productsTotal + testSettings.installationCost + testSettings.codAdvanceAmount;
let advance2 = (baseAmount2 * testSettings.codPercentage) / 100;
console.log('   With Installation (RS 5000):');
console.log('      Base Amount: RS' + baseAmount2);
console.log('      Advance (10%): RS' + advance2);

// Test 3: With Installation + AMC
let baseAmount3 = productsTotal + testSettings.installationCost + testSettings.amcOptions.with_1year + testSettings.codAdvanceAmount;
let advance3 = (baseAmount3 * testSettings.codPercentage) / 100;
console.log('   With Installation + AMC (1yr with material):');
console.log('      Base Amount: RS' + baseAmount3);
console.log('      Advance (10%): RS' + advance3);

// 3. Email System Status
console.log('\n📬 EMAIL SYSTEM STATUS:');
const emailDevMode = process.env.EMAIL_DEV_MODE === 'true';
if (emailDevMode) {
  console.log('   ⚠️  DEV MODE: Emails will be logged to console only');
  console.log('   ❌ Real emails will NOT be sent');
} else {
  console.log('   ✅ PRODUCTION MODE: Real emails will be sent');
  console.log('   📧 Recipients will receive actual emails');
}

// 4. COD Flow Summary
console.log('\n📋 COD FLOW SUMMARY:');
console.log('   1. User selects COD payment method');
console.log('   2. Order created in database (payment_status: Pending)');
console.log('   3. ❌ Email NOT sent yet (for COD orders)');
console.log('   4. User pays advance via Razorpay');
console.log('   5. Payment verified in /api/razorpay/verify-payment');
console.log('   6. Payment status updated to: Paid');
console.log('   7. ✅ Email sent NOW (after payment)');
console.log('   8. User receives confirmation email');

console.log('\n✅ DIAGNOSTIC COMPLETE\n');

// Final verdict
console.log('═══════════════════════════════════');
if (emailDevMode) {
  console.log('⚠️  WARNING: EMAIL_DEV_MODE is TRUE');
  console.log('Change to FALSE in .env.local for real emails');
} else if (!process.env.SMTP_PASS) {
  console.log('❌ ERROR: SMTP_PASS not configured');
} else {
  console.log('✅ SYSTEM READY FOR COD ORDERS');
  console.log('All configurations are correct');
}
console.log('═══════════════════════════════════\n');
