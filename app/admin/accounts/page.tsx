"use client";
import { useState, useEffect } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  FileText,
  Wallet,
  Clock
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

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
}

export default function AccountsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    razorpayRevenue: 0,
    pendingPayments: 0,
    codPending: 0,
    razorpayPending: 0,
    netProfit: 0
  });

  useEffect(() => {
    fetchOrders();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
        calculateMetrics(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (ordersData: Order[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthOrders = ordersData.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });

    // Total Revenue (paid orders)
    const totalRevenue = thisMonthOrders
      .filter(order => order.payment_status === 'Paid')
      .reduce((sum, order) => sum + Number(order.total_amount), 0);

    // Razorpay Revenue (paid via Razorpay)
    const razorpayRevenue = thisMonthOrders
      .filter(order => order.payment_method === 'razorpay' && order.payment_status === 'Paid')
      .reduce((sum, order) => sum + Number(order.total_amount), 0);

    // Pending Payments (all pending orders)
    const pendingPayments = thisMonthOrders
      .filter(order => order.payment_status === 'Pending')
      .reduce((sum, order) => sum + Number(order.total_amount), 0);

    // COD Pending
    const codPending = thisMonthOrders
      .filter(order => order.payment_method === 'cod' && order.payment_status === 'Pending')
      .reduce((sum, order) => sum + Number(order.total_amount), 0);

    // Razorpay Pending
    const razorpayPending = thisMonthOrders
      .filter(order => order.payment_method === 'razorpay' && order.payment_status === 'Pending')
      .reduce((sum, order) => sum + Number(order.total_amount), 0);

    // Net Profit (simplified - can be enhanced with cost data)
    const netProfit = totalRevenue * 0.2; // Example: 20% margin

    setMetrics({
      totalRevenue,
      razorpayRevenue,
      pendingPayments,
      codPending,
      razorpayPending,
      netProfit
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const recentSales = orders.slice(0, 10);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Accounts & Finance</h1>
          <p className="text-slate-600 mt-1">Financial overview, transactions, and payment tracking (Real-time)</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Total Revenue
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-600">
              {loading ? '...' : formatCurrency(metrics.totalRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Paid orders this month</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Razorpay Revenue
            </CardTitle>
            <Wallet className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-indigo-600">
              {loading ? '...' : formatCurrency(metrics.razorpayRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Online payments received</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Pending Payments
            </CardTitle>
            <CreditCard className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-blue-600">
              {loading ? '...' : formatCurrency(metrics.pendingPayments)}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">
              COD: {formatCurrency(metrics.codPending)} | Online: {formatCurrency(metrics.razorpayPending)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Net Profit
            </CardTitle>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-purple-600">
              {loading ? '...' : formatCurrency(metrics.netProfit)}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Estimated (20% margin)</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid gap-6">
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="font-black text-slate-900">Recent Sales</CardTitle>
            <CardDescription>Latest customer orders with payment details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20 animate-pulse" />
                <p className="font-semibold">Loading transactions...</p>
              </div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-semibold">No sales transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b-2">
                    <tr>
                      <th className="text-left p-4 text-xs font-bold text-slate-600 uppercase">Order #</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-600 uppercase">Customer</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-600 uppercase">Amount</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-600 uppercase">Payment Method</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-600 uppercase">Status</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-600 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((order) => (
                      <tr key={order.order_id} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-bold text-sm text-slate-900">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-semibold text-sm text-slate-900">{order.customer_name}</p>
                            <p className="text-xs text-slate-500">{order.customer_phone}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-lg text-slate-900">
                            {formatCurrency(Number(order.total_amount))}
                          </span>
                        </td>
                        <td className="p-4">
                          {order.payment_method === 'razorpay' ? (
                            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold">
                              <Wallet className="w-3 h-3 mr-1" />
                              Razorpay
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold">
                              <CreditCard className="w-3 h-3 mr-1" />
                              COD
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge 
                            className={
                              order.payment_status === 'Paid' 
                                ? "bg-green-100 text-green-700 hover:bg-green-200 font-bold" 
                                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-bold"
                            }
                          >
                            {order.payment_status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="font-black text-slate-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="h-16 font-bold">
              <FileText className="w-5 h-5 mr-2" />
              Generate Invoice
            </Button>
            <Button variant="outline" className="h-16 font-bold">
              <CreditCard className="w-5 h-5 mr-2" />
              Record Payment
            </Button>
            <Button variant="outline" className="h-16 font-bold">
              <TrendingUp className="w-5 h-5 mr-2" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
