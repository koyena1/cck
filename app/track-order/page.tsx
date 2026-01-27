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
  // Step 1: Enter Order ID & Phone
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  // Step 2: OTP Verification
  const [otpCode, setOtpCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  
  // Step 3: Order Details
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    if (!orderNumber || phoneNumber.length < 10) {
      setError("Please enter valid Order ID and Phone Number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/track-order/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phoneNumber }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        setError("");
        alert(`OTP sent to ${phoneNumber}. Check your messages!`);
      } else {
        setError(data.message || "Order not found or phone number mismatch");
      }
    } catch (err) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/track-order/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phoneNumber, otpCode }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsVerified(true);
        setOrderDetails(data.order);
        setError("");
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800",
      Verified: "bg-blue-100 text-blue-800",
      Allocated: "bg-purple-100 text-purple-800",
      In_Transit: "bg-indigo-100 text-indigo-800",
      Delivered: "bg-green-100 text-green-800",
      Installation_Pending: "bg-orange-100 text-orange-800",
      Completed: "bg-green-100 text-green-800",
      Cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
            <Package className="w-16 h-16 text-[#e63946] mx-auto mb-4" />
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Track Your Order
            </h1>
            <p className="text-slate-600">Enter your order details to check the latest status</p>
          </div>

          {!isVerified ? (
            <Card className="bg-white shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="text-[#e63946]" size={24} />
                  Secure Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!otpSent ? (
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-bold uppercase text-slate-700 mb-2 block">
                          Order Number
                        </label>
                        <Input
                          placeholder="e.g., ORD-20260125-0001"
                          value={orderNumber}
                          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                          className="text-lg font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-bold uppercase text-slate-700 mb-2 block">
                          Registered Phone Number
                        </label>
                        <Input
                          type="tel"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          className="text-lg"
                        />
                      </div>
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
                        OTP sent to {phoneNumber}
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
                        Change Details
                      </Button>
                      <Button
                        onClick={handleVerifyOTP}
                        disabled={loading}
                        className="flex-1 bg-[#e63946] hover:bg-red-700 font-bold"
                      >
                        {loading ? "Verifying..." : "Verify & Track"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="bg-white shadow-xl">
                <CardHeader className="bg-slate-900 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span>Order #{orderDetails.order_number}</span>
                    <Badge className={getStatusColor(orderDetails.status)}>
                      {orderDetails.status.replace(/_/g, " ")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <User className="text-[#e63946] mt-1" size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Customer</p>
                        <p className="text-sm font-bold text-slate-900">{orderDetails.customer_name}</p>
                        <p className="text-xs text-slate-600">{orderDetails.customer_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="text-[#e63946] mt-1" size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Location</p>
                        <p className="text-sm text-slate-900">{orderDetails.installation_address}</p>
                        <p className="text-xs text-slate-600">{orderDetails.city}, {orderDetails.pincode}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="text-[#e63946] mt-1" size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Expected Delivery</p>
                        <p className="text-sm font-bold text-slate-900">
                          {orderDetails.expected_delivery_date 
                            ? new Date(orderDetails.expected_delivery_date).toLocaleDateString() 
                            : "TBD"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CreditCard className="text-[#e63946] mt-1" size={20} />
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Total Amount</p>
                        <p className="text-2xl font-black text-[#e63946]">₹{orderDetails.total_amount}</p>
                        <p className="text-xs text-slate-600">{orderDetails.payment_status}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Timeline */}
              <Card className="bg-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="text-[#e63946]" size={24} />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {orderDetails.history && orderDetails.history.length > 0 ? (
                    <StatusTimeline history={orderDetails.history} />
                  ) : (
                    <p className="text-slate-500 text-sm">No tracking history available yet.</p>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={() => {
                  setIsVerified(false);
                  setOtpSent(false);
                  setOrderNumber("");
                  setPhoneNumber("");
                  setOtpCode("");
                  setOrderDetails(null);
                }}
                variant="outline"
                className="w-full"
              >
                Track Another Order
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
