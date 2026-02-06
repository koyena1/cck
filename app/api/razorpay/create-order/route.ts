import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const DEV_MODE = process.env.RAZORPAY_DEV_MODE === 'true';

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR', receipt, notes } = await request.json();

    // Development mode: Return mock order
    if (DEV_MODE) {
      const mockOrderId = `order_DEV${Date.now()}`;
      console.log(`💳 DEV MODE - Mock Razorpay order created: ${mockOrderId}`);
      console.log(`Amount: ₹${amount}, Receipt: ${receipt}`);
      
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: amount * 100,
        currency: currency,
        devMode: true,
      });
    }

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Razorpay credentials not configured. Please add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env file' 
        },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create Razorpay order' },
      { status: 500 }
    );
  }
}
