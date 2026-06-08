import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Test endpoint to verify email configuration
 * GET /api/test-email
 */
export async function GET() {
  try {
    console.log('\n🔍 EMAIL DIAGNOSTIC TEST\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET'}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-3) : 'NOT SET'}`);
    console.log(`   SMTP_FROM: ${process.env.SMTP_FROM || 'NOT SET'}`);
    console.log(`   EMAIL_DEV_MODE: ${process.env.EMAIL_DEV_MODE || 'NOT SET'}`);

    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
    const SMTP_USER = process.env.SMTP_USER || '';
    const SMTP_PASS = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');
    const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'protechtur@gmail.com';
    const DEV_MODE = process.env.EMAIL_DEV_MODE === 'true';

    console.log('\n🧪 Testing SMTP Connection:');
    console.log(`   Host: ${SMTP_HOST}`);
    console.log(`   Port: ${SMTP_PORT}`);
    console.log(`   User: ${SMTP_USER}`);
    console.log(`   Secure: ${SMTP_PORT === 465}`);

    if (DEV_MODE) {
      return NextResponse.json({
        success: false,
        error: 'EMAIL_DEV_MODE is enabled - actual email sending is disabled',
        devMode: true,
      });
    }

    if (!SMTP_USER || !SMTP_PASS) {
      return NextResponse.json({
        success: false,
        error: 'SMTP credentials are missing',
        missing: {
          user: !SMTP_USER,
          pass: !SMTP_PASS,
        },
      });
    }

    // Try to create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    console.log('🔗 Transporter created');

    // Verify connection
    console.log('✅ Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');

    // Send test email
    console.log(`\n📧 Sending test email to: ${SMTP_USER}`);
    const info = await transporter.sendMail({
      from: `"CCTV Platform Test" <${FROM_EMAIL}>`,
      to: SMTP_USER,
      subject: 'Email Configuration Test - CCTV Platform',
      text: 'If you are reading this, your SMTP configuration is working correctly!',
      html: `
        <h2>Email Configuration Test</h2>
        <p>If you are reading this, your SMTP configuration is working correctly!</p>
        <p>Details:</p>
        <ul>
          <li>SMTP Host: ${SMTP_HOST}</li>
          <li>SMTP Port: ${SMTP_PORT}</li>
          <li>From Email: ${FROM_EMAIL}</li>
          <li>Sent at: ${new Date().toISOString()}</li>
        </ul>
      `,
    });

    console.log(`✅ Email sent successfully!`);
    console.log(`   Response ID: ${info.response}`);

    return NextResponse.json({
      success: true,
      message: 'Email test successful - check your inbox',
      details: {
        host: SMTP_HOST,
        port: SMTP_PORT,
        user: SMTP_USER,
        to: SMTP_USER,
        responseId: info.response,
        messageId: info.messageId,
      },
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as any).message || 'Unknown error',
        details: {
          code: (error as any).code,
          command: (error as any).command,
          responseCode: (error as any).responseCode,
          response: (error as any).response,
        },
      },
      { status: 500 }
    );
  }
}
