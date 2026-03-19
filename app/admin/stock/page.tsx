"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Package,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Flag,
  X,
  Clock,
  CheckCircle2,
  TrendingDown,
  ShoppingBag,
  Boxes,
  Search,
  Hash,
  Mail,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "RS" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: any) {
  if (!d) return "Never";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function staleDays(days: number | null) {
  if (days === null) return null;
  return Math.floor(days);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type DealerSummary = {
  dealerId: number;
  uniqueDealerId: string | null;
  dealerName: string;
  businessName: string;
  status: string;
  stockValue: number;
  lastUpdated: string | null;
  totalProducts: number;
  outOfStockCount: number;
  lowStockCount: number;
  flaggedCount: number;
  daysSinceUpdate: number | null;
};

type Product = {
  product_id: number;
  product_code?: string;
  company: string;
  segment: string;
  model_number: string;
  product_type: string;
  description: string;
  dealer_purchase_price: number;
  quantity_available: number;
  quantity_purchased: number;
  quantity_sold: number;
  last_updated: string | null;
  item_stock_value: number;
  flag_type: string | null;
  flag_note: string | null;
  flagged_at: string | null;
  is_flagged: boolean;
};

const FLAG_LABELS: Record<string, { label: string; color: string }> = {
  low_stock: { label: "Low Stock", color: "bg-orange-100 text-orange-700 border-orange-300" },
  out_of_stock: { label: "Out of Stock", color: "bg-red-100 text-red-700 border-red-300" },
  stale: { label: "Stale (Old)", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  urgent: { label: "Urgent Update", color: "bg-red-100 text-red-700 border-red-300" },
};

// ─── Dealer Row ───────────────────────────────────────────────────────────────

function DealerRow({ dealer, refreshKey }: { dealer: DealerSummary; refreshKey: number }) {
  const [expanded, setExpanded] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [flagDialog, setFlagDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [flagType, setFlagType] = useState<string>("urgent");
  const [flagNote, setFlagNote] = useState("");
  const [flagging, setFlagging] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const days = staleDays(dealer.daysSinceUpdate);
  const isStale = days !== null && days >= 10;
  const hasIssues = dealer.outOfStockCount > 0 || dealer.lowStockCount > 0 || isStale || dealer.flaggedCount > 0;

  // When the parent triggers a refresh, reset stale cached products.
  // If the row is currently expanded, immediately re-fetch fresh data.
  useEffect(() => {
    setProducts([]);
  }, [refreshKey]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/stock/${dealer.dealerId}`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } finally {
      setLoadingProducts(false);
    }
  }, [dealer.dealerId]);

  // Re-fetch live data whenever the row is expanded (never serve stale cache).
  useEffect(() => {
    if (expanded) fetchProducts();
  }, [expanded, fetchProducts]);

  const handleExpand = () => {
    setExpanded((v) => !v);
  };

  const openFlagDialog = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlagDialog({ open: true, product });
    setFlagType(product.flag_type || "urgent");
    setFlagNote(product.flag_note || "");
  };

  const handleFlag = async (removeFlag = false) => {
    if (!flagDialog.product) return;
    setFlagging(true);
    try {
      const res = await fetch("/api/admin/stock/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: dealer.dealerId,
          productId: flagDialog.product.product_id,
          flagType: removeFlag ? null : flagType,
          note: removeFlag ? null : flagNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setProducts((prev) =>
          prev.map((p) =>
            p.product_id === flagDialog.product!.product_id
              ? {
                  ...p,
                  is_flagged: !removeFlag,
                  flag_type: removeFlag ? null : flagType,
                  flag_note: removeFlag ? null : flagNote,
                  flagged_at: removeFlag ? null : new Date().toISOString(),
                }
              : p
          )
        );
        setFlagDialog({ open: false, product: null });
      }
    } finally {
      setFlagging(false);
    }
  };

  const alertProducts = products.filter((product) => product.quantity_available < 5);

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/admin/stock/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: dealer.dealerId,
          message: emailMessage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setEmailResult({ type: "error", message: data.error || "Failed to send email" });
        return;
      }
      setEmailResult({
        type: "success",
        message: `PDF report sent to dealer email${data.email ? ` (${data.email})` : ''}.`,
      });
      setEmailMessage("");
    } catch {
      setEmailResult({ type: "error", message: "Network error while sending stock email" });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <>
      {/* Dealer Summary Row */}
      <div
        onClick={handleExpand}
        className={`group cursor-pointer rounded-xl border transition-all duration-200 mb-2 ${
          hasIssues
            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10 hover:shadow-md"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Expand icon */}
          <div className="shrink-0 text-slate-400">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>

          {/* Dealer name + business */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                {dealer.dealerName}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
                <Hash className="w-3 h-3" />
                ID: {dealer.uniqueDealerId ?? dealer.dealerId}
              </span>
              {dealer.businessName && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  · {dealer.businessName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dealer.lastUpdated ? fmtDate(dealer.lastUpdated) : "Never updated"}
              </span>
              {isStale && (
                <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {days}d stale
                </span>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {dealer.outOfStockCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0">
                {dealer.outOfStockCount} OOS
              </Badge>
            )}
            {dealer.lowStockCount > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] px-1.5 py-0">
                {dealer.lowStockCount} Low
              </Badge>
            )}
            {dealer.flaggedCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 text-[10px] px-1.5 py-0">
                <Flag className="w-2.5 h-2.5 mr-0.5" />
                {dealer.flaggedCount}
              </Badge>
            )}
            <span className="text-sm font-black text-slate-800 dark:text-slate-100 ml-1">
              {fmt(dealer.stockValue)}
            </span>
          </div>
        </div>

        {/* Expanded product list */}
        {expanded && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No products in inventory yet.</p>
            ) : (
              <div className="space-y-1">
                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-2 mb-1">
                  <span className="col-span-4">Product</span>
                  <span className="col-span-2 text-right">Purchase Price</span>
                  <span className="col-span-1 text-right">Qty</span>
                  <span className="col-span-2 text-right">Value</span>
                  <span className="col-span-2 text-center">Status</span>
                  <span className="col-span-1 text-center">Flag</span>
                </div>
                {products.map((p) => {
                  const qtyStatus =
                    p.quantity_available === 0
                      ? "out"
                      : p.quantity_available < 5
                      ? "low"
                      : "ok";
                  return (
                    <div
                      key={p.product_id}
                      className={`grid grid-cols-12 gap-2 items-center rounded-lg px-2 py-1.5 text-xs transition-colors ${
                        p.is_flagged
                          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                          : qtyStatus === "out"
                          ? "bg-red-50 dark:bg-red-900/10"
                          : qtyStatus === "low"
                          ? "bg-orange-50 dark:bg-orange-900/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      }`}
                    >
                      <div className="col-span-4 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {p.model_number}
                        </div>
                        {p.product_code && (
                          <div className="text-[10px] text-slate-500 truncate">{p.product_code}</div>
                        )}
                        <div className="text-[10px] text-slate-500 truncate">
                          {p.company} · {p.segment}
                        </div>
                        {p.is_flagged && p.flag_type && (
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${
                              FLAG_LABELS[p.flag_type]?.color
                            }`}
                          >
                            <Flag className="w-2.5 h-2.5" />
                            {FLAG_LABELS[p.flag_type]?.label}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-slate-600 dark:text-slate-300">
                        {fmt(Number(p.dealer_purchase_price))}
                      </div>
                      <div
                        className={`col-span-1 text-right font-bold ${
                          qtyStatus === "out"
                            ? "text-red-600 dark:text-red-400"
                            : qtyStatus === "low"
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {p.quantity_available}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                        {fmt(Number(p.item_stock_value))}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        {qtyStatus === "out" ? (
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                            <X className="w-3 h-3" /> Out
                          </span>
                        ) : qtyStatus === "low" ? (
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" /> Low
                          </span>
                        ) : (
                          <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> OK
                          </span>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => openFlagDialog(p, e)}
                          title={p.is_flagged ? "Edit flag" : "Flag for urgent update"}
                          className={`p-1 rounded-lg transition-colors ${
                            p.is_flagged
                              ? "text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                              : "text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* Total row */}
                <div className="grid grid-cols-12 gap-2 items-center rounded-lg px-2 py-2 text-xs mt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="col-span-4 font-bold text-slate-700 dark:text-slate-200">TOTAL</div>
                  <div className="col-span-2" />
                  <div className="col-span-1 text-right font-bold text-slate-700 dark:text-slate-200">
                    {products.reduce((s, p) => s + p.quantity_available, 0)}
                  </div>
                  <div className="col-span-2 text-right font-black text-slate-800 dark:text-slate-100">
                    {fmt(products.reduce((s, p) => s + Number(p.item_stock_value), 0))}
                  </div>
                  <div className="col-span-3" />
                </div>

                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Send Email
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Generate a PDF using current out-of-stock and low-stock items, then send it directly to the dealer.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {alertProducts.length} item{alertProducts.length === 1 ? '' : 's'} will be included.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleSendEmail}
                      disabled={sendingEmail || alertProducts.length === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {sendingEmail ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                      Send PDF
                    </Button>
                  </div>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={2}
                    placeholder="Optional message for the dealer email"
                    className="w-full mt-3 text-xs rounded-lg border border-blue-200 bg-white text-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  {emailResult && (
                    <div className={`mt-2 text-xs font-medium ${emailResult.type === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                      {emailResult.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flag Dialog */}
      <Dialog open={flagDialog.open} onOpenChange={(o) => !o && setFlagDialog({ open: false, product: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-orange-500" />
              Mark for Urgent Update
            </DialogTitle>
            <DialogDescription>
              {flagDialog.product?.model_number} — {flagDialog.product?.company}
              <br />
              This flag will appear on the dealer's portal to prompt them to update stock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Flag Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FLAG_LABELS).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setFlagType(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      flagType === key
                        ? meta.color + " ring-2 ring-offset-1 ring-current"
                        : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                Note (optional)
              </label>
              <textarea
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="e.g. Replenish at least 10 units before next week"
                rows={2}
                className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              {flagDialog.product?.is_flagged && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFlag(true)}
                  disabled={flagging}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Remove Flag
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => handleFlag(false)}
                disabled={flagging}
                className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
              >
                {flagging ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-1" />
                    {flagDialog.product?.is_flagged ? "Update Flag" : "Set Flag"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminStockPage() {
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardFilter, setCardFilter] = useState<"oos" | "low" | "stale" | "flagged" | null>(null);
  // Incrementing this forces every DealerRow to discard its stale product cache.
  const [rowRefreshKey, setRowRefreshKey] = useState(0);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/stock");
      const data = await res.json();
      if (data.success) {
        setTotalValue(data.totalStockValue);
        setDealers(data.dealers);
        setLastFetched(new Date());
        // Signal all DealerRow children to reset their cached product lists
        setRowRefreshKey((k) => k + 1);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalOutOfStock = dealers.reduce((s, d) => s + d.outOfStockCount, 0);
  const totalLowStock = dealers.reduce((s, d) => s + d.lowStockCount, 0);
  const totalFlagged = dealers.reduce((s, d) => s + d.flaggedCount, 0);
  const staleDealers = dealers.filter(
    (d) => d.daysSinceUpdate !== null && d.daysSinceUpdate >= 10
  ).length;

  const filteredDealers = (() => {
    let list = dealers;
    if (cardFilter === "oos") list = list.filter((d) => d.outOfStockCount > 0);
    else if (cardFilter === "low") list = list.filter((d) => d.lowStockCount > 0);
    else if (cardFilter === "stale") list = list.filter((d) => d.daysSinceUpdate !== null && d.daysSinceUpdate >= 10);
    else if (cardFilter === "flagged") list = list.filter((d) => d.flaggedCount > 0);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((d) =>
        d.dealerName.toLowerCase().includes(q) ||
        (d.businessName || "").toLowerCase().includes(q) ||
        String(d.dealerId).includes(q) ||
        (d.uniqueDealerId ? String(d.uniqueDealerId).toLowerCase().includes(q) : false)
      );
    }
    return list;
  })();

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-7 h-7 text-purple-600" />
            Stock Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Total dealer stock value & urgency management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dealer by name or ID…"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card
          onClick={() => { setCardFilter(cardFilter === "oos" ? null : "oos"); setExpanded(true); }}
          className={`cursor-pointer transition-all border-2 hover:shadow-md ${
            cardFilter === "oos" ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-slate-200 dark:border-slate-700"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Out of Stock</span>
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{totalOutOfStock}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{cardFilter === "oos" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
        <Card
          onClick={() => { setCardFilter(cardFilter === "low" ? null : "low"); setExpanded(true); }}
          className={`cursor-pointer transition-all border-2 hover:shadow-md ${
            cardFilter === "low" ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-700"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Low Stock</span>
            </div>
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{totalLowStock}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{cardFilter === "low" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
        <Card
          onClick={() => { setCardFilter(cardFilter === "stale" ? null : "stale"); setExpanded(true); }}
          className={`cursor-pointer transition-all border-2 hover:shadow-md ${
            cardFilter === "stale" ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : "border-slate-200 dark:border-slate-700"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Stale</span>
            </div>
            <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{staleDealers}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{cardFilter === "stale" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
        <Card
          onClick={() => { setCardFilter(cardFilter === "flagged" ? null : "flagged"); setExpanded(true); }}
          className={`cursor-pointer transition-all border-2 hover:shadow-md ${
            cardFilter === "flagged" ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20" : "border-slate-200 dark:border-slate-700"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Flagged</span>
            </div>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalFlagged}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">{cardFilter === "flagged" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Total Stock Value Card — click to expand */}
      <Card
        className={`border-2 cursor-pointer transition-all duration-200 ${
          expanded
            ? "border-purple-400 dark:border-purple-500 shadow-lg"
            : "border-purple-200 dark:border-purple-800 hover:shadow-md"
        }`}
        onClick={() => !loading && setExpanded((v) => !v)}
      >
        <CardHeader className="pb-2 pt-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Stock Value (All Dealers)
              </CardDescription>
              {loading ? (
                <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
              ) : (
                <CardTitle className="text-4xl font-black text-purple-700 dark:text-purple-400 mt-1">
                  {fmt(totalValue)}
                </CardTitle>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lastFetched && (
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  Updated {fmtDate(lastFetched)}
                </span>
              )}
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                {expanded ? (
                  <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                )}
              </div>
            </div>
          </div>
          {!loading && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {expanded ? "Click to collapse" : `Click to see breakdown across ${dealers.length} dealers`}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Dealer Breakdown — shown only when expanded */}
      {expanded && !loading && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-500" />
              Per-Dealer Breakdown
              <span className="text-slate-400 font-normal text-xs">
                {cardFilter
                  ? `— filtered: ${cardFilter === "oos" ? "out of stock" : cardFilter === "low" ? "low stock" : cardFilter === "stale" ? "stale" : "flagged"}`
                  : "(sorted: lowest to highest value)"}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              {cardFilter && (
                <button
                  onClick={() => setCardFilter(null)}
                  className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filter
                </button>
              )}
              <span className="text-xs text-slate-400">
                {filteredDealers.length !== dealers.length
                  ? `${filteredDealers.length} of ${dealers.length} dealers`
                  : `${dealers.length} dealers`}
              </span>
            </div>
          </div>

          {filteredDealers.length === 0 ? (
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  {searchQuery ? `No dealers match "${searchQuery}".` : "No active dealers with inventory data."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {filteredDealers.map((dealer) => (
                <DealerRow key={dealer.dealerId} dealer={dealer} refreshKey={rowRefreshKey} />
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
