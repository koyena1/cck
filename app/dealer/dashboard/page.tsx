"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  ExternalLink,
  Wrench,
  Search,
  RefreshCw,
  Package,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Truck,
  Activity,
  Bell,
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
  ReferenceLine
} from "recharts"

interface AssignedOrder {
  request_id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  pincode: string;
  installation_address: string;
  total_amount: number;
  order_status: string;
  request_status: string;
  accepted_at: string;
  dealer_notes: string;
  dealer_distance_km: number;
  hours_since_acceptance: number;
  order_items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export default function DealerDashboard() {
  const [assignedJobs, setAssignedJobs] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const router = useRouter();
  
  // Real-time counts
  const [acceptedOrdersCount, setAcceptedOrdersCount] = useState<number | null>(null);
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [orderRequestsCount, setOrderRequestsCount] = useState<number | null>(null);
  const [declinedOrdersCount, setDeclinedOrdersCount] = useState<number | null>(null);
  const [transactionsCount, setTransactionsCount] = useState<number | null>(null);
  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
  const [totalProformaCount, setTotalProformaCount] = useState<number | null>(null);
  const [finalizedProformaCount, setFinalizedProformaCount] = useState<number | null>(null);
  const [claimTotalCount, setClaimTotalCount] = useState<number | null>(null);
  const [claimOpenCount, setClaimOpenCount] = useState<number | null>(null);
  const [claimInProgressCount, setClaimInProgressCount] = useState<number | null>(null);
  const [claimResolvedCount, setClaimResolvedCount] = useState<number | null>(null);
  const [latestClaimTicketNumber, setLatestClaimTicketNumber] = useState<string>('');

  // Growth data
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loadingGrowth, setLoadingGrowth] = useState(false);

  // Quick Actions data
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [lowStockGmvLoss, setLowStockGmvLoss] = useState<number>(0);
  const [outOfStockCount, setOutOfStockCount] = useState<number>(0);
  const [outOfStockGmvLoss, setOutOfStockGmvLoss] = useState<number>(0);
  const [proformaAlertCount, setProformaAlertCount] = useState<number>(0);
  const [lineNotificationFlags, setLineNotificationFlags] = useState({
    totalOrder: false,
    acceptOrder: false,
    pendingOrder: false,
    totalStock: false,
    outOfStock: false,
    lowStock: false,
    totalTransaction: false,
    invoice: false,
  });
  // Orders needing a progress update
  const [pendingUpdateOrders, setPendingUpdateOrders] = useState<any[]>([]);

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
      
      // Initialize available years (2026 to 2030)
      const currentYear = new Date().getFullYear();
      const startYear = 2026;
      const endYear = 2030;
      const years = [];
      for (let year = startYear; year <= endYear; year++) {
        years.push(year);
      }
      setAvailableYears(years);
      setSelectedYear(currentYear);
      
      // Fetch all counts in parallel
      await Promise.all([
        fetchAssignedOrders(dId),
        fetchAcceptedOrdersCount(dId),
        fetchStockCount(dId),
        fetchOrderRequestsCount(dId),
        fetchDeclinedOrdersCount(dId),
        fetchTransactionsCount(dId),
        fetchInvoiceCount(dId),
        fetchClaimDetails(dId),
        fetchGrowthData(dId, currentYear),
        fetchInventoryActions(dId),
        fetchPendingUpdateOrders(dId),
        fetchProformaAlerts(dId),
        fetchLineNotificationFlags(dId),
      ]);
      
