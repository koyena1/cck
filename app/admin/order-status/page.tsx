"use client";

import { useState, useEffect } from "react";
import { Truck, Package, CheckCircle, Clock, AlertCircle, MapPin, Phone, Calendar, User, History, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderStatusUpdate {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  installation_address: string;
  pincode: string;
  city: string;
  total_amount: number;
  status: string;
  dealer_name: string;
  dealer_phone: string;
  accepted_at: string;
  status_history: Array<{
    status: string;
    remarks: string | null;
    updated_by_dealer_name: string;
    created_at: string;
  }>;
}

export default function AdminOrderStatusPage() {
  const [orders, setOrders] = useState<OrderStatusUpdate[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderStatusUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    fetchOrderStatuses();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterStatus, orders]);

  const fetchOrderStatuses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/order-status');
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        console.error('Failed to fetch order statuses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching order statuses:', error);
    }
    setLoading(false);
  };

  const applyFilter = () => {
    if (filterStatus === 'all') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status === filterStatus));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'Allocated': { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700' },
      'In_Transit': { label: 'In Transit', className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700' },
      'Delivered': { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700' },
      'Installation_Pending': { label: 'Ready to Install', className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700' },
      'Completed': { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600' };
    return <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Allocated': return <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'In_Transit': return <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Delivered': return <Package className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'Installation_Pending': return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'Completed': return <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default: return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'Allocated': 'text-blue-600 dark:text-blue-400',
      'In_Transit': 'text-purple-600 dark:text-purple-400',
      'Delivered': 'text-green-600 dark:text-green-400',
      'Installation_Pending': 'text-orange-600 dark:text-orange-400',
      'Completed': 'text-emerald-600 dark:text-emerald-400',
    };
    return colorMap[status] || 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading order statuses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10">
      <div className="p-4 sm:p-6 lg:p-10">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Order Status Tracking</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor delivery status updates from dealers</p>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="Allocated">Confirmed</SelectItem>
              <SelectItem value="In_Transit">In Transit</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Installation_Pending">Ready to Install</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {['Allocated', 'In_Transit', 'Delivered', 'Installation_Pending', 'Completed'].map((status) => {
            const count = orders.filter(o => o.status === status).length;
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus(status)}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-gray-600 mt-1">{status.replace(/_/g, ' ')}</p>
                    </div>
                    {getStatusIcon(status)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No Orders Found</h3>
              <p className="text-gray-500 dark:text-gray-400">No orders match the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.order_id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-800 dark:to-purple-900/30 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <CardTitle className="text-lg">{order.order_number}</CardTitle>
                        <CardDescription>{order.customer_name}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                      >
                        {expandedOrder === order.order_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dealer</p>
                        <p className="text-sm font-semibold dark:text-white">{order.dealer_name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{order.dealer_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Customer Contact</p>
                        <p className="text-sm font-semibold dark:text-white">{order.customer_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                        <p className="text-sm font-semibold dark:text-white">{order.city}, {order.pincode}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Accepted On</p>
                        <p className="text-sm font-semibold dark:text-white">{new Date(order.accepted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order.order_id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div>
                        <h4 className="font-semibold dark:text-white mb-2">Delivery Address</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{order.installation_address}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold dark:text-white mb-3 flex items-center gap-2">
                          <History className="w-4 h-4" />
                          Status History
                        </h4>
                        {order.status_history.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No status updates yet</p>
                        ) : (
                          <div className="space-y-3">
                            {order.status_history.map((history, idx) => (
                              <div key={idx} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className={`mt-1 ${getStatusColor(history.status)}`}>
                                  {getStatusIcon(history.status)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <p className="font-semibold text-sm dark:text-white">{history.status.replace(/_/g, ' ')}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">By: {history.updated_by_dealer_name}</p>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                      {new Date(history.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  {history.remarks && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 italic">"{history.remarks}"</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Amount</span>
                        <span className="text-lg font-bold dark:text-white">RS {order.total_amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
