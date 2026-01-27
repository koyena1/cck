"use client";
import { useEffect, useState } from "react";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  Calendar,
  Phone,
  MapPin
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

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, completed, today

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/leads', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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

  const filteredOrders = orders.filter((order: any) => {
    if (filter === "all") return true;
    if (filter === "pending") return order.status === "Pending" || order.status === "Verified";
    if (filter === "completed") return order.status === "Completed";
    if (filter === "today") {
      const today = new Date().toDateString();
      return new Date(order.created_at).toDateString() === today;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Orders Management</h1>
          <p className="text-slate-600 mt-1">Manage all customer orders, allocations, and delivery status</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="font-bold"
          >
            All Orders
          </Button>
          <Button 
            variant={filter === "today" ? "default" : "outline"}
            onClick={() => setFilter("today")}
            className="font-bold"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button 
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            className="font-bold"
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending
          </Button>
          <Button 
            variant={filter === "completed" ? "default" : "outline"}
            onClick={() => setFilter("completed")}
            className="font-bold"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Completed
          </Button>
        </div>
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by order ID, customer name, phone..." 
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{orders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-orange-600">
              {orders.filter((o: any) => o.status === "Pending" || o.status === "Verified").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">
              {orders.filter((o: any) => o.status === "Completed").length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Today's Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">
              {orders.filter((o: any) => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="font-black text-slate-900">
            {filter === "all" ? "All Orders" : 
             filter === "today" ? "Today's Orders" :
             filter === "pending" ? "Pending Orders" : "Completed Orders"}
          </CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} order(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: any) => (
                <div key={order.order_id} className="p-4 hover:bg-slate-50 transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-[#e63946]/10 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-[#e63946]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-sm font-black text-slate-900">{order.customer_name}</p>
                          <Badge className={`${getStatusBadge(order.status)} border font-bold text-xs`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <Phone size={12} className="text-slate-400" />
                            <span>{order.customer_phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={12} className="text-slate-400" />
                            <span>{order.city} - {order.pincode}</span>
                          </div>
                          <div className="font-mono font-bold text-slate-400">
                            {order.order_number}
                          </div>
                          <div className="text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Order Value</p>
                        <p className="text-lg font-black text-[#e63946]">₹{order.total_amount?.toLocaleString('en-IN')}</p>
                      </div>
                      <Button variant="outline" size="sm" className="font-bold">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-semibold">No orders found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