      setLoading(false);
    };

    initializePage();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (dealerId) {
        fetchAssignedOrders(dealerId);
        fetchAcceptedOrdersCount(dealerId);
        fetchStockCount(dealerId);
        fetchOrderRequestsCount(dealerId);
        fetchDeclinedOrdersCount(dealerId);
        fetchTransactionsCount(dealerId);
        fetchInvoiceCount(dealerId);
        fetchClaimDetails(dealerId);
        fetchInventoryActions(dealerId);
        fetchPendingUpdateOrders(dealerId);
        fetchProformaAlerts(dealerId);
        fetchLineNotificationFlags(dealerId);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [dealerId]);

  const fetchAssignedOrders = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer/assigned-orders?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setAssignedJobs(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch assigned orders:', error);
    }
  };

  const fetchAcceptedOrdersCount = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-order-response?dealerId=${dId}&status=accepted`);
      const data = await response.json();
      if (data.success) {
        setAcceptedOrdersCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch accepted orders count:', error);
    }
  };

  const fetchStockCount = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-inventory?dealerId=${dId}`);
      const data = await response.json();
      if (data.success) {
        // Count total unique products in stock
        setStockCount(data.inventory?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch stock count:', error);
    }
  };

  const fetchOrderRequestsCount = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-order-response?dealerId=${dId}&status=pending`);
      const data = await response.json();
      if (data.success) {
        setOrderRequestsCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch order requests count:', error);
    }
  };

  const fetchDeclinedOrdersCount = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-order-response?dealerId=${dId}&status=declined`);
      const data = await response.json();
      if (data.success) {
        setDeclinedOrdersCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch declined orders count:', error);
    }
  };

  const fetchTransactionsCount = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-transactions?dealerId=${dId}`);
      const data = await response.json();
      if (data.success) {
        setTransactionsCount(data.transactions?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch transactions count:', error);
    }
  };

  const fetchInvoiceCount = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-invoices?dealerId=${dId}&includeFinalized=true`);
      const data = await response.json();
      if (data.success) {
        setInvoiceCount(data.invoices?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch invoice count:', error);
    }
  };

  const fetchClaimDetails = async (dId: number) => {
    try {
      const response = await fetch(`/api/support/tickets?viewer=dealer&dealerId=${dId}`, {
        cache: 'no-store'
      });
      const data = await response.json();

      if (!data.success) {
        setClaimTotalCount(0);
        setClaimOpenCount(0);
        setClaimInProgressCount(0);
        setClaimResolvedCount(0);
        setLatestClaimTicketNumber('');
        return;
      }

      const tickets = data.tickets || [];
      const openCount = tickets.filter((ticket: any) => String(ticket.status || '').toLowerCase() === 'open').length;
      const inProgressCount = tickets.filter((ticket: any) => String(ticket.status || '').toLowerCase() === 'in_progress').length;
      const resolvedCount = tickets.filter((ticket: any) => {
        const status = String(ticket.status || '').toLowerCase();
        return status === 'resolved' || status === 'closed';
      }).length;

      setClaimTotalCount(tickets.length);
      setClaimOpenCount(openCount);
      setClaimInProgressCount(inProgressCount);
      setClaimResolvedCount(resolvedCount);
      setLatestClaimTicketNumber(tickets[0]?.ticket_number || '');
    } catch (error) {
      console.error('Failed to fetch claim details:', error);
      setClaimTotalCount(0);
      setClaimOpenCount(0);
      setClaimInProgressCount(0);
      setClaimResolvedCount(0);
      setLatestClaimTicketNumber('');
    }
  };

  const fetchPendingUpdateOrders = async (dId: number) => {
    try {
      // Get accepted orders
      const res = await fetch(`/api/dealer-order-response?dealerId=${dId}&status=accepted`);
      const data = await res.json();
      if (!data.success) return;
      const accepted: any[] = data.requests || [];
      // For each, check if there's a recent progress update
      const needsUpdate: any[] = [];
      await Promise.all(
        accepted.map(async (order: any) => {
          try {
            const pRes = await fetch(`/api/dealer/order-progress?orderId=${order.order_id}`);
            const pData = await pRes.json();
            const updates: any[] = pData.updates || [];
            // Skip if delivery already done
            if (updates.some((u: any) => u.is_delivery_done)) return;
            if (updates.length === 0) {
              needsUpdate.push({ ...order, lastUpdateHoursAgo: null });
            } else {
              const last = updates[updates.length - 1];
              const hoursAgo = (Date.now() - new Date(last.created_at).getTime()) / 3600000;
              if (hoursAgo >= 20) needsUpdate.push({ ...order, lastUpdateHoursAgo: Math.round(hoursAgo) });
            }
          } catch (_) { /* silent */ }
        })
      );
      setPendingUpdateOrders(needsUpdate);
    } catch (_) { /* silent */ }
  };

  const fetchProformaAlerts = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-proformas?dealerId=${dId}`);
      const data = await response.json();
      if (!data.success) {
        setProformaAlertCount(0);
        setTotalProformaCount(0);
        setFinalizedProformaCount(0);
        return;
      }

      // Keep transaction alert active until proformas are finalized.
      const unresolvedProformas = (data.proformas || []).filter(
        (proforma: any) => String(proforma.status || '').toLowerCase() !== 'finalized'
      );
      const finalizedProformas = (data.proformas || []).filter(
        (proforma: any) => String(proforma.status || '').toLowerCase() === 'finalized'
      );

      setProformaAlertCount(unresolvedProformas.length);
      setTotalProformaCount((data.proformas || []).length);
      setFinalizedProformaCount(finalizedProformas.length);
    } catch (error) {
      console.error('Failed to fetch proforma alerts:', error);
      setProformaAlertCount(0);
      setTotalProformaCount(0);
      setFinalizedProformaCount(0);
    }
  };

  const fetchLineNotificationFlags = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer/notifications?dealerId=${dId}`);
      const data = await response.json();

      if (!data.success) {
        setLineNotificationFlags({
          totalOrder: false,
          acceptOrder: false,
          pendingOrder: false,
          totalStock: false,
          outOfStock: false,
          lowStock: false,
          totalTransaction: false,
          invoice: false,
        });
        return;
      }

      const unreadNotifications = (data.notifications || []).filter((notification: any) => !notification.is_read);

      const hasKeyword = (text: string, keywords: string[]) =>
        keywords.some((keyword) => text.includes(keyword));

      const flags = unreadNotifications.reduce(
        (acc: any, notification: any) => {
          const type = String(notification.type || '').toLowerCase();
          const title = String(notification.title || '').toLowerCase();
          const message = String(notification.message || '').toLowerCase();
          const bag = `${type} ${title} ${message}`;

          if (hasKeyword(bag, ['order'])) {
            acc.totalOrder = true;
          }

          if (hasKeyword(bag, ['accepted', 'accept'])) {
            acc.acceptOrder = true;
          }

          if (hasKeyword(bag, ['pending', 'request', 'new order'])) {
            acc.pendingOrder = true;
            acc.totalOrder = true;
          }

          if (hasKeyword(bag, ['stock', 'inventory'])) {
            acc.totalStock = true;
          }

          if (hasKeyword(bag, ['out of stock', 'stockout', 'stock out'])) {
            acc.outOfStock = true;
            acc.totalStock = true;
          }

          if (hasKeyword(bag, ['low stock'])) {
            acc.lowStock = true;
            acc.totalStock = true;
          }

          if (hasKeyword(bag, ['transaction'])) {
            acc.totalTransaction = true;
          }

          if (hasKeyword(bag, ['invoice', 'proforma'])) {
            acc.invoice = true;
            acc.totalTransaction = true;
          }

          return acc;
        },
        {
          totalOrder: false,
          acceptOrder: false,
          pendingOrder: false,
          totalStock: false,
          outOfStock: false,
          lowStock: false,
          totalTransaction: false,
          invoice: false,
        }
      );

      setLineNotificationFlags(flags);
    } catch (error) {
      console.error('Failed to fetch line notification flags:', error);
      setLineNotificationFlags({
        totalOrder: false,
        acceptOrder: false,
        pendingOrder: false,
        totalStock: false,
        outOfStock: false,
        lowStock: false,
        totalTransaction: false,
        invoice: false,
      });
    }
  };

  const fetchInventoryActions = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-inventory?dealerId=${dId}`);
      const data = await response.json();
      if (data.success) {
        const LOW_STOCK_THRESHOLD = 5;
        
        // Separate low stock (1-4 items) from out of stock (0 items)
        const lowStock = data.inventory.filter((item: any) => 
          item.quantity_available > 0 && item.quantity_available < LOW_STOCK_THRESHOLD
        );
        const outOfStock = data.inventory.filter((item: any) => item.quantity_available === 0);
        
        setLowStockCount(lowStock.length);
        setOutOfStockCount(outOfStock.length);
        
        // Calculate potential GMV loss for low stock items
        const lowStockLoss = lowStock.reduce((sum: number, item: any) => {
          const price = parseFloat(item.dealer_sale_price) || 0;
          return sum + price;
        }, 0);
        setLowStockGmvLoss(lowStockLoss);
        
        // Calculate potential GMV loss for out of stock items
        const outOfStockLoss = outOfStock.reduce((sum: number, item: any) => {
          const price = parseFloat(item.dealer_sale_price) || 0;
          return sum + price;
        }, 0);
        setOutOfStockGmvLoss(outOfStockLoss);
      }
    } catch (error) {
      console.error('Failed to fetch inventory actions:', error);
    }
  };

  const fetchGrowthData = async (dId: number, year: number) => {
    setLoadingGrowth(true);
    try {
      const response = await fetch(`/api/dealer/growth?dealerId=${dId}&year=${year}`);
      const data = await response.json();
      
      if (data.success) {
        setGrowthData(data.monthlyData || []);
      } else {
        console.error('Failed to fetch growth data:', data.error);
        setGrowthData([]);
      }
    } catch (error) {
      console.error('Failed to fetch growth data:', error);
      setGrowthData([]);
    }
    setLoadingGrowth(false);
  };

  const handleYearChange = async (year: number) => {
    setSelectedYear(year);
    if (dealerId) {
      await fetchGrowthData(dealerId, year);
    }
  };

  const handleRefresh = async () => {
    if (dealerId) {
      setLoading(true);
      await Promise.all([
        fetchAssignedOrders(dealerId),
        fetchAcceptedOrdersCount(dealerId),
        fetchStockCount(dealerId),
        fetchOrderRequestsCount(dealerId),
        fetchDeclinedOrdersCount(dealerId),
        fetchTransactionsCount(dealerId),
        fetchInvoiceCount(dealerId),
        fetchClaimDetails(dealerId)
      ]);
      setLoading(false);
    }
  };

  const handleCardClick = (route: string, filter?: string) => {
    if (filter) {
      router.push(`${route}?filter=${filter}`);
    } else {
      router.push(route);
    }
  };

  const getStatusBadgeInfo = (status: string) => {
    switch (status) {
      case 'Allocated':
        return { text: 'Order Confirmed', className: 'bg-blue-600 text-white' };
      case 'In_Transit':
        return { text: 'In Transit', className: 'bg-purple-600 text-white' };
      case 'Delivered':
        return { text: 'Delivered', className: 'bg-indigo-600 text-white' };
      case 'Installation_Pending':
        return { text: 'Ready to Install', className: 'bg-orange-600 text-white' };
      case 'Scheduled':
        return { text: 'Scheduled', className: 'bg-[#0f172a] text-white' };
      default:
        return { text: status.replace(/_/g, ' '), className: 'bg-[#0f172a] text-white' };
    }
  };

  const orderLineColor = {
    total: lineNotificationFlags.totalOrder ? 'text-red-600' : 'text-[#0f172a]',
    accepted: (acceptedOrdersCount ?? 0) > 0 ? 'text-green-600' : (lineNotificationFlags.acceptOrder ? 'text-green-600' : 'text-[#0f172a]'),
    pending: ((orderRequestsCount ?? 0) > 0 || lineNotificationFlags.pendingOrder) ? 'text-red-600' : 'text-[#0f172a]',
    declined: (declinedOrdersCount ?? 0) > 0 ? 'text-red-600' : 'text-[#0f172a]',
  };

  const stockLineColor = {
    total: lineNotificationFlags.totalStock ? 'text-red-600' : 'text-[#0f172a]',
    outOfStock: (outOfStockCount > 0 || lineNotificationFlags.outOfStock) ? 'text-red-600' : 'text-[#0f172a]',
    lowStock: (lowStockCount > 0 || lineNotificationFlags.lowStock) ? 'text-red-600' : 'text-[#0f172a]',
  };

  const transactionLineColor = {
    total: lineNotificationFlags.totalTransaction ? 'text-red-600' : 'text-[#0f172a]',
    invoice: (proformaAlertCount > 0 || lineNotificationFlags.invoice) ? 'text-red-600' : 'text-[#0f172a]',
    profit: 'text-green-600',
    loss: 'text-red-600',
  };

  const proformaLineColor = {
    total: (proformaAlertCount > 0 || lineNotificationFlags.invoice) ? 'text-red-600' : 'text-[#0f172a]',
    pending: proformaAlertCount > 0 ? 'text-red-600' : 'text-[#0f172a]',
    finalized: (finalizedProformaCount ?? 0) > 0 ? 'text-green-600' : 'text-[#0f172a]',
  };

  const claimLineColor = {
    total: (claimOpenCount ?? 0) > 0 ? 'text-red-600' : 'text-[#0f172a]',
    open: (claimOpenCount ?? 0) > 0 ? 'text-red-600' : 'text-[#0f172a]',
    inProgress: (claimInProgressCount ?? 0) > 0 ? 'text-blue-600' : 'text-[#0f172a]',
    resolved: (claimResolvedCount ?? 0) > 0 ? 'text-green-600' : 'text-[#0f172a]',
  };

  const totalProfitAmount = growthData.reduce((sum, item) => sum + (item.profit || 0), 0);
  const totalLossAmount = growthData.reduce((sum, item) => sum + (item.loss || 0), 0);

  return (
    <div className="min-h-screen pb-10">
      <div className="p-3 sm:p-4 md:p-6 lg:p-10">
        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mb-6 sm:mb-8">
          <Card
            className="border-none bg-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-100"
            onClick={() => router.push('/dealer/order-requests')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold font-poppins uppercase tracking-wider text-[#0f172a]">
                Order
              </CardTitle>
              <div className="p-2 bg-[#0f172a] rounded-md">
                <ClipboardList className="w-4 h-4 text-[#facc15]" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-xs font-poppins font-medium text-[#0f172a] opacity-90">
                <li className="flex items-center justify-between gap-2">
                  <span className={orderLineColor.total}>Total Order</span>
                  <span className={`font-bold ${orderLineColor.total}`}>
                    {(acceptedOrdersCount !== null && orderRequestsCount !== null && declinedOrdersCount !== null)
                      ? (acceptedOrdersCount + orderRequestsCount + declinedOrdersCount).toString().padStart(2, '0')
                      : '--'}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={orderLineColor.accepted}>Accept Order</span>
                  <span className={`font-bold ${orderLineColor.accepted}`}>{acceptedOrdersCount !== null ? acceptedOrdersCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={orderLineColor.pending}>Pending Order</span>
                  <span className={`font-bold ${orderLineColor.pending}`}>{orderRequestsCount !== null ? orderRequestsCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={orderLineColor.declined}>Decline Order</span>
                  <span className={`font-bold ${orderLineColor.declined}`}>{declinedOrdersCount !== null ? declinedOrdersCount.toString().padStart(2, '0') : '--'}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="border-none bg-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-100"
            onClick={() => router.push('/dealer/stock')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold font-poppins uppercase tracking-wider text-[#0f172a]">
                Stock
              </CardTitle>
              <div className="p-2 bg-[#0f172a] rounded-md">
                <Package className="w-4 h-4 text-[#facc15]" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-xs font-poppins font-medium text-[#0f172a] opacity-90">
                <li className="flex items-center justify-between gap-2">
                  <span className={stockLineColor.total}>Total Stock</span>
                  <span className={`font-bold ${stockLineColor.total}`}>{stockCount !== null ? stockCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={stockLineColor.outOfStock}>Out of Stock</span>
                  <span className={`font-bold ${stockLineColor.outOfStock}`}>{outOfStockCount.toString().padStart(2, '0')}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={stockLineColor.lowStock}>Low Stock</span>
                  <span className={`font-bold ${stockLineColor.lowStock}`}>{lowStockCount.toString().padStart(2, '0')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="border-none bg-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-100"
            onClick={() => router.push('/dealer/transactions')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold font-poppins uppercase tracking-wider text-[#0f172a]">
                Accounts
              </CardTitle>
              <div className="p-2 bg-[#0f172a] rounded-md">
                <DollarSign className="w-4 h-4 text-[#facc15]" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-xs font-poppins font-medium text-[#0f172a] opacity-90">
                <li className="flex items-center justify-between gap-2">
                  <span className={transactionLineColor.total}>Total Transaction</span>
                  <span className={`font-bold ${transactionLineColor.total}`}>{transactionsCount !== null ? transactionsCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={transactionLineColor.invoice}>Invoice</span>
                  <span className={`font-bold ${transactionLineColor.invoice}`}>{invoiceCount !== null ? invoiceCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={transactionLineColor.profit}>Total Profit</span>
                  <span className={`font-bold ${transactionLineColor.profit}`}>RS {totalProfitAmount.toLocaleString('en-IN')}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={transactionLineColor.loss}>Total Loss</span>
                  <span className={`font-bold ${transactionLineColor.loss}`}>RS {totalLossAmount.toLocaleString('en-IN')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="border-none bg-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-100"
            onClick={() => router.push('/dealer/proforma')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold font-poppins uppercase tracking-wider text-[#0f172a]">
                Proforma
              </CardTitle>
              <div className="p-2 bg-[#0f172a] rounded-md">
                <FileText className="w-4 h-4 text-[#facc15]" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-xs font-poppins font-medium text-[#0f172a] opacity-90">
                <li className="flex items-center justify-between gap-2">
                  <span className={proformaLineColor.total}>Total Proforma</span>
                  <span className={`font-bold ${proformaLineColor.total}`}>{totalProformaCount !== null ? totalProformaCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={proformaLineColor.pending}>Pending Proforma</span>
                  <span className={`font-bold ${proformaLineColor.pending}`}>{proformaAlertCount.toString().padStart(2, '0')}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={proformaLineColor.finalized}>Finalized Proforma</span>
                  <span className={`font-bold ${proformaLineColor.finalized}`}>{finalizedProformaCount !== null ? finalizedProformaCount.toString().padStart(2, '0') : '--'}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="border-none bg-white shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-100"
            onClick={() => router.push('/dealer/service-support')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold font-poppins uppercase tracking-wider text-[#0f172a]">
                Claim
              </CardTitle>
              <div className="p-2 bg-[#0f172a] rounded-md">
                <Wrench className="w-4 h-4 text-[#facc15]" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-xs font-poppins font-medium text-[#0f172a] opacity-90">
                <li className="flex items-center justify-between gap-2">
                  <span className={claimLineColor.total}>Total Claim</span>
                  <span className={`font-bold ${claimLineColor.total}`}>{claimTotalCount !== null ? claimTotalCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={claimLineColor.open}>Open Claim</span>
                  <span className={`font-bold ${claimLineColor.open}`}>{claimOpenCount !== null ? claimOpenCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={claimLineColor.inProgress}>In Progress</span>
                  <span className={`font-bold ${claimLineColor.inProgress}`}>{claimInProgressCount !== null ? claimInProgressCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className={claimLineColor.resolved}>Resolved</span>
                  <span className={`font-bold ${claimLineColor.resolved}`}>{claimResolvedCount !== null ? claimResolvedCount.toString().padStart(2, '0') : '--'}</span>
                </li>
                <li className="pt-1 text-[10px] text-slate-600 flex items-center justify-between gap-2">
                  <span>Latest Ticket</span>
                  <span className="font-mono font-semibold text-[#0f172a]">{latestClaimTicketNumber || '--'}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-7">
          {/* Growth Chart */}
          <Card className="md:col-span-4 border-none bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-orbitron uppercase text-[#0f172a] dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#facc15]" />
                    Growth
                  </CardTitle>
                  <CardDescription className="font-poppins text-xs sm:text-sm">Profit and loss analysis</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                    {availableYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => handleYearChange(year)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                          selectedYear === year
                            ? 'bg-[#0f172a] text-white'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {loadingGrowth ? (
                <div className="h-75 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#facc15]" />
                </div>
              ) : (
                <div className="w-full h-75">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={growthData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: '600' }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        style={{ fontSize: '12px', fontWeight: '600' }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                        formatter={(value: any) => `RS ${value.toLocaleString()}`}
                      />
                      <Legend 
                        wrapperStyle={{
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      />
                      <ReferenceLine y={0} stroke="#94a3b8" />
                      <Bar 
                        dataKey="loss" 
                        stackId="a" 
                        fill="#dc2626" 
                        name="Loss"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar 
                        dataKey="profit" 
                        stackId="a" 
                        fill="#0f4c5c" 
                        name="Profit"
                        radius={[4, 4, 0, 0]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#f97316" 
                        strokeWidth={3}
                        dot={{ fill: '#f97316', r: 4 }}
                        name="Total"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Total Profit</p>
                  <p className="text-lg font-bold text-green-600">
                    RS {growthData.reduce((sum, item) => sum + item.profit, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Total Loss</p>
                  <p className="text-lg font-bold text-red-600">
                    RS {growthData.reduce((sum, item) => sum + item.loss, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase mb-1">Net</p>
                  <p className="text-lg font-bold text-[#0f172a] dark:text-[#facc15]">
                    RS {(growthData.reduce((sum, item) => sum + item.profit - item.loss, 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="md:col-span-3 border-none bg-white shadow-lg">
            <CardHeader className="border-b border-slate-200 pb-4">
              <CardTitle className="font-orbitron uppercase text-[#0f172a] text-lg sm:text-xl font-bold">
                Quick Actions ({(
                  (proformaAlertCount > 0 ? 1 : 0) +
                  ((orderRequestsCount !== null && orderRequestsCount > 0) ? 1 : 0) +
                  (pendingUpdateOrders.length > 0 ? 1 : 0) +
                  (outOfStockCount > 0 ? 1 : 0) +
                  (lowStockCount > 0 ? 1 : 0)
                )})
              </CardTitle>
              <CardDescription className="font-poppins text-slate-500 text-xs sm:text-sm">Priority tasks requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Show tasks in priority order */}

              {/* Priority 0: Proformas pending finalization */}
              {proformaAlertCount > 0 && (
                <div className="bg-white border-l-4 border-indigo-500 p-4 sm:p-6 rounded-r-lg hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                        <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-poppins text-base sm:text-lg text-[#0f172a] font-semibold leading-tight flex items-center gap-2 flex-wrap">
                        <span>
                          {proformaAlertCount === 1
                            ? '1 proforma is pending finalization'
                            : `${proformaAlertCount} proformas are pending finalization`}
                        </span>
                        <Button
                          onClick={() => router.push('/dealer/proforma')}
                          variant="outline"
                          size="sm"
                          className="border border-indigo-500 text-indigo-700 hover:bg-indigo-500 hover:text-white font-semibold px-3 py-1 h-auto text-xs"
                        >
                          Open Proformas
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Priority 0: Orders needing progress update */}
              {pendingUpdateOrders.length > 0 && (
                <div className="bg-white border-l-4 border-yellow-500 p-4 sm:p-6 rounded-r-lg hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-poppins text-base sm:text-lg text-[#0f172a] font-semibold leading-tight mb-2">
                        {pendingUpdateOrders.length === 1
                          ? `1 accepted order needs a progress update`
                          : `${pendingUpdateOrders.length} accepted orders need progress updates`}
                      </p>
                      <div className="space-y-1.5">
                        {pendingUpdateOrders.map((o: any) => (
                          <div key={o.order_id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-bold text-slate-700">{o.order_number}</span>
                            <span className="text-slate-500">
                              {o.lastUpdateHoursAgo === null ? 'No updates yet' : `${o.lastUpdateHoursAgo}h since last update`}
                            </span>
                            <Button
                              onClick={() => router.push('/dealer/order-requests?filter=accepted')}
                              variant="outline"
                              size="sm"
                              className="border border-yellow-500 text-yellow-700 hover:bg-yellow-500 hover:text-white font-semibold px-2 py-0.5 h-auto text-[10px]"
                            >
                              Update Now
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority 1: Pending Order Requests */}
              {orderRequestsCount !== null && orderRequestsCount > 0 && (
                <div 
                  className="bg-white border-l-4 border-blue-500 p-4 sm:p-6 rounded-r-lg hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl sm:text-4xl">{orderRequestsCount}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-poppins text-base sm:text-lg text-[#0f172a] font-semibold leading-tight flex items-center gap-2 flex-wrap">
                        <span>{orderRequestsCount === 1 ? 'New order request' : `${orderRequestsCount} new order requests`} awaiting your response</span>
                        <Button 
                          onClick={() => router.push('/dealer/order-requests?filter=pending')}
                          variant="outline" 
                          size="sm"
                          className="border border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white font-semibold px-3 py-1 h-auto text-xs"
                        >
                          Review Now
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Priority 2: Out of Stock (Critical) */}
              {outOfStockCount > 0 && (
                <div 
                  className="bg-white border-l-4 border-red-500 p-4 sm:p-6 rounded-r-lg hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl sm:text-4xl">{outOfStockCount}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-poppins text-base sm:text-lg text-[#0f172a] font-semibold leading-tight flex items-center gap-2 flex-wrap">
                        <span>
                          {outOfStockCount === 1 ? '1 product is' : `${outOfStockCount} products are`} out of stock
                          {outOfStockGmvLoss > 0 && ` | Potential GMV loss RS ${outOfStockGmvLoss.toLocaleString('en-IN')}`}
                        </span>
                        <Button 
                          onClick={() => router.push('/dealer/stock?filter=out-of-stock')}
                          variant="outline" 
                          size="sm"
                          className="border border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-semibold px-3 py-1 h-auto text-xs"
                        >
                          Restock Now
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Priority 3: Low Stock (Warning) */}
              {lowStockCount > 0 && (
                <div 
                  className="bg-white border-l-4 border-orange-500 p-4 sm:p-6 rounded-r-lg hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl sm:text-4xl">{lowStockCount}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-poppins text-base sm:text-lg text-[#0f172a] font-semibold leading-tight flex items-center gap-2 flex-wrap">
                        <span>
                          {lowStockCount === 1 ? '1 product has' : `${lowStockCount} products have`} low stock (below 5 units)
                          {lowStockGmvLoss > 0 && ` | Potential GMV loss RS ${lowStockGmvLoss.toLocaleString('en-IN')}`}
                        </span>
                        <Button 
                          onClick={() => router.push('/dealer/stock?filter=low-stock')}
                          variant="outline" 
                          size="sm"
                          className="border border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-semibold px-3 py-1 h-auto text-xs"
                        >
                          Restock Now
                        </Button>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* All Clear Message */}
              {(orderRequestsCount === 0 || orderRequestsCount === null) && outOfStockCount === 0 && lowStockCount === 0 && pendingUpdateOrders.length === 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <p className="font-poppins text-sm text-green-700 font-medium">
                      All tasks completed! No pending actions required.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}