// app/track-order/page.tsx
"use client";
import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Phone, 
  Shield, 
  Truck, 
  CheckCircle2, 
  Clock,
  MapPin,
  Calendar,
  User,
  CreditCard
} from "lucide-react";

export default function TrackOrderPage() {
  // Step 1: Enter Phone Number
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  // Step 2: Verify OTP
  const [otpCode, setOtpCode] = useState("");
  const [verified, setVerified] = useState(false);
  
  // Step 3: Display Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/track-order/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        setError("");
        // Show dev OTP in console for testing
        if (data.devOtp) {
          console.log("DEV OTP:", data.devOtp);
          alert(`DEV MODE: OTP is ${data.devOtp}`);
        }
      } else {
        setError(data.message || data.error || "No orders found for this phone number");
      }
    } catch (err: any) {
      console.error("Send OTP error:", err);
      setError("Failed to send OTP. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/track-order/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otpCode }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVerified(true);
        setOrders(data.orders || []);
        setError("");
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Failed to verify OTP. Please try again.");
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

  const StatusTimeline = ({ history }: { history: any[] }) => (
    <div className="space-y-4">
      {history.map((item, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#e63946] flex items-center justify-center text-white">
              <CheckCircle2 size={20} />
            </div>
            {index < history.length - 1 && (
              <div className="w-0.5 h-12 bg-slate-200 my-2"></div>
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="font-bold text-sm text-slate-900">{item.status}</p>
            <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
            {item.remarks && <p className="text-xs text-slate-600 mt-1">{item.remarks}</p>}
          </div>
        </div>
      ))}
    </div>
  );

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
            <p className="text-slate-600">Secure access with OTP verification</p>
          </div>

          {!verified ? (
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="text-[#e63946]" size={24} />
                  {!otpSent ? "Enter Your Phone Number" : "Verify OTP"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="text-sm font-bold uppercase text-slate-700 mb-2 block">
                        Registered Mobile Number
                      </label>
                      <Input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                        className="text-lg"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Enter the phone number you used when placing your orders
                      </p>
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    <Button
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full bg-[#e63946] hover:bg-red-700 h-14 text-lg font-bold"
                    >
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-bold text-green-800">
                        ✓ OTP sent to +91 {phoneNumber}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Please check your SMS messages
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-bold uppercase text-slate-700 mb-2 block">
                        Enter 6-Digit OTP
                      </label>
                      <Input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="text-2xl font-mono text-center tracking-widest"
                        onKeyPress={(e) => e.key === 'Enter' && handleVerifyOTP()}
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError("");
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Change Number
                      </Button>
                      <Button
                        onClick={handleVerifyOTP}
                        disabled={loading}
                        className="flex-1 bg-[#e63946] hover:bg-red-700 font-bold"
                      >
                        {loading ? "Verifying..." : "Verify & View Orders"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Orders List */}
              <Card className="bg-white shadow-xl">
                <CardHeader className="bg-slate-900 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Orders ({orders.length})</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setVerified(false);
                        setOtpSent(false);
                        setOtpCode("");
                        setPhoneNumber("");
                        setOrders([]);
                        setSelectedOrder(null);
                      }}
                      className="text-white border-white hover:bg-white hover:text-slate-900"
                    >
                      Logout
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-semibold">No orders found</p>
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
                        <span className="text-xs text-slate-500">
                          Last updated: {new Date(selectedOrder.updated_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
