// app/track-order/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Shield, 
  CheckCircle2, 
  MapPin,
  Calendar,
  User,
  CreditCard,
  Loader2
} from "lucide-react";

export default function TrackOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const email = localStorage.getItem('customerEmail');
    const token = localStorage.getItem('customerToken');
    
    if (!email || !token) {
      // Not logged in, redirect to home with login prompt
      router.push('/?login=true');
      return;
    }
    
    setCustomerEmail(email);
    fetchOrders(email);
  }, [router]);

  const fetchOrders = async (email: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/track-order/by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err: any) {
      console.error("Fetch orders error:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "in progress": "bg-blue-100 text-blue-800 border-blue-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
    };
    return colors[statusLower] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-[#e63946] mx-auto mb-4 animate-spin" />
              <p className="text-slate-600">Loading your orders...</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 text-[#e63946] mx-auto mb-4" />
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Track Your Orders
            </h1>
            <p className="text-slate-600">View all your order details and status</p>
          </div>

          {error && (
            <Card className="bg-red-50 border-red-200 mb-6">
              <CardContent className="p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Orders List */}
            <Card className="bg-white shadow-xl">
              <CardHeader className="bg-slate-900 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>Your Orders ({orders.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-semibold text-lg mb-2">No orders found</p>
                    <p className="text-sm text-slate-500">You haven't placed any orders yet.</p>
                    <Button
                      onClick={() => router.push('/')}
                      className="mt-6 bg-[#e63946] hover:bg-red-700"
                    >
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                    <div className="space-y-4">
                      {orders.map((order: any) => (
                        <div
                          key={order.order_id}
                          className="p-4 border border-slate-200 rounded-lg hover:border-[#e63946] transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-mono font-bold text-slate-900">{order.order_number}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              {order.order_type === 'product_cart' ? '🛒 Cart Order' : 
                               order.order_type === 'hd_combo' ? '📦 HD Combo' :
                               order.order_type === 'quotation' ? '📋 Quotation' : 
                               order.order_type}
                            </span>
                            <span className="font-bold text-[#e63946]">
                              ₹{order.total_amount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Selected Order Details */}
              {selectedOrder && (
                <Card className="bg-white shadow-xl">
                  <CardHeader className="bg-[#e63946] text-white">
                    <CardTitle className="flex items-center justify-between">
                      <span>Order Details</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedOrder(null)}
                        className="text-white hover:bg-white/20"
                      >
                        ✕ Close
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-3">
                        <User className="text-[#e63946] mt-1" size={20} />
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500">Customer</p>
                          <p className="text-sm font-bold text-slate-900">{selectedOrder.customer_name}</p>
                          <p className="text-xs text-slate-600">{selectedOrder.customer_phone}</p>
                          {selectedOrder.customer_email && (
                            <p className="text-xs text-slate-600">{selectedOrder.customer_email}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="text-[#e63946] mt-1" size={20} />
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500">Location</p>
                          <p className="text-sm text-slate-900">{selectedOrder.installation_address || selectedOrder.address}</p>
                          <p className="text-xs text-slate-600">
                            {selectedOrder.city}, {selectedOrder.state} - {selectedOrder.pincode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="text-[#e63946] mt-1" size={20} />
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500">Order Date</p>
                          <p className="text-sm font-bold text-slate-900">
                            {new Date(selectedOrder.created_at).toLocaleDateString('en-IN')}
                          </p>
                          {selectedOrder.expected_delivery_date && (
                            <p className="text-xs text-slate-600">
                              Expected: {new Date(selectedOrder.expected_delivery_date).toLocaleDateString('en-IN')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CreditCard className="text-[#e63946] mt-1" size={20} />
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-500">Payment</p>
                          <p className="text-2xl font-black text-[#e63946]">
                            ₹{selectedOrder.total_amount?.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-slate-600">
                            {selectedOrder.payment_method?.toUpperCase() || 'N/A'} • {selectedOrder.payment_status}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs font-bold uppercase text-slate-500 mb-2">Current Status</p>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(selectedOrder.status)} text-sm px-3 py-1`}>
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
