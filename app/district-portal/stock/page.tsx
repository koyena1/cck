"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

function fmt(n: number) {
  return "RS " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

type DistrictUser = {
  district: string;
  full_name: string;
};

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

function DealerRow({ dealer, refreshKey, district }: { dealer: DealerSummary; refreshKey: number; district: string }) {
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

  useEffect(() => {
    setProducts([]);
  }, [refreshKey]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/district-portal/stock/${dealer.dealerId}?district=${encodeURIComponent(district)}`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } finally {
      setLoadingProducts(false);
    }
  }, [dealer.dealerId, district]);

  useEffect(() => {
    if (expanded) fetchProducts();
  }, [expanded, fetchProducts]);

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
      const res = await fetch("/api/district-portal/stock/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: dealer.dealerId,
          productId: flagDialog.product.product_id,
          flagType: removeFlag ? null : flagType,
          note: removeFlag ? null : flagNote,
          district,
        }),
      });
      const data = await res.json();
      if (data.success) {
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
      const res = await fetch("/api/district-portal/stock/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: dealer.dealerId,
          district,
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
        message: `PDF report sent to dealer email${data.email ? ` (${data.email})` : ""}.`,
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
      <div
        onClick={() => setExpanded((value) => !value)}
        className={`group cursor-pointer rounded-xl border transition-all duration-200 mb-2 ${
          hasIssues ? "border-red-200 bg-red-50 hover:shadow-md" : "border-slate-200 bg-white hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="shrink-0 text-slate-400">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-800 truncate">{dealer.dealerName}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
                <Hash className="w-3 h-3" />
                ID: {dealer.uniqueDealerId ?? dealer.dealerId}
              </span>
              {dealer.businessName && <span className="text-xs text-slate-500">· {dealer.businessName}</span>}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dealer.lastUpdated ? fmtDate(dealer.lastUpdated) : "Never updated"}
              </span>
              {isStale && (
                <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {days}d stale
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {dealer.outOfStockCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border border-red-300 text-[10px] px-1.5 py-0">{dealer.outOfStockCount} OOS</Badge>
            )}
            {dealer.lowStockCount > 0 && (
              <Badge className="bg-orange-100 text-orange-700 border border-orange-300 text-[10px] px-1.5 py-0">{dealer.lowStockCount} Low</Badge>
            )}
            {dealer.flaggedCount > 0 && (
              <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300 text-[10px] px-1.5 py-0">
                <Flag className="w-2.5 h-2.5 mr-0.5" />
                {dealer.flaggedCount}
              </Badge>
            )}
            <span className="text-sm font-black text-slate-800 ml-1">{fmt(dealer.stockValue)}</span>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-slate-200 px-4 py-3">
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No products in inventory yet.</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide px-2 mb-1">
                  <span className="col-span-4">Product</span>
                  <span className="col-span-2 text-right">Purchase Price</span>
                  <span className="col-span-1 text-right">Qty</span>
                  <span className="col-span-2 text-right">Value</span>
                  <span className="col-span-2 text-center">Status</span>
                  <span className="col-span-1 text-center">Flag</span>
                </div>
                {products.map((p) => {
                  const qtyStatus = p.quantity_available === 0 ? "out" : p.quantity_available < 5 ? "low" : "ok";
                  return (
                    <div
                      key={p.product_id}
                      className={`grid grid-cols-12 gap-2 items-center rounded-lg px-2 py-1.5 text-xs transition-colors ${
                        p.is_flagged
                          ? "bg-red-50 border border-red-200"
                          : qtyStatus === "out"
                          ? "bg-red-50"
                          : qtyStatus === "low"
                          ? "bg-orange-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="col-span-4 min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{p.model_number}</div>
                        {p.product_code && <div className="text-[10px] text-slate-500 truncate">{p.product_code}</div>}
                        <div className="text-[10px] text-slate-500 truncate">{p.company} · {p.segment}</div>
                        {p.is_flagged && p.flag_type && (
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${FLAG_LABELS[p.flag_type]?.color}`}>
                            <Flag className="w-2.5 h-2.5" />
                            {FLAG_LABELS[p.flag_type]?.label}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 text-right text-slate-600">{fmt(Number(p.dealer_purchase_price))}</div>
                      <div className={`col-span-1 text-right font-bold ${qtyStatus === "out" ? "text-red-600" : qtyStatus === "low" ? "text-orange-600" : "text-slate-800"}`}>
                        {p.quantity_available}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-slate-700">{fmt(Number(p.item_stock_value))}</div>
                      <div className="col-span-2 flex justify-center">
                        {qtyStatus === "out" ? (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5"><X className="w-3 h-3" /> Out</span>
                        ) : qtyStatus === "low" ? (
                          <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> Low</span>
                        ) : (
                          <span className="text-[10px] text-green-600 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> OK</span>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={(e) => openFlagDialog(p, e)}
                          title={p.is_flagged ? "Edit flag" : "Flag for urgent update"}
                          className={`p-1 rounded-lg transition-colors ${
                            p.is_flagged ? "text-red-500 hover:bg-red-100" : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="grid grid-cols-12 gap-2 items-center rounded-lg px-2 py-2 text-xs mt-2 border-t border-slate-200">
                  <div className="col-span-4 font-bold text-slate-700">TOTAL</div>
                  <div className="col-span-2" />
                  <div className="col-span-1 text-right font-bold text-slate-700">{products.reduce((sum, p) => sum + p.quantity_available, 0)}</div>
                  <div className="col-span-2 text-right font-black text-slate-800">{fmt(products.reduce((sum, p) => sum + Number(p.item_stock_value), 0))}</div>
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
                        {alertProducts.length} item{alertProducts.length === 1 ? "" : "s"} will be included.
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
                    <div className={`mt-2 text-xs font-medium ${emailResult.type === "success" ? "text-green-700" : "text-red-600"}`}>
                      {emailResult.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={flagDialog.open} onOpenChange={(open) => !open && setFlagDialog({ open: false, product: null })}>
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
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Flag Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FLAG_LABELS).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setFlagType(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      flagType === key
                        ? meta.color + " ring-2 ring-offset-1 ring-current"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Note (optional)</label>
              <textarea
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                placeholder="e.g. Replenish at least 10 units before next week"
                rows={2}
                className="w-full text-xs rounded-lg border border-slate-200 bg-white text-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
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
                {flagging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Flag className="w-4 h-4 mr-1" />{flagDialog.product?.is_flagged ? "Update Flag" : "Set Flag"}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DistrictStockPage() {
  const router = useRouter();
  const [user, setUser] = useState<DistrictUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [dealers, setDealers] = useState<DealerSummary[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cardFilter, setCardFilter] = useState<"oos" | "low" | "stale" | "flagged" | null>(null);
  const [rowRefreshKey, setRowRefreshKey] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("district_user");
    if (!userData) {
      router.push("/district-portal/login");
      return;
    }
    setUser(JSON.parse(userData));
  }, [router]);

  const fetchData = useCallback(async (district: string, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/district-portal/stock?district=${encodeURIComponent(district)}`);
      const data = await res.json();
      if (data.success) {
        setTotalValue(data.totalStockValue);
        setDealers(data.dealers);
        setLastFetched(new Date());
        setRowRefreshKey((key) => key + 1);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.district) {
      fetchData(user.district);
    }
  }, [user?.district, fetchData]);

  const totalOutOfStock = dealers.reduce((sum, dealer) => sum + dealer.outOfStockCount, 0);
  const totalLowStock = dealers.reduce((sum, dealer) => sum + dealer.lowStockCount, 0);
  const totalFlagged = dealers.reduce((sum, dealer) => sum + dealer.flaggedCount, 0);
  const staleDealers = dealers.filter((dealer) => dealer.daysSinceUpdate !== null && dealer.daysSinceUpdate >= 10).length;

  const filteredDealers = (() => {
    let list = dealers;
    if (cardFilter === "oos") list = list.filter((dealer) => dealer.outOfStockCount > 0);
    else if (cardFilter === "low") list = list.filter((dealer) => dealer.lowStockCount > 0);
    else if (cardFilter === "stale") list = list.filter((dealer) => dealer.daysSinceUpdate !== null && dealer.daysSinceUpdate >= 10);
    else if (cardFilter === "flagged") list = list.filter((dealer) => dealer.flaggedCount > 0);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((dealer) =>
        dealer.dealerName.toLowerCase().includes(query) ||
        (dealer.businessName || "").toLowerCase().includes(query) ||
        String(dealer.dealerId).includes(query) ||
        (dealer.uniqueDealerId ? String(dealer.uniqueDealerId).toLowerCase().includes(query) : false)
      );
    }

    return list;
  })();

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-slate-500 dark:text-slate-300">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3" />
          Loading stock overview...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            <Boxes className="w-7 h-7 text-purple-600" />
            District Stock Overview
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{user.district} dealer stock, urgency management, and email escalation</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchData(user.district, true)} disabled={refreshing} className="gap-1.5">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dealer by name or ID…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card onClick={() => { setCardFilter(cardFilter === "oos" ? null : "oos"); setExpanded(true); }} className={`cursor-pointer transition-all border-2 hover:shadow-md ${cardFilter === "oos" ? "border-red-400 bg-red-50" : "border-slate-200"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><ShoppingBag className="w-4 h-4 text-red-500" /><span className="text-xs font-bold text-slate-500 uppercase">Out of Stock</span></div>
            <div className="text-2xl font-black text-red-600">{totalOutOfStock}</div>
            <div className="text-[10px] text-slate-400">{cardFilter === "oos" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
        <Card onClick={() => { setCardFilter(cardFilter === "low" ? null : "low"); setExpanded(true); }} className={`cursor-pointer transition-all border-2 hover:shadow-md ${cardFilter === "low" ? "border-orange-400 bg-orange-50" : "border-slate-200"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-orange-500" /><span className="text-xs font-bold text-slate-500 uppercase">Low Stock</span></div>
            <div className="text-2xl font-black text-orange-600">{totalLowStock}</div>
            <div className="text-[10px] text-slate-400">{cardFilter === "low" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
        <Card onClick={() => { setCardFilter(cardFilter === "stale" ? null : "stale"); setExpanded(true); }} className={`cursor-pointer transition-all border-2 hover:shadow-md ${cardFilter === "stale" ? "border-yellow-400 bg-yellow-50" : "border-slate-200"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-yellow-500" /><span className="text-xs font-bold text-slate-500 uppercase">Stale</span></div>
            <div className="text-2xl font-black text-yellow-600">{staleDealers}</div>
            <div className="text-[10px] text-slate-400">{cardFilter === "stale" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
        <Card onClick={() => { setCardFilter(cardFilter === "flagged" ? null : "flagged"); setExpanded(true); }} className={`cursor-pointer transition-all border-2 hover:shadow-md ${cardFilter === "flagged" ? "border-purple-400 bg-purple-50" : "border-slate-200"}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Flag className="w-4 h-4 text-purple-500" /><span className="text-xs font-bold text-slate-500 uppercase">Flagged</span></div>
            <div className="text-2xl font-black text-purple-600">{totalFlagged}</div>
            <div className="text-[10px] text-slate-400">{cardFilter === "flagged" ? "click to clear filter" : "click to filter dealers"}</div>
          </CardContent>
        </Card>
      </div>

      <Card className={`border-2 cursor-pointer transition-all duration-200 ${expanded ? "border-purple-400 shadow-lg" : "border-purple-200 hover:shadow-md"}`} onClick={() => setExpanded((value) => !value)}>
        <CardHeader className="pb-2 pt-4 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Stock Value ({user.district})</CardDescription>
              <CardTitle className="text-4xl font-black text-purple-700 mt-1">{fmt(totalValue)}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {lastFetched && <span className="text-[10px] text-slate-400 hidden sm:block">Updated {fmtDate(lastFetched)}</span>}
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                {expanded ? <ChevronDown className="w-5 h-5 text-purple-600" /> : <ChevronRight className="w-5 h-5 text-purple-600" />}
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">{expanded ? "Click to collapse" : `Click to see breakdown across ${dealers.length} dealers`}</p>
        </CardHeader>
      </Card>

      {expanded && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
              <Package className="w-4 h-4 text-purple-500" />
              Per-Dealer Breakdown
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                {cardFilter ? `— filtered: ${cardFilter === "oos" ? "out of stock" : cardFilter === "low" ? "low stock" : cardFilter === "stale" ? "stale" : "flagged"}` : "(sorted: lowest to highest value)"}
              </span>
            </h2>
            <div className="flex items-center gap-2">
              {cardFilter && <button onClick={() => setCardFilter(null)} className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline dark:text-purple-300"><X className="w-3 h-3" /> Clear filter</button>}
              <span className="text-xs text-slate-400 dark:text-slate-500">{filteredDealers.length !== dealers.length ? `${filteredDealers.length} of ${dealers.length} dealers` : `${dealers.length} dealers`}</span>
            </div>
          </div>

          {filteredDealers.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{searchQuery ? `No dealers match "${searchQuery}".` : "No district dealers with inventory data."}</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {filteredDealers.map((dealer) => (
                <DealerRow key={dealer.dealerId} dealer={dealer} refreshKey={rowRefreshKey} district={user.district} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}