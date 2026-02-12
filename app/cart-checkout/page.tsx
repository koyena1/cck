'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ChevronRight } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  quantity?: number;
}

export default function CartCheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('cartCheckout');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    setLoading(false);
  }, []);

  const handleBuyNow = () => {
    if (cartItems.length === 0) return;
    
    // Store cart items in localStorage and redirect
    localStorage.setItem('buyNowCart', JSON.stringify(cartItems));
    router.push('/buy-now');
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e63946]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <button onClick={() => router.back()} className="hover:text-[#e63946]">Products</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Cart</span>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingBag className="w-8 h-8 text-[#e63946]" />
              <h1 className="text-2xl font-bold text-slate-900">Your Cart ({cartItems.length} items)</h1>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Your cart is empty</p>
                <Button onClick={() => router.push('/categories')} className="mt-4">
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${item.category}-${index}`} className="flex items-center gap-4 p-4 border rounded-lg">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      {item.category && (
                        <p className="text-sm text-slate-500 mt-1">{item.category}</p>
                      )}
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-xs text-slate-600 mt-1">Quantity: {item.quantity}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#e63946]">
                        ₹{item.price.toLocaleString()}
                      </p>
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-sm text-slate-500">
                          ₹{(item.price * item.quantity).toLocaleString()} total
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Summary */}
          {cartItems.length > 0 && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg shadow-lg p-6">
              <div className="space-y-3 text-white">
                <div className="flex justify-between text-lg">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-white/20 pt-3 mt-3">
                  <div className="flex justify-between text-2xl font-bold">
                    <span>Total</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBuyNow}
                className="w-full mt-6 bg-[#e63946] hover:bg-[#d62839] text-white text-lg py-6"
              >
                Proceed to Buy Now
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
