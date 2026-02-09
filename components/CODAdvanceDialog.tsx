'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CODAdvanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  advanceAmount: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  onPaymentSuccess: () => void;
}

export function CODAdvanceDialog({
  isOpen,
  onClose,
  advanceAmount,
  orderNumber,
  customerName,
  phone,
  totalAmount,
  onPaymentSuccess,
}: CODAdvanceDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentTriggered, setPaymentTriggered] = useState(false);

  useEffect(() => {
    // Load Razorpay script if not already loaded
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Auto-trigger payment when dialog opens
  useEffect(() => {
    if (isOpen && !paymentTriggered && orderNumber) {
      setPaymentTriggered(true);
      // Increased delay to ensure Razorpay script is fully loaded
      setTimeout(() => {
        handlePayAdvance();
      }, 1000);
    }
    
    // Reset state when dialog closes
    if (!isOpen) {
      setPaymentTriggered(false);
      setProcessing(false);
    }
  }, [isOpen, orderNumber, paymentTriggered]);

  const handlePayAdvance = async () => {
    setProcessing(true);

    try {
      // Check if Razorpay script is loaded
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        console.error('Razorpay script not loaded');
        alert('Payment system is loading. Please wait a moment and try again.');
        setProcessing(false);
        setPaymentTriggered(false);
        return;
      }

      console.log('🔄 Creating Razorpay order for COD advance payment...');
      console.log('Amount:', advanceAmount);
      console.log('Order Number:', orderNumber);

      // Create Razorpay order for advance payment
      const razorpayResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: advanceAmount,
          receipt: `${orderNumber}_ADVANCE`,
          notes: {
            orderNumber,
            customerName,
            phone,
            paymentType: 'COD_ADVANCE',
          },
        }),
      });

      const razorpayData = await razorpayResponse.json();
      console.log('💳 Razorpay response:', razorpayData);

      if (!razorpayData.success) {
        alert(razorpayData.error || 'Failed to initialize payment');
        setProcessing(false);
        setPaymentTriggered(false);
        return;
      }

      // Development mode: Skip Razorpay and auto-verify
      if (razorpayData.devMode) {
        console.log('🧪 DEV MODE - Simulating COD advance payment...');
        
        const verifyResponse = await fetch('/api/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: razorpayData.orderId,
            razorpay_payment_id: `pay_COD_ADVANCE_DEV${Date.now()}`,
            razorpay_signature: 'dev_signature',
            order_number: orderNumber,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          setProcessing(false);
          onPaymentSuccess();
        } else {
          alert('Payment verification failed');
          setProcessing(false);
          setPaymentTriggered(false);
        }
        return;
      }

      console.log('🚀 Opening Razorpay payment gateway...');

      // Production mode: Use real Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SC7jHw0oYI68Ps',
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'CCTV Store',
        description: `COD Advance Payment - Order #${orderNumber}`,
        order_id: razorpayData.orderId,
        handler: async function (response: any) {
          console.log('✅ Payment successful, verifying...');
          // Verify payment
          const verifyResponse = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_number: orderNumber,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            console.log('✅ Payment verified successfully');
            setProcessing(false);
            onPaymentSuccess();
          } else {
            console.error('❌ Payment verification failed');
            alert('Payment verification failed');
            setProcessing(false);
            setPaymentTriggered(false);
          }
        },
        prefill: {
          name: customerName,
          contact: phone,
        },
        theme: {
          color: '#e63946',
        },
        modal: {
          ondismiss: function() {
            console.log('❌ COD advance payment cancelled by user');
            setProcessing(false);
            setPaymentTriggered(false);
            onClose();
          }
        }
      };

      console.log('Razorpay options:', { ...options, key: '***' });

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
      console.log('✅ Razorpay modal opened');
    } catch (error) {
      console.error('❌ COD advance payment error:', error);
      alert('Payment initialization failed. Please try again.');
      setProcessing(false);
      setPaymentTriggered(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          disabled={processing}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
          COD Advance Payment Required
        </h2>

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Why do I need to pay in advance?</p>
              <p>For Cash on Delivery orders, we require an advance payment of <span className="font-semibold">₹{advanceAmount.toFixed(2)}</span>. This is calculated as a percentage of your total order amount (including extra COD charges). This helps us prevent fraudulent orders and ensures serious buyers.</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Order Total:</span>
            <span className="font-semibold text-slate-900">₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Advance Payment:</span>
            <span className="font-semibold text-orange-600">₹{advanceAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="text-slate-600">Balance (Pay on Delivery):</span>
            <span className="font-bold text-[#e63946] text-lg">₹{(totalAmount - advanceAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!processing && !paymentTriggered && (
            <Button
              onClick={handlePayAdvance}
              disabled={processing}
              className="w-full bg-[#e63946] hover:bg-[#d62839] text-white py-6 text-lg"
            >
              Pay ₹{advanceAmount.toFixed(2)} Now
            </Button>
          )}
          {processing && (
            <div className="w-full bg-[#e63946] text-white py-6 text-lg rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Opening Razorpay Payment Gateway...
            </div>
          )}
          {!processing && (
            <Button
              onClick={() => {
                setPaymentTriggered(false);
                onClose();
              }}
              disabled={processing}
              variant="outline"
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Secure payment powered by Razorpay. Your payment details are safe.
        </p>
      </div>
    </div>
  );
}
