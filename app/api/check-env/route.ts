import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    emailDevMode: process.env.EMAIL_DEV_MODE,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS ? '✓ SET' : '✗ NOT SET',
    smtpFrom: process.env.SMTP_FROM,
    razorpayDevMode: process.env.RAZORPAY_DEV_MODE,
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? '✓ SET' : '✗ NOT SET',
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json({
    success: true,
    message: 'Server Environment Check',
    config,
    timestamp: new Date().toISOString(),
    status: {
      emailConfigured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      emailDevMode: process.env.EMAIL_DEV_MODE === 'true',
      razorpayConfigured: !!(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      razorpayDevMode: process.env.RAZORPAY_DEV_MODE === 'true',
    }
  });
}
