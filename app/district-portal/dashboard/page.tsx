"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Building2,
  Star,
  TrendingUp,
  Activity,
  LogOut,
  Store,
  FileText,
  X,
  RefreshCw,
  Hash,
  History,
  IndianRupee,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wrench,
  Truck,
  BadgeCheck,
  Tag,
  ArrowRight,
  Send,
  Timer,
  UserX,
  UserCheck2,
  ShieldAlert,
  Eye,
  User,
  Search,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DealerDetailsModal from "@/components/DealerDetailsModal";
import SendAlertModal from "@/components/SendAlertModal";

interface DistrictUser {
  district_user_id: number;
  username: string;
  email: string;
  full_name: string;
  district: string;
  state: string;
  can_view_dealers: boolean;
  can_view_orders: boolean;
  can_contact_dealers: boolean;
}

interface Dealer {
  dealer_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  business_name: string;
  business_address: string;
  location: string;
  status: string;
  rating: number;
  completed_jobs: number;
  serviceable_pincodes: string;
  unique_dealer_id?: string | null;
  gstin?: string | null;
}

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  installation_address: string;
  pincode: string;
  status: string;
  total_amount: number;
  created_at: string;
  dealer_name: string;
  dealer_business_name: string;
  dealer_request_status: string | null;
  dealer_response_at: string | null;
  dealer_notes: string | null;
  task_accepted_by_portal?: 'admin' | 'district' | null;
  task_accepted_by_name?: string | null;
  task_accepted_by_details?: { district?: string; username?: string } | null;
  task_accepted_at?: string | null;
}

interface DealerRequest {
  request_id: number;
  order_id: number;
  dealer_id: number;
  request_status: string;
  response_deadline: string;
  dealer_distance_km: number;
  stock_verified: boolean;
  stock_available: boolean;
  dealer_response_at: string | null;
  dealer_notes: string | null;
  created_at: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  installation_address: string;
  pincode: string;
  total_amount: number;
  order_status: string;
  dealer_business_name: string;
  dealer_name: string;
  dealer_phone: string;
  dealer_email: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: any) {
  return 'RS ' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: any) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── District Order Details Modal ──────────────────────────────────────────

