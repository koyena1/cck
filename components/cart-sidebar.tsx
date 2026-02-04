'use client';

import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from './cart-context';
import { Button } from './ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function CartSidebar() {
  const { cart, removeFromCart, clearCart, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const router = useRouter();

  const handleBuyNow = () => {
    if (cart.length === 0) return;
    
    // Store cart items for checkout
    localStorage.setItem('cartCheckout', JSON.stringify(cart));
    setIsCartOpen(false);
    router.push('/cart-checkout');
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#e63946]" />
            <h2 className="text-xl font-bold text-slate-900">Shopping Cart</h2>
            <span className="bg-[#e63946] text-white text-xs px-2 py-1 rounded-full">
              {cart.length}
            </span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-slate-400 mt-2">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.id}-${item.category}`} className="flex gap-3 p-3 border rounded-lg hover:border-[#e63946] transition-colors">
                  {item.image && (
                    <div className="relative w-16 h-16 flex-shrink-0 bg-slate-100 rounded">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{item.name}</h3>
                    {item.category && (
                      <p className="text-xs text-slate-500 mt-1">{item.category}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[#e63946] font-bold">₹{item.price.toLocaleString()}</p>
                      {item.quantity && item.quantity > 1 && (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">x{item.quantity}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-slate-900">Total:</span>
              <span className="text-[#e63946]">₹{cartTotal.toLocaleString()}</span>
            </div>
            
            <Button
              onClick={handleBuyNow}
              className="w-full bg-[#e63946] hover:bg-[#d62839] text-white"
            >
              Buy Now
            </Button>
            
            <button
              onClick={clearCart}
              className="w-full text-sm text-slate-600 hover:text-slate-900"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
