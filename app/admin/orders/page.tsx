"use client";
import { useEffect, useState } from "react";
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
  ChevronRight,
  User,
  FileText,
  X,
  BadgeCheck,
  Truck,
  Wrench,
  Tag,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  ArrowRight,
  Send,
  Timer,
  UserX,
  UserCheck2,
  ShieldAlert,
  MessageSquare,
  Activity,
  Download,
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// ─── Helpers ────────────────────────────────────────────────────────────────

// Company details for invoice
const COMPANY_NAME = 'Protechtur';

function fmt(n: any) {
  return 'RS' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: any) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── ViewDetails Modal ───────────────────────────────────────────────────────

function ViewDetailsModal({
  orderId,
  onClose,
  onOrderUpdated,
}: {
  orderId: number;
  onClose: () => void;
  onOrderUpdated: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Manual assign state
  const [showAssign, setShowAssign] = useState(false);
  const [assignDealers, setAssignDealers] = useState<any[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!data) return;
    setDownloadingInvoice(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      const inv = await res.json();
      if (!inv.success) { alert('Failed to fetch invoice data'); return; }
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

      // Strip dealer UID suffix (e.g. PR-090326-008-101 → PR-090326-008)
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

      // ── Seller & Buyer Section ────────────────────────────────────────
      const col2 = pageW / 2 + 5;
      const rightColWidth = pageW - margin - col2 - 2;
      const leftColWidth = col2 - margin - 8;

      // Section headers with gray background
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

      // ── Left column: SELLER details (fixed for all customer invoices) ──
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

      // ── Right column: BUYER details ──────────────────────────────
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
      const colSNo = margin + 2, colProductId = margin + 10, colDesc = margin + 36, colQty = margin + 65;
      const colUnit = margin + 80, colUPrice = margin + 92, colTotal = margin + 110;
      const colDisc = margin + 128, colGST = margin + 142;
      const colSGST = margin + 158, colCGST = margin + 172;
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
      let itemsSum = 0; // Always calculate from actual items  
      (items || []).forEach((item: any, idx: number) => {
        if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 1, pageW - 2 * margin, 7, 'F'); }
        doc.setTextColor(15, 23, 42);
        
        const itemTotal = parseFloat(item.total_price);
        const itemUnitPrice = parseFloat(item.unit_price);
        const itemQty = parseFloat(item.quantity);
        const itemDiscount = 0; // Discount not tracked at item level currently
        const gstAmount = Math.round((itemTotal * 0.18) * 100) / 100;
        const sgstAmount = Math.round((gstAmount / 2) * 100) / 100;
        const cgstAmount = Math.round((gstAmount - sgstAmount) * 100) / 100;
        const fallbackSource = item.product_id ?? item.id ?? item.item_id ?? (idx + 1);
        const productUniqueId = item.product_code || `PIC${String(fallbackSource).padStart(3, '0')}`;
        const itemLabel = item.item_name;
        
        doc.text(String(idx + 1), colSNo, y + 4);
        doc.text(String(productUniqueId), colProductId, y + 4);
        doc.text(doc.splitTextToSize(itemLabel, 50)[0], colDesc, y + 4);
        doc.text(String(itemQty), colQty, y + 4);
        doc.text('', colUnit, y + 4); // Unit column empty
        doc.text(`${itemUnitPrice.toFixed(2)}`, colUPrice, y + 4);
        doc.text(`${itemTotal.toFixed(2)}`, colTotal, y + 4);
        doc.text(itemDiscount > 0 ? `${itemDiscount}%` : '', colDisc, y + 4);
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
      // ALWAYS use actual sum of items (ignore potentially wrong DB subtotal)
      const productTotal = itemsSum;

      // 1. Product Total (includes installation/AMC)
      addRow('Product Total:', productTotal);
      
      // 2. COD Extra Charges (flat RS 500 from installation_settings)
      let codCharges = 0;
      if (o.payment_method === 'cod') {
        // Use codAmount from settings (NOT advance_amount which is 30% upfront payment)
        codCharges = codAmount || 500;
        if (codCharges > 0) addRow('COD Extra Charges:', codCharges);
      }
      
      // 3. GST is applied only on Product Total (COD charges excluded)
      const gstRate = 0.18; // 18%
      const finalGST = Math.round(productTotal * gstRate * 100) / 100;
      const finalSGST = Math.round((finalGST / 2) * 100) / 100;
      const finalCGST = Math.round((finalGST - finalSGST) * 100) / 100;
      
      if (finalGST > 0) {
        addRow('SGST (9%):', finalSGST);
        addRow('CGST (9%):', finalCGST);
      }
      
      // 4. Grand Total = Product + GST (+ COD charges when applicable)
      const grandTotal = productTotal + finalGST + codCharges;
      
      doc.setFillColor(15, 23, 42);
      doc.rect(totalsX - 4, y - 1, pageW - margin - totalsX + 4 + margin - margin, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(250, 204, 21);
      doc.text('GRAND TOTAL', totalsX, y + 6);
      doc.text(`Rs.${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalsValX, y + 6, { align: 'right' });
      y += 16;

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 18, pageW, 18, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(200, 210, 230);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for choosing Protechtur. For support, contact us via our website.', pageW / 2, pageH - 10, { align: 'center' });
      doc.text(`Admin-generated invoice. Invoice ID: ${invoiceNumber}`, pageW / 2, pageH - 5, { align: 'center' });
      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Invoice generation error:', err);
      alert('Failed to generate invoice.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const fetchOrderData = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const r = await fetch(`/api/admin/orders/${orderId}`);
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
    // Auto-refresh every 10 seconds to pick up dealer status changes
    const interval = setInterval(() => fetchOrderData(), 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadDealers = async () => {
    setShowAssign(true);
    setLoadingDealers(true);
    try {
      const res = await fetch(`/api/admin/reassign-order?orderId=${orderId}&includeAll=true`);
      const d = await res.json();
      if (d.success) setAssignDealers(d.dealers);
    } finally {
      setLoadingDealers(false);
    }
  };

  const assignDealer = async (dealerId: number) => {
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/reassign-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, dealerId }),
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

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-slate-500 flex gap-3 items-center">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading order details...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { order, orderItems, transactions, statusHistory, dealerRequests, allocationLog, progressUpdates = [], paymentSummary } = data;

  const statusLower = order.status?.toLowerCase() || '';
  const paidFull = paymentSummary.remaining_balance <= 0;

  // ── Build unified order journey ──
  const now = new Date();
  type JourneyEvent =
    | { kind: 'status'; time: Date; label: string; remarks: string | null; by: string | null }
    | { kind: 'dealer_sent'; time: Date; seq: number; dealer: string; uid: string; distance: number | null; deadline: Date; status: string; respondedAt: Date | null; declineReason: string | null }
    | { kind: 'dealer_result'; time: Date; seq: number; dealer: string; uid: string; result: 'accepted' | 'declined' | 'expired'; reason: string | null };

  const journeyEvents: JourneyEvent[] = [];

  // Status history entries: skip dealer-overlap statuses — show only creation & non-dealer ops
  const dealerStatuses = new Set(['accepted', 'declined', 'awaiting dealer confirmation', 'pending admin review']);
  statusHistory.forEach((h: any) => {
    const lbl = (h.status || '').toLowerCase();
    // Always include the very first entry (order created) and non-dealer operational statuses
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

  // Dealer request events
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
      <div
        className="relative mx-auto my-6 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 dark:bg-slate-950">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-white font-mono">{order.order_number}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                statusLower === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' :
                statusLower === 'declined' ? 'bg-red-100 text-red-800 border-red-300' :
                statusLower === 'awaiting dealer confirmation' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                statusLower === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                statusLower === 'in-progress' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                'bg-slate-100 text-slate-700 border-slate-300'
              }`}>{order.status}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-slate-400 text-xs">Created {fmtDate(order.created_at)}</p>
              {lastRefreshed && (
                <p className="text-slate-500 text-[10px]">
                  Updated {lastRefreshed.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 transition-colors disabled:opacity-50"
              title="Download customer invoice"
            >
              {downloadingInvoice ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {downloadingInvoice ? 'Generating...' : 'Invoice'}
            </button>
            <button
              onClick={() => fetchOrderData(true)}
              disabled={refreshing}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Refresh order status"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* ── Customer Info ── */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Customer Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Name', value: order.customer_name },
                { label: 'Phone', value: order.customer_phone },
                { label: 'Email', value: order.customer_email || '—' },
                { label: 'City', value: order.city || '—' },
                { label: 'Pincode', value: order.pincode },
                { label: 'State', value: order.state || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
                </div>
              ))}
              <div className="col-span-full bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Installation Address</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {order.installation_address}{order.landmark ? `, ${order.landmark}` : ''}
                </p>
              </div>
            </div>
          </section>

          {/* ── Order Info ── */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Order Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Order Type', value: order.order_type },
                { label: 'Payment Method', value: order.payment_method || '—' },
                { label: 'Payment Status', value: order.payment_status || '—' },
                ...(order.brand ? [{ label: 'Brand', value: order.brand }] : []),
                ...(order.channels ? [{ label: 'Channels', value: String(order.channels) }] : []),
                ...(order.camera_type ? [{ label: 'Camera Type', value: order.camera_type }] : []),
                ...(order.storage_size ? [{ label: 'Storage', value: order.storage_size }] : []),
                ...(order.order_token ? [{ label: 'Tracking Token', value: order.order_token }] : []),
                ...(order.payment_id ? [{ label: 'Payment ID', value: order.payment_id }] : []),
                ...(order.razorpay_order_id ? [{ label: 'Razorpay Order ID', value: order.razorpay_order_id }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 break-all">{value}</p>
                </div>
              ))}
            </div>

            {/* Order Items Table */}
            {orderItems && orderItems.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Items Ordered
                </p>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="text-left px-3 py-2 text-[10px] font-black uppercase text-slate-500">Item</th>
                        <th className="text-left px-3 py-2 text-[10px] font-black uppercase text-slate-500">Type</th>
                        <th className="text-center px-3 py-2 text-[10px] font-black uppercase text-slate-500">Qty</th>
                        <th className="text-right px-3 py-2 text-[10px] font-black uppercase text-slate-500">Unit Price</th>
                        <th className="text-right px-3 py-2 text-[10px] font-black uppercase text-slate-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {orderItems.map((item: any) => (
                        <tr key={item.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-3 py-2.5 font-semibold text-slate-800 dark:text-slate-100">
                            {item.item_name}
                            {item.product_code && <div className="text-[11px] font-bold text-slate-500">{item.product_code}</div>}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              item.item_type === 'Product'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>{item.item_type}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600 dark:text-slate-300">{item.quantity}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600 dark:text-slate-300">{fmt(item.unit_price)}</td>
                          <td className="px-3 py-2.5 text-right font-black text-slate-800 dark:text-slate-100">{fmt(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── Payment Breakdown ── */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5" /> Payment Breakdown
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden">
              <div className="divide-y dark:divide-slate-700">
                {[
                  { label: 'Products / Subtotal', icon: Package, value: paymentSummary.products_total || paymentSummary.subtotal, show: true },
                  { label: 'Installation Charges', icon: Wrench, value: paymentSummary.installation_charges, show: paymentSummary.installation_charges > 0 },
                  { label: 'Delivery Charges', icon: Truck, value: paymentSummary.delivery_charges, show: paymentSummary.delivery_charges > 0 },
                  { label: 'AMC', icon: BadgeCheck, value: paymentSummary.amc_cost, show: paymentSummary.amc_cost > 0 },
                  { label: 'Tax', icon: ArrowUpFromLine, value: paymentSummary.tax_amount, show: paymentSummary.tax_amount > 0 },
                  { label: 'Discount', icon: Tag, value: -paymentSummary.discount_amount, show: paymentSummary.discount_amount > 0, negative: true },
                  { label: 'Referral Discount', icon: Tag, value: -paymentSummary.referral_discount, show: paymentSummary.referral_discount > 0, negative: true },
                  { label: 'Points Redeemed', icon: Tag, value: -paymentSummary.points_redeemed, show: paymentSummary.points_redeemed > 0, negative: true },
                  { label: `COD Extra Charge`, icon: CreditCard, value: paymentSummary.derived_cod_extra, show: (paymentSummary.derived_cod_extra ?? 0) > 0 && order.payment_method === 'cod' },
                ].filter(r => r.show).map(({ label, icon: Icon, value, negative }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Icon className="w-3.5 h-3.5 opacity-60" />{label}
                    </div>
                    <span className={`text-sm font-bold ${negative ? 'text-green-600' : 'text-slate-800 dark:text-slate-100'}`}>
                      {negative ? '-' : ''}{fmt(Math.abs(value))}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 dark:bg-slate-950 text-white font-black text-base">
                  <span>Total Order Value</span>
                  <span className="text-[#e63946]">{fmt(paymentSummary.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* COD Advance Required (only for COD orders) */}
            {order.payment_method === 'cod' && (paymentSummary.cod_advance_required ?? 0) > 0 && (
              <div className="mt-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" /> COD Advance Payment ({paymentSummary.cod_percentage}% of total)
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-black text-amber-800 dark:text-amber-200">{fmt(paymentSummary.cod_advance_required)}</p>
                    {paymentSummary.is_cod_advance_paid
                      ? <p className="text-xs text-green-700 dark:text-green-400 font-semibold mt-0.5">✓ Collected via Razorpay</p>
                      : <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">✗ Not yet collected</p>
                    }
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    paymentSummary.is_cod_advance_paid
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {paymentSummary.is_cod_advance_paid ? 'PAID' : 'PENDING'}
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                  Remaining on delivery: {fmt(Math.max(0, paymentSummary.total_amount - (paymentSummary.advance_paid || 0)))}
                </p>
              </div>
            )}

            {/* Paid / Remaining */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownToLine className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold uppercase text-green-700 dark:text-green-400">Amount Paid</span>
                </div>
                <p className="text-2xl font-black text-green-700 dark:text-green-300">{fmt(paymentSummary.effective_paid)}</p>
                {paymentSummary.is_cod_advance_paid && (
                  <p className="text-xs text-green-600 mt-1">
                    COD advance ({paymentSummary.cod_percentage}% of base) collected via Razorpay
                  </p>
                )}
                {!paymentSummary.is_cod_advance_paid && paymentSummary.advance_paid > 0 && (
                  <p className="text-xs text-green-600 mt-1">incl. advance: {fmt(paymentSummary.advance_paid)}</p>
                )}
              </div>
              <div className={`border rounded-xl p-4 ${
                paidFull
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className={`w-4 h-4 ${paidFull ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-xs font-bold uppercase ${paidFull ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    Remaining Balance
                  </span>
                </div>
                <p className={`text-2xl font-black ${paidFull ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {paidFull ? 'PAID IN FULL' : fmt(paymentSummary.remaining_balance)}
                </p>
              </div>
            </div>

            {/* Transaction history */}
            {transactions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">Payment Transactions</p>
                <div className="space-y-2">
                  {transactions.map((t: any) => (
                    <div key={t.transaction_id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">{t.transaction_type.replace(/_/g, ' ')}</p>
                        <p className="text-[11px] text-slate-400">{t.payment_method || '—'} · {t.reference_number || '—'} · {fmtDate(t.transaction_date)}</p>
                        {t.description && <p className="text-[11px] text-slate-500">{t.description}</p>}
                      </div>
                      <span className="text-base font-black text-green-600">{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Assigned Dealer ── */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Assigned Dealer
            </h2>
            {order.assigned_dealer_id ? (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-black text-sm border border-blue-300">
                    <Hash className="w-3 h-3" />{order.assigned_dealer_display_uid}
                  </span>
                  <div>
                    <p className="font-black text-slate-900 dark:text-slate-100">{order.assigned_dealer_name || order.assigned_dealer_full_name}</p>
                    <p className="text-xs text-slate-500">{order.assigned_dealer_location || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {order.assigned_dealer_phone && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><Phone className="w-3 h-3" />{order.assigned_dealer_phone}</div>
                  )}
                  {order.assigned_dealer_email && (
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 col-span-2">{order.assigned_dealer_email}</div>
                  )}
                  {order.assigned_at && (
                    <div className="text-slate-400 col-span-2">Assigned: {fmtDate(order.assigned_at)}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-slate-400 text-sm">No dealer assigned yet.</div>
            )}

            {/* Manual Assign Button */}
            <div className="mt-3">
              {!showAssign ? (
                <Button
                  onClick={loadDealers}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2"
                  size="sm"
                >
                  <Navigation className="w-4 h-4" />
                  Next Nearest Dealer for Assign
                </Button>
              ) : (
                <div className="border border-blue-200 dark:border-blue-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-950">
                    <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1.5">
                      <Navigation className="w-3 h-3" /> Nearest Active Dealers (sorted by distance)
                    </span>
                    <button onClick={() => setShowAssign(false)} className="text-blue-400 hover:text-blue-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {loadingDealers ? (
                    <div className="flex items-center gap-2 p-4 text-sm text-slate-500">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading dealers...
                    </div>
                  ) : assignDealers.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No active dealers found.</div>
                  ) : (
                    <div className="divide-y dark:divide-slate-700 max-h-64 overflow-y-auto">
                      {assignDealers.map((dealer: any) => (
                        <div key={dealer.dealer_id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-black text-[10px] border ${
                              dealer.already_contacted
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : 'bg-blue-100 text-blue-700 border-blue-300'
                            }`}>
                              #{dealer.display_uid}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {dealer.business_name || dealer.full_name}
                                {dealer.already_contacted && (
                                  <span className="ml-1.5 text-[10px] text-amber-600 font-normal">(previously contacted)</span>
                                )}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                {dealer.location && <span>{dealer.location}</span>}
                                {dealer.distance_km !== null && (
                                  <span className="text-green-600 font-bold">{dealer.distance_km.toFixed(1)} km</span>
                                )}
                                {dealer.phone_number && <span>{dealer.phone_number}</span>}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            onClick={() => assignDealer(dealer.dealer_id)}
                            disabled={assigning}
                          >
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

          {/* ── Dealer Progress Updates ── */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Dealer Progress Updates
            </h2>
            {progressUpdates.length === 0 ? (
              <div className="text-sm text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                No progress updates posted yet.
              </div>
            ) : (
              <div className="relative pl-1">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-3">
                  {progressUpdates.map((u: any) => (
                    <div key={u.id} className="flex gap-3 relative">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] border-2 ${
                        u.is_delivery_done ? 'bg-green-100 border-green-500' : 'bg-blue-50 border-blue-400'
                      }`}>
                        {u.is_delivery_done ? '✅' : '🔧'}
                      </div>
                      <div className={`flex-1 rounded-xl px-3 py-2.5 border text-xs ${
                        u.is_delivery_done
                          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${
                            u.is_delivery_done
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : u.status_label === 'Installation Started'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : u.status_label === 'Appointment Scheduled'
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : u.status_label === 'Parts/Equipment Ordered'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {u.status_label}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            #{u.dealer_uid} {u.dealer_name}
                          </span>
                          {u.estimated_days && (
                            <span className="text-slate-500 dark:text-slate-400">ETA: {u.estimated_days} day(s)</span>
                          )}
                        </div>
                        {u.notes && (
                          <p className="text-slate-600 dark:text-slate-300 italic mb-1">&ldquo;{u.notes}&rdquo;</p>
                        )}
                        <p className="text-[10px] text-slate-400">{fmtDate(u.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Order Journey Timeline ── */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Order Journey
            </h2>

            {journeyEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No tracking events yet.</p>
            ) : (
              <div className="relative">
                {/* vertical rail */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

                <div className="space-y-0">
                  {journeyEvents.map((ev, idx) => {
                    const isLast = idx === journeyEvents.length - 1;

                    if (ev.kind === 'status') {
                      const isCreated = (ev.label || '').toLowerCase().includes('pending') && idx === 0;
                      return (
                        <div key={`s-${idx}`} className="relative flex gap-3 pb-4">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            isCreated ? 'bg-blue-100 border-blue-400' :
                            ev.label?.toLowerCase().includes('complete') ? 'bg-green-100 border-green-400' :
                            ev.label?.toLowerCase().includes('deliver') ? 'bg-teal-100 border-teal-400' :
                            'bg-slate-100 border-slate-300'
                          }`}>
                            <FileText className={`w-3.5 h-3.5 ${
                              isCreated ? 'text-blue-600' :
                              ev.label?.toLowerCase().includes('complete') ? 'text-green-600' :
                              'text-slate-500'
                            }`} />
                          </div>
                          <div className="flex-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl px-3 py-2.5">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100">{ev.label}</p>
                            {ev.remarks && <p className="text-[11px] text-slate-500 mt-0.5">{ev.remarks}</p>}
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-[10px] text-slate-400">{fmtDate(ev.time)}</p>
                              {ev.by && <p className="text-[10px] text-slate-400">by {ev.by}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (ev.kind === 'dealer_sent') {
                      const isPending = ev.status === 'pending';
                      const isExpired = ev.status === 'expired';
                      const isAccepted = ev.status === 'accepted';
                      const isDeclined = ev.status === 'declined';
                      const isCancelled = ev.status === 'cancelled';
                      return (
                        <div key={`ds-${idx}`} className="relative flex gap-3 pb-4">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            isAccepted ? 'bg-green-100 border-green-400' :
                            isDeclined ? 'bg-red-100 border-red-400' :
                            isExpired ? 'bg-amber-100 border-amber-400' :
                            isCancelled ? 'bg-slate-100 border-slate-300' :
                            'bg-orange-100 border-orange-400'
                          }`}>
                            <Send className={`w-3.5 h-3.5 ${
                              isAccepted ? 'text-green-600' :
                              isDeclined ? 'text-red-600' :
                              isExpired ? 'text-amber-600' :
                              isCancelled ? 'text-slate-400' :
                              'text-orange-600'
                            }`} />
                          </div>
                          <div className={`flex-1 rounded-xl px-3 py-2.5 border ${
                            isAccepted ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900' :
                            isDeclined ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                            isExpired ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900' :
                            isCancelled ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60' :
                            'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black text-slate-500 uppercase">Attempt #{ev.seq}</span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100">#{ev.uid} {ev.dealer}</span>
                              {ev.distance !== null && (
                                <span className="text-[10px] text-green-600 font-bold">{Number(ev.distance).toFixed(1)} km away</span>
                              )}
                              {isPending && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 border border-orange-300 animate-pulse">⏳ Awaiting response</span>
                              )}
                              {isCancelled && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 border border-slate-300">Skipped</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <p className="text-[10px] text-slate-400">📤 Sent: {fmtDate(ev.time)}</p>
                              <p className={`text-[10px] font-medium ${
                                isPending && ev.deadline < now ? 'text-red-500' : 'text-slate-400'
                              }`}>
                                ⏱ Deadline: {fmtDate(ev.deadline)}
                                {isPending && ev.deadline < now && ' — OVERDUE'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (ev.kind === 'dealer_result') {
                      const isAccepted = ev.result === 'accepted';
                      const isDeclined = ev.result === 'declined';
                      const isExpired = ev.result === 'expired';
                      return (
                        <div key={`dr-${idx}`} className="relative flex gap-3 pb-4">
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            isAccepted ? 'bg-green-200 border-green-500' :
                            isDeclined ? 'bg-red-200 border-red-500' :
                            'bg-amber-200 border-amber-500'
                          }`}>
                            {isAccepted && <UserCheck2 className="w-3.5 h-3.5 text-green-700" />}
                            {isDeclined && <UserX className="w-3.5 h-3.5 text-red-700" />}
                            {isExpired && <Timer className="w-3.5 h-3.5 text-amber-700" />}
                          </div>
                          <div className={`flex-1 rounded-xl px-3 py-2.5 border ${
                            isAccepted ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-800' :
                            isDeclined ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800' :
                            'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800'
                          }`}>
                            <p className={`text-xs font-black ${
                              isAccepted ? 'text-green-800 dark:text-green-200' :
                              isDeclined ? 'text-red-800 dark:text-red-200' :
                              'text-amber-800 dark:text-amber-200'
                            }`}>
                              {isAccepted && `✅ #${ev.uid} ${ev.dealer} accepted the order`}
                              {isDeclined && `❌ #${ev.uid} ${ev.dealer} declined the order`}
                              {isExpired && `⏰ #${ev.uid} ${ev.dealer} did not respond — deadline expired`}
                            </p>
                            {ev.reason && (
                              <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">Reason: {ev.reason}</p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1">{fmtDate(ev.time)}</p>
                            {(isDeclined || isExpired) && !isLast && (
                              <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" /> Order automatically reassigned to next nearest dealer
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Current status summary at the end */}
                  <div className="relative flex gap-3">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                      statusLower === 'accepted' ? 'bg-green-200 border-green-500' :
                      statusLower === 'completed' ? 'bg-green-200 border-green-500' :
                      statusLower === 'declined' ? 'bg-red-200 border-red-500' :
                      statusLower === 'pending admin review' ? 'bg-purple-100 border-purple-400' :
                      'bg-slate-100 border-slate-400'
                    }`}>
                      <ShieldAlert className={`w-3.5 h-3.5 ${
                        statusLower === 'accepted' || statusLower === 'completed' ? 'text-green-700' :
                        statusLower === 'declined' ? 'text-red-700' :
                        statusLower === 'pending admin review' ? 'text-purple-600' :
                        'text-slate-500'
                      }`} />
                    </div>
                    <div className={`flex-1 rounded-xl px-3 py-2.5 border font-black text-sm ${
                      statusLower === 'accepted' || statusLower === 'completed' ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200' :
                      statusLower === 'declined' ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200' :
                      statusLower === 'pending admin review' ? 'bg-purple-50 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-200' :
                      'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                    }`}>
                      Current Status: {order.status}
                      {order.assigned_dealer_id && order.assigned_dealer_name && (
                        <span className="font-normal text-[11px] block mt-0.5 opacity-80">
                          Handled by #{order.assigned_dealer_display_uid} {order.assigned_dealer_name}
                        </span>
                      )}
                      {!order.assigned_dealer_id && statusLower === 'pending admin review' && (
                        <span className="font-normal text-[11px] block mt-0.5 opacity-80">
                          Awaiting manual assignment by admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

        </div>{/* end scroll area */}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const CLOSED_STATUSES = ['completed', 'delivered', 'cancelled'];

function getSimpleStatus(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'pending admin review') return 'Needs Review';
  if (s === 'awaiting dealer confirmation') return 'With Dealer';
  if (s === 'accepted') return 'Accepted';
  if (s === 'declined') return 'Declined';
  if (s === 'pending') return 'New Order';
  if (s.includes('in-progress') || s.includes('in progress')) return 'In Progress';
  if (s === 'completed') return 'Completed';
  if (s === 'delivered') return 'Delivered';
  if (s === 'cancelled') return 'Cancelled';
  return status || 'Unknown';
}

function getStatusStyle(status: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'delivered') return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300';
  if (s === 'cancelled') return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
  if (s.includes('in-progress') || s.includes('in progress')) return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300';
  if (s === 'accepted') return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300';
  if (s === 'declined') return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300';
  if (s === 'awaiting dealer confirmation') return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300';
  if (s === 'pending admin review') return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
  return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300';
}

export default function OrdersPage() {
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

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) setOrders(data.orders);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrders(prev => prev.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
        }
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openReassignPanel = async (orderId: number) => {
    setReassignOrderId(orderId);
    setLoadingDealers(true);
    setAvailableDealers([]);
    try {
      const res = await fetch(`/api/admin/reassign-order?orderId=${orderId}`);
      const data = await res.json();
      if (data.success) setAvailableDealers(data.dealers);
    } catch (e) {
      console.error('Failed to load dealers:', e);
    } finally {
      setLoadingDealers(false);
    }
  };

  const confirmReassign = async (dealerId: number) => {
    if (!reassignOrderId) return;
    setReassigning(true);
    try {
      const res = await fetch('/api/admin/reassign-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: reassignOrderId, dealerId }),
      });
      const data = await res.json();
      if (data.success) {
        setReassignOrderId(null);
        await fetchOrders();
      } else {
        if (data.alreadyAcceptedBy) {
          const acceptedBy = data.alreadyAcceptedBy.portal === 'admin'
            ? 'Protechtur Admin'
            : `${data.alreadyAcceptedBy.name}${data.alreadyAcceptedBy.details?.district ? ` (${data.alreadyAcceptedBy.details.district})` : ''}`;
          alert(`This task is already accepted by ${acceptedBy}.`);
        } else {
          alert(data.error || 'Reassignment failed');
        }
      }
    } catch (e) {
      alert('Network error during reassignment');
    } finally {
      setReassigning(false);
    }
  };

  const acceptTask = async (orderId: number) => {
    setAcceptingTaskId(orderId);
    try {
      const res = await fetch('/api/order-task-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          portal: 'admin',
          actorName: 'Protechtur Admin',
          actorDetails: { source: 'admin-orders' },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.alreadyAcceptedBy) {
          const acceptedBy = data.alreadyAcceptedBy.portal === 'admin'
            ? 'Protechtur Admin'
            : `${data.alreadyAcceptedBy.name}${data.alreadyAcceptedBy.details?.district ? ` (${data.alreadyAcceptedBy.details.district})` : ''}`;
          alert(`This task is already accepted by ${acceptedBy}.`);
        } else {
          alert(data.error || 'Failed to accept task');
        }
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

  // ── Section filtering ────────────────────────────────────────────────────
  const applySearch = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(o =>
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q) ||
      (o.assigned_dealer_uid || '').toLowerCase().includes(q) ||
      (o.assigned_dealer_name || '').toLowerCase().includes(q) ||
      (o.order_token || '').toLowerCase().includes(q)
    );
  };

  const isClosed = (o: any) => CLOSED_STATUSES.includes((o.status || '').toLowerCase());

  const allList       = applySearch(guestOnly ? orders.filter(o => o.is_guest_order) : orders);
  const pendingList   = applySearch(orders.filter(o => o.assigned_dealer_id && !isClosed(o)));
  const closedList    = applySearch(orders.filter(o => isClosed(o)));
  const unassignedList = applySearch(orders.filter(o => !o.assigned_dealer_id && !isClosed(o)));

  const currentOrders =
    section === 'all'        ? allList :
    section === 'pending'    ? pendingList :
    section === 'closed'     ? closedList :
    unassignedList;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500 dark:text-slate-400">Loading orders...</div>
      </div>
    );
  }

  const hasUrgent = pendingList.some(o => (o.status || '').toLowerCase() === 'declined');
  const unassignedCount = orders.filter(o => !o.assigned_dealer_id && !isClosed(o)).length;

  type SectionKey = 'all' | 'pending' | 'closed' | 'unassigned';
  const tabs: { key: SectionKey; label: string; count: number; icon: any; urgent?: boolean }[] = [
    { key: 'all',        label: 'View All Orders', count: orders.length,      icon: Package },
    { key: 'pending',    label: 'Pending',          count: pendingList.length,  icon: Clock,        urgent: hasUrgent },
    { key: 'closed',     label: 'Closed',           count: closedList.length,   icon: CheckCircle },
    { key: 'unassigned', label: 'Not Assigned',     count: unassignedCount,     icon: AlertCircle,  urgent: unassignedCount > 0 },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Orders Management</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-sm">
              {orders.length} total · {unassignedCount} unassigned · {pendingList.length} in progress
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Order ID, customer, phone, dealer..."
                className="pl-10 w-72 text-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1.5 shrink-0">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
          {tabs.map(({ key, label, count, icon: Icon, urgent }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                section === key
                  ? 'border-[#e63946] text-[#e63946] bg-red-50/50 dark:bg-red-950/30'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-black ${
                section === key
                  ? 'bg-[#e63946] text-white'
                  : urgent
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Guest filter — only on "View All" */}
        {section === 'all' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuestOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                guestOnly
                  ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-700'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              👤 Guest Orders Only
            </button>
            <span className="text-xs text-slate-400">{allList.length} orders shown</span>
          </div>
        )}

        {/* Orders */}
        <div className="space-y-3">
          {currentOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No orders in this section</p>
              {searchQuery && <p className="text-sm mt-1">Try clearing the search filter</p>}
            </div>
          ) : (
            currentOrders.map((order: any) => {
              const statusLower = (order.status || '').toLowerCase();
              const isDeclined = statusLower === 'declined';
              const isReassigning = reassignOrderId === order.order_id;
              const taskAcceptedByAdmin = order.task_accepted_by_portal === 'admin';
              const taskAcceptedByDistrict = order.task_accepted_by_portal === 'district';
              const acceptedByDistrictLabel = taskAcceptedByDistrict
                ? `${order.task_accepted_by_name}${order.task_accepted_by_details?.district ? ` (${order.task_accepted_by_details.district})` : ''}`
                : '';

              return (
                <div key={order.order_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div className="p-4">
                    <div className="flex items-start gap-4">

                      {/* Icon */}
                      <div className="w-10 h-10 rounded-full bg-[#e63946]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Package className="w-5 h-5 text-[#e63946]" />
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">

                        {/* Row 1: name + status + dealer + guest */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{order.customer_name}</span>

                          <Badge className={`${getStatusStyle(order.status)} border font-bold text-xs`}>
                            {getSimpleStatus(order.status)}
                          </Badge>

                          {order.assigned_dealer_uid && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${getStatusStyle(order.status)}`}>
                              <Hash className="w-2.5 h-2.5" />
                              {order.assigned_dealer_uid}
                              {order.assigned_dealer_name && (
                                <span className="font-medium opacity-80"> · {order.assigned_dealer_name}</span>
                              )}
                            </span>
                          )}

                          {order.is_guest_order && (
                            <Badge className="bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-200 text-xs font-bold">
                              👤 Guest
                            </Badge>
                          )}

                          {order.order_type && (
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {order.order_type === 'product_cart' ? 'Product' :
                               order.order_type === 'hd_combo'     ? 'HD Combo' :
                               order.order_type === 'quotation'    ? 'Quotation' : order.order_type}
                            </Badge>
                          )}
                        </div>

                        {/* Row 2: contact + location + order number + date */}
                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap mb-1.5">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.customer_phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[order.city, order.state].filter(Boolean).join(', ')}
                            {order.pincode && <span className="ml-1 font-mono">{order.pincode}</span>}
                          </span>
                          <span className="font-mono font-bold text-slate-400">{order.order_number}</span>
                          <span>
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {order.payment_status && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              {order.payment_status}
                            </Badge>
                          )}
                        </div>

                        {/* Row 3: latest dealer message */}
                        {order.latest_dealer_remark && (
                          <div className="flex items-start gap-1.5 mt-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                            <span className="italic">&ldquo;{order.latest_dealer_remark}&rdquo;</span>
                          </div>
                        )}

                        {order.task_accepted_at && (
                          <div className={`mt-2 rounded-lg px-3 py-2 text-xs border ${taskAcceptedByAdmin ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                            {taskAcceptedByAdmin
                              ? 'This task has already been accepted by Protechtur Admin.'
                              : `This task has already been accepted by District Manager ${acceptedByDistrictLabel}.`}
                            <span className="block mt-0.5 opacity-80">
                              {new Date(order.task_accepted_at).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        {/* Row 4: Declined — inline reassign panel */}
                        {isDeclined && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                              <span className="text-xs font-bold text-red-700 dark:text-red-400">
                                Declined by {order.assigned_dealer_uid ? `#${order.assigned_dealer_uid}` : 'dealer'}
                                {order.assigned_dealer_name ? ` — ${order.assigned_dealer_name}` : ''}
                              </span>
                            </div>

                            {isReassigning ? (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                  <Navigation className="w-3 h-3" />
                                  Available dealers (sorted by proximity):
                                </p>
                                {loadingDealers ? (
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Loading dealers...
                                  </div>
                                ) : availableDealers.length === 0 ? (
                                  <p className="text-xs text-slate-500">No available dealers found.</p>
                                ) : (
                                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                                    {availableDealers.map((dealer: any) => (
                                      <div
                                        key={dealer.dealer_id}
                                        className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                                      >
                                        <div className="flex items-center gap-2 text-xs">
                                          <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] border border-blue-300">
                                            #{dealer.display_uid}
                                          </span>
                                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                                            {dealer.business_name || dealer.full_name}
                                          </span>
                                          {dealer.location && <span className="text-slate-400">{dealer.location}</span>}
                                          {dealer.distance_km !== null && (
                                            <span className="text-green-600 font-bold">{dealer.distance_km} km</span>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          className="h-6 px-2 text-[10px] bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                          onClick={() => confirmReassign(dealer.dealer_id)}
                                          disabled={reassigning}
                                        >
                                          {reassigning ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Assign'}
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={() => setReassignOrderId(null)}
                                >
                                  Close
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1"
                                onClick={() => openReassignPanel(order.order_id)}
                              >
                                <UserCheck className="w-3 h-3" />
                                Reassign to Another Dealer
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: value + actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-xl font-black text-[#e63946]">
                          RS {(order.total_amount || 0).toLocaleString('en-IN')}
                        </p>
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="font-bold gap-1 text-xs"
                            onClick={() => setViewOrderId(order.order_id)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Button>

                          {!order.assigned_dealer_id && !taskAcceptedByDistrict && !taskAcceptedByAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => acceptTask(order.order_id)}
                              disabled={acceptingTaskId === order.order_id}
                            >
                              {acceptingTaskId === order.order_id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                              Accept Task
                            </Button>
                          )}

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1 text-xs">
                                <Edit className="w-3.5 h-3.5" />
                                Status
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change Order Status</DialogTitle>
                                <DialogDescription>
                                  <span className="font-mono font-bold">{order.order_number}</span> &mdash; {order.customer_name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-2 py-4">
                                {[
                                  { status: 'Pending',     icon: Clock },
                                  { status: 'In Progress', icon: Package },
                                  { status: 'Completed',   icon: CheckCircle },
                                  { status: 'Delivered',   icon: Truck },
                                  { status: 'Cancelled',   icon: XCircle },
                                ].map(({ status, icon: Icon }) => (
                                  <Button
                                    key={status}
                                    onClick={() => updateOrderStatus(order.order_id, status)}
                                    variant="outline"
                                    className="justify-start"
                                    disabled={updatingStatus}
                                  >
                                    <Icon className="w-4 h-4 mr-2" />
                                    {status}
                                  </Button>
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
            })
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {viewOrderId !== null && (
        <ViewDetailsModal
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
          onOrderUpdated={() => { fetchOrders(); setViewOrderId(null); }}
        />
      )}
    </>
  );
}