function ViewOrderModal({
  orderId,
  district,
  onClose,
}: {
  orderId: number;
  district: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    const interval = setInterval(() => fetchOrderData(), 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 text-slate-500 flex gap-3 items-center">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading order details...
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { order, orderItems, transactions, statusHistory, dealerRequests, progressUpdates = [], paymentSummary } = data;
  const statusLower = order.status?.toLowerCase() || '';
  const paidFull = paymentSummary.remaining_balance <= 0;

  // ── Build unified order journey ──
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
      journeyEvents.push({ kind: 'status', time: new Date(h.created_at), label: h.status, remarks: h.remarks || null, by: h.updated_by_name || h.updated_by_dealer_name || null });
    }
  });

  dealerRequests.forEach((req: any) => {
    const isExpired = req.request_status === 'pending' && new Date(req.response_deadline) < now;
    const effectiveStatus: string = isExpired ? 'expired' : req.request_status;
    journeyEvents.push({ kind: 'dealer_sent', time: new Date(req.requested_at || req.created_at), seq: req.request_sequence, dealer: req.dealer_name || req.dealer_full_name || 'Unknown Dealer', uid: req.dealer_display_uid || '—', distance: req.dealer_distance_km ?? null, deadline: new Date(req.response_deadline), status: effectiveStatus, respondedAt: req.responded_at ? new Date(req.responded_at) : null, declineReason: req.decline_reason || null });
    if (req.responded_at && (effectiveStatus === 'accepted' || effectiveStatus === 'declined')) {
      journeyEvents.push({ kind: 'dealer_result', time: new Date(req.responded_at), seq: req.request_sequence, dealer: req.dealer_name || req.dealer_full_name || 'Unknown Dealer', uid: req.dealer_display_uid || '—', result: effectiveStatus as 'accepted' | 'declined', reason: req.decline_reason || null });
    } else if (effectiveStatus === 'expired') {
      journeyEvents.push({ kind: 'dealer_result', time: new Date(req.response_deadline), seq: req.request_sequence, dealer: req.dealer_name || req.dealer_full_name || 'Unknown Dealer', uid: req.dealer_display_uid || '—', result: 'expired', reason: null });
    }
  });
  journeyEvents.sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div className="relative mx-auto my-6 w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-white font-mono">{order.order_number}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                statusLower === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' :
                statusLower === 'completed' ? 'bg-green-100 text-green-800 border-green-300' :
                statusLower === 'declined' ? 'bg-red-100 text-red-800 border-red-300' :
                statusLower === 'awaiting dealer confirmation' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                'bg-slate-100 text-slate-700 border-slate-300'
              }`}>{order.status}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-slate-400 text-xs">Created {fmtDate(order.created_at)}</p>
              {lastRefreshed && <p className="text-slate-500 text-[10px]">Updated {lastRefreshed.toLocaleTimeString()}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchOrderData(true)} disabled={refreshing} className="text-slate-400 hover:text-white transition-colors p-1" title="Refresh">
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Customer Info */}
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

          {/* Order Details */}
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
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-slate-800 break-all">{value}</p>
                </div>
              ))}
            </div>
            {orderItems && orderItems.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Items Ordered
                </p>
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
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              item.item_type === 'Product' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>{item.item_type}</span>
                          </td>
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

          {/* Payment Breakdown */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <IndianRupee className="w-3.5 h-3.5" /> Payment Breakdown
            </h2>
            <div className="bg-slate-50 rounded-2xl overflow-hidden">
              <div className="divide-y">
                {[
                  { label: 'Products / Subtotal', icon: Package, value: paymentSummary.products_total || paymentSummary.subtotal, show: true },
                  { label: 'Installation Charges', icon: Wrench, value: paymentSummary.installation_charges, show: paymentSummary.installation_charges > 0 },
                  { label: 'Delivery Charges', icon: Truck, value: paymentSummary.delivery_charges, show: paymentSummary.delivery_charges > 0 },
                  { label: 'AMC', icon: BadgeCheck, value: paymentSummary.amc_cost, show: paymentSummary.amc_cost > 0 },
                  { label: 'Tax', icon: ArrowUpFromLine, value: paymentSummary.tax_amount, show: paymentSummary.tax_amount > 0 },
                  { label: 'Discount', icon: Tag, value: -paymentSummary.discount_amount, show: paymentSummary.discount_amount > 0, negative: true },
                  { label: 'Referral Discount', icon: Tag, value: -paymentSummary.referral_discount, show: paymentSummary.referral_discount > 0, negative: true },
                  { label: 'Points Redeemed', icon: Tag, value: -paymentSummary.points_redeemed, show: paymentSummary.points_redeemed > 0, negative: true },
                  { label: 'COD Extra Charge', icon: CreditCard, value: paymentSummary.derived_cod_extra, show: (paymentSummary.derived_cod_extra ?? 0) > 0 && order.payment_method === 'cod' },
                ].filter(r => r.show).map(({ label, icon: Icon, value, negative }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600"><Icon className="w-3.5 h-3.5 opacity-60" />{label}</div>
                    <span className={`text-sm font-bold ${negative ? 'text-green-600' : 'text-slate-800'}`}>
                      {negative ? '-' : ''}{fmt(Math.abs(value))}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white font-black text-base">
                  <span>Total Order Value</span>
                  <span className="text-red-400">{fmt(paymentSummary.total_amount)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownToLine className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold uppercase text-green-700">Amount Paid</span>
                </div>
                <p className="text-2xl font-black text-green-700">{fmt(paymentSummary.effective_paid)}</p>
              </div>
              <div className={`border rounded-xl p-4 ${paidFull ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className={`w-4 h-4 ${paidFull ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-xs font-bold uppercase ${paidFull ? 'text-green-700' : 'text-red-700'}`}>Remaining Balance</span>
                </div>
                <p className={`text-2xl font-black ${paidFull ? 'text-green-700' : 'text-red-700'}`}>
                  {paidFull ? 'PAID IN FULL' : fmt(paymentSummary.remaining_balance)}
                </p>
              </div>
            </div>
            {transactions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-bold uppercase text-slate-400 mb-2">Payment Transactions</p>
                <div className="space-y-2">
                  {transactions.map((t: any) => (
                    <div key={t.transaction_id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 capitalize">{t.transaction_type.replace(/_/g, ' ')}</p>
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

          {/* Assigned Dealer */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> Assigned Dealer
            </h2>
            {order.assigned_dealer_id ? (
              <div className="bg-slate-50 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-black text-sm border border-blue-300">
                    <Hash className="w-3 h-3" />{order.assigned_dealer_display_uid}
                  </span>
                  <div>
                    <p className="font-black text-slate-900">{order.assigned_dealer_name || order.assigned_dealer_full_name}</p>
                    <p className="text-xs text-slate-500">{order.assigned_dealer_location || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {order.assigned_dealer_phone && (
                    <div className="flex items-center gap-1.5 text-slate-600"><Phone className="w-3 h-3" />{order.assigned_dealer_phone}</div>
                  )}
                  {order.assigned_dealer_email && (
                    <div className="flex items-center gap-1.5 text-slate-600 col-span-2">{order.assigned_dealer_email}</div>
                  )}
                  {order.assigned_at && (
                    <div className="text-slate-400 col-span-2">Assigned: {fmtDate(order.assigned_at)}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-4 text-slate-400 text-sm">No dealer assigned yet.</div>
            )}
          </section>

          {/* Dealer Progress Updates */}
          {progressUpdates.length > 0 && (
            <section>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Dealer Progress Updates
              </h2>
              <div className="relative pl-1">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-3">
                  {progressUpdates.map((u: any) => (
                    <div key={u.id} className="flex gap-3 relative">
                      <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] border-2 ${
                        u.is_delivery_done ? 'bg-green-100 border-green-500' : 'bg-blue-50 border-blue-400'
                      }`}>
                        {u.is_delivery_done ? '✅' : '🔧'}
                      </div>
                      <div className={`flex-1 rounded-xl px-3 py-2.5 border text-xs ${
                        u.is_delivery_done ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                      }`}>
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
            </section>
          )}

          {/* Order Journey Timeline */}
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Order Journey
            </h2>
            {journeyEvents.length === 0 ? (
              <p className="text-sm text-slate-400">No tracking events yet.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200" />
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
                            'bg-slate-100 border-slate-300'
                          }`}>
                            <FileText className={`w-3.5 h-3.5 ${isCreated ? 'text-blue-600' : ev.label?.toLowerCase().includes('complete') ? 'text-green-600' : 'text-slate-500'}`} />
                          </div>
                          <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                            <p className="text-xs font-black text-slate-800">{ev.label}</p>
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
                            isAccepted ? 'bg-green-100 border-green-400' : isDeclined ? 'bg-red-100 border-red-400' : isExpired ? 'bg-amber-100 border-amber-400' : isCancelled ? 'bg-slate-100 border-slate-300' : 'bg-orange-100 border-orange-400'
                          }`}>
                            <Send className={`w-3.5 h-3.5 ${isAccepted ? 'text-green-600' : isDeclined ? 'text-red-600' : isExpired ? 'text-amber-600' : isCancelled ? 'text-slate-400' : 'text-orange-600'}`} />
                          </div>
                          <div className={`flex-1 rounded-xl px-3 py-2.5 border ${
                            isAccepted ? 'bg-green-50 border-green-200' : isDeclined ? 'bg-red-50 border-red-200' : isExpired ? 'bg-amber-50 border-amber-200' : isCancelled ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-orange-50 border-orange-200'
                          }`}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black text-slate-500 uppercase">Attempt #{ev.seq}</span>
                              <span className="text-xs font-black text-slate-800">#{ev.uid} {ev.dealer}</span>
                              {ev.distance !== null && <span className="text-[10px] text-green-600 font-bold">{Number(ev.distance).toFixed(1)} km away</span>}
                              {isPending && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-orange-100 text-orange-700 border border-orange-300 animate-pulse">⏳ Awaiting response</span>}
                              {isCancelled && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500 border border-slate-300">Skipped</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <p className="text-[10px] text-slate-400">📤 Sent: {fmtDate(ev.time)}</p>
                              <p className={`text-[10px] font-medium ${isPending && ev.deadline < now ? 'text-red-500' : 'text-slate-400'}`}>
                                ⏱ Deadline: {fmtDate(ev.deadline)}{isPending && ev.deadline < now && ' — OVERDUE'}
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
                            isAccepted ? 'bg-green-200 border-green-500' : isDeclined ? 'bg-red-200 border-red-500' : 'bg-amber-200 border-amber-500'
                          }`}>
                            {isAccepted && <UserCheck2 className="w-3.5 h-3.5 text-green-700" />}
                            {isDeclined && <UserX className="w-3.5 h-3.5 text-red-700" />}
                            {isExpired && <Timer className="w-3.5 h-3.5 text-amber-700" />}
                          </div>
                          <div className={`flex-1 rounded-xl px-3 py-2.5 border ${
                            isAccepted ? 'bg-green-100 border-green-300' : isDeclined ? 'bg-red-100 border-red-300' : 'bg-amber-100 border-amber-300'
                          }`}>
                            <p className={`text-xs font-black ${isAccepted ? 'text-green-800' : isDeclined ? 'text-red-800' : 'text-amber-800'}`}>
                              {isAccepted && `✅ #${ev.uid} ${ev.dealer} accepted the order`}
                              {isDeclined && `❌ #${ev.uid} ${ev.dealer} declined the order`}
                              {isExpired && `⏰ #${ev.uid} ${ev.dealer} did not respond — deadline expired`}
                            </p>
                            {ev.reason && <p className="text-[11px] text-red-600 mt-0.5">Reason: {ev.reason}</p>}
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
                  {/* Current status at end of timeline */}
                  <div className="relative flex gap-3">
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                      statusLower === 'accepted' || statusLower === 'completed' ? 'bg-green-200 border-green-500' :
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
                      statusLower === 'accepted' || statusLower === 'completed' ? 'bg-green-100 border-green-300 text-green-800' :
                      statusLower === 'declined' ? 'bg-red-100 border-red-300 text-red-800' :
                      statusLower === 'pending admin review' ? 'bg-purple-50 border-purple-300 text-purple-800' :
                      'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      Current Status: {order.status}
                      {order.assigned_dealer_id && order.assigned_dealer_name && (
                        <span className="font-normal text-[11px] block mt-0.5 opacity-80">Handled by #{order.assigned_dealer_display_uid} {order.assigned_dealer_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

export default function DistrictPortalDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<DistrictUser | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dealerRequests, setDealerRequests] = useState<DealerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseNotes, setResponseNotes] = useState<string>("");
  const [respondingToOrder, setRespondingToOrder] = useState<number | null>(null);
  const [orderResponseNotes, setOrderResponseNotes] = useState<string>("");
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<number | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState<string>("");
  const [acceptingTaskOrderId, setAcceptingTaskOrderId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'dealers' | 'orders' | 'requests'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dealerSearchQuery, setDealerSearchQuery] = useState<string>('');
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [selectedDealerName, setSelectedDealerName] = useState<string>('');
  const [selectedDealerEmail, setSelectedDealerEmail] = useState<string>('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [approvalDealer, setApprovalDealer] = useState<Dealer | null>(null);
  const [approvalMode, setApprovalMode] = useState<'auto' | 'manual'>('auto');
  const [autoUniqueId, setAutoUniqueId] = useState('');
  const [manualUniqueId, setManualUniqueId] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [approvingDealer, setApprovingDealer] = useState(false);
  const [viewOrderId, setViewOrderId] = useState<number | null>(null);
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('district_user');
    if (!userData) {
      router.push('/district-portal/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    fetchData(parsedUser.district);
  }, [router]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab === 'orders') {
      router.replace('/district-portal/orders');
      return;
    }
    if (requestedTab === 'dealers' || requestedTab === 'requests' || requestedTab === 'overview') {
      setActiveTab(requestedTab);
      return;
    }
    setActiveTab('overview');
  }, [router, searchParams]);

  const fetchData = async (district: string) => {
    try {
      const token = localStorage.getItem('district_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const [dealersRes, ordersRes, requestsRes] = await Promise.all([
        fetch(`/api/district-portal/dealers?district=${encodeURIComponent(district)}`, { headers }),
        fetch(`/api/district-portal/orders?district=${encodeURIComponent(district)}`, { headers }),
        fetch(`/api/district-portal/dealer-requests?district=${encodeURIComponent(district)}`, { headers })
      ]);

      const dealersData = await dealersRes.json();
      const ordersData = await ordersRes.json();
      const requestsData = await requestsRes.json();

      if (dealersData.success) setDealers(dealersData.dealers);
      if (ordersData.success) setOrders(ordersData.orders);
      if (requestsData.success) setDealerRequests(requestsData.requests);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.district) return;
    const interval = setInterval(() => {
      fetchData(user.district);
    }, 10000);
    return () => clearInterval(interval);
  }, [user?.district]);

  const handleRespond = async (requestId: number, action: 'accept' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this order request?`)) {
      return;
    }

    try {
      const response = await fetch('/api/district-portal/respond-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          notes: responseNotes || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Order ${action === 'accept' ? 'accepted' : 'rejected'} successfully!`);
        setRespondingTo(null);
        setResponseNotes("");
        // Refresh data
        if (user) {
          fetchData(user.district);
        }
      } else {
        alert(data.error || 'Failed to process request');
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
      alert('Failed to process request');
    }
  };

  const handleDealerClick = (dealerId: number) => {
    console.log('Dealer clicked with ID:', dealerId, 'Type:', typeof dealerId);
    setSelectedDealerId(dealerId);
    setShowDetailsModal(true);
  };

  const handleSendAlert = (dealerId: number) => {
    const dealer = dealers.find(d => d.dealer_id === dealerId);
    if (dealer) {
      setSelectedDealerId(dealerId);
      setSelectedDealerName(dealer.full_name);
      setSelectedDealerEmail(dealer.email);
      setShowDetailsModal(false);
      setShowAlertModal(true);
    }
  };

  const handleAlertSuccess = () => {
    setShowAlertModal(false);
    alert('Alert sent successfully!');
  };

  const loadNextUniqueId = async () => {
    if (!user?.district) return;
    try {
      const response = await fetch('/api/district-portal/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next-uid', district: user.district })
      });
      const data = await response.json();
      if (data.success) {
        setAutoUniqueId(data.nextUniqueId || '101');
      } else {
        setAutoUniqueId('101');
      }
    } catch {
      setAutoUniqueId('101');
    }
  };

  const openApprovalModal = async (dealer: Dealer) => {
    setApprovalDealer(dealer);
    setApprovalMode('auto');
    setManualUniqueId('');
    setApprovalError('');
    await loadNextUniqueId();
  };

  const approveDealer = async () => {
    if (!approvalDealer || !user?.district) return;
    const uniqueDealerId = approvalMode === 'auto' ? autoUniqueId : manualUniqueId.trim();
    if (!uniqueDealerId) {
      setApprovalError('Unique Dealer ID is required.');
      return;
    }

    setApprovingDealer(true);
    setApprovalError('');
    try {
      const response = await fetch('/api/district-portal/dealers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId: approvalDealer.dealer_id,
          status: 'Active',
          district: user.district,
          uniqueDealerId,
        })
      });
      const data = await response.json();
      if (!data.success) {
        setApprovalError(data.error || 'Failed to approve dealer.');
        return;
      }

      setApprovalDealer(null);
      setManualUniqueId('');
      setAutoUniqueId('');
      await fetchData(user.district);
      alert(`Dealer approved. Assigned Unique ID: ${data.assignedUniqueId || uniqueDealerId}`);
    } catch {
      setApprovalError('Network error while approving dealer.');
    } finally {
      setApprovingDealer(false);
    }
  };

  const rejectDealer = async (dealerId: number) => {
    if (!user?.district) return;
    if (!confirm('Are you sure you want to reject this dealer?')) return;

    try {
      const response = await fetch('/api/district-portal/dealers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerId, status: 'Rejected', district: user.district })
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to reject dealer');
        return;
      }

      await fetchData(user.district);
      alert('Dealer rejected successfully');
    } catch {
      alert('Network error while rejecting dealer');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number) => {
    if (!newOrderStatus) {
      alert('Please select a status');
      return;
    }

    if (!user?.district) {
      alert('District user session is missing. Please log in again.');
      return;
    }

    if (!confirm(`Are you sure you want to update this order status to ${newOrderStatus}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/district-portal/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newOrderStatus,
          district: user.district,
          notes: orderResponseNotes || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Order status updated to ${newOrderStatus} successfully!`);
        setUpdatingOrderStatus(null);
        setNewOrderStatus("");
        setOrderResponseNotes("");
        // Refresh data
        if (user) {
          fetchData(user.district);
        }
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const handleAcceptTask = async (orderId: number) => {
    if (!user) return;
    setAcceptingTaskOrderId(orderId);
    try {
      const response = await fetch('/api/order-task-accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          portal: 'district',
          actorName: user.full_name || 'District Manager',
          actorDetails: {
            district: user.district,
            username: user.username,
          },
        })
      });
      const data = await response.json();
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
      await fetchData(user.district);
    } catch (error) {
      console.error('Failed to accept task:', error);
      alert('Network error while accepting task');
    } finally {
      setAcceptingTaskOrderId(null);
    }
  };

  const filteredDealers = dealers.filter((dealer) => {
    const statusMatch = filterStatus === 'all' || dealer.status === filterStatus;
    const q = dealerSearchQuery.trim().toLowerCase();
    if (!q) return statusMatch;

    const searchMatch = [
      dealer.full_name,
      dealer.business_name,
      dealer.email,
      dealer.phone_number,
      dealer.location,
      dealer.unique_dealer_id || "",
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(q));

    return statusMatch && searchMatch;
  });

  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const setDashboardTab = (tab: 'overview' | 'dealers' | 'requests') => {
    setActiveTab(tab);
    router.push(tab === 'overview' ? '/district-portal/dashboard' : `/district-portal/dashboard?tab=${tab}`);
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalDealers: dealers.length,
    activeDealers: dealers.filter(d => d.status === 'Active').length,
    pendingDealers: dealers.filter(d => d.status === 'Pending Approval').length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'Pending').length,
    completedOrders: orders.filter(o => o.status === 'Completed').length,
    totalRevenue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount?.toString() || '0'), 0)
  };

  return (
    <div className="space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-white via-blue-50 to-slate-100 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">District Management</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{user.district} Operations Dashboard</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <MapPin className="h-4 w-4" />
                {user.district}, {user.state}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white/80 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">{stats.totalDealers} dealers</Badge>
              <Badge variant="outline" className="bg-white/80 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">{stats.totalOrders} orders</Badge>
              <Badge variant="outline" className="bg-white/80 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200">RS {stats.totalRevenue.toLocaleString('en-IN')} revenue</Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setDashboardTab('dealers')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-500" />
                Total Dealers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.totalDealers}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">
                {stats.activeDealers} active, {stats.pendingDealers} pending
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/district-portal/orders')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.totalOrders}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">
                {stats.pendingOrders} pending, {stats.completedOrders} completed
              </p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/district-portal/orders')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                RS {stats.totalRevenue.toLocaleString('en-IN')}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">From all orders</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setDashboardTab('dealers')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Avg Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {dealers.length > 0 
                  ? (dealers.reduce((sum, d) => sum + parseFloat(d.rating?.toString() || '0'), 0) / dealers.length).toFixed(1)
                  : 'N/A'
                }
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">Dealer average</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setDashboardTab('overview')}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Overview
          </Button>
          {user.can_view_dealers && (
            <Button
              variant={activeTab === 'dealers' ? 'default' : 'outline'}
              onClick={() => setDashboardTab('dealers')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Dealers ({dealers.length})
            </Button>
          )}
          {user.can_view_orders && (
            <Button
              variant={activeTab === 'requests' ? 'default' : 'outline'}
              onClick={() => setDashboardTab('requests')}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Dealer Requests ({dealerRequests.length})
            </Button>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>District Overview</CardTitle>
                <CardDescription>Summary of dealers and orders in {user.district}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="mb-1 text-sm text-gray-600 dark:text-slate-300">Active Dealers</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.activeDealers}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <p className="mb-1 text-sm text-gray-600 dark:text-slate-300">Pending Approval</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pendingDealers}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="mb-1 text-sm text-gray-600 dark:text-slate-300">Completed Orders</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="mb-1 text-sm text-gray-600 dark:text-slate-300">Pending Orders</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">Your Permissions</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.can_view_dealers && (
                        <Badge variant="outline" className="bg-blue-50">View Dealers</Badge>
                      )}
                      {user.can_view_orders && (
                        <Badge variant="outline" className="bg-green-50">View Orders</Badge>
                      )}
                      {user.can_contact_dealers && (
                        <Badge variant="outline" className="bg-purple-50">Contact Dealers</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {user.can_view_dealers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Recent Dealers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dealers.slice(0, 5).map((dealer) => (
                        <div key={dealer.dealer_id} className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-slate-800/60">
                          <div>
                            <p className="font-medium">{dealer.business_name}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-300">{dealer.full_name}</p>
                          </div>
                          <Badge variant={dealer.status === 'Active' ? 'default' : 'secondary'}>
                            {dealer.status}
                          </Badge>
                        </div>
                      ))}
                      {dealers.length === 0 && <p className="py-4 text-center text-gray-500 dark:text-slate-400">No dealers in this district</p>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {user.can_view_orders && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.order_id} className="flex items-center justify-between rounded bg-gray-50 p-3 dark:bg-slate-800/60">
                          <div>
                            <p className="font-medium text-sm">{order.order_number}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-300">{order.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">RS {parseFloat(order.total_amount?.toString() || '0').toLocaleString('en-IN')}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && <p className="py-4 text-center text-gray-500 dark:text-slate-400">No orders yet</p>}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Dealers Tab */}
        {activeTab === 'dealers' && user.can_view_dealers && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Dealers in {user.district}
                  </CardTitle>
                  <CardDescription>All dealers operating in your district</CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                  <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <Input
                      value={dealerSearchQuery}
                      onChange={(e) => setDealerSearchQuery(e.target.value)}
                      placeholder="Search dealer by name, email, phone, UID"
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDealers.map((dealer) => (
                  <div key={dealer.dealer_id} className="rounded-lg border border-slate-200 px-4 py-3 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 text-sm">
                          <div className="md:col-span-4 min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDealerClick(dealer.dealer_id)}
                                className="truncate font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline dark:text-blue-300 dark:hover:text-blue-200"
                              >
                                {dealer.business_name}
                              </button>
                              <Badge variant={dealer.status === 'Active' ? 'default' : 'secondary'}>
                                {dealer.status}
                              </Badge>
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-600 dark:text-slate-300">{dealer.full_name}</p>
                            {dealer.unique_dealer_id && (
                              <p className="mt-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">UID: {dealer.unique_dealer_id}</p>
                            )}
                          </div>

                          <div className="md:col-span-4 min-w-0 space-y-1 text-xs text-gray-600 dark:text-slate-300">
                            {user.can_contact_dealers && (
                              <>
                                <div className="flex items-center gap-1.5 truncate"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{dealer.phone_number}</span></div>
                                <div className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{dealer.email}</span></div>
                              </>
                            )}
                            <div className="flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0" /><span>{dealer.location}</span></div>
                          </div>

                          <div className="md:col-span-4 min-w-0 space-y-1 text-xs text-gray-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /><span className="font-semibold">{dealer.rating || 'N/A'}</span><span>· {dealer.completed_jobs} jobs</span></div>
                            <div className="flex items-center gap-1.5 truncate"><Building2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{dealer.business_address}</span></div>
                            <div className="flex items-center gap-1.5 truncate"><FileText className="h-3.5 w-3.5 shrink-0" /><span>PIN: {dealer.serviceable_pincodes || 'Not set'}</span></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/district-portal/proforma?dealerId=${dealer.dealer_id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Proformas
                        </Button>
                        {dealer.status === 'Pending Approval' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => openApprovalModal(dealer)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => rejectDealer(dealer.dealer_id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredDealers.length === 0 && (
                  <div className="py-12 text-center text-gray-500 dark:text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{dealerSearchQuery.trim() ? 'No matching dealer found' : 'No dealers found'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && user.can_view_orders && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Orders in {user.district}
                  </CardTitle>
                  <CardDescription>All orders assigned to dealers in your district</CardDescription>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-left">Order #</th>
                      <th className="px-4 py-2 text-left">Customer</th>
                      <th className="px-4 py-2 text-left">Location</th>
                      <th className="px-4 py-2 text-left">Dealer</th>
                      <th className="px-4 py-2 text-center">Amount</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-center">Date</th>
                      <th className="px-4 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.order_id} className="border-b hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800/60">
                        <td className="px-4 py-3 font-medium">{order.order_number}</td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-gray-600 dark:text-slate-300">{order.customer_phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p>{order.installation_address?.substring(0, 30)}...</p>
                            <p className="text-gray-600 dark:text-slate-300">PIN: {order.pincode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{order.dealer_name || 'Not assigned'}</td>
                        <td className="px-4 py-3 text-center font-semibold">
                          RS {parseFloat(order.total_amount?.toString() || '0').toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline">{order.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mb-2 gap-1 text-xs"
                            onClick={() => setViewOrderId(order.order_id)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Button>
                          {!order.dealer_name && !order.task_accepted_at && (
                            <Button
                              onClick={() => handleAcceptTask(order.order_id)}
                              className="w-full mb-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2"
                              size="sm"
                              disabled={acceptingTaskOrderId === order.order_id}
                            >
                              {acceptingTaskOrderId === order.order_id ? 'Accepting...' : 'Accept Task'}
                            </Button>
                          )}
                          {order.task_accepted_at && (
                            <div className={`mb-2 rounded-md border px-2 py-1.5 text-[11px] ${order.task_accepted_by_portal === 'admin' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                              {order.task_accepted_by_portal === 'admin'
                                ? 'Already accepted by Protechtur Admin'
                                : `Already accepted by ${order.task_accepted_by_name}${order.task_accepted_by_details?.district ? ` (${order.task_accepted_by_details.district})` : ''}`}
                            </div>
                          )}
                          {order.dealer_request_status === 'accepted' ? (
                            <div className="text-center">
                              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accepted
                              </Badge>
                              {order.dealer_response_at && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                  by {order.dealer_business_name || order.dealer_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {updatingOrderStatus === order.order_id ? (
                                <div className="space-y-2">
                                  <select
                                    value={newOrderStatus}
                                    onChange={(e) => setNewOrderStatus(e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">Select Status</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Confirm">Confirm</option>
                                    <option value="Reject">Reject</option>
                                  </select>
                                  <textarea
                                    placeholder="Add notes (optional)..."
                                    value={orderResponseNotes}
                                    onChange={(e) => setOrderResponseNotes(e.target.value)}
                                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={2}
                                  />
                                  <div className="flex gap-1">
                                    <Button
                                      onClick={() => handleUpdateOrderStatus(order.order_id)}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1"
                                      size="sm"
                                    >
                                      Update
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setUpdatingOrderStatus(null);
                                        setNewOrderStatus("");
                                        setOrderResponseNotes("");
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="text-xs py-1"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => setUpdatingOrderStatus(order.order_id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 px-2"
                                  size="sm"
                                >
                                  Update Status
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500 dark:text-slate-400">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No orders found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dealer Requests Tab */}
        {activeTab === 'requests' && user.can_view_orders && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Dealer Order Requests in {user.district}
                  </CardTitle>
                  <CardDescription>Track which dealers received order requests and their responses</CardDescription>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dealerRequests
                  .filter(req => filterStatus === 'all' || req.request_status.toLowerCase() === filterStatus)
                  .map((request) => (
                    <div
                      key={request.request_id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{request.order_number}</h3>
                            <Badge 
                              variant={
                                request.request_status === 'accepted' ? 'default' :
                                request.request_status === 'pending' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {request.request_status}
                            </Badge>
                            {request.stock_verified && (
                              <Badge variant="outline" className="text-xs">
                                Stock {request.stock_available ? 'Available' : 'Unavailable'}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div className="flex items-start gap-2">
                              <Building2 className="mt-0.5 h-4 w-4 text-gray-500 dark:text-slate-400" />
                              <div>
                                <p className="font-medium">{request.dealer_business_name}</p>
                                <p className="text-xs text-gray-600 dark:text-slate-300">{request.dealer_name}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Users className="mt-0.5 h-4 w-4 text-gray-500 dark:text-slate-400" />
                              <div>
                                <p className="font-medium">{request.customer_name}</p>
                                <p className="text-xs text-gray-600 dark:text-slate-300">{request.customer_phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                              <span className="text-xs">{request.installation_address?.substring(0, 40)}...</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                              <span className="font-semibold">RS {parseFloat(request.total_amount?.toString() || '0').toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {user.can_contact_dealers && (
                            <div className="mb-2 flex gap-4 text-xs text-gray-600 dark:text-slate-300">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {request.dealer_phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {request.dealer_email}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-4 text-xs text-gray-600 dark:text-slate-300">
                            <div>
                              <span className="font-medium">Distance:</span> {request.dealer_distance_km} km
                            </div>
                            <div>
                              <span className="font-medium">Deadline:</span> {new Date(request.response_deadline).toLocaleString()}
                            </div>
                            {request.dealer_response_at && (
                              <div>
                                <span className="font-medium">Responded:</span> {new Date(request.dealer_response_at).toLocaleString()}
                              </div>
                            )}
                          </div>

                          {request.dealer_notes && (
                            <div className="mt-2 rounded bg-gray-50 p-2 text-sm dark:bg-slate-800/60">
                              <span className="font-medium">Dealer Notes:</span> {request.dealer_notes}
                            </div>
                          )}

                          {/* Accept/Reject Actions for Pending Requests */}
                          {request.request_status === 'pending' && (
                            <div className="mt-4 pt-4 border-t">
                              {respondingTo === request.request_id ? (
                                <div className="space-y-3">
                                  <textarea
                                    placeholder="Add notes (optional)..."
                                    value={responseNotes}
                                    onChange={(e) => setResponseNotes(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleRespond(request.request_id, 'accept')}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                      size="sm"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Confirm Accept
                                    </Button>
                                    <Button
                                      onClick={() => handleRespond(request.request_id, 'reject')}
                                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                      size="sm"
                                    >
                                      Confirm Reject
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        setRespondingTo(null);
                                        setResponseNotes("");
                                      }}
                                      variant="outline"
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => setRespondingTo(request.request_id)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Accept Order
                                  </Button>
                                  <Button
                                    onClick={() => setRespondingTo(request.request_id)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    size="sm"
                                  >
                                    Reject Order
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-xs text-gray-500 dark:text-slate-400">
                          <p>Request sent:</p>
                          <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
                          <p>{new Date(request.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                {dealerRequests.filter(req => filterStatus === 'all' || req.request_status.toLowerCase() === filterStatus).length === 0 && (
                  <div className="py-12 text-center text-gray-500 dark:text-slate-400">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No dealer requests found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Details Modal */}
      {viewOrderId !== null && user && (
        <ViewOrderModal
          orderId={viewOrderId}
          district={user.district}
          onClose={() => setViewOrderId(null)}
        />
      )}

      {/* Dealer Details Modal */}
      {selectedDealerId && (
        <DealerDetailsModal
          dealerId={selectedDealerId}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedDealerId(null);
          }}
          onSendAlert={handleSendAlert}
        />
      )}

      {/* Send Alert Modal */}
      {selectedDealerId && (
        <SendAlertModal
          dealerId={selectedDealerId}
          dealerName={selectedDealerName}
          dealerEmail={selectedDealerEmail}
          isOpen={showAlertModal}
          onClose={() => {
            setShowAlertModal(false);
            setSelectedDealerId(null);
          }}
          onSuccess={handleAlertSuccess}
        />
      )}

      <Dialog
        open={!!approvalDealer}
        onOpenChange={(open) => {
          if (!open) {
            setApprovalDealer(null);
            setApprovalError('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Dealer</DialogTitle>
            <DialogDescription>
              Assign a Unique Dealer ID for {approvalDealer?.business_name || approvalDealer?.full_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={approvalMode === 'auto' ? 'default' : 'outline'}
                onClick={() => setApprovalMode('auto')}
                className="w-full"
              >
                Auto Generate
              </Button>
              <Button
                type="button"
                variant={approvalMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setApprovalMode('manual')}
                className="w-full"
              >
                Manual
              </Button>
            </div>

            {approvalMode === 'auto' ? (
              <div className="rounded-lg border bg-green-50 p-3">
                <p className="text-xs text-green-700 mb-1">Next available Unique Dealer ID</p>
                <p className="text-2xl font-black text-green-800">{autoUniqueId || '...'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Unique Dealer ID</label>
                <Input
                  value={manualUniqueId}
                  onChange={(e) => setManualUniqueId(e.target.value)}
                  placeholder="Enter unique ID"
                />
              </div>
            )}

            {approvalError && (
              <p className="text-sm text-red-600">{approvalError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalDealer(null)}
              disabled={approvingDealer}
            >
              Cancel
            </Button>
            <Button
              onClick={approveDealer}
              disabled={approvingDealer || (approvalMode === 'manual' && !manualUniqueId.trim())}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {approvingDealer ? 'Approving...' : 'Approve Dealer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
