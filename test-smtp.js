const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('\n🔍 Testing SMTP Connection...\n');
  
  // Check what createTransport looks like
  console.log('Nodemailer type:', typeof nodemailer);
  console.log('createTransport type:', typeof nodemailer.createTransport);
  
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'protechtur@gmail.com',
      pass: 'kusa cmoh leom mwrm'
    }
  };
  
  console.log('📧 Configuration:');
  console.log('   Host:', config.host);
  console.log('   Port:', config.port);
  console.log('   User:', config.auth.user);
  console.log('   Pass:', config.auth.pass);
  console.log();
  
  try {
    const transporter = nodemailer.createTransport(config);
    
    console.log('⏳ Verifying connection...');
    await transporter.verify();
    
    console.log('✅ SMTP Connection Successful!');
    console.log('\n📧 Sending test email...');
    
    const info = await transporter.sendMail({
      from: '"Protechtur" <protechtur@gmail.com>',
      to: 'protechtur@gmail.com',
      subject: 'Test Email - SMTP Working!',
      text: 'If you receive this, your SMTP is configured correctly!',
      html: '<h1>✅ SMTP Test Successful!</h1><p>Your email configuration is working correctly.</p>'
    });
    
    console.log('✅ Test Email Sent!');
    console.log('   Message ID:', info.messageId);
    console.log('\n🎉 Email system is working! Check protechtur@gmail.com inbox.\n');
    
  } catch (error) {
    console.error('\n❌ SMTP Connection Failed!');
    console.error('   Error:', error.message);
    
    // Try with spaces removed
    console.log('\n🔄 Retrying with spaces removed from password...');
    config.auth.pass = 'kusacmohleommwrm';
    
    try {
      const transporter2 = nodemailer.createTransport(config);
      await transporter2.verify();
      console.log('✅ SMTP Connection Successful (without spaces)!');
      
      const info = await transporter2.sendMail({
        from: '"Protechtur" <protechtur@gmail.com>',
        to: 'protechtur@gmail.com',
        subject: 'Test Email - SMTP Working!',
        text: 'If you receive this, your SMTP is configured correctly!',
        html: '<h1>✅ SMTP Test Successful!</h1><p>Your email configuration is working correctly.</p>'
      });
      
      console.log('✅ Test Email Sent!');
      console.log('   Message ID:', info.messageId);
      console.log('\n🎉 Email system is working!\n');
    } catch (error2) {
      console.error('\n❌ Both attempts failed!');
      console.error('   Error:', error2.message);
      console.error('\n📋 You need to regenerate the App Password:');
      console.error('   https://myaccount.google.com/apppasswords\n');
    }
  }
}

testSMTP();
