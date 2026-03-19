"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Phone,
  MapPin,
  Edit,
  CheckCircle,
  Hash,
  RefreshCw,
  AlertCircle,
  UserCheck,
  Navigation,
  Eye,
  CreditCard,
  IndianRupee,
  Building2,
  History,
  User,
  FileText,
  X,
  BadgeCheck,
  Truck,
  Wrench,
  Tag,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRight,
  Send,
  Timer,
  UserX,
  UserCheck2,
  ShieldAlert,
  MessageSquare,
  Activity,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DistrictUser {
  district_user_id: number;
  username: string;
  full_name: string;
  district: string;
  state: string;
}

const CLOSED_STATUSES = ["completed", "delivered", "cancelled"];

function fmt(n: any) {
  return "RS " + parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getSimpleStatus(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "pending admin review") return "Needs Review";
  if (s === "awaiting dealer confirmation") return "With Dealer";
  if (s === "accepted") return "Accepted";
  if (s === "declined") return "Declined";
  if (s === "pending") return "New Order";
  if (s.includes("in-progress") || s.includes("in progress")) return "In Progress";
  if (s === "completed") return "Completed";
  if (s === "delivered") return "Delivered";
  if (s === "cancelled") return "Cancelled";
  return status || "Unknown";
}

function getStatusStyle(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "completed" || s === "delivered") return "bg-green-100 text-green-800 border-green-300";
  if (s === "cancelled") return "bg-gray-100 text-gray-700 border-gray-300";
  if (s.includes("in-progress") || s.includes("in progress")) return "bg-blue-100 text-blue-800 border-blue-300";
  if (s === "accepted") return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (s === "declined") return "bg-red-100 text-red-800 border-red-300";
  if (s === "awaiting dealer confirmation") return "bg-orange-100 text-orange-800 border-orange-300";
  if (s === "pending admin review") return "bg-rose-100 text-rose-800 border-rose-300 animate-pulse";
  return "bg-yellow-100 text-yellow-800 border-yellow-300";
}

