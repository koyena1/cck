import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR', receipt, notes } = await request.json();
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount for Razorpay order' },
        { status: 400 }
      );
    }

    if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID (or NEXT_PUBLIC_RAZORPAY_KEY_ID) and RAZORPAY_KEY_SECRET.' 
        },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: Math.round(parsedAmount * 100), // amount in smallest currency unit (paise)
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
      keyId,
    });
  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    const errorMessage =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      'Failed to create Razorpay order';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: errorMessage.toLowerCase().includes('authentication failed') ? 401 : 500 }
    );
  }
}
