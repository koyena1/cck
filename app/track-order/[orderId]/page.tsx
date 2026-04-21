"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowLeft,
  CheckCheck,
  CreditCard,
  Loader2,
  MapPin,
  PlusCircle,
  Calendar,
  RefreshCw,
  User,
} from "lucide-react";

const PROGRESS_STATUS_OPTIONS = [
  { value: 'In Progress', emoji: '🔧' },
  { value: 'Order Packing Done', emoji: '📦' },
  { value: 'Order Dispatch', emoji: '🚚' },
  { value: 'Order Delivery Done', emoji: '✅' },
] as const;

export default function TrackOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async (email: string, showLoader = false) => {
    if (!orderId) return;

    if (showLoader) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch(`/api/track-order/by-email/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setOrder(data.order);
      } else {
        setError(data.error || "Order not found");
      }
    } catch (err) {
      console.error("Order detail fetch error:", err);
      setError("Failed to load order details. Please try again.");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [orderId]);

  useEffect(() => {
    const email = localStorage.getItem("customerEmail");
    const token = localStorage.getItem("customerToken");

    if (!email || !token) {
      router.push("/?login=true");
      return;
    }

    fetchOrder(email, true);

    // Keep status and progress in sync with backend changes.
    const intervalId = setInterval(() => {
      fetchOrder(email, false);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchOrder, router]);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "order placed": "bg-blue-100 text-blue-800 border-blue-200",
      "in progress": "bg-blue-100 text-blue-800 border-blue-200",
      "in-progress": "bg-blue-100 text-blue-800 border-blue-200",
      "order packing done": "bg-orange-100 text-orange-800 border-orange-200",
      "order dispatch": "bg-purple-100 text-purple-800 border-purple-200",
      "order delivery done": "bg-green-100 text-green-800 border-green-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      accepted: "bg-blue-100 text-blue-800 border-blue-200",
      awaiting: "bg-purple-100 text-purple-800 border-purple-200",
    };

    if (statusLower.includes("awaiting")) {
      return colors.awaiting;
    }

    return colors[statusLower] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatStatus = (status: string) => status?.replace(/_/g, " ") || "Unknown";

  const getCustomerFacingStatus = (status: string) => {
    const statusLower = status?.toLowerCase() || "";

    if (statusLower === "awaiting dealer confirmation" || statusLower === "pending admin review") {
      return "Order Placed";
    }

    if (statusLower === "declined") {
      return "Cancelled";
    }

    if (statusLower === "accepted") {
      return "In Progress";
    }

    return status;
  };

  const getDisplayStatus = (orderData: any) => {
    const latestHistoryStatus = orderData?.statusHistory?.[0]?.status;
    if (latestHistoryStatus) {
      return getCustomerFacingStatus(latestHistoryStatus);
    }

    const updates = orderData?.progressUpdates || [];
    if (updates.length > 0) {
      return getCustomerFacingStatus(updates[updates.length - 1].status_label);
    }

    return getCustomerFacingStatus(orderData?.status || "Unknown");
  };

  const toAmount = (value: any) => {
    const parsed = parseFloat(String(value ?? 0));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatAmount = (value: any) => `RS ${toAmount(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-slate-50 min-h-screen">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" onClick={() => router.push("/track-order")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>
            {order?.order_number && (
              <p className="font-mono text-sm text-slate-600">{order.order_number?.replace(/-\d{3}$/, "") ?? order.order_number}</p>
            )}
          </div>

          {loading && (
            <Card className="bg-white shadow-xl">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-10 h-10 text-[#e63946] mx-auto mb-3 animate-spin" />
                <p className="text-slate-600">Loading order details...</p>
              </CardContent>
            </Card>
          )}

          {!loading && error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-red-700 text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          {!loading && order && (
            (() => {
              const displayStatus = getDisplayStatus(order);
              return (
            <Card className="bg-white shadow-xl">
              <CardHeader className="bg-[#e63946] text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>Order Details</span>
                  <Badge className={`${getStatusColor(displayStatus)} text-sm px-3 py-1`}>
                    {formatStatus(displayStatus)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <User className="text-[#e63946] mt-1" size={20} />
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Customer</p>
                      <p className="text-sm font-bold text-slate-900">{order.customer_name}</p>
                      <p className="text-xs text-slate-600">{order.customer_phone}</p>
                      {order.customer_email && (
                        <p className="text-xs text-slate-600">{order.customer_email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-[#e63946] mt-1" size={20} />
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Location</p>
                      <p className="text-sm text-slate-900">{order.installation_address}</p>
                      <p className="text-xs text-slate-600">
                        {order.city}, {order.state} - {order.pincode}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="text-[#e63946] mt-1" size={20} />
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Order Date</p>
                      <p className="text-sm font-bold text-slate-900">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </p>
                      {order.expected_delivery_date && (
                        <p className="text-xs text-slate-600">
                          Expected: {new Date(order.expected_delivery_date).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard className="text-[#e63946] mt-1" size={20} />
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-500">Payment</p>
                      <p className="text-2xl font-black text-[#e63946]">
                        RS {order.total_amount?.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-600">
                        {order.payment_method?.toUpperCase() || "N/A"} • {order.payment_status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs font-bold uppercase text-slate-500 mb-2">Current Status</p>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(displayStatus)} text-sm px-3 py-1`}>
                      {formatStatus(displayStatus)}
                    </Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#e63946]" />
                        Order Progress & Payment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const updates = order.progressUpdates || [];
                        const paymentSummary = order.paymentSummary || {};
                        const actualPrice = toAmount(paymentSummary.actual_price || order.products_total || order.subtotal);
                        const installationCharges = toAmount(paymentSummary.installation_charges || order.installation_charges);
                        const amcCharges = toAmount(paymentSummary.amc_charges || order.amc_cost);
                        const deliveryCharges = toAmount(paymentSummary.delivery_charges || order.delivery_charges);
                        const gstAmount = toAmount(paymentSummary.gst_amount || order.tax_amount);
                        const codExtraCharges = toAmount(paymentSummary.cod_extra_charges);
                        const amountAlreadyPaid = toAmount(paymentSummary.amount_already_paid || order.advance_amount);
                        const pendingOnDelivery = toAmount(paymentSummary.amount_pending_on_delivery);
                        const totalPayment = toAmount(paymentSummary.total_amount || order.total_amount);
                        const isCOD = String(order.payment_method || '').toLowerCase() === 'cod';
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

                        return (
                          <div className="space-y-3">
                            {updates.length > 0 && (
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
                            )}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs font-bold uppercase text-slate-600 mb-3">Payment Breakdown</p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Actual Product Price</span>
                                  <span className="font-semibold text-slate-900">{formatAmount(actualPrice)}</span>
                                </div>
                                {installationCharges > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Installation Charges</span>
                                    <span className="font-semibold text-slate-900">{formatAmount(installationCharges)}</span>
                                  </div>
                                )}
                                {amcCharges > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">AMC Charges</span>
                                    <span className="font-semibold text-slate-900">{formatAmount(amcCharges)}</span>
                                  </div>
                                )}
                                {deliveryCharges > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Delivery Charges</span>
                                    <span className="font-semibold text-slate-900">{formatAmount(deliveryCharges)}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">GST (18%)</span>
                                  <span className="font-semibold text-slate-900">{formatAmount(gstAmount)}</span>
                                </div>
                                {isCOD && codExtraCharges > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">COD Extra Charges</span>
                                    <span className="font-semibold text-slate-900">{formatAmount(codExtraCharges)}</span>
                                  </div>
                                )}
                                <div className="border-t pt-2 mt-2 flex items-center justify-between text-sm">
                                  <span className="font-bold text-slate-800">Total Payment</span>
                                  <span className="font-black text-[#e63946]">{formatAmount(totalPayment)}</span>
                                </div>

                                {isCOD ? (
                                  <>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-600">Advance Paid</span>
                                      <span className="font-semibold text-slate-900">{formatAmount(amountAlreadyPaid)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-slate-600">Pending on Delivery</span>
                                      <span className="font-semibold text-slate-900">{formatAmount(pendingOnDelivery)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Payment Status</span>
                                    <span className="font-semibold text-green-700">Paid</span>
                                  </div>
                                )}
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
                </div>
              </CardContent>
            </Card>
              );
            })()
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
