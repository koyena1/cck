"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Users,
  ArrowUpRight,
  MapPin,
  Package,
  Phone,
  ClipboardList,
  DollarSign,
  Headphones,
  Boxes,
  LogIn,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AnyOrder = {
  order_id: number;
  order_number?: string;
  customer_name?: string;
  customer_phone?: string;
  pincode?: string;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  assigned_dealer_id?: number | null;
  created_at?: string;
  updated_at?: string;
};

type StockDealerSummary = {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
};

type SupportTicket = { status?: string };
type DealerItem = { status?: string };
type PendingAdmin = { status?: string };

type LineFlags = {
  order: { total: boolean; pending: boolean; closed: boolean; notAssigned: boolean };
  stock: { total: boolean; low: boolean; out: boolean; dealerWise: boolean };
  accounts: { revenue: boolean; netWorth: boolean; pending: boolean; paid: boolean };
  claims: { total: boolean; open: boolean; inProgress: boolean; resolved: boolean };
  dealers: { total: boolean; active: boolean; pending: boolean; inactive: boolean };
  login: { total: boolean; pending: boolean; approved: boolean; rejected: boolean };
};

const EMPTY_FLAGS: LineFlags = {
  order: { total: false, pending: false, closed: false, notAssigned: false },
  stock: { total: false, low: false, out: false, dealerWise: false },
  accounts: { revenue: false, netWorth: false, pending: false, paid: false },
  claims: { total: false, open: false, inProgress: false, resolved: false },
  dealers: { total: false, active: false, pending: false, inactive: false },
  login: { total: false, pending: false, approved: false, rejected: false },
};

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<AnyOrder[]>([]);

  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPending, setOrdersPending] = useState(0);
  const [ordersClosed, setOrdersClosed] = useState(0);
  const [ordersNotAssigned, setOrdersNotAssigned] = useState(0);

  const [stockTotal, setStockTotal] = useState(0);
  const [stockLow, setStockLow] = useState(0);
  const [stockOut, setStockOut] = useState(0);
  const [stockDealerWise, setStockDealerWise] = useState(0);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [paidOrdersCount, setPaidOrdersCount] = useState(0);

  const [claimsTotal, setClaimsTotal] = useState(0);
  const [claimsOpen, setClaimsOpen] = useState(0);
  const [claimsInProgress, setClaimsInProgress] = useState(0);
  const [claimsResolved, setClaimsResolved] = useState(0);

  const [dealerTotal, setDealerTotal] = useState(0);
  const [dealerActive, setDealerActive] = useState(0);
  const [dealerPending, setDealerPending] = useState(0);
  const [dealerInactive, setDealerInactive] = useState(0);

  const [loginRoles, setLoginRoles] = useState(4);
  const [loginPending, setLoginPending] = useState(0);
  const [loginApproved, setLoginApproved] = useState(0);
  const [loginRejected, setLoginRejected] = useState(0);

  const [lineFlags, setLineFlags] = useState<LineFlags>(EMPTY_FLAGS);
  const [notificationCounts, setNotificationCounts] = useState({
    order: 0,
    stock: 0,
    accounts: 0,
    claims: 0,
    dealers: 0,
    login: 0,
  });

  useEffect(() => {
    void fetchDashboardData();
    const interval = setInterval(() => {
      void fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrderAndAccountsData(),
        fetchStockData(),
        fetchClaimsData(),
        fetchDealersData(),
        fetchLoginData(),
        fetchNotificationFlags(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderAndAccountsData = async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      const data = await response.json();

      let orders: AnyOrder[] = [];
      if (data?.success && Array.isArray(data.orders)) {
        orders = data.orders;
      } else {
        const fallbackResponse = await fetch("/api/leads", { cache: "no-store" });
        const fallbackData = await fallbackResponse.json();
        if (Array.isArray(fallbackData)) orders = fallbackData;
      }

      const byUpdatedAtDesc = [...orders].sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
        return bTime - aTime;
      });
      const latestTwoUpdated = byUpdatedAtDesc.slice(0, 2);
      const latestTwoIds = new Set(latestTwoUpdated.map((order) => order.order_id));

      const remainingByCreatedAt = orders
        .filter((order) => !latestTwoIds.has(order.order_id))
        .sort((a, b) => {
          const aTime = new Date(a.created_at || 0).getTime();
          const bTime = new Date(b.created_at || 0).getTime();
          return bTime - aTime;
        });

      setRecentOrders([...latestTwoUpdated, ...remainingByCreatedAt]);

      const pendingStatuses = new Set(["pending", "verified"]);
      const closedStatuses = new Set(["closed", "completed", "cancelled"]);

      setOrdersTotal(orders.length);
      setOrdersPending(orders.filter((o) => pendingStatuses.has(String(o.status || "").toLowerCase())).length);
      setOrdersClosed(orders.filter((o) => closedStatuses.has(String(o.status || "").toLowerCase())).length);
      setOrdersNotAssigned(orders.filter((o) => !o.assigned_dealer_id).length);

      const paidOrders = orders.filter((o) => String(o.payment_status || "").toLowerCase() === "paid");
      const pendingPayOrders = orders.filter((o) => String(o.payment_status || "").toLowerCase() === "pending");

      const paidRevenue = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const pendingRevenue = pendingPayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      setTotalRevenue(Math.round(paidRevenue));
      setPendingPayments(Math.round(pendingRevenue));
      setNetWorth(Math.round(paidRevenue - pendingRevenue));
      setPaidOrdersCount(paidOrders.length);
    } catch (error) {
      console.error("Failed to fetch order/account metrics:", error);
    }
  };

  const fetchStockData = async () => {
    try {
      const response = await fetch("/api/admin/stock", { cache: "no-store" });
      const data = await response.json();
      if (!data?.success) return;

      const dealers: StockDealerSummary[] = data.dealers || [];
      setStockTotal(dealers.reduce((sum, d) => sum + (Number(d.totalProducts) || 0), 0));
      setStockLow(dealers.reduce((sum, d) => sum + (Number(d.lowStockCount) || 0), 0));
      setStockOut(dealers.reduce((sum, d) => sum + (Number(d.outOfStockCount) || 0), 0));
      setStockDealerWise(dealers.length);
    } catch (error) {
      console.error("Failed to fetch stock metrics:", error);
    }
  };

  const fetchClaimsData = async () => {
    try {
      const response = await fetch("/api/support/tickets?viewer=admin", { cache: "no-store" });
      const data = await response.json();
      if (!data?.success) return;

      const tickets: SupportTicket[] = data.tickets || [];
      setClaimsTotal(tickets.length);
      setClaimsOpen(tickets.filter((t) => String(t.status || "").toLowerCase() === "open").length);
      setClaimsInProgress(tickets.filter((t) => String(t.status || "").toLowerCase() === "in_progress").length);
      setClaimsResolved(
        tickets.filter((t) => {
          const s = String(t.status || "").toLowerCase();
          return s === "resolved" || s === "closed";
        }).length
      );
    } catch (error) {
      console.error("Failed to fetch claims metrics:", error);
    }
  };

  const fetchDealersData = async () => {
    try {
      const response = await fetch("/api/dealers", { cache: "no-store" });
      const data = await response.json();
      if (!data?.success) return;

      const dealers: DealerItem[] = data.dealers || [];
      const active = dealers.filter((d) => ["active", "approved"].includes(String(d.status || "").toLowerCase())).length;
      const pending = dealers.filter((d) => ["pending", "requested"].includes(String(d.status || "").toLowerCase())).length;

      setDealerTotal(dealers.length);
      setDealerActive(active);
      setDealerPending(pending);
      setDealerInactive(Math.max(0, dealers.length - active - pending));
    } catch (error) {
      console.error("Failed to fetch dealer metrics:", error);
    }
  };

  const fetchLoginData = async () => {
    try {
      const response = await fetch("/api/admin/pending-admins", { cache: "no-store" });
      const data = await response.json();
      if (!data?.success) return;

      const admins: PendingAdmin[] = data.pendingAdmins || [];
      setLoginPending(admins.filter((a) => String(a.status || "").toLowerCase() === "pending").length);
      setLoginApproved(admins.filter((a) => String(a.status || "").toLowerCase() === "approved").length);
      setLoginRejected(admins.filter((a) => String(a.status || "").toLowerCase() === "rejected").length);
      setLoginRoles(4);
    } catch (error) {
      console.error("Failed to fetch login metrics:", error);
    }
  };

  const fetchNotificationFlags = async () => {
    try {
      const response = await fetch("/api/portal-notifications?portal=admin", { cache: "no-store" });
      const data = await response.json();
      if (!data?.success) return;

      const unread = (data.notifications || []).filter((n: any) => !n.is_read);
      const hasWord = (text: string, words: string[]) => words.some((w) => text.includes(w));

      const nextFlags: LineFlags = JSON.parse(JSON.stringify(EMPTY_FLAGS));
      const nextCounts = { order: 0, stock: 0, accounts: 0, claims: 0, dealers: 0, login: 0 };

      for (const item of unread) {
        const bag = `${String(item.type || "").toLowerCase()} ${String(item.title || "").toLowerCase()} ${String(item.message || "").toLowerCase()}`;

        if (hasWord(bag, ["order", "pending order", "verified", "unassigned", "assign dealer"])) {
          nextCounts.order += 1;
          nextFlags.order.total = true;
        }
        if (hasWord(bag, ["pending order", "pending", "verified"])) nextFlags.order.pending = true;
        if (hasWord(bag, ["closed", "completed", "cancelled"])) nextFlags.order.closed = true;
        if (hasWord(bag, ["not assigned", "unassigned", "assign dealer"])) nextFlags.order.notAssigned = true;

        if (hasWord(bag, ["stock", "inventory", "low stock", "out of stock", "dealer stock"])) {
          nextCounts.stock += 1;
          nextFlags.stock.total = true;
        }
        if (hasWord(bag, ["low stock"])) nextFlags.stock.low = true;
        if (hasWord(bag, ["out of stock", "stock out", "stockout"])) nextFlags.stock.out = true;
        if (hasWord(bag, ["dealer-wise", "dealer wise", "dealer stock"])) nextFlags.stock.dealerWise = true;

        if (hasWord(bag, ["revenue", "account", "finance", "transaction", "net worth", "pending payment", "invoice"])) {
          nextCounts.accounts += 1;
          nextFlags.accounts.revenue = true;
        }
        if (hasWord(bag, ["net worth", "networth"])) nextFlags.accounts.netWorth = true;
        if (hasWord(bag, ["pending payment", "payment pending"])) nextFlags.accounts.pending = true;
        if (hasWord(bag, ["paid", "invoice"])) nextFlags.accounts.paid = true;

        if (hasWord(bag, ["support", "service", "claim", "ticket", "in progress", "resolved"])) {
          nextCounts.claims += 1;
          nextFlags.claims.total = true;
        }
        if (hasWord(bag, ["open claim", "open ticket", "open support", "open"])) nextFlags.claims.open = true;
        if (hasWord(bag, ["in progress", "in_progress"])) nextFlags.claims.inProgress = true;
        if (hasWord(bag, ["resolved", "closed claim", "closed ticket"])) nextFlags.claims.resolved = true;

        if (hasWord(bag, ["dealer", "dealer request", "pending dealer", "inactive dealer"])) {
          nextCounts.dealers += 1;
          nextFlags.dealers.total = true;
        }
        if (hasWord(bag, ["dealer active", "active dealer"])) nextFlags.dealers.active = true;
        if (hasWord(bag, ["dealer pending", "pending dealer", "dealer request"])) nextFlags.dealers.pending = true;
        if (hasWord(bag, ["inactive dealer", "dealer inactive"])) nextFlags.dealers.inactive = true;

        if (hasWord(bag, ["login", "access", "admin registration", "pending admin", "approved", "rejected"])) {
          nextCounts.login += 1;
          nextFlags.login.total = true;
        }
        if (hasWord(bag, ["pending admin", "login pending", "awaiting approval"])) nextFlags.login.pending = true;
        if (hasWord(bag, ["approved", "approval"])) nextFlags.login.approved = true;
        if (hasWord(bag, ["rejected", "reject"])) nextFlags.login.rejected = true;
      }

      setLineFlags(nextFlags);
      setNotificationCounts(nextCounts);
    } catch (error) {
      console.error("Failed to fetch notification flags:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Verified: "bg-blue-100 text-blue-800 border-blue-200",
      Allocated: "bg-purple-100 text-purple-800 border-purple-200",
      In_Transit: "bg-indigo-100 text-indigo-800 border-indigo-200",
      Delivered: "bg-green-100 text-green-800 border-green-200",
      Completed: "bg-green-100 text-green-800 border-green-200",
      Cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const lineText = (active: boolean, positive = false) => {
    if (positive) return "text-green-600";
    return active ? "text-red-600" : "text-[#0f172a]";
  };

  const quickActions = [
    {
      key: "orders",
      label: "Review Pending Orders",
      href: "/admin/orders?filter=pending",
      icon: ClipboardList,
      isActive: ordersPending > 0 || ordersNotAssigned > 0,
      count: ordersPending + ordersNotAssigned,
      updates: notificationCounts.order,
    },
    {
      key: "stock",
      label: "Check Stock Alerts",
      href: "/admin/stock",
      icon: Boxes,
      isActive: stockLow > 0 || stockOut > 0,
      count: stockLow + stockOut,
      updates: notificationCounts.stock,
    },
    {
      key: "accounts",
      label: "Follow Pending Payments",
      href: "/admin/accounts",
      icon: DollarSign,
      isActive: pendingPayments > 0,
      count: pendingPayments,
      updates: notificationCounts.accounts,
    },
    {
      key: "claims",
      label: "Handle Service Claims",
      href: "/admin/service",
      icon: Headphones,
      isActive: claimsOpen > 0 || claimsInProgress > 0,
      count: claimsOpen + claimsInProgress,
      updates: notificationCounts.claims,
    },
    {
      key: "dealers",
      label: "Approve Dealer Requests",
      href: "/admin/dealers",
      icon: Users,
      isActive: dealerPending > 0,
      count: dealerPending,
      updates: notificationCounts.dealers,
    },
    {
      key: "login",
      label: "Review Login Access",
      href: "/admin/access",
      icon: LogIn,
      isActive: loginPending > 0,
      count: loginPending,
      updates: notificationCounts.login,
    },
  ];

  const quickActionsCount = quickActions.filter((item) => item.isActive).length;
  const displayedRecentOrders = recentOrders.slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500 dark:text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Executive Overview</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Real-time status of your service aggregation platform.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push("/admin/orders")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Orders</CardTitle>
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${lineText(lineFlags.order.total)}`}>{ordersTotal}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Total orders</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className={lineText(ordersPending > 0 || lineFlags.order.pending)}>Pending</span><span className={`font-bold ${lineText(ordersPending > 0 || lineFlags.order.pending)}`}>{ordersPending}</span></div>
              <div className="flex justify-between"><span className={lineText(lineFlags.order.closed, ordersClosed > 0)}>Closed</span><span className={`font-bold ${lineText(lineFlags.order.closed, ordersClosed > 0)}`}>{ordersClosed}</span></div>
              <div className="flex justify-between"><span className={lineText(ordersNotAssigned > 0 || lineFlags.order.notAssigned)}>Not Assigned</span><span className={`font-bold ${lineText(ordersNotAssigned > 0 || lineFlags.order.notAssigned)}`}>{ordersNotAssigned}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push("/admin/stock") }>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Stock</CardTitle>
            <Boxes className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${lineText(lineFlags.stock.total)}`}>{stockTotal}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Total stock units</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className={lineText(stockLow > 0 || lineFlags.stock.low)}>Low Stock</span><span className={`font-bold ${lineText(stockLow > 0 || lineFlags.stock.low)}`}>{stockLow}</span></div>
              <div className="flex justify-between"><span className={lineText(stockOut > 0 || lineFlags.stock.out)}>Out of Stock</span><span className={`font-bold ${lineText(stockOut > 0 || lineFlags.stock.out)}`}>{stockOut}</span></div>
              <div className="flex justify-between"><span className={lineText(lineFlags.stock.dealerWise)}>Dealer-wise Stock</span><span className={`font-bold ${lineText(lineFlags.stock.dealerWise)}`}>{stockDealerWise}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push("/admin/accounts")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Accounts</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${lineText(lineFlags.accounts.revenue)}`}>RS {totalRevenue.toLocaleString("en-IN")}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Total revenue</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className={lineText(lineFlags.accounts.netWorth, netWorth >= 0)}>Net Worth</span><span className={`font-bold ${lineText(lineFlags.accounts.netWorth, netWorth >= 0)}`}>RS {netWorth.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className={lineText(pendingPayments > 0 || lineFlags.accounts.pending)}>Pending Payments</span><span className={`font-bold ${lineText(pendingPayments > 0 || lineFlags.accounts.pending)}`}>RS {pendingPayments.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className={lineText(lineFlags.accounts.paid, paidOrdersCount > 0)}>Paid Orders</span><span className={`font-bold ${lineText(lineFlags.accounts.paid, paidOrdersCount > 0)}`}>{paidOrdersCount}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push("/admin/service") }>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Claims</CardTitle>
            <Headphones className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${lineText(lineFlags.claims.total)}`}>{claimsTotal}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Support and service tickets</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className={lineText(claimsOpen > 0 || lineFlags.claims.open)}>Open</span><span className={`font-bold ${lineText(claimsOpen > 0 || lineFlags.claims.open)}`}>{claimsOpen}</span></div>
              <div className="flex justify-between"><span className={lineText(claimsInProgress > 0 || lineFlags.claims.inProgress)}>In Progress</span><span className={`font-bold ${lineText(claimsInProgress > 0 || lineFlags.claims.inProgress)}`}>{claimsInProgress}</span></div>
              <div className="flex justify-between"><span className={lineText(lineFlags.claims.resolved, claimsResolved > 0)}>Resolved</span><span className={`font-bold ${lineText(lineFlags.claims.resolved, claimsResolved > 0)}`}>{claimsResolved}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push("/admin/dealers")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Dealers</CardTitle>
            <Users className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${lineText(lineFlags.dealers.total)}`}>{dealerTotal}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Total dealer network</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className={lineText(lineFlags.dealers.active, dealerActive > 0)}>Active</span><span className={`font-bold ${lineText(lineFlags.dealers.active, dealerActive > 0)}`}>{dealerActive}</span></div>
              <div className="flex justify-between"><span className={lineText(dealerPending > 0 || lineFlags.dealers.pending)}>Pending</span><span className={`font-bold ${lineText(dealerPending > 0 || lineFlags.dealers.pending)}`}>{dealerPending}</span></div>
              <div className="flex justify-between"><span className={lineText(lineFlags.dealers.inactive)}>Inactive</span><span className={`font-bold ${lineText(lineFlags.dealers.inactive)}`}>{dealerInactive}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push("/admin/access")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">Login</CardTitle>
            <LogIn className="w-5 h-5 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-black ${lineText(lineFlags.login.total)}`}>{loginRoles}</div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Role access categories</p>
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className={lineText(loginPending > 0 || lineFlags.login.pending)}>Pending Access</span><span className={`font-bold ${lineText(loginPending > 0 || lineFlags.login.pending)}`}>{loginPending}</span></div>
              <div className="flex justify-between"><span className={lineText(lineFlags.login.approved, loginApproved > 0)}>Approved</span><span className={`font-bold ${lineText(lineFlags.login.approved, loginApproved > 0)}`}>{loginApproved}</span></div>
              <div className="flex justify-between"><span className={lineText(lineFlags.login.rejected)}>Rejected</span><span className={`font-bold ${lineText(lineFlags.login.rejected)}`}>{loginRejected}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-0 shadow-lg dark:bg-slate-800">
          <CardHeader className="bg-linear-to-r from-slate-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border-b dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-black text-slate-900 dark:text-white">Recent Orders</CardTitle>
                <CardDescription className="dark:text-slate-300">Latest customer orders needing action</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                displayedRecentOrders.map((order: AnyOrder) => (
                  <div key={order.order_id} className="flex items-center justify-between p-4 hover:bg-purple-50/50 dark:hover:bg-slate-700/50 rounded-lg transition-all group border border-transparent hover:border-purple-200 dark:hover:border-purple-500">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{order.customer_name || "Customer"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                          <Phone size={12} /> {order.customer_phone || "-"} • {order.pincode || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-slate-400 dark:text-slate-400">{order.order_number || `#${order.order_id}`}</p>
                        <p className="text-sm font-black text-purple-600 dark:text-purple-400">RS {(Number(order.total_amount) || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <Badge className={`${getStatusBadge(String(order.status || ""))} border font-bold`}>
                        {String(order.status || "-")}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-bold gap-1 text-xs"
                        onClick={() => router.push(`/admin/orders?viewOrderId=${order.order_id}`)}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold">No orders yet</p>
                </div>
              )}

              {recentOrders.length > 2 && (
                <div className="pt-1">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/admin/orders")}
                    className="w-full font-bold border-purple-200 hover:bg-purple-50 hover:text-purple-600"
                  >
                    View All
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-0 shadow-lg dark:bg-slate-800">
          <CardHeader className="bg-linear-to-r from-slate-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border-b dark:border-slate-700">
            <CardTitle className="font-black text-slate-900 dark:text-white">Quick Actions ({quickActionsCount})</CardTitle>
            <CardDescription className="dark:text-slate-300">Frequently used management tools</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  variant="outline"
                  onClick={() => router.push(action.href)}
                  className={`w-full justify-start gap-3 font-bold h-14 transition-colors ${
                    action.isActive
                      ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                      : "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left truncate">{action.label}</span>
                  {action.updates > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {action.updates} new
                    </span>
                  )}
                  {action.count > 0 && (
                    <span className={`text-xs font-black ${action.isActive ? "text-red-700" : "text-slate-500"}`}>
                      {Number.isFinite(action.count) ? Math.floor(action.count).toString() : action.count}
                    </span>
                  )}
                </Button>
              );
            })}

            {quickActionsCount === 0 && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">All priority tasks are completed.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
