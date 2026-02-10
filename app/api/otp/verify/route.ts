import { NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const DEV_MODE = process.env.OTP_DEV_MODE === 'true';
const DEV_OTP = '123456'; // Fixed OTP for testing

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number and OTP are required' 
      }, { status: 400 });
    }

    // Validate OTP format
    if (!/^[0-9]{6}$/.test(otp)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid OTP format' 
      }, { status: 400 });
    }

    // Developer Mode: Accept fixed OTP without Twilio
    if (DEV_MODE) {
      if (otp === DEV_OTP) {
        console.log(`🧪 DEV MODE: OTP verified successfully for ${phone}`);
        return NextResponse.json({ 
          success: true, 
          message: 'Phone number verified successfully (DEV MODE)',
          devMode: true
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid OTP. Use ${DEV_OTP} in dev mode.` 
        }, { status: 401 });
      }
    }

    try {
      // Format phone with country code
      const formattedPhone = `+91${phone}`;

      // Verify OTP with Twilio Verify
      const verificationCheck = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
        .verificationChecks.create({ 
          to: formattedPhone, 
          code: otp 
        });

      if (verificationCheck.status === 'approved') {
        console.log(`✅ OTP verified successfully for ${phone}`);

        return NextResponse.json({ 
          success: true, 
          message: 'Phone number verified successfully'
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid OTP. Please try again.' 
        }, { status: 401 });
      }

    } catch (twilioError: any) {
      console.error('Twilio verification error:', twilioError);
      
      // Handle specific Twilio errors
      if (twilioError.code === 20404) {
        return NextResponse.json({ 
          success: false, 
          error: 'OTP has expired or not found. Please request a new one.' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid OTP. Please try again.' 
      }, { status: 401 });
    }

  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify OTP. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
