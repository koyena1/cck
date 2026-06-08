"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import jsPDF from "jspdf";
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
  Download,
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
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

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

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    setDownloadingInvoice(true);
    try {
      const phoneParam = order?.customer_phone ? `?phone=${encodeURIComponent(order.customer_phone)}` : '';
      const res = await fetch(`/api/orders/${orderId}/invoice${phoneParam}`);
      const data = await res.json();
      if (!data.success) { alert('Failed to fetch invoice data'); return; }

      const { invoiceNumber, order: o, items, codAmount, codPercentage } = data;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 38, 'F');
      doc.setTextColor(250, 204, 21);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PROTECHTUR', pageW / 2, 18, { align: 'center' });
      doc.setFontSize(13);
      doc.text('CUSTOMER INVOICE', pageW / 2, 31, { align: 'center' });
      y = 48;

      const customerOrderNo = o.order_number;

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice No: ${invoiceNumber}`, margin, y);
      doc.text(`Order No: ${customerOrderNo}`, pageW - margin, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, y);
      const isCodPayment = String(o.payment_method || '').toLowerCase() === 'cod';
      const paymentStatusLabel = o.payment_status || '—';
      const paymentMeta = isCodPayment
        ? 'Payment: Pay on Delivery'
        : `Payment: Online | Status: ${paymentStatusLabel}`;
      doc.text(paymentMeta, pageW - margin, y, { align: 'right' });
      y += 3;
      doc.setDrawColor(200, 210, 230);
      doc.line(margin, y + 2, pageW - margin, y + 2);
      y += 8;

      const col2 = pageW / 2 + 5;
      const rightColWidth = pageW - margin - col2 - 2;
      const leftColWidth = col2 - margin - 8;

      doc.setFillColor(220, 220, 220);
      doc.rect(margin, y - 2, leftColWidth, 7, 'F');
      doc.rect(col2, y - 2, rightColWidth, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('SELLER', margin + 2, y + 3);
      doc.text('BUYER', col2 + 2, y + 3);
      y += 8;

      let yLeft = y;
      let yRight = y;

      const sellerName = 'PROTECHTUR';
      const sellerAddress = 'Hatabari, Central Bus Stand, Contai, Purba Medinipur';
      const sellerCity = 'Contai';
      const sellerDistrict = 'Purba Medinipur';
      const sellerState = 'West Bengal';
      const sellerPin = '721401';
      const sellerPhone = '8250999523 / 8250999521 / 8250999522';
      const sellerGST = '19DNTPS0577P1ZO';

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Name:', margin, yLeft);
      yLeft += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(sellerName, margin, yLeft);
      yLeft += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Address:', margin, yLeft);
      yLeft += 4.5;

      doc.setFont('helvetica', 'normal');
      const sellerAddrLines = doc.splitTextToSize(sellerAddress, leftColWidth);
      doc.text(sellerAddrLines, margin, yLeft);
      yLeft += (sellerAddrLines.length as number) * 4.5;

      doc.setFont('helvetica', 'bold');
      doc.text('City:', margin, yLeft);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${sellerCity}`, margin + 10, yLeft);
      yLeft += 4.5;

      doc.setFont('helvetica', 'bold');
      doc.text('District:', margin, yLeft);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${sellerDistrict}`, margin + 14, yLeft);
      yLeft += 4.5;

      doc.setFont('helvetica', 'bold');
      doc.text('State:', margin, yLeft);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${sellerState}`, margin + 12, yLeft);
      yLeft += 4.5;

      doc.setFont('helvetica', 'bold');
      doc.text('Pin:', margin, yLeft);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${sellerPin}`, margin + 8, yLeft);
      yLeft += 4.5;

      doc.setFont('helvetica', 'bold');
      doc.text('Phone Number:', margin, yLeft);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${sellerPhone}`, margin + 25, yLeft);
      yLeft += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('GST Number:', margin, yLeft);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${sellerGST}`, margin + 20, yLeft);
      yLeft += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Name:', col2, yRight);
      yRight += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(o.customer_name || '—', col2, yRight);
      yRight += 5;

      const buyerAddress = o.installation_address || '—';
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', col2, yRight);
      yRight += 4.5;

      doc.setFont('helvetica', 'normal');
      const buyerAddrLines = doc.splitTextToSize(buyerAddress, rightColWidth);
      doc.text(buyerAddrLines, col2, yRight);
      yRight += (buyerAddrLines.length as number) * 4.5;

      if (o.pincode) {
        doc.setFont('helvetica', 'bold');
        doc.text('Pincode:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${o.pincode}`, col2 + 16, yRight);
        yRight += 4.5;
      }

      if (o.state) {
        doc.setFont('helvetica', 'bold');
        doc.text('State:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${o.state}`, col2 + 12, yRight);
        yRight += 4.5;
      }

      if (o.city) {
        doc.setFont('helvetica', 'bold');
        doc.text('City:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${o.city}`, col2 + 10, yRight);
        yRight += 4.5;
      }

      const buyerPhone = o.customer_phone || o.phone || '';
      if (buyerPhone) {
        doc.setFont('helvetica', 'bold');
        doc.text('Phone:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${buyerPhone}`, col2 + 13, yRight);
        yRight += 4.5;
      }

      const customerGSTIN = o.customer_gstin || o.gst_number || o.gstNumber || o.gstin || '';
      doc.setFont('helvetica', 'bold');
      doc.text('GST Number:', col2, yRight);
      doc.setFont('helvetica', 'normal');
      doc.text(` ${customerGSTIN || '-'}`, col2 + 22, yRight);
      yRight += 4.5;

      y = Math.max(yLeft, yRight) + 3;
      doc.setDrawColor(200, 210, 230);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
      doc.setTextColor(255, 255, 255);
      const colSNo = margin + 2, colProductId = margin + 11, colDesc = margin + 39, colHsn = margin + 73;
      const colQty = margin + 94, colUPrice = margin + 105, colTotal = margin + 126;
      const colGST = margin + 145, colSGST = margin + 158, colCGST = margin + 173;
      doc.setFontSize(7.5);
      doc.text('S.No', colSNo, y + 5);
      doc.text('Product Unique_ID', colProductId, y + 5);
      doc.text('Description', colDesc, y + 5);
      doc.text('HSN Code', colHsn, y + 5);
      doc.text('Qty', colQty, y + 5);
      doc.text('Unit Price', colUPrice, y + 5);
      doc.text('Total', colTotal, y + 5);
      doc.text('GST%', colGST, y + 5);
      doc.text('SGST', colSGST, y + 5);
      doc.text('CGST', colCGST, y + 5);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      let itemsSum = 0;
      (items || []).forEach((item: any, idx: number) => {
        if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 1, pageW - 2 * margin, 7, 'F'); }
        doc.setTextColor(15, 23, 42);

        const itemTotal = parseFloat(item.total_price);
        const itemUnitPrice = parseFloat(item.unit_price);
        const itemQty = parseFloat(item.quantity);
        const gstAmount = Math.round((itemTotal * 0.18) * 100) / 100;
        const sgstAmount = Math.round((gstAmount / 2) * 100) / 100;
        const cgstAmount = Math.round((gstAmount - sgstAmount) * 100) / 100;
        const fallbackSource = item.product_id ?? item.id ?? item.item_id ?? (idx + 1);
        const productUniqueId = item.product_code || `PIC${String(fallbackSource).padStart(3, '0')}`;
        const itemLabel = item.item_name;

        doc.text(String(idx + 1), colSNo, y + 4);
        doc.text(String(productUniqueId), colProductId, y + 4);
        doc.text(doc.splitTextToSize(itemLabel, 32)[0], colDesc, y + 4);
        doc.text(String(item.hsn_code || ''), colHsn, y + 4);
        doc.text(String(itemQty), colQty, y + 4);
        doc.text(`${itemUnitPrice.toFixed(2)}`, colUPrice, y + 4);
        doc.text(`${itemTotal.toFixed(2)}`, colTotal, y + 4);
        doc.text('18%', colGST, y + 4);
        doc.text(`${sgstAmount.toFixed(2)}`, colSGST, y + 4);
        doc.text(`${cgstAmount.toFixed(2)}`, colCGST, y + 4);

        itemsSum += itemTotal;
        y += 7;
      });

      y += 4;
      doc.setDrawColor(200, 210, 230);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      const totalsX = pageW - margin - 60, totalsValX = pageW - margin;
      const addRow = (label: string, val: number, bold = false, color?: number[]) => {
        if (val === 0) return;
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...(color || [15, 23, 42]) as [number, number, number]);
        doc.text(label, totalsX, y);
        doc.text(`Rs.${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValX, y, { align: 'right' });
        y += 6;
      };
      const productTotal = itemsSum;

      addRow('Product Total:', productTotal);

      let codCharges = 0;
      if (o.payment_method === 'cod') {
        codCharges = codAmount || 500;
        if (codCharges > 0) addRow('COD Extra Charges:', codCharges);
      }

      const taxableTotal = productTotal + codCharges;
      const finalSGST = Math.round(taxableTotal * 0.09 * 100) / 100;
      const finalCGST = Math.round(taxableTotal * 0.09 * 100) / 100;

      if (taxableTotal > 0) {
        addRow('SGST (9%):', finalSGST);
        addRow('CGST (9%):', finalCGST);
      }

      const grandTotal = taxableTotal + finalSGST + finalCGST;

      doc.setFillColor(15, 23, 42);
      doc.rect(totalsX - 4, y - 1, pageW - margin - totalsX + 4 + margin - margin, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(250, 204, 21);
      doc.text('GRAND TOTAL', totalsX, y + 6);
      doc.text(`Rs.${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValX, y + 6, { align: 'right' });
      y += 16;

      if (isCodPayment) {
        const round2 = (val: number) => Math.round(val * 100) / 100;
        const codPercentValue = parseFloat(String(codPercentage || 0)) || 0;
        const advanceFromDb = round2(parseFloat(String(o.advance_amount || 0)) || 0);
        const advanceFromPercent = codPercentValue > 0
          ? round2((grandTotal * codPercentValue) / 100)
          : 0;
        const amountAlreadyPaid = Math.max(advanceFromDb, advanceFromPercent);
        const amountDueOnDelivery = round2(Math.max(0, grandTotal - amountAlreadyPaid));
        const pageHeight = doc.internal.pageSize.getHeight();

        if (y > pageHeight - 40) {
          doc.addPage();
          y = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text('Important Note:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(
          `Already paid: Rs.${amountAlreadyPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          margin, y
        );
        y += 4.5;
        doc.text(
          `Pay on delivery (COD): Rs.${amountDueOnDelivery.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          margin, y
        );
        y += 6;
      }

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 18, pageW, 18, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(200, 210, 230);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for choosing Protechtur. For support, contact us via our website.', pageW / 2, pageH - 10, { align: 'center' });
      doc.text(`Invoice ID: ${invoiceNumber}`, pageW / 2, pageH - 5, { align: 'center' });
      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Invoice generation error:', err);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => router.push("/track-order")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="border-slate-300 text-slate-700 hover:bg-slate-100"
              >
                {downloadingInvoice ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Invoice
                  </>
                )}
              </Button>
            </div>
            {order?.order_number && (
              <p className="font-mono text-sm text-slate-600">{order.order_number}</p>
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
