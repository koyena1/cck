'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const details = localStorage.getItem('orderDetails');
    if (details) {
      setOrderDetails(JSON.parse(details));
    }
  }, []);

  if (!orderDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600 mb-4">No order details found</p>
            <Button onClick={() => router.push('/categories')}>
              Browse Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed!</h1>
            <p className="text-slate-600 mb-8">Your order has been successfully placed</p>
            
            <div className="bg-slate-50 rounded-lg p-6 mb-6 text-left">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Product:</span>
                  <span className="font-semibold">{orderDetails.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Quantity:</span>
                  <span className="font-semibold">{orderDetails.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Product Price:</span>
                  <span className="font-semibold">₹{(parseFloat(orderDetails.productPrice) * orderDetails.quantity).toLocaleString()}</span>
                </div>
                
                {orderDetails.withInstallation && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Installation:</span>
                    <span className="font-semibold">₹{orderDetails.installationCost.toLocaleString()}</span>
                  </div>
                )}
                
                {orderDetails.selectedAmc && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">AMC:</span>
                    <span className="font-semibold">₹{orderDetails.amcCost.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-[#e63946]">₹{orderDetails.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              A confirmation email has been sent to your registered email address.
            </p>
            
            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/categories')}
                variant="outline"
                className="flex-1"
              >
                Continue Shopping
              </Button>
              <Button
                onClick={() => router.push('/')}
                className="flex-1 bg-[#e63946] hover:bg-[#d62839]"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
