// app/guest-track-order/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Activity,
  Package,
  CheckCircle2,
  CheckCheck,
  MapPin,
  Calendar,
  User,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  Truck,
  Clock,
  Phone,
  Mail,
  Home,
} from 'lucide-react';

const PROGRESS_STATUS_OPTIONS = [
  { value: 'In Progress', emoji: '🔧' },
  { value: 'Order Packing Done', emoji: '📦' },
  { value: 'Order Dispatch', emoji: '🚚' },
  { value: 'Order Delivery Done', emoji: '✅' },
] as const;

function GuestTrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams?.get('token');

  const [orderToken, setOrderToken] = useState(tokenParam || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const trackOrder = async () => {
    if (!orderToken.trim()) {
      setError('Please enter your tracking token or order ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await fetch('/api/guest-track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderToken: orderToken.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
        setError('');
      } else {
        setError(data.message || 'Order not found. Please check your tracking token or order ID.');
        setOrder(null);
      }
    } catch (err: any) {
      console.error('Track order error:', err);
      setError('Failed to fetch order details. Please try again.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-track if token in URL
  useEffect(() => {
    if (tokenParam) {
      trackOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'in progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'order packing done': 'bg-orange-100 text-orange-800 border-orange-200',
      'order dispatch': 'bg-purple-100 text-purple-800 border-purple-200',
      'order delivery done': 'bg-green-100 text-green-800 border-green-200',
      verified: 'bg-blue-100 text-blue-800 border-blue-200',
      allocated: 'bg-purple-100 text-purple-800 border-purple-200',
      in_transit: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      installation_pending: 'bg-orange-100 text-orange-800 border-orange-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[statusLower] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      'advance paid': 'bg-blue-100 text-blue-800',
      'advance_paid': 'bg-blue-100 text-blue-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[statusLower] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getDisplayStatus = (orderData: any) => {
    return orderData?.latestProgressStatus || orderData?.status || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#e63946] rounded-full mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Track Your Order
            </h1>
            <p className="text-slate-600 text-lg">
              Enter your tracking token or order ID to view order status
            </p>
          </div>

          {/* Search Card */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="orderToken" className="text-base font-semibold">
                    Tracking Token / Order ID
                  </Label>
                  <p className="text-sm text-slate-600 mb-2">
                    Use your tracking token (TRK-YYYYMMDD-XXXXXXXX) or your order ID/number.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="orderToken"
                      type="text"
                      placeholder="e.g., TRK-20260212-ABC12345 or PR-190326-040"
                      value={orderToken}
                      onChange={(e) => setOrderToken(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                      className="flex-1 h-12 text-lg"
                      disabled={loading}
                    />
                    <Button
                      onClick={trackOrder}
                      disabled={loading || !orderToken.trim()}
                      className="bg-[#e63946] hover:bg-[#c62936] h-12 px-8"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Tracking...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Track Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          {order && (
            (() => {
              const displayStatus = getDisplayStatus(order);
              return (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <p className="font-bold text-green-900">Order Found!</p>
                  <p className="text-green-700 text-sm">
                    Your order is being processed. Details are shown below.
                  </p>
                </div>
              </div>

              {/* Order Overview Card */}
              <Card className="shadow-lg">
                <CardHeader className="bg-slate-900 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        Order #{order.order_number}
                      </CardTitle>
                      <p className="text-slate-300 text-sm">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(displayStatus)} border-2 text-sm font-semibold py-1 px-3`}>
                      {formatStatus(displayStatus)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-[#e63946]" />
                        Customer Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="text-slate-600 font-medium">Name:</span>
                          <span className="text-slate-900">{order.customer_name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
                          <span className="text-slate-900">{order.customer_phone}</span>
                        </div>
                        {order.customer_email && (
                          <div className="flex gap-2">
                            <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
                            <span className="text-slate-900">{order.customer_email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#e63946]" />
                        Delivery Address
                      </h3>
                      <div className="text-sm text-slate-900">
                        <p>{order.installation_address}</p>
                        {order.city && <p>{order.city}</p>}
                        {order.state && <p>{order.state}</p>}
                        <p className="font-medium mt-1">PIN: {order.pincode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t mt-6 pt-6 grid md:grid-cols-3 gap-4">
                    {/* Payment Info */}
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Payment Method</p>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Payment Status</p>
                      <Badge className={getPaymentStatusColor(order.payment_status)}>
                        {formatStatus(order.payment_status)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 mb-1">Total Amount</p>
                      <p className="font-bold text-xl text-[#e63946]">
                        RS {parseFloat(order.total_amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Dates */}
                  {(order.expected_delivery_date || order.actual_delivery_date) && (
                    <div className="border-t mt-6 pt-6 flex gap-6">
                      {order.expected_delivery_date && (
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-xs text-slate-600">Expected Delivery</p>
                            <p className="font-medium text-slate-900">
                              {new Date(order.expected_delivery_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      {order.actual_delivery_date && (
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-xs text-slate-600">Delivered On</p>
                            <p className="font-medium text-slate-900">
                              {formatDate(order.actual_delivery_date)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


                </CardContent>
              </Card>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#e63946]" />
                      Order Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {order.items.map((item: any, index: number) => (
                        <div key={item.item_id || index} className="py-4 flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.item_name}</p>
                            {item.product_code && <p className="text-xs text-slate-500 font-bold">{item.product_code}</p>}
                            {item.item_description && (
                              <p className="text-sm text-slate-600">{item.item_description}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-1">
                              {item.item_type} • Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">
                              RS {parseFloat(item.total_price).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-slate-500">
                              RS {parseFloat(item.unit_price).toLocaleString('en-IN')} each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="text-slate-900">
                            RS {parseFloat(order.subtotal || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                        {order.installation_charges > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Installation:</span>
                            <span className="text-slate-900">
                              RS {parseFloat(order.installation_charges).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {order.delivery_charges > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Delivery:</span>
                            <span className="text-slate-900">
                              RS {parseFloat(order.delivery_charges).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {order.tax_amount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Tax:</span>
                            <span className="text-slate-900">
                              RS {parseFloat(order.tax_amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {order.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-RS {parseFloat(order.discount_amount).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                          <span className="text-slate-900">Total:</span>
                          <span className="text-[#e63946]">
                            RS {parseFloat(order.total_amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Progress */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#e63946]" />
                    Order Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const updates = order.progressUpdates || [];
                    const latestLabel = updates.length > 0
                      ? updates[updates.length - 1].status_label
                      : '';
                    const latestIndex = Math.max(
                      0,
                      PROGRESS_STATUS_OPTIONS.findIndex((opt) => opt.value === latestLabel)
                    );
                    const isDeliveryDone = updates.some(
                      (u: any) => u.is_delivery_done || u.status_label === 'Order Delivery Done'
                    );

                    if (updates.length === 0) {
                      return (
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Waiting for dealer to post progress updates.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <div className="overflow-x-auto pb-2">
                          <div className="min-w-140 px-2">
                            <div className="relative">
                              <div className="absolute left-6 right-6 top-4 h-1 rounded-full bg-slate-300" />
                              <div
                                className="absolute left-6 top-4 h-1 rounded-full bg-green-500 transition-all duration-300"
                                style={{
                                  width: `${Math.max(0, (latestIndex / (PROGRESS_STATUS_OPTIONS.length - 1)) * 100)}%`,
                                  right: 'auto'
                                }}
                              />
                              <div className="relative flex items-start justify-between gap-2">
                                {PROGRESS_STATUS_OPTIONS.map((opt, idx) => {
                                  const isDone = idx <= latestIndex;
                                  const isCurrent = idx === latestIndex && !isDeliveryDone;
                                  return (
                                    <div key={opt.value} className="w-28 shrink-0 text-center">
                                      <div
                                        className={`mx-auto w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                                          isDone
                                            ? 'bg-green-500 border-green-600 text-white'
                                            : 'bg-slate-100 border-slate-400 text-slate-500'
                                        } ${isCurrent ? 'ring-2 ring-green-200' : ''}`}
                                      >
                                        {isDone ? '✓' : idx + 1}
                                      </div>
                                      <p className={`mt-1 text-[11px] font-semibold leading-tight ${isDone ? 'text-green-700' : 'text-slate-500'}`}>
                                        {opt.value}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {isDeliveryDone && (
                          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-300 rounded-xl">
                            <CheckCheck className="w-5 h-5 text-green-600 shrink-0" />
                            <div>
                              <p className="text-sm font-bold text-green-800">Delivery Completed!</p>
                              <p className="text-xs text-green-600">The order has been closed.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Order Timeline — customer-visible events only */}
              {order.statusHistory && order.statusHistory.length > 0 && false && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#e63946]" />
                      Order Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.statusHistory.map((history: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-[#e63946]' : 'bg-slate-300'}`} />
                            {index < order.statusHistory.length - 1 && (
                              <div className="w-0.5 h-full bg-slate-200 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="flex justify-between items-start mb-1">
                              <Badge className={`${getStatusColor(history.status)} text-xs`}>
                                {history.status === 'Awaiting Dealer Confirmation' ? 'Being Processed' : formatStatus(history.status)}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {formatDate(history.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mt-2">{history.remarks}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Help Card */}
              <Card className="bg-blue-50 border-blue-200 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Need Help?</h3>
                      <p className="text-sm text-slate-700 mb-3">
                        If you have any questions about your order, please contact our support team.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/contact')}
                        className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
              );
            })()
          )}

          {/* No Results State */}
          {searched && !order && !loading && (
            <Card className="shadow-lg">
              <CardContent className="pt-10 pb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Order Found</h3>
                <p className="text-slate-600 mb-6">
                  Please check your tracking token and try again.
                </p>
                <Button onClick={() => router.push('/categories')} variant="outline">
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function GuestTrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#e63946]" />
      </div>
    }>
      <GuestTrackOrderContent />
    </Suspense>
  );
}
