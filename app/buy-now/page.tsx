'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, ShoppingCart, Package } from 'lucide-react';

interface InstallationSettings {
  installationCost: number;
  amcOptions: {
    with_1year: number;
    with_2year: number;
    without_1year: number;
    without_2year: number;
  };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  quantity?: number;
}

function BuyNowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');
  const productPrice = searchParams.get('price');
  const itemsParam = searchParams.get('items');
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [withInstallation, setWithInstallation] = useState(false);
  const [withAmc, setWithAmc] = useState(false);
  const [amcMaterial, setAmcMaterial] = useState<'with' | 'without' | null>(null);
  const [amcDuration, setAmcDuration] = useState<'1year' | '2year' | null>(null);
  const [settings, setSettings] = useState<InstallationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Customer details form
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [landmark, setLandmark] = useState('');

  useEffect(() => {
    // Priority 1: Load from buyNowCart (from cart checkout)
    const buyNowCart = localStorage.getItem('buyNowCart');
    if (buyNowCart) {
      try {
        const items = JSON.parse(buyNowCart);
        setCartItems(items);
        // Clear after loading
        localStorage.removeItem('buyNowCart');
      } catch (error) {
        console.error('Error parsing buyNowCart:', error);
      }
    } 
    // Priority 2: Load from URL items parameter (fallback)
    else if (itemsParam) {
      try {
        const items = JSON.parse(itemsParam);
        setCartItems(items);
      } catch (error) {
        console.error('Error parsing cart items:', error);
      }
    } 
    // Priority 3: Single product from direct Buy Now
    else if (productId && productName && productPrice) {
      setCartItems([{
        id: productId,
        name: productName,
        price: parseFloat(productPrice),
      }]);
    }
    // Priority 4: Load from regular cart if nothing else
    else {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const items = JSON.parse(savedCart);
          setCartItems(items);
        } catch (error) {
          console.error('Error loading cart:', error);
        }
      }
    }
    
    fetchSettings();
  }, [itemsParam, productId, productName, productPrice]);

  const fetchSettings = async () => {
    try {
      // Fetch installation charges from quotation settings
      const quotationRes = await fetch('/api/quotation-settings');
      const quotationData = await quotationRes.json();
      
      // Fetch AMC options from installation settings
      const amcRes = await fetch('/api/installation-settings');
      const amcData = await amcRes.json();
      
      console.log('Quotation settings response:', quotationData);
      console.log('Installation charges value:', quotationData.settings?.installation_charges_base);
      console.log('AMC settings response:', amcData);
      
      const installationCost = quotationData.settings?.installation_charges_base 
        ? parseFloat(quotationData.settings.installation_charges_base)
        : 5000;
      
      console.log('Final installation cost:', installationCost);
      
      if (quotationData && amcData.success) {
        setSettings({
          installationCost: installationCost,
          amcOptions: amcData.settings.amcOptions
        });
        console.log('Settings loaded:', {
          installationCost: installationCost,
          amcOptions: amcData.settings.amcOptions
        });
      } else {
        // Set default settings if API fails
        setSettings({
          installationCost: installationCost,
          amcOptions: {
            with_1year: 400,
            with_2year: 700,
            without_1year: 250,
            without_2year: 200
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Set default settings on error
      setSettings({
        installationCost: 5000,
        amcOptions: {
          with_1year: 400,
          with_2year: 700,
          without_1year: 250,
          without_2year: 200
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    // Calculate total product price from all cart items with quantities
    let total = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    
    if (withInstallation && settings) {
      total += settings.installationCost;
    }
    
    if (withAmc && settings && amcMaterial && amcDuration) {
      const key = `${amcMaterial}_${amcDuration}` as keyof typeof settings.amcOptions;
      total += (settings.amcOptions[key] || 0);
    }
    
    return total;
  };

  const getProductsTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const handleConfirm = () => {
    // Store order details and proceed to checkout
    const orderDetails = {
      products: cartItems,
      productsTotal: getProductsTotal(),
      withInstallation,
      installationCost: withInstallation ? settings?.installationCost : 0,
      withAmc,
      amcDetails: withAmc && amcMaterial && amcDuration ? { material: amcMaterial, duration: amcDuration } : null,
      amcCost: withAmc && settings && amcMaterial && amcDuration ? (settings.amcOptions[`${amcMaterial}_${amcDuration}` as keyof typeof settings.amcOptions] || 0) : 0,
      total: calculateTotal(),
      customerDetails: {
        name: customerName,
        email,
        phone,
        address,
        city,
        state,
        pinCode,
        landmark
      }
    };
    
    localStorage.setItem('orderDetails', JSON.stringify(orderDetails));
    router.push('/checkout');
  };

  const validateForm = () => {
    if (!customerName.trim()) return { valid: false, message: 'Name is required' };
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, message: 'Valid email is required' };
    if (!phone.trim() || !/^\d{10}$/.test(phone)) return { valid: false, message: 'Valid 10-digit phone number is required' };
    if (!address.trim()) return { valid: false, message: 'Address is required' };
    if (!city.trim()) return { valid: false, message: 'City is required' };
    if (!state.trim()) return { valid: false, message: 'State is required' };
    if (!pinCode.trim() || !/^\d{6}$/.test(pinCode)) return { valid: false, message: 'Valid 6-digit PIN code is required' };
    return { valid: true, message: '' };
  };

  const handleRazorpay = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      // First create order in database
      const orderResult = await submitOrder('razorpay');
      if (!orderResult) return;

      const { orderNumber, totalAmount } = orderResult;

      // Create Razorpay order
      const razorpayResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          receipt: orderNumber,
          notes: {
            orderNumber,
            customerName,
            phone,
          },
        }),
      });

      const razorpayData = await razorpayResponse.json();

      if (!razorpayData.success) {
        alert(razorpayData.error || 'Failed to initialize payment');
        return;
      }

      // Development mode: Skip Razorpay and auto-verify
      if (razorpayData.devMode) {
        console.log('🧪 DEV MODE - Simulating successful payment...');
        
        const verifyResponse = await fetch('/api/razorpay/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: razorpayData.orderId,
            razorpay_payment_id: `pay_DEV${Date.now()}`,
            razorpay_signature: 'dev_signature',
            order_number: orderNumber,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
          alert('✅ Payment successful (DEV MODE)! Order placed.');
          localStorage.removeItem('cart');
          localStorage.removeItem('cartCheckout');
          router.push('/');
        }
        return;
      }

      // Production mode: Use real Razorpay
      // Initialize Razorpay checkout
      const options = {
        key: 'rzp_test_SC7jHw0oYI68Ps', // Your Razorpay test key
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'CCTV Store',
        description: `Order #${orderNumber}`,
        order_id: razorpayData.orderId,
        handler: async function (response: any) {
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
            alert('Payment successful! Order placed.');
            localStorage.removeItem('cart');
            localStorage.removeItem('cartCheckout');
            router.push('/');
          } else {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: customerName,
          email: email,
          contact: phone,
        },
        theme: {
          color: '#e63946',
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      alert('Payment initialization failed. Please try again.');
    }
  };

  const handleCOD = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Create order in database
    await submitOrder('cod');
  };

  const submitOrder = async (paymentMethod: 'razorpay' | 'cod') => {
    try {
      const orderData = {
        customerName,
        email,
        phone,
        address,
        city,
        state,
        pinCode,
        landmark,
        products: cartItems,
        productsTotal: getProductsTotal(),
        withInstallation,
        installationCost: withInstallation ? settings?.installationCost : 0,
        withAmc,
        amcDetails: withAmc && amcMaterial && amcDuration ? { material: amcMaterial, duration: amcDuration } : null,
        amcCost: withAmc && settings && amcMaterial && amcDuration ? (settings.amcOptions[`${amcMaterial}_${amcDuration}` as keyof typeof settings.amcOptions] || 0) : 0,
        totalAmount: calculateTotal(),
        paymentMethod,
        status: 'pending'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (paymentMethod === 'cod') {
          alert('Order placed successfully with COD!');
          localStorage.removeItem('cart');
          localStorage.removeItem('cartCheckout');
          router.push('/');
          return null;
        }
        
        // For Razorpay, return order details
        return {
          orderNumber: result.order.order_number,
          totalAmount: result.order.total_amount,
        };
      } else {
        alert('Failed to place order. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error placing order. Please try again.');
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e63946] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <button onClick={() => router.back()} className="hover:text-[#e63946]">Products</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-medium">Configure Purchase</span>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-start gap-4 mb-4">
              <ShoppingCart className="w-8 h-8 text-[#e63946]" />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {cartItems.length > 1 ? `${cartItems.length} Products` : cartItems[0]?.name || 'Product'}
                </h1>
              </div>
            </div>
            
            {/* Product List */}
            <div className="space-y-3 border-t pt-4">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    {item.category && (
                      <p className="text-sm text-slate-500">{item.category}</p>
                    )}
                    {item.quantity && item.quantity > 1 && (
                      <p className="text-xs text-slate-600 mt-1">Quantity: {item.quantity}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[#e63946]">
                      ₹{item.price.toLocaleString()}
                    </p>
                    {item.quantity && item.quantity > 1 && (
                      <p className="text-xs text-slate-500">
                        ₹{(item.price * item.quantity).toLocaleString()} total
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                <p className="font-bold text-slate-900">Products Total ({getTotalItems()} items)</p>
                <p className="text-xl font-bold text-[#e63946]">
                  ₹{getProductsTotal().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Installation Option */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="w-6 h-6 text-[#e63946]" />
              <h2 className="text-xl font-bold text-slate-900">Installation Service</h2>
            </div>
            
            <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg hover:border-[#e63946] cursor-pointer transition-colors">
              <Checkbox
                checked={withInstallation}
                onCheckedChange={(checked) => setWithInstallation(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-900 mb-1">
                  With Installation
                </p>
                <p className="text-sm text-slate-600 mb-2">
                  Professional installation service by certified technicians
                </p>
                <p className="text-lg font-bold text-[#e63946]">
                  ₹{settings?.installationCost.toLocaleString()}
                </p>
              </div>
            </label>
          </div>

          {/* AMC Options */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-[#e63946] transition-colors">
              <Checkbox
                checked={withAmc}
                onCheckedChange={(checked) => {
                  console.log('AMC checkbox clicked:', checked);
                  console.log('Current settings:', settings);
                  setWithAmc(checked as boolean);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  Annual Maintenance Contract (AMC) - Optional
                </h2>
                <p className="text-sm text-slate-600">
                  Get hassle-free maintenance for your CCTV system
                </p>
              </div>
            </label>

            {/* Nested AMC Options */}
            {withAmc && settings && (
              <div className="mt-4 ml-8 space-y-3">
                <h3 className="font-semibold text-slate-900 mb-2">Choose Material Option:</h3>
                
                {/* With Material */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    amcMaterial === 'with' ? 'border-[#e63946] bg-red-50' : 'border-slate-200 hover:border-[#e63946]'
                  }`}>
                    <Checkbox
                      checked={amcMaterial === 'with'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAmcMaterial('with');
                          setAmcDuration(null);
                        } else {
                          setAmcMaterial(null);
                          setAmcDuration(null);
                        }
                      }}
                      className="mt-0"
                    />
                    <span className="font-medium text-slate-900">With Material</span>
                  </label>
                  
                  {/* Year options appear only when With Material is checked */}
                  {amcMaterial === 'with' && (
                    <div className="ml-7 space-y-2 border-l-2 border-slate-200 pl-4">
                      <label className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        amcDuration === '1year' ? 'border-[#e63946] bg-red-50' : 'border-slate-200 hover:border-[#e63946]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={amcDuration === '1year'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAmcDuration('1year');
                              } else {
                                setAmcDuration(null);
                              }
                            }}
                          />
                          <span className="text-slate-900 font-medium">For 1 Year</span>
                        </div>
                        <span className="font-semibold text-[#e63946]">
                          ₹{settings.amcOptions.with_1year.toLocaleString()}/Camera
                        </span>
                      </label>
                      
                      <label className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        amcDuration === '2year' ? 'border-[#e63946] bg-red-50' : 'border-slate-200 hover:border-[#e63946]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={amcDuration === '2year'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAmcDuration('2year');
                              } else {
                                setAmcDuration(null);
                              }
                            }}
                          />
                          <span className="text-slate-900 font-medium">For 2 Years</span>
                        </div>
                        <span className="font-semibold text-[#e63946]">
                          ₹{settings.amcOptions.with_2year.toLocaleString()}/Camera
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Without Material */}
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    amcMaterial === 'without' ? 'border-[#e63946] bg-red-50' : 'border-slate-200 hover:border-[#e63946]'
                  }`}>
                    <Checkbox
                      checked={amcMaterial === 'without'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setAmcMaterial('without');
                          setAmcDuration(null);
                        } else {
                          setAmcMaterial(null);
                          setAmcDuration(null);
                        }
                      }}
                      className="mt-0"
                    />
                    <span className="font-medium text-slate-900">Without Material</span>
                  </label>
                  
                  {/* Year options appear only when Without Material is checked */}
                  {amcMaterial === 'without' && (
                    <div className="ml-7 space-y-2 border-l-2 border-slate-200 pl-4">
                      <label className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        amcDuration === '1year' ? 'border-[#e63946] bg-red-50' : 'border-slate-200 hover:border-[#e63946]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={amcDuration === '1year'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAmcDuration('1year');
                              } else {
                                setAmcDuration(null);
                              }
                            }}
                          />
                          <span className="text-slate-900 font-medium">For 1 Year</span>
                        </div>
                        <span className="font-semibold text-[#e63946]">
                          ₹{settings.amcOptions.without_1year.toLocaleString()}/Camera
                        </span>
                      </label>
                      
                      <label className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        amcDuration === '2year' ? 'border-[#e63946] bg-red-50' : 'border-slate-200 hover:border-[#e63946]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={amcDuration === '2year'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAmcDuration('2year');
                              } else {
                                setAmcDuration(null);
                              }
                            }}
                          />
                          <span className="text-slate-900 font-medium">For 2 Years</span>
                        </div>
                        <span className="font-semibold text-[#e63946]">
                          ₹{settings.amcOptions.without_2year.toLocaleString()}/Camera
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg shadow-lg p-6 mb-6">
            <div className="space-y-3 text-white">
              <div className="flex justify-between text-sm">
                <span>Products Total ({getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'})</span>
                <span>₹{getProductsTotal().toLocaleString()}</span>
              </div>
              
              {withInstallation && (
                <div className="flex justify-between text-sm">
                  <span>Installation</span>
                  <span>₹{settings?.installationCost.toLocaleString()}</span>
                </div>
              )}
              
              {withAmc && settings && amcMaterial && amcDuration && (
                <div className="flex justify-between text-sm">
                  <span>AMC ({amcMaterial === 'with' ? 'With' : 'Without'} Material - {amcDuration === '1year' ? '1 Year' : '2 Years'})</span>
                  <span>
                    ₹{(settings.amcOptions[`${amcMaterial}_${amcDuration}` as keyof typeof settings.amcOptions] || 0).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="border-t border-white/20 pt-3 mt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Amount</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Customer Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PIN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit PIN code"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Flat No, Street, Area"
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near landmark (optional)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter state"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleCOD}
              variant="outline"
              className="flex-1 border-2 border-slate-700 hover:border-slate-900 text-slate-700 hover:bg-slate-50 text-lg py-6"
            >
              COD (Cash on Delivery)
            </Button>
            <Button
              onClick={handleRazorpay}
              className="flex-1 bg-[#e63946] hover:bg-[#d62839] text-white text-lg py-6"
            >
              Pay with Razorpay
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default function BuyNowPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-12 h-12 animate-pulse mx-auto mb-4 text-[#e63946]" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <BuyNowContent />
    </Suspense>
  );
}
