import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { getPool } from '@/lib/db';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
  try {
    const { phoneNumber, otpCode, orderNumber } = await request.json();

    if (!phoneNumber || !otpCode) {
      return NextResponse.json(
        { success: false, message: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

    // Verify OTP with Twilio
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: formattedPhone, code: otpCode });

    if (verificationCheck.status === 'approved') {
      // Fetch orders from the database for verified user
      const pool = getPool();
      
      let query = `SELECT 
        order_id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        installation_address,
        city,
        state,
        pincode,
        total_amount,
        status,
        payment_method,
        payment_status,
        created_at,
        updated_at,
        expected_delivery_date,
        installation_date
      FROM orders 
      WHERE customer_phone = $1`;
      
      const params: any[] = [phoneNumber];
      
      // If orderNumber is provided, filter by it too
      if (orderNumber) {
        query += ` AND order_number = $2`;
        params.push(orderNumber);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const ordersResult = await pool.query(query, params);

      if (ordersResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: "No orders found for this phone number" },
          { status: 404 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        orders: ordersResult.rows 
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}