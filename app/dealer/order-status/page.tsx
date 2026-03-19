"use client";

import { useState, useEffect } from "react";
import { Truck, Package, CheckCircle, Clock, AlertCircle, MapPin, Phone, Calendar, ChevronDown, ChevronUp } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  installation_address: string;
  pincode: string;
  city: string;
  total_amount: number;
  status: string;
  accepted_at: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  order_items: Array<{
    item_name: string;
    product_code?: string;
    quantity: number;
    unit_price: number;
  }>;
}

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const [statusRemarks, setStatusRemarks] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const storedDealerId = localStorage.getItem('dealerId');
    if (storedDealerId) {
      const dId = parseInt(storedDealerId);
      setDealerId(dId);
      fetchOrders(dId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (dId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dealer/orders?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        console.error('Failed to fetch orders:', data.error);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    if (!dealerId) return;

    setUpdatingOrder(orderId);
    try {
      const response = await fetch('/api/dealer/update-order-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          dealerId,
          status: newStatus,
          remarks: statusRemarks[orderId] || ''
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh orders
        await fetchOrders(dealerId);
        // Clear remarks
        setStatusRemarks(prev => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
      } else {
        alert('Failed to update status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
    setUpdatingOrder(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'Allocated': { label: 'Confirmed', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      'In_Transit': { label: 'In Transit', className: 'bg-purple-100 text-purple-800 border-purple-300' },
      'Delivered': { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-300' },
      'Installation_Pending': { label: 'Ready to Install', className: 'bg-orange-100 text-orange-800 border-orange-300' },
      'Completed': { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
    return <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Allocated': return <Clock className="w-5 h-5 text-blue-600" />;
      case 'In_Transit': return <Truck className="w-5 h-5 text-purple-600" />;
      case 'Delivered': return <Package className="w-5 h-5 text-green-600" />;
      case 'Installation_Pending': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'Completed': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    const flowMap: { [key: string]: string[] } = {
      'Allocated': ['In_Transit'],
      'In_Transit': ['Delivered'],
      'Delivered': ['Installation_Pending', 'Completed'],
      'Installation_Pending': ['Completed'],
      'Completed': []
    };
    return flowMap[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f172a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="p-4 sm:p-6 lg:p-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-orbitron text-[#0f172a]">Order Status Management</h1>
          <p className="text-gray-600 mt-2 font-poppins">Track and update delivery status for your accepted orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Found</h3>
              <p className="text-gray-500">You haven't accepted any orders yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.order_id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <CardTitle className="text-lg font-orbitron">{order.order_number}</CardTitle>
                        <CardDescription className="font-poppins">{order.customer_name}</CardDescription>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Contact</p>
                        <p className="text-sm font-semibold">{order.customer_phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="text-sm font-semibold">{order.city}, {order.pincode}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-500 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500">Accepted</p>
                        <p className="text-sm font-semibold">{new Date(order.accepted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order.order_id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Delivery Address</h4>
                        <p className="text-sm text-gray-700">{order.installation_address}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Order Items</h4>
                        <div className="space-y-1">
                          {order.order_items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>
                                {item.item_name}
                                {item.product_code ? ` (${item.product_code})` : ''} x{item.quantity}
                              </span>
                              <span className="font-semibold">
                                {Number(item.unit_price) > 0 ? `RS ${Number(item.unit_price).toLocaleString('en-IN')}` : 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t font-bold">
                          <span>Total Amount</span>
                          <span>
                            RS {order.order_items.reduce((sum, item) => {
                              const price = Number(item.unit_price || 0);
                              return sum + (price > 0 ? price * Number(item.quantity || 0) : 0);
                            }, 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {getNextStatuses(order.status).length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3">Update Status</h4>
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Add remarks (optional)"
                              value={statusRemarks[order.order_id] || ''}
                              onChange={(e) => setStatusRemarks(prev => ({ ...prev, [order.order_id]: e.target.value }))}
                              className="min-h-[60px]"
                            />
                            <div className="flex flex-wrap gap-2">
                              {getNextStatuses(order.status).map((nextStatus) => (
                                <Button
                                  key={nextStatus}
                                  onClick={() => handleStatusUpdate(order.order_id, nextStatus)}
                                  disabled={updatingOrder === order.order_id}
                                  className="bg-[#0f172a] hover:bg-[#1e293b] text-white"
                                >
                                  {updatingOrder === order.order_id ? 'Updating...' : `Mark as ${nextStatus.replace(/_/g, ' ')}`}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {order.status === 'Completed' && (
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-green-800 font-semibold">Order Completed Successfully!</p>
                        </div>
                      )}
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
