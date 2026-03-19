"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Calendar,
  TrendingUp,
  FileText,
  RefreshCw,
  Activity,
  PlusCircle,
  Send,
  CheckCheck,
  Download,
  Search,
} from "lucide-react";
import jsPDF from "jspdf";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Company details for invoice
const COMPANY_NAME = 'Protechtur';

// ─── Progress status options ────────────────────────────────────────────────
const PROGRESS_STATUS_OPTIONS = [
  { value: 'In Progress',  emoji: '🔧', desc: 'Work is actively ongoing' },
  { value: 'Order Packing Done', emoji: '📦', desc: 'Order packing has been completed' },
  { value: 'Order Dispatch', emoji: '🚚', desc: 'Order has been dispatched' },
  { value: 'Order Delivery Done', emoji: '✅', desc: 'Order fully delivered & installed' },
];

function statusColor(label: string) {
  if (label === 'Order Delivery Done')      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200';
  if (label === 'Order Dispatch')           return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200';
  if (label === 'Order Packing Done')       return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-200';
  return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200';
}

function ProgressSection({ orderId, dealerId }: { orderId: number; dealerId: number }) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusLabel, setStatusLabel] = useState('In Progress');
  const [notes, setNotes] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`/api/dealer/order-progress?orderId=${orderId}`);
      const data = await res.json();
      if (data.success) setUpdates(data.updates);
    } catch (_) {/* silent */}
    finally { setLoadingUpdates(false); }
  };

  useEffect(() => { fetchUpdates(); }, [orderId]);

  const isDeliveryDone = updates.some(u => u.is_delivery_done || u.status_label === 'Order Delivery Done');
  const latestStatusLabel = updates.length > 0 ? updates[updates.length - 1].status_label : null;
  const latestIndex = latestStatusLabel
    ? PROGRESS_STATUS_OPTIONS.findIndex((opt) => opt.value === latestStatusLabel)
    : -1;
  const nextIndex = Math.min(latestIndex + 1, PROGRESS_STATUS_OPTIONS.length - 1);
  const nextRequiredStatus = PROGRESS_STATUS_OPTIONS[nextIndex]?.value || 'In Progress';

  useEffect(() => {
    if (!isDeliveryDone) {
      setStatusLabel(nextRequiredStatus);
    }
  }, [isDeliveryDone, nextRequiredStatus]);

  const needsReminder = !isDeliveryDone && (() => {
    if (updates.length === 0) return true;
    const last = updates[updates.length - 1];
    const hrs = (Date.now() - new Date(last.created_at).getTime()) / 3600000;
    return hrs >= 20;
  })();

  const submit = async () => {
    if (!statusLabel) return;
    const isDelivery = statusLabel === 'Order Delivery Done';
    if (isDelivery) {
      if (!window.confirm('Mark this order as Order Delivery Done? This completes the order and locks further updates.')) return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/dealer/order-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          dealerId,
          statusLabel,
          notes,
          estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
          isDeliveryDone: isDelivery,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchUpdates();
        setNotes('');
        setEstimatedDays('');
        setShowForm(false);
        setStatusLabel(nextRequiredStatus);
      } else {
        alert(data.error || 'Failed to submit update');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fmtTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
      {/* Section heading + Add Update button */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Order Progress
        </h4>
        {!isDeliveryDone && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {showForm ? 'Close' : 'Add Update'}
          </button>
        )}
      </div>

      {/* Reminder banner */}
      {needsReminder && !showForm && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-xl">
          <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
              {updates.length === 0
                ? '⚠️ No updates yet — add your first progress update!'
                : '⏰ Update needed! Last update was over 20 hours ago.'}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Keep the admin informed about this order&apos;s progress.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
          >
            Update Now
          </button>
        </div>
      )}

      {/* Timeline */}
      {loadingUpdates ? (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw className="w-3 h-3 animate-spin" /> Loading updates...
        </div>
      ) : updates.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[560px] px-2">
              <div className="relative">
                <div className="absolute left-6 right-6 top-4 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
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
                              : 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-500'
                          } ${isCurrent ? 'ring-2 ring-green-200 dark:ring-green-900' : ''}`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <p className={`mt-1 text-[11px] font-semibold leading-tight ${isDone ? 'text-green-700 dark:text-green-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {opt.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {updates.map((u) => (
            <div
              key={u.id}
              className={`rounded-xl px-3 py-2 border text-xs ${
                u.is_delivery_done
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`font-bold px-2 py-0.5 rounded-full border text-[10px] ${statusColor(u.status_label)}`}>
                  {u.status_label}
                </span>
                {u.estimated_days && (
                  <span className="text-slate-500 dark:text-slate-400">ETA: {u.estimated_days} day(s)</span>
                )}
              </div>
              {u.notes && (
                <p className="text-slate-600 dark:text-slate-300 italic mb-1">&ldquo;{u.notes}&rdquo;</p>
              )}
              <p className="text-slate-400 dark:text-slate-500">{fmtTime(u.created_at)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 pl-1">No progress updates yet.</p>
      )}

      {/* Delivery Done final state */}
      {isDeliveryDone && (
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-xl">
          <CheckCheck className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800 dark:text-green-200">Delivery Completed!</p>
            <p className="text-xs text-green-600 dark:text-green-400">The order has been closed and the admin has been notified.</p>
          </div>
        </div>
      )}

      {/* Update form */}
      {showForm && !isDeliveryDone && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300">Post Progress Update</h5>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Next required step: <span className="font-bold">{nextRequiredStatus}</span>
          </p>

          {/* Status radio options */}
          <div className="overflow-x-auto pb-1">
            <div className="min-w-[620px] px-1">
              <div className="relative">
                <div className="absolute left-7 right-7 top-5 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="relative flex items-start justify-between gap-2">
            {PROGRESS_STATUS_OPTIONS.map(opt => {
              const optionIndex = PROGRESS_STATUS_OPTIONS.findIndex((o) => o.value === opt.value);
              const disabled = optionIndex !== nextIndex;
              return (
              <label
                key={opt.value}
                className={`w-36 shrink-0 p-2 rounded-lg border cursor-pointer transition-all text-center ${
                  statusLabel === opt.value
                    ? opt.value === 'Order Delivery Done'
                      ? 'bg-green-50 border-green-400 dark:bg-green-950 dark:border-green-600'
                      : 'bg-blue-50 border-blue-400 dark:bg-blue-950 dark:border-blue-600'
                    : disabled
                      ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name={`status-${orderId}`}
                  value={opt.value}
                  checked={statusLabel === opt.value}
                  onChange={() => !disabled && setStatusLabel(opt.value)}
                  disabled={disabled}
                  className="sr-only"
                />
                <div className="mx-auto mb-1 w-7 h-7 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-white dark:bg-slate-800">
                  <span className="text-sm">{opt.emoji}</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{opt.value}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{opt.desc}</p>
                </div>
              </label>
            );})}
                </div>
              </div>
            </div>
          </div>

          {/* ETA days (not for final delivery step) */}
          {statusLabel !== 'Order Delivery Done' && (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estimated Days to Complete (optional)</label>
              <input
                type="number" min="1" max="90" placeholder="e.g. 3"
                value={estimatedDays}
                onChange={e => setEstimatedDays(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Notes (optional)</label>
            <textarea
              placeholder={statusLabel === 'Order Delivery Done' ? 'Any final notes about the installation...' : "What's happening with this order?"}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Delivery Done warning */}
          {statusLabel === 'Order Delivery Done' && (
            <div className="p-2.5 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                ⚠️ This will mark the order as <strong>Completed</strong>. No further updates will be possible after this.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={submitting}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-white transition-colors ${
                statusLabel === 'Order Delivery Done' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting...' : statusLabel === 'Order Delivery Done' ? 'Mark as Delivered ✅' : 'Post Update'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface OrderRequest {
  request_id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_pincode: string;
  address: string;
  total_amount: number;
  order_status: string;
  dealer_id: number;
  request_sequence: number;
  request_status: string;
  assigned_dealer_id?: number;
  stock_check_details: any;
  dealer_distance_km: number;
  requested_at: string;
  response_deadline: string;
  responded_at?: string;
  expired_at?: string;
  hours_remaining: number;
  is_expired: boolean;
  order_items: Array<{
    item_name: string;
    product_code?: string;
    quantity: number;
    unit_price: number | null;
    dealer_price: number | null;
    dealer_total: number | null;
    total_price: number | null;
  }>;
}

export default function DealerOrderRequestsPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter') as 'pending' | 'accepted' | 'declined' | 'all' | null;
  
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<OrderRequest[]>([]);
  const [declinedOrders, setDeclinedOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<OrderRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'accepted' | 'declined' | 'all'>(filterParam || 'pending');
  const [downloadingInvoice, setDownloadingInvoice] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleDownloadInvoice = async (orderId: number, orderNumber: string) => {
    setDownloadingInvoice(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`);
      const data = await res.json();
      if (!data.success) { alert('Failed to fetch invoice data'); return; }

      const { invoiceNumber, order, items, codAmount } = data;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;

      // ── Header band ──────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 38, 'F');
      doc.setTextColor(250, 204, 21);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('PROTECHTUR', pageW / 2, 18, { align: 'center' });
      doc.setFontSize(13);
      doc.setTextColor(250, 204, 21);
      doc.text('CUSTOMER INVOICE', pageW / 2, 31, { align: 'center' });

      y = 48;

      // Customer-facing order number — strip dealer UID suffix (e.g. PR-090326-008-101 → PR-090326-008)
      const customerOrderNumber = /^PR-\d{6}-\d+-\d+$/.test(order.order_number)
        ? order.order_number.replace(/-\d+$/, '')
        : order.order_number;

      // ── Invoice metadata ─────────────────────────────────────────────────
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Invoice No: ${invoiceNumber}`, margin, y);
      doc.text(`Order No: ${customerOrderNumber}`, pageW - margin, y, { align: 'right' });
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, y);
      doc.text(`Payment: ${order.payment_method || '—'} | Status: ${order.payment_status || '—'}`, pageW - margin, y, { align: 'right' });
      y += 3;
      doc.setDrawColor(200, 210, 230);
      doc.line(margin, y + 2, pageW - margin, y + 2);
      y += 8;

      // ── Seller & Buyer Section ────────────────────────────────────────
      const col2 = pageW / 2 + 5;
      const rightColWidth = pageW - margin - col2 - 2;
      const leftColWidth  = col2 - margin - 8;

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

      let yLeft  = y;
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
      doc.text(order.customer_name || '—', col2, yRight);
      yRight += 5;

      const buyerAddress = order.installation_address || '—';
      doc.setFont('helvetica', 'bold');
      doc.text('Address:', col2, yRight);
      yRight += 4.5;

      doc.setFont('helvetica', 'normal');
      const buyerAddrLines = doc.splitTextToSize(buyerAddress, rightColWidth);
      doc.text(buyerAddrLines, col2, yRight);
      yRight += (buyerAddrLines.length as number) * 4.5;

      if (order.pincode) {
        doc.setFont('helvetica', 'bold');
        doc.text('Pincode:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${order.pincode}`, col2 + 16, yRight);
        yRight += 4.5;
      }

      if (order.state) {
        doc.setFont('helvetica', 'bold');
        doc.text('State:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${order.state}`, col2 + 12, yRight);
        yRight += 4.5;
      }

      const customerGSTIN = order.customer_gstin || order.gstin || '';
      if (customerGSTIN) {
        doc.setFont('helvetica', 'bold');
        doc.text('GST No.:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${customerGSTIN}`, col2 + 16, yRight);
        yRight += 4.5;
      }

      if (order.city) {
        doc.setFont('helvetica', 'bold');
        doc.text('City:', col2, yRight);
        doc.setFont('helvetica', 'normal');
        doc.text(` ${order.city}`, col2 + 10, yRight);
        yRight += 4.5;
      }

      y = Math.max(yLeft, yRight) + 3;

      // Divider
      doc.setDrawColor(200, 210, 230);
      doc.line(margin, y, pageW - margin, y);
      y += 6;

      // ── Items Table ──────────────────────────────────────────────────────
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
      let itemsSum = 0; // Always calculate from actual items
      (items || []).forEach((item: any, idx: number) => {
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 1, pageW - 2 * margin, 7, 'F');
        }
        doc.setTextColor(15, 23, 42);
        
        const dealerUnitPrice = Number(item.dealer_price ?? item.unit_price ?? 0);
        const itemQty = Number(item.quantity || 0);
        const itemTotal = Number(item.dealer_total ?? (dealerUnitPrice * itemQty));
        const itemUnitPrice = dealerUnitPrice;
        const itemDiscount = 0; // Discount not tracked at item level currently
        const gstAmount = Math.round((itemTotal * 0.18) * 100) / 100;
        const sgstAmount = Math.round((gstAmount / 2) * 100) / 100;
        const cgstAmount = Math.round((gstAmount - sgstAmount) * 100) / 100;
        const fallbackSource = item.product_id ?? item.id ?? item.item_id ?? (idx + 1);
        const productUniqueId = item.product_code || `PIC${String(fallbackSource).padStart(3, '0')}`;
        
        doc.text(String(idx + 1), colSNo, y + 4);
        doc.text(String(productUniqueId), colProductId, y + 4);
        const itemLabel = item.item_name;
        const nameLines = doc.splitTextToSize(itemLabel, 50);
        doc.text(nameLines[0], colDesc, y + 4);
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

      // ── Totals Block ─────────────────────────────────────────────────────
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

      // ALWAYS use actual sum of items (ignore potentially wrong DB subtotal)
      const productTotal = itemsSum;
      
      // 1. Product Total (includes installation/AMC)
      addTotalRow('Product Total:', productTotal);
      
      // 2. COD Extra Charges (flat RS 500 from installation_settings)
      let codCharges = 0;
      if (order.payment_method === 'cod') {
        // Use codAmount from settings (NOT advance_amount which is 30% upfront payment)
        codCharges = codAmount || 500;
        if (codCharges > 0) addTotalRow('COD Extra Charges:', codCharges);
      }
      
      // 3. GST is applied only on Product Total (COD charges excluded)
      const gstRate = 0.18; // 18%
      const finalGST = Math.round(productTotal * gstRate * 100) / 100;
      const finalSGST = Math.round((finalGST / 2) * 100) / 100;
      const finalCGST = Math.round((finalGST - finalSGST) * 100) / 100;
      
      if (finalGST > 0) {
        addTotalRow('SGST (9%):', finalSGST);
        addTotalRow('CGST (9%):', finalCGST);
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

      // ── Footer ───────────────────────────────────────────────────────────
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 18, pageW, 18, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(200, 210, 230);
      doc.setFont('helvetica', 'normal');
      doc.text(`Thank you for choosing Protechtur. For support, contact us via our website.`, pageW / 2, pageH - 10, { align: 'center' });
      doc.text(`This is a system-generated invoice. Invoice ID: ${invoiceNumber}`, pageW / 2, pageH - 5, { align: 'center' });

      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Invoice generation error:', err);
      alert('Failed to generate invoice. Please try again.');
    } finally {
      setDownloadingInvoice(null);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      
      const storedDealerId = localStorage.getItem('dealerId');
      if (!storedDealerId) {
        console.warn('No dealer ID found');
        setLoading(false);
        return;
      }
      
      const dId = parseInt(storedDealerId);
      setDealerId(dId);
      
      await Promise.all([
        fetchRequests(dId),
        fetchAcceptedOrders(dId),
        fetchDeclinedOrders(dId)
      ]);
      
      setLoading(false);
    };

    initializePage();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (dealerId) {
        fetchRequests(dealerId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dealerId]);

  const fetchRequests = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-order-response?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const fetchAcceptedOrders = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-order-response?dealerId=${dId}&status=accepted`);
      const data = await response.json();
      
      if (data.success) {
        setAcceptedOrders(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch accepted orders:', error);
    }
  };

  const fetchDeclinedOrders = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-order-response?dealerId=${dId}&status=declined`);
      const data = await response.json();
      
      if (data.success) {
        setDeclinedOrders(data.requests);
      }
    } catch (error) {
      console.error('Failed to fetch declined orders:', error);
    }
  };

  const handleAction = (request: OrderRequest, action: 'accept' | 'decline') => {
    setSelectedRequest(request);
    setActionType(action);
    setNotes('');
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType || !dealerId) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/dealer-order-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.request_id,
          dealerId: dealerId,
          action: actionType,
          notes: notes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setActionDialogOpen(false);
        setSelectedRequest(null);
        setActionType(null);
        setNotes('');
        
        // Refresh requests
        await fetchRequests(dealerId);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to process action:', error);
      alert('Failed to process request. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getUrgencyBadge = (hoursRemaining: number | string | null) => {
    const hours = typeof hoursRemaining === 'number' ? hoursRemaining : parseFloat(String(hoursRemaining || 0));
    
    if (hours < 2) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">Urgent - {hours.toFixed(1)}h left</Badge>;
    } else if (hours < 4) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">{hours.toFixed(1)}h remaining</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">{hours.toFixed(1)}h remaining</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = async () => {
    if (dealerId) {
      setLoading(true);
      await Promise.all([
        fetchRequests(dealerId),
        fetchAcceptedOrders(dealerId),
        fetchDeclinedOrders(dealerId)
      ]);
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: 'pending' | 'accepted' | 'declined' | 'all') => {
    setActiveFilter(filter);
  };

  const normalizeSearchText = (value: string) => {
    return value
      .toLowerCase()
      .replace(/\border\s*#?/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  };

  const handleSearch = () => {
    setSearchQuery(normalizeSearchText(searchInput));
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const filteredByStatus = activeFilter === 'pending' 
    ? requests 
    : activeFilter === 'accepted' 
    ? acceptedOrders 
    : activeFilter === 'declined'
    ? declinedOrders
    : [...requests, ...acceptedOrders, ...declinedOrders].sort((a, b) => 
        new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      );

  const displayedOrders = searchQuery
    ? filteredByStatus.filter((order) => {
        const searchable = normalizeSearchText([
          order.order_number,
          order.customer_name,
          order.customer_phone,
          order.customer_pincode,
          order.address,
        ].join(' '));
        const queryTokens = searchQuery.split(' ').filter(Boolean);
        return queryTokens.every((token) => searchable.includes(token));
      })
    : filteredByStatus;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-[#facc15] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading order requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-[#f8fafc] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-slate-100 font-orbitron flex items-center gap-2">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-[#facc15]" />
            Order Requests
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">Review and respond to incoming orders</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => {
              const nextVisible = !showSearch;
              setShowSearch(nextVisible);
              if (!nextVisible) {
                clearSearch();
              }
            }}
            variant="outline"
            className="gap-2 flex-1 sm:flex-none"
          >
            <Search className="w-4 h-4" />
            Search
          </Button>
          <Button onClick={handleRefresh} variant="outline" className="gap-2 flex-1 sm:flex-none">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {showSearch && (
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Search by order no, customer name, phone, pincode, or address"
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 sm:shrink-0">
                <Button onClick={handleSearch} className="gap-2 flex-1 sm:flex-none">
                  <Search className="w-4 h-4" />
                  Search
                </Button>
                {(searchQuery || searchInput) && (
                  <Button onClick={clearSearch} variant="outline" className="flex-1 sm:flex-none">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card 
          className={`border-none shadow-sm cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'all' ? 'ring-2 ring-blue-600 bg-blue-50 dark:bg-blue-950' : 'bg-white dark:bg-slate-900'
          }`}
          onClick={() => handleFilterChange('all')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              Total Orders
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-blue-600">
              {requests.length + acceptedOrders.length + declinedOrders.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={`border-none shadow-sm cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'pending' ? 'ring-2 ring-orange-600 bg-orange-50 dark:bg-orange-950' : 'bg-white dark:bg-slate-900'
          }`}
          onClick={() => handleFilterChange('pending')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
              Pending Requests
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-orange-600">{requests.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={`border-none shadow-sm cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'accepted' ? 'ring-2 ring-green-600 bg-green-50 dark:bg-green-950' : 'bg-white dark:bg-slate-900'
          }`}
          onClick={() => handleFilterChange('accepted')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              Order Accept
            </CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-green-600">
              {acceptedOrders.length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card 
          className={`border-none shadow-sm cursor-pointer transition-all hover:shadow-md ${
            activeFilter === 'declined' ? 'ring-2 ring-red-600 bg-red-50 dark:bg-red-950' : 'bg-white dark:bg-slate-900'
          }`}
          onClick={() => handleFilterChange('declined')}
        >
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              Order Decline
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold text-red-600">
              {declinedOrders.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Requests List */}
      {displayedOrders.length === 0 ? (
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardContent className="p-8 sm:p-12 text-center">
            <Bell className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {activeFilter === 'all' && 'No Orders Yet'}
              {activeFilter === 'pending' && 'No Pending Requests'}
              {activeFilter === 'accepted' && 'No Accepted Orders'}
              {activeFilter === 'declined' && 'No Declined Orders'}
            </h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
              {activeFilter === 'all' && "You don't have any orders yet."}
              {activeFilter === 'pending' && "You don't have any order requests waiting for your response."}
              {activeFilter === 'accepted' && "You haven't accepted any orders yet."}
              {activeFilter === 'declined' && "You haven't declined any orders yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {displayedOrders.map((request) => (
            <Card key={request.request_id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-slate-900">
              <CardHeader className="bg-linear-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-b dark:border-slate-700 py-2.5 px-3 sm:px-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="font-orbitron text-xs sm:text-sm uppercase flex items-center gap-2">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#0f172a] dark:text-slate-100" />
                      Order #{request.order_number}
                    </CardTitle>
                    {/* Compact status button next to Order ID */}
                    {(activeFilter === 'all') && (
                      request.request_status === 'pending' ? (
                        <button
                          onClick={() => handleAction(request, 'accept')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-400 hover:bg-yellow-200 transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          Pending
                        </button>
                      ) : request.request_status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Accepted
                        </span>
                      ) : request.request_status === 'declined' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-400">
                          <XCircle className="w-3 h-3" />
                          Declined
                        </span>
                      ) : request.request_status === 'expired' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-400">
                          <Clock className="w-3 h-3" />
                          Timed Out
                        </span>
                      ) : request.request_status === 'reassigned' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-400">
                          <AlertCircle className="w-3 h-3" />
                          Reassigned
                        </span>
                      ) : null
                    )}
                    {(activeFilter === 'pending') && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAction(request, 'accept')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-400 hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleAction(request, 'decline')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-400 hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          Decline
                        </button>
                      </div>
                    )}
                    {(activeFilter === 'accepted') && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Accepted
                      </span>
                    )}
                    {(activeFilter === 'declined') && (
                      request.request_status === 'expired' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-400">
                          <Clock className="w-3 h-3" />
                          Timed Out
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-400">
                          <XCircle className="w-3 h-3" />
                          Declined
                        </span>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <CardDescription className="text-xs">
                      {formatDate(request.requested_at)}
                    </CardDescription>
                    {(activeFilter === 'pending' || (activeFilter === 'all' && request.request_status === 'pending')) && getUrgencyBadge(request.hours_remaining)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-sm">
                  <div className="md:col-span-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="font-semibold truncate">{request.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{request.customer_phone}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5" />
                      <span className="line-clamp-2">{request.address}</span>
                    </div>
                    <div className="text-xs text-slate-500">PIN: {request.customer_pincode}</div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {request.order_items?.map((item, idx) => {
                        const hasDealerPrice = Number(item.dealer_price) > 0;
                        const displayPrice = hasDealerPrice
                          ? Number(item.dealer_price) * Number(item.quantity || 0)
                          : null;
                        return (
                          <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded">
                            <div className="min-w-0 pr-2">
                              <span className="font-medium truncate">{item.item_name}</span>
                              {item.product_code && <span className="ml-1 text-[10px] font-bold text-slate-500">({item.product_code})</span>}
                              <span className="text-slate-500 ml-1">x{item.quantity}</span>
                              {hasDealerPrice ? (
                                <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1 py-0.5 rounded font-semibold">
                                  Dealer Price
                                </span>
                              ) : (
                                <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1 py-0.5 rounded font-semibold">
                                  Price pending
                                </span>
                              )}
                            </div>
                            <span className="font-semibold shrink-0">
                              {displayPrice !== null ? `RS ${displayPrice.toLocaleString('en-IN')}` : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-3 flex md:justify-end">
                    <div className="w-full md:w-auto rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-3 py-2">
                      <p className="text-[11px] font-semibold text-green-700 dark:text-green-300">Order Value</p>
                      <p className="text-lg font-black text-green-600">
                        RS {(
                          request.order_items && request.order_items.length > 0
                            ? request.order_items.reduce((sum, item) => {
                                const price = item.dealer_price && item.dealer_price > 0
                                  ? Number(item.dealer_price) * Number(item.quantity || 0)
                                  : 0;
                                return sum + price;
                              }, 0)
                            : 0
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deadline Info - Only show for pending orders */}
                {(activeFilter === 'pending' || (activeFilter === 'all' && request.request_status === 'pending')) && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-semibold">Response Deadline:</span>
                        <span>{formatDate(request.response_deadline)}</span>
                      </div>
                      <span className="sm:ml-auto">
                        ({(typeof request.hours_remaining === 'number' ? request.hours_remaining : parseFloat(String(request.hours_remaining || 0))).toFixed(1)} hours remaining)
                      </span>
                    </div>
                  </div>
                )}

                {/* Installation Mandatory Notice - only for pending */}
                {(activeFilter === 'pending') && (
                  <div className="mt-4 p-3 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-400 dark:border-amber-600 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-amber-500 dark:bg-amber-600 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white font-bold text-xs">!</span>
                      </div>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <span className="font-bold">Installation Mandatory:</span> By accepting, you commit to full installation services.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Display for Accepted/Declined Orders in specific filters */}
                {request.request_status === 'reassigned' || (request.request_status === 'accepted' && request.assigned_dealer_id && request.assigned_dealer_id !== dealerId) ? (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-800">
                      Another dealer has been assigned to this order. You no longer have access to update it.
                    </p>
                  </div>
                ) : request.request_status === 'accepted' && dealerId ? (
                  <>
                    <ProgressSection orderId={request.order_id} dealerId={dealerId} />
                    {/* Download Customer Invoice - shown for all accepted orders */}
                    <div className="mt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Customer Invoice</p>
                          <p className="text-[10px] text-slate-400">INV-{request.order_number}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoice(request.order_id, request.order_number)}
                        disabled={downloadingInvoice === request.order_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
                      >
                        {downloadingInvoice === request.order_id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        {downloadingInvoice === request.order_id ? 'Generating...' : 'Download Invoice'}
                      </button>
                    </div>
                  </>
                ) : null}

                {activeFilter === 'declined' && (
                  request.request_status === 'expired' ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">Time Out</span>
                      <span>— Already assigned to another dealer</span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-medium">Order Declined</span>
                      <span>— Better luck next time 💪</span>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'accept' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Accept Order Request
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Decline Order Request
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && `Order #${selectedRequest.order_number} - ${selectedRequest.customer_name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                {actionType === 'accept' ? 'Add Notes (Optional)' : 'Reason for Declining (Required)'}
              </label>
              <Textarea
                placeholder={actionType === 'accept' 
                  ? "Add any notes about delivery timing, special instructions, etc."
                  : "Please provide a reason for declining this order..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="border-slate-200"
              />
            </div>

            {actionType === 'accept' && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> By accepting this order, you commit to fulfilling it from your current stock.
                </p>
              </div>
            )}

            {actionType === 'decline' && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This order will be automatically sent to the next available dealer.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={processing || (actionType === 'decline' && !notes.trim())}
              className={actionType === 'accept' 
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
              }
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
