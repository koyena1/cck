"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  Mail,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  RefreshCw,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: number | string;
  dealer_id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  sent_via_email: boolean;
  email_sent_at: string | null;
  created_by: string;
  created_at: string;
  read_at: string | null;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

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
      
      await fetchNotifications(dId);
      
      setLoading(false);
    };

    initializePage();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      const storedDealerId = localStorage.getItem('dealerId');
      if (storedDealerId) {
        fetchNotifications(parseInt(storedDealerId));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (dId: number) => {
    try {
      let allNotifications: Notification[] = [];

      // 1) DB notifications from admin
      const response = await fetch(`/api/dealer/notifications?dealerId=${dId}`);
      const data = await response.json();
      if (data.success) {
        allNotifications = [...(data.notifications || [])];
      }

      // 2) Synthetic stock notifications
      try {
        const invRes = await fetch(`/api/dealer-inventory?dealerId=${dId}`);
        if (invRes.ok) {
          const invData = await invRes.json();
          if (invData.success) {
            const LOW_STOCK_THRESHOLD = 5;
            const inventory = invData.inventory || [];
            const outOfStock = inventory.filter((item: any) => item.quantity_available === 0);
            if (outOfStock.length > 0) {
              const gmvLoss = outOfStock.reduce((s: number, i: any) => s + (parseFloat(i.dealer_sale_price) || 0), 0);
              allNotifications.push({
                id: 'stock-out', dealer_id: dId,
                title: 'Out of Stock Alert',
                message: `${outOfStock.length} ${outOfStock.length === 1 ? 'product is' : 'products are'} out of stock. Potential GMV loss: RS ${gmvLoss.toLocaleString('en-IN')}`,
                type: 'stock', priority: 'high', is_read: false,
                sent_via_email: false, email_sent_at: null, created_by: 'system',
                created_at: new Date().toISOString(), read_at: null
              });
            }
            const lowStock = inventory.filter((i: any) => i.quantity_available > 0 && i.quantity_available < LOW_STOCK_THRESHOLD);
            if (lowStock.length > 0) {
              allNotifications.push({
                id: 'stock-low', dealer_id: dId,
                title: 'Low Stock Warning',
                message: `${lowStock.length} ${lowStock.length === 1 ? 'product has' : 'products have'} low stock (below ${LOW_STOCK_THRESHOLD} units). Restock soon to avoid stockouts.`,
                type: 'stock', priority: 'medium', is_read: false,
                sent_via_email: false, email_sent_at: null, created_by: 'system',
                created_at: new Date().toISOString(), read_at: null
              });
            }
          }
        }
      } catch (_) { /* silent */ }

      // 3) Synthetic order-progress update reminders
      try {
        const accRes = await fetch(`/api/dealer-order-response?dealerId=${dId}&status=accepted`);
        if (accRes.ok) {
          const accData = await accRes.json();
          const accepted: any[] = accData.success ? (accData.requests || []) : [];
          const ordersNeedingUpdate: { order_number: string; hoursAgo: number | null }[] = [];
          await Promise.all(
            accepted.map(async (order: any) => {
              try {
                const pRes = await fetch(`/api/dealer/order-progress?orderId=${order.order_id}`);
                if (!pRes.ok) return;
                const pData = await pRes.json();
                const updates: any[] = pData.updates || [];
                if (updates.some((u: any) => u.is_delivery_done)) return;
                if (updates.length === 0) {
                  ordersNeedingUpdate.push({ order_number: order.order_number, hoursAgo: null });
                } else {
                  const last = updates[updates.length - 1];
                  const hoursAgo = (Date.now() - new Date(last.created_at).getTime()) / 3600000;
                  if (hoursAgo >= 20) ordersNeedingUpdate.push({ order_number: order.order_number, hoursAgo: Math.round(hoursAgo) });
                }
              } catch (_) { /* silent */ }
            })
          );
          if (ordersNeedingUpdate.length > 0) {
            const orderList = ordersNeedingUpdate
              .map(o => o.hoursAgo === null ? `${o.order_number} (no update yet)` : `${o.order_number} (${o.hoursAgo}h ago)`)
              .join(', ');
            allNotifications.push({
              id: 'order-update-needed', dealer_id: dId,
              title: `${ordersNeedingUpdate.length === 1 ? '1 order needs' : `${ordersNeedingUpdate.length} orders need`} a progress update`,
              message: `Please post a progress update for: ${orderList}. Keeping customers informed builds trust.`,
              type: 'order-update', priority: 'high', is_read: false,
              sent_via_email: false, email_sent_at: null, created_by: 'system',
              created_at: new Date().toISOString(), read_at: null
            });
          }
        }
      } catch (_) { /* silent */ }

      // Sort: priority high→low, then newest first
      const priorityOrder: any = { high: 3, medium: 2, normal: 1, low: 0 };
      allNotifications.sort((a, b) => {
        const pd = (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
        if (pd !== 0) return pd;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number | string) => {
    if (!dealerId) return;
    // Synthetic notifications — update local state only
    if (typeof notificationId === 'string') {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    try {
      const response = await fetch('/api/dealer/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, dealerId })
      });
      const data = await response.json();
      if (data.success) { fetchNotifications(dealerId); }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number | string) => {
    if (!dealerId) return;
    // Synthetic notifications — remove from local state only
    if (typeof notificationId === 'string') {
      const removed = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (removed && !removed.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    try {
      const response = await fetch(`/api/dealer/notifications?notificationId=${notificationId}&dealerId=${dealerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        fetchNotifications(dealerId);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!dealerId) return;
    const unreadNotifications = notifications.filter(n => !n.is_read);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'stock':
        return <Package className="w-5 h-5 text-orange-600" />;
      case 'order-update':
        return <Bell className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950';
      case 'stock':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'order-update':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: any = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      normal: 'bg-blue-100 text-blue-700 border-blue-300',
      low: 'bg-slate-100 text-slate-700 border-slate-300'
    };
    
    return (
      <Badge variant="outline" className={`${colors[priority] || colors.normal} font-bold text-xs`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Notifications
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Stay updated with alerts and messages from admin
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            variant="outline"
            size="sm"
            className="font-semibold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'all' ? 'bg-[#0f172a] hover:bg-slate-800' : ''}
            >
              All ({notifications.length})
            </Button>
            <Button
              onClick={() => setFilter('unread')}
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'unread' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              onClick={() => setFilter('read')}
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              className={filter === 'read' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
          <CardTitle className="font-black text-slate-900 dark:text-slate-100">Your Notifications</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <RefreshCw className="w-16 h-16 mx-auto mb-4 opacity-20 animate-spin" />
              <p className="font-semibold">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 border-l-4 transition-all ${getTypeColor(notification.type)} ${
                    !notification.is_read ? 'bg-opacity-100' : 'bg-opacity-40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-bold text-lg ${!notification.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                              {notification.title}
                            </h3>
                            {!notification.is_read && (
                              <Badge className="bg-[#facc15] text-[#0f172a] hover:bg-yellow-400">
                                NEW
                              </Badge>
                            )}
                            {getPriorityBadge(notification.priority)}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {formatDate(notification.created_at)}
                            {notification.sent_via_email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                Emailed
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <p className={`text-sm whitespace-pre-wrap ${!notification.is_read ? 'text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {!notification.is_read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mark as read
                          </Button>
                        )}
                        <Button
                          onClick={() => deleteNotification(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