function ViewDetailsModal({
  orderId,
  district,
  actorName,
  username,
  onClose,
  onOrderUpdated,
}: {
  orderId: number;
  district: string;
  actorName: string;
  username: string;
  onClose: () => void;
  onOrderUpdated: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignDealers, setAssignDealers] = useState<any[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchOrderData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const r = await fetch(`/api/district-portal/orders/${orderId}?district=${encodeURIComponent(district)}`);
      const d = await r.json();
      if (d.success) {
        setData(d);
        setLastRefreshed(new Date());
      }
    } finally {
      if (showSpinner) setRefreshing(false);
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
    const interval = setInterval(() => fetchOrderData(), 10000);
    return () => clearInterval(interval);
  }, [orderId, district]);

  const loadDealers = async () => {
    setShowAssign(true);
    setLoadingDealers(true);
    try {
      const res = await fetch(`/api/district-portal/reassign-order?orderId=${orderId}&district=${encodeURIComponent(district)}&includeAll=true`);
      const d = await res.json();
      if (d.success) setAssignDealers(d.dealers);
    } finally {
      setLoadingDealers(false);
    }
  };

  const assignDealer = async (dealerId: number) => {
    setAssigning(true);
    try {
      const res = await fetch('/api/district-portal/reassign-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, dealerId, district, actorName, username }),
      });
      const d = await res.json();
      if (d.success) {
        onOrderUpdated();
        onClose();
      } else {
        alert(d.error || 'Assignment failed');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      const inv = await res.json();
      if (!inv.success) {
        alert('Failed to fetch invoice data');
        return;
      }
      const { invoiceNumber, order: o, items, codAmount } = inv;
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

      const customerOrderNo = /^PR-\d{6}-\d+-\d+$/.test(o.order_number)
        ? o.order_number.replace(/-\d+$/, '')
        : o.order_number;

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice No: ${invoiceNumber}`, margin, y);
      doc.text(`Order No: ${customerOrderNo}`, pageW - margin, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, y);
      doc.text(`Payment: ${o.payment_method || '—'} | Status: ${o.payment_status || '—'}`, pageW - margin, y, { align: 'right' });

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

      const customerGSTIN = o.customer_gstin || o.gstin || '';
      if (customerGSTIN) {
        doc.setFont('helvetica', 'bold');
        doc.text('GST No.:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${customerGSTIN}`, col2 + 16, yRight);
        yRight += 4.5;
      }

      if (o.city) {
        doc.setFont('helvetica', 'bold');
        doc.text('City:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${o.city}`, col2 + 10, yRight);
        yRight += 4.5;
      }

      y = Math.max(yLeft, yRight) + 3;

      doc.setDrawColor(200, 210, 230);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, pageW - 2 * margin, 7, 'F');
      doc.setTextColor(255, 255, 255);
      const colSNo = margin + 2;
      const colProductId = margin + 10;
      const colDesc = margin + 36;
      const colQty = margin + 65;
      const colUnit = margin + 80;
      const colUPrice = margin + 92;
      const colTotal = margin + 110;
      const colDisc = margin + 128;
      const colGST = margin + 142;
      const colSGST = margin + 158;
      const colCGST = margin + 172;
      doc.setFontSize(7.5);
      doc.text('S.No', colSNo, y + 5);
      doc.text('Product Unique_ID', colProductId, y + 5);
      doc.text('Description', colDesc, y + 5);
      doc.text('Qty', colQty, y + 5);
      doc.text('Unit', colUnit, y + 5);
      doc.text('UnitPrice', colUPrice, y + 5);
      doc.text('Total', colTotal, y + 5);
      doc.text('Discount', colDisc, y + 5);
      doc.text('GST%', colGST, y + 5);
      doc.text('SGST', colSGST, y + 5);
      doc.text('CGST', colCGST, y + 5);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      let itemsSum = 0;
      (items || []).forEach((item: any, idx: number) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 1, pageW - 2 * margin, 7, 'F');
        }
        doc.setTextColor(15, 23, 42);

        const itemQty = Number(item.quantity || 0);
        const itemUnitPrice = Number(item.unit_price || 0);
        const itemTotal = Number(item.total_price || (itemUnitPrice * itemQty));
        const gstAmount = Math.round((itemTotal * 0.18) * 100) / 100;
        const sgstAmount = Math.round((gstAmount / 2) * 100) / 100;
        const cgstAmount = Math.round((gstAmount - sgstAmount) * 100) / 100;
        const fallbackSource = item.product_id ?? item.id ?? item.item_id ?? (idx + 1);
        const productUniqueId = item.product_code || `PIC${String(fallbackSource).padStart(3, '0')}`;
        const itemLabel = item.item_name;

        doc.text(String(idx + 1), colSNo, y + 4);
        doc.text(String(productUniqueId), colProductId, y + 4);
        const nameLines = doc.splitTextToSize(itemLabel, 50);
        doc.text(nameLines[0], colDesc, y + 4);
        doc.text(String(itemQty), colQty, y + 4);
        doc.text('', colUnit, y + 4);
        doc.text(`${itemUnitPrice.toFixed(2)}`, colUPrice, y + 4);
        doc.text(`${itemTotal.toFixed(2)}`, colTotal, y + 4);
        doc.text('', colDisc, y + 4);
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

      const totalsX = pageW - margin - 60;
      const totalsValX = pageW - margin;

      const addTotalRow = (label: string, val: number, bold = false, color?: number[]) => {
        if (val === 0) return;
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...(color || [15, 23, 42]) as [number, number, number]);
        doc.text(label, totalsX, y);
        doc.text(`Rs.${Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValX, y, { align: 'right' });
        y += 6;
      };

      const productTotal = itemsSum;
      addTotalRow('Product Total:', productTotal);

      let codCharges = 0;
      if (o.payment_method === 'cod') {
        codCharges = codAmount || 500;
        if (codCharges > 0) addTotalRow('COD Extra Charges:', codCharges);
      }

      const finalGST = Math.round(productTotal * 0.18 * 100) / 100;
      const finalSGST = Math.round((finalGST / 2) * 100) / 100;
      const finalCGST = Math.round((finalGST - finalSGST) * 100) / 100;
      if (finalGST > 0) {
        addTotalRow('SGST (9%):', finalSGST);
        addTotalRow('CGST (9%):', finalCGST);
      }

      const grandTotal = productTotal + finalGST + codCharges;
      doc.setFillColor(15, 23, 42);
      doc.rect(totalsX - 4, y - 1, pageW - margin - totalsX + 4, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(250, 204, 21);
      doc.text('GRAND TOTAL', totalsX, y + 6);
      doc.text(`Rs.${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValX, y + 6, { align: 'right' });

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 18, pageW, 18, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(200, 210, 230);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for choosing Protechtur. For support, contact us via our website.', pageW / 2, pageH - 10, { align: 'center' });
      doc.text(`This is a system-generated invoice. Invoice ID: ${invoiceNumber}`, pageW / 2, pageH - 5, { align: 'center' });

      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Invoice generation error:', error);
      alert('Failed to generate invoice.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="flex gap-3 rounded-2xl bg-white p-10 text-slate-500 dark:bg-slate-900 dark:text-slate-300 items-center">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading order details...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { order, orderItems, transactions, statusHistory, dealerRequests, progressUpdates = [], paymentSummary } = data;
  const statusLower = order.status?.toLowerCase() || '';
  const paidFull = paymentSummary.remaining_balance <= 0;
  const now = new Date();
  type JourneyEvent =
    | { kind: 'status'; time: Date; label: string; remarks: string | null; by: string | null }
    | { kind: 'dealer_sent'; time: Date; seq: number; dealer: string; uid: string; distance: number | null; deadline: Date; status: string; respondedAt: Date | null; declineReason: string | null }
    | { kind: 'dealer_result'; time: Date; seq: number; dealer: string; uid: string; result: 'accepted' | 'declined' | 'expired'; reason: string | null };
  const journeyEvents: JourneyEvent[] = [];
  const dealerStatuses = new Set(['accepted', 'declined', 'awaiting dealer confirmation', 'pending admin review']);
  statusHistory.forEach((h: any) => {
    const lbl = (h.status || '').toLowerCase();
    if (!dealerStatuses.has(lbl) || h.history_id === statusHistory[0]?.history_id) {
      journeyEvents.push({
        kind: 'status',
        time: new Date(h.created_at),
        label: h.status,
        remarks: h.remarks || null,
        by: h.updated_by_name || h.updated_by_dealer_name || null,
      });
    }
  });
  dealerRequests.forEach((req: any) => {
    const isExpired = req.request_status === 'pending' && new Date(req.response_deadline) < now;
    const effectiveStatus: string = isExpired ? 'expired' : req.request_status;
    journeyEvents.push({
      kind: 'dealer_sent',
      time: new Date(req.requested_at || req.created_at),
      seq: req.request_sequence,
      dealer: req.dealer_name || req.dealer_full_name || 'Unknown Dealer',
      uid: req.dealer_display_uid || '—',
      distance: req.dealer_distance_km ?? null,
      deadline: new Date(req.response_deadline),
      status: effectiveStatus,
      respondedAt: req.responded_at ? new Date(req.responded_at) : null,
      declineReason: req.decline_reason || null,
    });
    if (req.responded_at && (effectiveStatus === 'accepted' || effectiveStatus === 'declined')) {
      journeyEvents.push({
        kind: 'dealer_result',
        time: new Date(req.responded_at),
        seq: req.request_sequence,
        dealer: req.dealer_name || req.dealer_full_name || 'Unknown Dealer',
        uid: req.dealer_display_uid || '—',
        result: effectiveStatus as 'accepted' | 'declined',
        reason: req.decline_reason || null,
      });
    } else if (effectiveStatus === 'expired') {
      journeyEvents.push({
        kind: 'dealer_result',
        time: new Date(req.response_deadline),
        seq: req.request_sequence,
        dealer: req.dealer_name || req.dealer_full_name || 'Unknown Dealer',
        uid: req.dealer_display_uid || '—',
        result: 'expired',
        reason: null,
      });
    }
  });
  journeyEvents.sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div className="relative mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-white font-mono">{order.order_number}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusLower === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' : statusLower === 'declined' ? 'bg-red-100 text-red-800 border-red-300' : statusLower === 'awaiting dealer confirmation' ? 'bg-orange-100 text-orange-800 border-orange-300' : statusLower === 'completed' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-slate-400 text-xs">Created {fmtDate(order.created_at)}</p>
              {lastRefreshed && <p className="text-slate-500 text-[10px]">Updated {lastRefreshed.toLocaleTimeString()}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDownloadInvoice} disabled={downloadingInvoice} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 transition-colors disabled:opacity-50">
              {downloadingInvoice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Invoice
            </button>
            <button onClick={() => fetchOrderData(true)} disabled={refreshing} className="text-slate-400 hover:text-white transition-colors p-1">
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Customer Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Name', value: order.customer_name },
                { label: 'Phone', value: order.customer_phone },
                { label: 'Email', value: order.customer_email || '—' },
                { label: 'City', value: order.city || '—' },
                { label: 'Pincode', value: order.pincode },
                { label: 'State', value: order.state || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800">{value}</p>
                </div>
              ))}
              <div className="col-span-full bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Installation Address</p>
                <p className="text-sm font-semibold text-slate-800">{order.installation_address}{order.landmark ? `, ${order.landmark}` : ''}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Order Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Order Type', value: order.order_type },
                { label: 'Payment Method', value: order.payment_method || '—' },
                { label: 'Payment Status', value: order.payment_status || '—' },
                ...(order.order_token ? [{ label: 'Tracking Token', value: order.order_token }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 break-all">{value}</p>
                </div>
              ))}
            </div>
            {orderItems?.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1.5"><Package className="w-3 h-3" /> Items Ordered</p>
                <div className="rounded-xl overflow-hidden border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="text-left px-3 py-2 text-[10px] font-black uppercase text-slate-500">Item</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black uppercase text-slate-500">Type</th>
                        <th className="text-center px-3 py-2 text-[10px] font-black uppercase text-slate-500">Qty</th>
                        <th className="text-right px-3 py-2 text-[10px] font-black uppercase text-slate-500">Unit Price</th>
                        <th className="text-right px-3 py-2 text-[10px] font-black uppercase text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderItems.map((item: any) => (
                        <tr key={item.id} className="bg-white hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-slate-800">
                            {item.item_name}
                            {item.product_code && <div className="text-[11px] font-bold text-slate-500">{item.product_code}</div>}
                          </td>
                          <td className="px-3 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-blue-50 text-blue-700 border-blue-200">{item.item_type}</span></td>
                          <td className="px-3 py-2.5 text-center text-slate-600">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{fmt(item.unit_price)}</td>
                          <td className="px-3 py-2.5 text-right font-black text-slate-800">{fmt(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><IndianRupee className="w-3.5 h-3.5" /> Payment Breakdown</h2>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <div className="divide-y">
                {[
                  { label: 'Products / Subtotal', icon: Package, value: paymentSummary.products_total || paymentSummary.subtotal, show: true },
                  { label: 'Installation Charges', icon: Wrench, value: paymentSummary.installation_charges, show: paymentSummary.installation_charges > 0 },
                  { label: 'Delivery Charges', icon: Truck, value: paymentSummary.delivery_charges, show: paymentSummary.delivery_charges > 0 },
                  { label: 'AMC', icon: BadgeCheck, value: paymentSummary.amc_cost, show: paymentSummary.amc_cost > 0 },
                  { label: 'Tax', icon: ArrowUpFromLine, value: paymentSummary.tax_amount, show: paymentSummary.tax_amount > 0 },
                  { label: 'Discount', icon: Tag, value: -paymentSummary.discount_amount, show: paymentSummary.discount_amount > 0, negative: true },
                ].filter((row) => row.show).map(({ label, icon: Icon, value, negative }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600"><Icon className="w-3.5 h-3.5 opacity-60" />{label}</div>
                    <span className={`text-sm font-bold ${negative ? 'text-green-600' : 'text-slate-800'}`}>{negative ? '-' : ''}{fmt(Math.abs(value))}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white font-black text-base">
                  <span>Total Order Value</span>
                  <span className="text-[#e63946]">{fmt(paymentSummary.total_amount)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1"><ArrowDownToLine className="w-4 h-4 text-green-600" /><span className="text-xs font-bold uppercase text-green-700">Amount Paid</span></div>
                <p className="text-2xl font-black text-green-700">{fmt(paymentSummary.effective_paid)}</p>
              </div>
              <div className={`border rounded-xl p-4 ${paidFull ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1"><CreditCard className={`w-4 h-4 ${paidFull ? 'text-green-600' : 'text-red-600'}`} /><span className={`text-xs font-bold uppercase ${paidFull ? 'text-green-700' : 'text-red-700'}`}>Remaining Balance</span></div>
                <p className={`text-2xl font-black ${paidFull ? 'text-green-700' : 'text-red-700'}`}>{paidFull ? 'PAID IN FULL' : fmt(paymentSummary.remaining_balance)}</p>
              </div>
            </div>
            {transactions.length > 0 && (
              <div className="mt-3 space-y-2">
                {transactions.map((t: any) => (
                  <div key={t.transaction_id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-800 capitalize">{t.transaction_type.replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-slate-400">{t.payment_method || '—'} · {t.reference_number || '—'} · {fmtDate(t.transaction_date)}</p>
                    </div>
                    <span className="text-base font-black text-green-600">{fmt(t.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Assigned Dealer</h2>
            {order.assigned_dealer_id ? (
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-black text-sm border border-blue-300"><Hash className="w-3 h-3" />{order.assigned_dealer_display_uid}</span>
                  <div>
                    <p className="font-black text-slate-900">{order.assigned_dealer_name || order.assigned_dealer_full_name}</p>
                    <p className="text-xs text-slate-500">{order.assigned_dealer_location || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {order.assigned_dealer_phone && <div className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3 h-3" />{order.assigned_dealer_phone}</div>}
                  {order.assigned_dealer_email && <div className="flex items-center gap-1.5 text-slate-600 col-span-2">{order.assigned_dealer_email}</div>}
                  {order.assigned_at && <div className="text-slate-400 col-span-2">Assigned: {fmtDate(order.assigned_at)}</div>}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 text-slate-400 text-sm">No dealer assigned yet.</div>
            )}
            <div className="mt-3">
              {!showAssign ? (
                <Button onClick={loadDealers} className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2" size="sm"><Navigation className="w-4 h-4" /> Next Nearest Dealer for Assign</Button>
              ) : (
                <div className="border border-blue-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50">
                    <span className="text-xs font-black text-blue-700 uppercase flex items-center gap-1.5"><Navigation className="w-3 h-3" /> Nearest Active Dealers</span>
                    <button onClick={() => setShowAssign(false)} className="text-blue-400 hover:text-blue-700"><X className="w-4 h-4" /></button>
                  </div>
                  {loadingDealers ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-slate-500"><RefreshCw className="w-4 h-4 animate-spin" /> Loading dealers...</div>
                  ) : assignDealers.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No active dealers found.</div>
                  ) : (
                    <div className="divide-y max-h-64 overflow-y-auto">
                      {assignDealers.map((dealer: any) => (
                        <div key={dealer.dealer_id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-black text-[10px] border ${dealer.already_contacted ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-blue-100 text-blue-700 border-blue-300'}`}>#{dealer.display_uid}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{dealer.business_name || dealer.full_name}</p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                {dealer.location && <span>{dealer.location}</span>}
                                {dealer.distance_km !== null && <span className="text-green-600 font-bold">{dealer.distance_km.toFixed(1)} km</span>}
                                {dealer.phone_number && <span>{dealer.phone_number}</span>}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => assignDealer(dealer.dealer_id)} disabled={assigning}>
                            {assigning ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Assign'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Dealer Progress Updates</h2>
            {progressUpdates.length === 0 ? (
              <div className="text-sm text-slate-400 bg-slate-50 rounded-xl px-4 py-3">No progress updates posted yet.</div>
            ) : (
              <div className="relative pl-1">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-3">
                  {progressUpdates.map((u: any) => (
                    <div key={u.id} className="flex gap-3 relative">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] border-2 ${u.is_delivery_done ? 'bg-green-100 border-green-500' : 'bg-blue-50 border-blue-400'}`}>
                        {u.is_delivery_done ? '✅' : '🔧'}
                      </div>
                      <div className={`flex-1 rounded-xl px-3 py-2.5 border text-xs ${u.is_delivery_done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold px-2 py-0.5 rounded-full border text-[10px] bg-blue-100 text-blue-800 border-blue-300">{u.status_label}</span>
                          <span className="text-slate-500">#{u.dealer_uid} {u.dealer_name}</span>
                          {u.estimated_days && <span className="text-slate-500">ETA: {u.estimated_days} day(s)</span>}
                        </div>
                        {u.notes && <p className="text-slate-600 italic mb-1">&ldquo;{u.notes}&rdquo;</p>}
                        <p className="text-[10px] text-slate-400">{fmtDate(u.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><History className="w-3.5 h-3.5" /> Order Journey</h2>
            {journeyEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No tracking events yet.</p>
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex items-stretch gap-2 min-w-max pr-2">
                  {journeyEvents.map((ev, idx) => {
                    const isLast = idx === journeyEvents.length - 1;
                    if (ev.kind === 'status') {
                      return (
                        <div key={`s-${idx}`} className="flex items-center gap-2">
                          <div className="w-[320px] bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                            <div className="flex items-start gap-2">
                              <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 bg-slate-100 border-slate-300"><FileText className="w-3.5 h-3.5 text-slate-500" /></div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800">{ev.label}</p>
                                {ev.remarks && <p className="text-[11px] text-slate-500 mt-0.5">{ev.remarks}</p>}
                                <div className="flex items-center gap-3 mt-1"><p className="text-[10px] text-slate-400">{fmtDate(ev.time)}</p>{ev.by && <p className="text-[10px] text-slate-400">by {ev.by}</p>}</div>
                              </div>
                            </div>
                          </div>
                          {!isLast && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                        </div>
                      );
                    }
                    if (ev.kind === 'dealer_sent') {
                      return (
                        <div key={`ds-${idx}`} className="flex items-center gap-2">
                          <div className="w-[360px] rounded-xl px-3 py-2.5 border bg-orange-50 border-orange-200">
                            <div className="flex items-start gap-2">
                              <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 bg-orange-100 border-orange-400"><Send className="w-3.5 h-3.5 text-orange-600" /></div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] font-black text-slate-500 uppercase">Attempt #{ev.seq}</span><span className="text-xs font-black text-slate-800">#{ev.uid} {ev.dealer}</span>{ev.distance !== null && <span className="text-[10px] text-green-600 font-bold">{Number(ev.distance).toFixed(1)} km away</span>}</div>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap"><p className="text-[10px] text-slate-400">📤 Sent: {fmtDate(ev.time)}</p><p className="text-[10px] font-medium text-slate-400">⏱ Deadline: {fmtDate(ev.deadline)}</p></div>
                              </div>
                            </div>
                          </div>
                          {!isLast && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                        </div>
                      );
                    }
                    return (
                      <div key={`dr-${idx}`} className="flex items-center gap-2">
                        <div className="w-[360px] rounded-xl px-3 py-2.5 border bg-slate-50 border-slate-200">
                          <div className="flex items-start gap-2">
                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${ev.result === 'accepted' ? 'bg-green-200 border-green-500' : ev.result === 'declined' ? 'bg-red-200 border-red-500' : 'bg-amber-200 border-amber-500'}`}>
                              {ev.result === 'accepted' && <UserCheck2 className="w-3.5 h-3.5 text-green-700" />}
                              {ev.result === 'declined' && <UserX className="w-3.5 h-3.5 text-red-700" />}
                              {ev.result === 'expired' && <Timer className="w-3.5 h-3.5 text-amber-700" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800">
                                {ev.result === 'accepted' && `✅ #${ev.uid} ${ev.dealer} accepted the order`}
                                {ev.result === 'declined' && `❌ #${ev.uid} ${ev.dealer} declined the order`}
                                {ev.result === 'expired' && `⏰ #${ev.uid} ${ev.dealer} did not respond — deadline expired`}
                              </p>
                              {ev.reason && <p className="text-[11px] text-red-600 mt-0.5">Reason: {ev.reason}</p>}
                              <p className="text-[10px] text-slate-400 mt-1">{fmtDate(ev.time)}</p>
                              {(ev.result === 'declined' || ev.result === 'expired') && !isLast && <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Order automatically reassigned to next nearest dealer</p>}
                            </div>
                          </div>
                        </div>
                        {!isLast && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function DistrictOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<DistrictUser | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<'all' | 'pending' | 'closed' | 'unassigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestOnly, setGuestOnly] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);
  const [reassignOrderId, setReassignOrderId] = useState<number | null>(null);
  const [availableDealers, setAvailableDealers] = useState<any[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [reassigning, setReassigning] = useState(false);
  const [acceptingTaskId, setAcceptingTaskId] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('district_user');
    if (!userData) {
      router.push('/district-portal/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const fetchOrders = async (showLoader = true) => {
    if (!user?.district) return;
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/district-portal/orders?district=${encodeURIComponent(user.district)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) setOrders(data.orders);
    } catch (error) {
      console.error('Failed to fetch district orders:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.district) fetchOrders();
  }, [user?.district]);

  useEffect(() => {
    if (!user?.district) return;
    const interval = setInterval(() => fetchOrders(false), 10000);
    return () => clearInterval(interval);
  }, [user?.district]);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    if (!user?.district) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/district-portal/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, district: user.district }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((order) => order.order_id === orderId ? { ...order, status: newStatus } : order));
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openReassignPanel = async (orderId: number) => {
    if (!user?.district) return;
    setReassignOrderId(orderId);
    setLoadingDealers(true);
    setAvailableDealers([]);
    try {
      const res = await fetch(`/api/district-portal/reassign-order?orderId=${orderId}&district=${encodeURIComponent(user.district)}`);
      const data = await res.json();
      if (data.success) setAvailableDealers(data.dealers);
    } catch (error) {
      console.error('Failed to load dealers:', error);
    } finally {
      setLoadingDealers(false);
    }
  };

  const confirmReassign = async (dealerId: number) => {
    if (!reassignOrderId || !user) return;
    setReassigning(true);
    try {
      const res = await fetch('/api/district-portal/reassign-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: reassignOrderId,
          dealerId,
          district: user.district,
          actorName: user.full_name,
          username: user.username,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReassignOrderId(null);
        await fetchOrders();
      } else {
        alert(data.error || 'Reassignment failed');
      }
    } catch (error) {
      console.error('Network error during reassignment:', error);
      alert('Network error during reassignment');
    } finally {
      setReassigning(false);
    }
  };

  const acceptTask = async (orderId: number) => {
    if (!user) return;
    setAcceptingTaskId(orderId);
    try {
      const res = await fetch('/api/order-task-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          portal: 'district',
          actorName: user.full_name,
          actorDetails: { district: user.district, username: user.username },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to accept task');
        return;
      }
      await fetchOrders();
    } catch (error) {
      console.error('Failed to accept task:', error);
      alert('Network error while accepting task');
    } finally {
      setAcceptingTaskId(null);
    }
  };

  const applySearch = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((order) =>
      (order.order_number || '').toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.customer_phone || '').toLowerCase().includes(q) ||
      (order.assigned_dealer_uid || '').toLowerCase().includes(q) ||
      (order.dealer_business_name || '').toLowerCase().includes(q) ||
      (order.order_token || '').toLowerCase().includes(q)
    );
  };

  const isClosed = (order: any) => CLOSED_STATUSES.includes((order.status || '').toLowerCase());
  const allList = applySearch(guestOnly ? orders.filter((order) => order.is_guest_order) : orders);
  const pendingList = applySearch(orders.filter((order) => order.assigned_dealer_id && !isClosed(order)));
  const closedList = applySearch(orders.filter((order) => isClosed(order)));
  const unassignedList = applySearch(orders.filter((order) => !order.assigned_dealer_id && !isClosed(order)));
  const currentOrders = section === 'all' ? allList : section === 'pending' ? pendingList : section === 'closed' ? closedList : unassignedList;

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Loading orders...</div>
      </div>
    );
  }

  const hasUrgent = pendingList.some((order) => (order.status || '').toLowerCase() === 'declined');
  const unassignedCount = orders.filter((order) => !order.assigned_dealer_id && !isClosed(order)).length;
  const tabs: Array<{
    key: 'all' | 'pending' | 'closed' | 'unassigned';
    label: string;
    count: number;
    icon: any;
    urgent?: boolean;
  }> = [
    { key: 'all', label: 'View All Orders', count: orders.length, icon: Package },
    { key: 'pending', label: 'Pending', count: pendingList.length, icon: Clock, urgent: hasUrgent },
    { key: 'closed', label: 'Closed', count: closedList.length, icon: CheckCircle },
    { key: 'unassigned', label: 'Not Assigned', count: unassignedCount, icon: AlertCircle, urgent: unassignedCount > 0 },
  ];

  return (
    <>
      <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">District Orders Management</h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{user.district} · {orders.length} total · {unassignedCount} unassigned · {pendingList.length} in progress</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input placeholder="Order ID, customer, phone, dealer..." className="pl-10 w-72 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={() => void fetchOrders()} className="gap-1.5 shrink-0"><RefreshCw className="w-4 h-4" />Refresh</Button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700">
          {tabs.map(({ key, label, count, icon: Icon, urgent }) => (
            <button key={key} onClick={() => setSection(key as any)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${section === key ? 'border-[#e63946] text-[#e63946] bg-red-50/50 dark:bg-red-950/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}>
              <Icon className="w-4 h-4" />{label}
              <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-black ${section === key ? 'bg-[#e63946] text-white' : urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>{count}</span>
            </button>
          ))}
        </div>

        {section === 'all' && (
          <div className="flex items-center gap-3">
            <button onClick={() => setGuestOnly((value) => !value)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${guestOnly ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:border-slate-500'}`}>
              👤 Guest Orders Only
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500">{allList.length} orders shown</span>
          </div>
        )}

        <div className="space-y-3">
          {currentOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><Package className="w-16 h-16 mx-auto mb-4 opacity-20" /><p className="font-semibold">No orders in this section</p></div>
          ) : currentOrders.map((order: any) => {
            const statusLower = (order.status || '').toLowerCase();
            const isDeclined = statusLower === 'declined';
            const isReassigning = reassignOrderId === order.order_id;
            const taskAcceptedByAdmin = order.task_accepted_by_portal === 'admin';
            const taskAcceptedByDistrict = order.task_accepted_by_portal === 'district';
            const acceptedByDistrictLabel = taskAcceptedByDistrict ? `${order.task_accepted_by_name}${order.task_accepted_by_details?.district ? ` (${order.task_accepted_by_details.district})` : ''}` : '';
            return (
              <div key={order.order_id} className="rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#e63946]/10 flex items-center justify-center shrink-0 mt-0.5"><Package className="w-5 h-5 text-[#e63946]" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">{order.customer_name}</span>
                        <Badge className={`${getStatusStyle(order.status)} border font-bold text-xs`}>{getSimpleStatus(order.status)}</Badge>
                        {order.assigned_dealer_uid && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusStyle(order.status)}`}><Hash className="w-2.5 h-2.5" />{order.assigned_dealer_uid}{order.dealer_business_name && <span className="font-medium opacity-80"> · {order.dealer_business_name}</span>}</span>}
                        {order.is_guest_order && <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-xs font-bold">👤 Guest</Badge>}
                        {order.order_type && <Badge variant="outline" className="text-[10px] font-semibold">{order.order_type === 'product_cart' ? 'Product' : order.order_type === 'hd_combo' ? 'HD Combo' : order.order_type}</Badge>}
                      </div>
                      <div className="mb-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.customer_phone}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{[order.city, order.state].filter(Boolean).join(', ')}{order.pincode && <span className="ml-1 font-mono">{order.pincode}</span>}</span>
                        <span className="font-mono font-bold text-slate-400 dark:text-slate-500">{order.order_number}</span>
                        <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {order.payment_status && <Badge variant="outline" className="text-[10px] py-0">{order.payment_status}</Badge>}
                      </div>
                      {order.latest_dealer_remark && <div className="mt-1.5 flex items-start gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" /><span className="italic">&ldquo;{order.latest_dealer_remark}&rdquo;</span></div>}
                      {order.task_accepted_at && <div className={`mt-2 rounded-lg px-3 py-2 text-xs border ${taskAcceptedByAdmin ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>{taskAcceptedByAdmin ? 'This task has already been accepted by Protechtur Admin.' : `This task has already been accepted by District Manager ${acceptedByDistrictLabel}.`}<span className="block mt-0.5 opacity-80">{new Date(order.task_accepted_at).toLocaleString('en-IN')}</span></div>}
                      {isDeclined && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="mb-2 flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0 text-red-600" /><span className="text-xs font-bold text-red-700 dark:text-red-300">Declined by {order.assigned_dealer_uid ? `#${order.assigned_dealer_uid}` : 'dealer'}{order.dealer_business_name ? ` — ${order.dealer_business_name}` : ''}</span></div>
                          {isReassigning ? (
                            <div className="space-y-2">
                              <p className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><Navigation className="w-3 h-3" />Available dealers (sorted by proximity):</p>
                              {loadingDealers ? <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><RefreshCw className="w-3 h-3 animate-spin" />Loading dealers...</div> : availableDealers.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">No available dealers found.</p> : <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">{availableDealers.map((dealer: any) => <div key={dealer.dealer_id} className="flex items-center justify-between rounded border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs"><span className="rounded-full border border-blue-300 bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-700 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300">#{dealer.display_uid}</span><span className="font-semibold text-slate-800 dark:text-slate-100">{dealer.business_name || dealer.full_name}</span>{dealer.location && <span className="text-slate-400 dark:text-slate-500">{dealer.location}</span>}{dealer.distance_km !== null && <span className="font-bold text-green-600 dark:text-green-400">{dealer.distance_km} km</span>}</div><Button size="sm" className="h-6 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={() => confirmReassign(dealer.dealer_id)} disabled={reassigning}>{reassigning ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Assign'}</Button></div>)}</div>}
                              <Button variant="outline" size="sm" className="text-xs h-6" onClick={() => setReassignOrderId(null)}>Close</Button>
                            </div>
                          ) : <Button size="sm" className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1" onClick={() => openReassignPanel(order.order_id)}><UserCheck className="w-3 h-3" />Reassign to Another Dealer</Button>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xl font-black text-[#e63946]">RS {(order.total_amount || 0).toLocaleString('en-IN')}</p>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="font-bold gap-1 text-xs" onClick={() => setViewOrderId(order.order_id)}><Eye className="w-3.5 h-3.5" />Details</Button>
                        {!order.assigned_dealer_id && !taskAcceptedByDistrict && !taskAcceptedByAdmin && <Button variant="outline" size="sm" className="gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => acceptTask(order.order_id)} disabled={acceptingTaskId === order.order_id}>{acceptingTaskId === order.order_id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}Accept Task</Button>}
                        <Dialog>
                          <DialogTrigger asChild><Button variant="outline" size="sm" className="gap-1 text-xs"><Edit className="w-3.5 h-3.5" />Status</Button></DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Order Status</DialogTitle>
                              <DialogDescription><span className="font-mono font-bold">{order.order_number}</span> - {order.customer_name}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-2 py-4">
                              {[{ status: 'Pending', icon: Clock }, { status: 'In Progress', icon: Package }, { status: 'Completed', icon: CheckCircle }, { status: 'Delivered', icon: Truck }, { status: 'Cancelled', icon: XCircle }].map(({ status, icon: Icon }) => (
                                <Button key={status} onClick={() => updateOrderStatus(order.order_id, status)} variant="outline" className="justify-start" disabled={updatingStatus}><Icon className="w-4 h-4 mr-2" />{status}</Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewOrderId !== null && user && <ViewDetailsModal orderId={viewOrderId} district={user.district} actorName={user.full_name} username={user.username} onClose={() => setViewOrderId(null)} onOrderUpdated={() => { fetchOrders(); setViewOrderId(null); }} />}
    </>
  );
}