import { NextResponse } from 'next/server';
import twilio from 'twilio';

const DEV_MODE = process.env.OTP_DEV_MODE === 'true';
const DEV_OTP = '123456'; // Fixed OTP for testing

// Only initialize Twilio client in production mode
const client = DEV_MODE ? null : twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    console.log('📋 OTP_DEV_MODE environment variable:', process.env.OTP_DEV_MODE);
    console.log('🔍 DEV_MODE is:', DEV_MODE);

    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number is required' 
      }, { status: 400 });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid phone number format. Use 10 digits.' 
      }, { status: 400 });
    }

    // Developer Mode: Skip Twilio and return fixed OTP
    if (DEV_MODE) {
      console.log(`🧪 DEV MODE ACTIVE: OTP for ${phone} is ${DEV_OTP}`);
      return NextResponse.json({ 
        success: true, 
        message: `DEV MODE: OTP sent to ${phone}`,
        devMode: true,
        devOtp: DEV_OTP
      });
    }

    // Production Mode: Use Twilio
    if (!client) {
      return NextResponse.json({ 
        success: false, 
        error: 'Twilio client not initialized' 
      }, { status: 500 });
    }

    try {
      // Format phone with country code (+91 for India)
      const formattedPhone = `+91${phone}`;

      // Send OTP via Twilio Verify
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verifications.create({ 
          to: formattedPhone, 
          channel: 'sms' 
        });

      console.log(`✅ OTP sent to ${phone} via Twilio`);

      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully to your phone',
        status: verification.status
      });

    } catch (twilioError: any) {
      console.error('Twilio error:', twilioError);
      return NextResponse.json({ 
        success: false, 
        error: twilioError.message || 'Failed to send OTP via SMS' 
      }, { status: 500 });
    }

  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send OTP. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
