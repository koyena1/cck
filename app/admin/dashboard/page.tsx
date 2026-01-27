"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Users,
  ArrowUpRight,
  MapPin,
  Package,
  Phone
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

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    activeDealers: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders
      const ordersResponse = await fetch('/api/leads', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!ordersResponse.ok) {
        const errorData = await ordersResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', errorData);
        setLoading(false);
        return;
      }
      
      const ordersData = await ordersResponse.json();
      
      if (Array.isArray(ordersData)) {
        // Calculate stats
        const today = new Date().toDateString();
        const todayOrders = ordersData.filter(order => 
          new Date(order.created_at).toDateString() === today
        ).length;
        
        const pendingOrders = ordersData.filter(order => 
          order.status === 'Pending' || order.status === 'Verified'
        ).length;
        
        const completedOrders = ordersData.filter(order => 
          order.status === 'Completed'
        ).length;
        
        setStats({
          todayOrders,
          pendingOrders,
          completedOrders,
          activeDealers: 42 // Can fetch from dealers table later
        });
        
        // Set recent orders (top 5)
        setRecentOrders(ordersData.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Verified': 'bg-blue-100 text-blue-800 border-blue-200',
      'Allocated': 'bg-purple-100 text-purple-800 border-purple-200',
      'In_Transit': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Executive Overview</h1>
        <p className="text-slate-600 mt-1">Real-time status of your service aggregation platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-white/90">
              Today's Orders
            </CardTitle>
            <Package className="w-5 h-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{stats.todayOrders}</div>
            <p className="text-xs text-white/80 mt-2 font-medium">New orders today</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-white/90">
              Pending Orders
            </CardTitle>
            <Clock className="w-5 h-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{stats.pendingOrders}</div>
            <p className="text-xs text-white/80 mt-2 font-medium">Requires action</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-teal-400 via-emerald-500 to-green-500 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-white/90">
              Completed Orders
            </CardTitle>
            <CheckCircle2 className="w-5 h-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{stats.completedOrders}</div>
            <p className="text-xs text-white/80 mt-2 font-medium">This month</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-white/90">
              Active Dealers
            </CardTitle>
            <Users className="w-5 h-5 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">{stats.activeDealers}</div>
            <p className="text-xs text-white/80 mt-2 font-medium">Within 5-10km</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Orders Table */}
        <Card className="lg:col-span-4 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-black text-slate-900">Recent Orders</CardTitle>
                <CardDescription>Latest customer orders needing action</CardDescription>
              </div>
              <Link href="/admin/orders">
                <Button variant="outline" size="sm" className="font-bold border-purple-200 hover:bg-purple-50 hover:text-purple-600">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <div key={order.order_id} className="flex items-center justify-between p-4 hover:bg-purple-50/50 rounded-lg transition-all group border border-transparent hover:border-purple-200">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{order.customer_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <Phone size={12} /> {order.customer_phone} • {order.pincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-slate-400">{order.order_number}</p>
                        <p className="text-sm font-black text-purple-600">₹{order.total_amount}</p>
                      </div>
                      <Badge className={`${getStatusBadge(order.status)} border font-bold`}>
                        {order.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold">No orders yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b">
            <CardTitle className="font-black text-slate-900">Quick Actions</CardTitle>
            <CardDescription>Frequently used management tools</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start gap-3 font-bold h-14 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300">
                <TrendingUp className="w-5 h-5" />
                Update Product Prices
              </Button>
            </Link>
            <Link href="/admin/access">
              <Button variant="outline" className="w-full justify-start gap-3 font-bold h-14 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300">
                <Users className="w-5 h-5" />
                Onboard New Dealer
              </Button>
            </Link>
            <Link href="/admin/orders?filter=pending">
              <Button variant="outline" className="w-full justify-start gap-3 font-bold h-14 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300">
                <Clock className="w-5 h-5" />
                View Urgent Callbacks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}