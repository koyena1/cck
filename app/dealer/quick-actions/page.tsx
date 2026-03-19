"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Package,
  Flag,
  Bell,
  ClipboardList,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  TrendingDown,
  X,
  CheckCircle2,
  ArrowUpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type UrgencyFlag = {
  productId: number;
  modelNumber: string;
  company: string;
  segment: string;
  flagType: string;
  note: string | null;
  flaggedAt: string;
  currentQty: number;
};

type Notification = {
  id: number | string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  created_at: string;
};

const FLAG_META: Record<string, { label: string; color: string; icon: typeof Flag }> = {
  low_stock: { label: "Low Stock", color: "bg-orange-100 text-orange-700 border-orange-300", icon: TrendingDown },
  out_of_stock: { label: "Out of Stock", color: "bg-red-100 text-red-700 border-red-300", icon: X },
  stale: { label: "Stale Stock", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: AlertTriangle },
  urgent: { label: "Urgent Update", color: "bg-red-100 text-red-700 border-red-300", icon: AlertTriangle },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function QuickActionsPage() {
  const router = useRouter();
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [flags, setFlags] = useState<UrgencyFlag[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("dealerId");
    if (!stored) { router.push("/login"); return; }
    const dId = parseInt(stored);
    setDealerId(dId);
  }, [router]);

  const fetchData = useCallback(async (dId: number, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      // Fetch active admin urgency flags + current stock quantities
      const [flagRes, notifRes, invRes] = await Promise.all([
        fetch(`/api/dealer/stock-flags?dealerId=${dId}`),
        fetch(`/api/dealer/notifications?dealerId=${dId}`),
        fetch(`/api/dealer-inventory?dealerId=${dId}`),
      ]);

      let activeFlags: UrgencyFlag[] = [];
      if (flagRes.ok) {
        const flagData = await flagRes.json();
        const flagMap: Record<number, any> = flagData.flags || {};

        if (invRes.ok) {
          const invData = await invRes.json();
          const inventory: any[] = invData.inventory || [];
          // Build flag list enriched with product info + current qty
          activeFlags = Object.entries(flagMap).map(([productIdStr, flag]) => {
            const productId = parseInt(productIdStr);
            const inv = inventory.find((i: any) => i.product_id === productId);
            return {
              productId,
              modelNumber: inv?.model_number ?? `Product #${productId}`,
              company: inv?.company ?? "",
              segment: inv?.segment ?? "",
              flagType: (flag as any).flagType,
              note: (flag as any).note,
              flaggedAt: (flag as any).flaggedAt,
              currentQty: inv?.quantity_available ?? 0,
            };
          });
        }
      }
      setFlags(activeFlags);

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        const allNotifs: Notification[] = notifData.notifications || [];
        // Show unread notifications that are NOT stock_urgent_flag (those shown in flags section already)
        const filtered = allNotifs.filter(
          (n) => !n.is_read && n.type !== "stock_urgent_flag"
        );
        setNotifications(filtered.slice(0, 5));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (dealerId) fetchData(dealerId);
  }, [dealerId, fetchData]);

  const handleRefresh = () => {
    if (dealerId) fetchData(dealerId, true);
  };

  const urgentCount = flags.length;
  const unreadCount = notifications.length;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-500" />
            Quick Actions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Urgent tasks and shortcuts
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ── Admin Stock Flags ──────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Flag className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            Stock Actions Required
          </h2>
          {urgentCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border border-red-300 text-[10px] px-1.5 py-0">
              {urgentCount}
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : urgentCount === 0 ? (
          <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                No stock actions required — all clear!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {flags.map((flag) => {
              const meta = FLAG_META[flag.flagType] || FLAG_META.urgent;
              const Icon = meta.icon;
              return (
                <Link key={flag.productId} href="/dealer/stock?filter=flagged">
                  <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 hover:shadow-md transition-all cursor-pointer">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {flag.modelNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {flag.company}{flag.segment ? ` · ${flag.segment}` : ""} &nbsp;·&nbsp; Qty: {flag.currentQty}
                      </p>
                      {flag.note && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                          &ldquo;{flag.note}&rdquo;
                        </p>
                      )}
                    </div>
                    <ArrowUpCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  </div>
                </Link>
              );
            })}
            <Link href="/dealer/stock">
              <div className="text-center py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">
                Go to Stock Page →
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* ── Unread Notifications ───────────────────────────────── */}
      {!loading && unreadCount > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              Recent Notifications
            </h2>
            <Badge className="bg-blue-100 text-blue-700 border border-blue-300 text-[10px] px-1.5 py-0">
              {unreadCount}
            </Badge>
          </div>
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link key={n.id} href="/dealer/notifications">
                <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 hover:shadow-md transition-all">
                  <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                </div>
              </Link>
            ))}
            <Link href="/dealer/notifications">
              <div className="text-center py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                View All Notifications →
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Quick Navigation ───────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-500" />
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
            Shortcuts
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/dealer/stock", icon: Package, label: "Update Stock", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800" },
            { href: "/dealer/order-requests", icon: ClipboardList, label: "Order Requests", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" },
            { href: "/dealer/notifications", icon: Bell, label: "Notifications", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}>
              <Card className={`border cursor-pointer hover:shadow-md transition-all ${color}`}>
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-bold">{label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
