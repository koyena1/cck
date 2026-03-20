"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ClipboardList, 
  MapPin, 
  UserCircle, 
  ShieldCheck,
  LogOut,
  Menu,
  X,
  DollarSign,
  History,
  FileText,
  Package,
  Bell,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  Zap,
  Headset
} from "lucide-react";
import { DealerAuthGuard } from "./DealerAuthGuard";

interface DealerInfo {
  dealer_id: number;
  full_name: string;
  business_name: string;
  email: string;
  phone?: string;
  address?: string;
  location?: string;
  gst_number?: string;
  status: string;
  unique_dealer_id?: string | null;
}

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

function DealerLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Desktop: open by default
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile: closed by default
  const [dealerInfo, setDealerInfo] = useState<DealerInfo | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node) &&
        mobileNotificationRef.current &&
        !mobileNotificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchNotifications = async () => {
      try {
        const dealerId = localStorage.getItem('dealerId');
        if (!dealerId) return;
        
        // Fetch regular notifications
        const notifResponse = await fetch(`/api/dealer/notifications?dealerId=${dealerId}`, { signal });
        if (!notifResponse.ok) {
          console.warn('Notifications API returned:', notifResponse.status);
          return;
        }
        const notifData = await notifResponse.json();
        
        // Fetch inventory data for stock notifications
        const inventoryResponse = await fetch(`/api/dealer-inventory?dealerId=${dealerId}`, { signal });
        if (!inventoryResponse.ok) {
          console.warn('Inventory API returned:', inventoryResponse.status);
          return;
        }
        const inventoryData = await inventoryResponse.json();
        
        let allNotifications: Notification[] = [];
        
        // Add regular notifications
        if (notifData.success) {
          allNotifications = [...(notifData.notifications || [])];
        }
        
        // Add stock notifications
        if (inventoryData.success) {
          const LOW_STOCK_THRESHOLD = 5;
          const inventory = inventoryData.inventory || [];
          
          // Out of stock items
          const outOfStock = inventory.filter((item: any) => item.quantity_available === 0);
          if (outOfStock.length > 0) {
            const gmvLoss = outOfStock.reduce((sum: number, item: any) => {
              return sum + (parseFloat(item.dealer_sale_price) || 0);
            }, 0);
            
            allNotifications.push({
              id: 'stock-out',
              dealer_id: parseInt(dealerId),
              title: 'Out of Stock Alert',
              message: `${outOfStock.length} ${outOfStock.length === 1 ? 'product is' : 'products are'} out of stock. Potential GMV loss: RS ${gmvLoss.toLocaleString('en-IN')}`,
              type: 'stock',
              priority: 'high',
              is_read: false,
              sent_via_email: false,
              email_sent_at: null,
              created_by: 'system',
              created_at: new Date().toISOString(),
              read_at: null
            });
          }
          
          // Low stock items
          const lowStock = inventory.filter((item: any) => 
            item.quantity_available > 0 && item.quantity_available < LOW_STOCK_THRESHOLD
          );
          if (lowStock.length > 0) {
            allNotifications.push({
              id: 'stock-low',
              dealer_id: parseInt(dealerId),
              title: 'Low Stock Warning',
              message: `${lowStock.length} ${lowStock.length === 1 ? 'product has' : 'products have'} low stock (below ${LOW_STOCK_THRESHOLD} units). Restock soon to avoid stockouts.`,
              type: 'stock',
              priority: 'medium',
              is_read: false,
              sent_via_email: false,
              email_sent_at: null,
              created_by: 'system',
              created_at: new Date().toISOString(),
              read_at: null
            });
          }
        }

        // Add order progress update reminders
        try {
          const acceptedRes = await fetch(`/api/dealer-order-response?dealerId=${dealerId}&status=accepted`, { signal });
          if (acceptedRes.ok) {
            const acceptedData = await acceptedRes.json();
            const accepted: any[] = acceptedData.success ? (acceptedData.requests || []) : [];
            const ordersNeedingUpdate: { order_number: string; hoursAgo: number | null }[] = [];
            await Promise.all(
              accepted.map(async (order: any) => {
                try {
                  const pRes = await fetch(`/api/dealer/order-progress?orderId=${order.order_id}`, { signal });
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
                id: 'order-update-needed',
                dealer_id: parseInt(dealerId),
                title: `${ordersNeedingUpdate.length === 1 ? '1 order needs' : `${ordersNeedingUpdate.length} orders need`} a progress update`,
                message: `Please post a progress update for: ${orderList}. Keeping customers informed builds trust.`,
                type: 'order-update',
                priority: 'high',
                is_read: false,
                sent_via_email: false,
                email_sent_at: null,
                created_by: 'system',
                created_at: new Date().toISOString(),
                read_at: null
              });
            }
          }
        } catch (_) { /* silent */ }

        // Sort by priority and date
        allNotifications.sort((a, b) => {
          // Priority order: high > medium > low
          const priorityOrder: any = { high: 3, medium: 2, low: 1 };
          const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then sort by date (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setNotifications(allNotifications);
        setUnreadCount(allNotifications.filter(n => !n.is_read).length);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dealer/dashboard" },
    { icon: ClipboardList, label: "Order Details", href: "/dealer/order-requests" },
    { icon: FileText, label: "Proforma", href: "/dealer/proforma" },
    { icon: Trophy, label: "Rewards", href: "/dealer/rewards" },
    // { icon: MapPin, label: "Service Areas", href: "/dealer/service-areas" },
    { icon: DollarSign, label: "Pricing", href: "/dealer/pricing" },
    { icon: Package, label: "Stock", href: "/dealer/stock" },
    { icon: UserCircle, label: "Dealer Profile", href: "/dealer/profile" },
  ];

  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        const dealerId = localStorage.getItem('dealerId');
        
        // If no dealer ID, don't redirect immediately - just log warning
        if (!dealerId) {
          console.warn('No dealer ID found in localStorage');
          return;
        }
        
        const response = await fetch(`/api/dealer/me?dealerId=${dealerId}`);
        const data = await response.json();
        
        if (data.success) {
          setDealerInfo(data.dealer);
        } else {
          console.error('Failed to fetch dealer info:', data.error);
        }
      } catch (error) {
        console.error('Failed to fetch dealer info:', error);
      }
    };

    fetchDealerInfo();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    // Clear any stored auth data and redirect to login page
    localStorage.removeItem('authToken');
    localStorage.removeItem('dealerId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const markAsRead = async (notificationId: number | string) => {
    try {
      // Handle synthetic notifications (stock, order-update, etc.) — no DB record
      if (typeof notificationId === 'string') {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      const dealerId = localStorage.getItem('dealerId');
      if (!dealerId) return;

      const response = await fetch('/api/dealer/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, dealerId: parseInt(dealerId) })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number | string) => {
    try {
      // Handle synthetic notifications (stock, order-update, etc.) — no DB record
      if (typeof notificationId === 'string') {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return;
      }

      const dealerId = localStorage.getItem('dealerId');
      if (!dealerId) return;

      const response = await fetch(`/api/dealer/notifications?notificationId=${notificationId}&dealerId=${dealerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'stock':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'order-update':
        return <Bell className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] overflow-hidden">
      {/* Header - Always visible with hamburger menu */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 z-50 shadow-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Hamburger Button - Mobile only */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-[#0f172a] to-slate-800 hover:from-slate-800 hover:to-[#0f172a] text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl relative group"
            title="Toggle menu"
          >
            <div className="relative">
              {isMobileMenuOpen ? (
                <X size={22} className="transition-transform duration-200 group-hover:rotate-90" />
              ) : (
                <Menu size={22} className="transition-transform duration-200 group-hover:scale-110" />
              )}
            </div>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-[#facc15] w-7 h-7 drop-shadow-md" />
            <span className="font-bold text-lg sm:text-xl tracking-tighter uppercase font-orbitron text-slate-900 dark:text-white">
              Dealer<span className="text-[#facc15]">.</span>
            </span>
          </div>
        </div>

        {/* Right Side - Mobile & Desktop */}
        <div className="flex items-center gap-2">
          {/* Service Support Shortcut - Mobile */}
          <Link
            href="/dealer/service-support"
            className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Service Support"
          >
            <Headset className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Link>

          {/* Notification Bell - Mobile (visible only on mobile) */}
          <div className="lg:hidden relative" ref={mobileNotificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-[70vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                            !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getTypeIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                  {notification.title}
                                </h4>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(notification.created_at)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="text-slate-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <Link
                      href="/dealer/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-sm font-semibold text-[#0f172a] dark:text-[#facc15] hover:underline block text-center"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

            {/* Dealer Info with dropdown */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/dealer/service-support"
                className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                title="Service Support"
              >
                <Headset className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </Link>

              {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Bell className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-[500px] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                              !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                            }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">{getTypeIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5"></div>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(notification.created_at)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="text-slate-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <Link
                        href="/dealer/notifications"
                        onClick={() => setIsNotificationOpen(false)}
                        className="text-sm font-semibold text-[#0f172a] dark:text-[#facc15] hover:underline block text-center"
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#facc15] to-yellow-500 flex items-center justify-center text-[#0f172a] font-bold text-sm shadow-md">
                    {dealerInfo ? getInitials(dealerInfo.full_name) : 'D'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                        {dealerInfo?.full_name || 'Loading...'}
                      </p>
                      {dealerInfo?.unique_dealer_id && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-yellow-400 text-slate-900 border border-yellow-500 shrink-0">
                          #{dealerInfo.unique_dealer_id}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      {dealerInfo?.business_name || 'Dealer'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                    <Link
                      href="/dealer/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      My Profile
                    </Link>
                    <div className="border-t border-slate-200 dark:border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      </header>

      {/* Sidebar - Icon-only on desktop, slide-in on mobile */}
      <aside className={`
        fixed left-0 bg-[#0f172a] text-white flex flex-col z-40 border-r border-slate-800/60
        w-64 md:w-16 shadow-2xl
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `} style={{ top: '64px', height: 'calc(100vh - 64px)' }}>

        {/* ── Desktop: Icon-only sidebar ── */}
        <div className="hidden md:flex flex-col h-full">
          {/* Nav Items */}
          <nav className="flex-1 flex flex-col items-center pt-3 gap-0.5 overflow-visible">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center justify-center w-full h-12 group"
                >
                  {/* Hover / Active background pill */}
                  <span className={`absolute inset-x-2 inset-y-1 rounded-xl transition-all duration-200 ${
                    isActive ? "bg-slate-700/70" : "group-hover:bg-slate-800/50"
                  }`} />

                  {/* Icon */}
                  <item.icon size={20} className={`relative z-10 transition-colors duration-200 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`} />

                  {/* Right active indicator bar */}
                  {isActive && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-white rounded-l-full z-10" />
                  )}

                  {/* Tooltip */}
                  <span className="absolute left-[calc(100%+6px)] bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/50 z-50 font-medium font-poppins">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom: Profile + Logout */}
          <div className="flex flex-col items-center pb-4 gap-0.5">
            {/* Profile avatar with notification badge */}
            <Link
              href="/dealer/profile"
              className="relative flex items-center justify-center w-full h-12 group"
            >
              <span className="absolute inset-x-2 inset-y-1 rounded-xl group-hover:bg-slate-800/50 transition-all duration-200" />
              <div className="relative z-10 w-8 h-8 rounded-full bg-gradient-to-br from-[#facc15] to-yellow-500 flex items-center justify-center text-[#0f172a] font-bold text-xs shadow-md border-2 border-slate-700 group-hover:border-yellow-400/60 transition-all">
                {dealerInfo ? getInitials(dealerInfo.full_name) : 'D'}
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="absolute left-[calc(100%+6px)] bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/50 z-50 font-medium font-poppins">
                {dealerInfo?.full_name || 'Profile'}
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="relative flex items-center justify-center w-full h-10 group"
            >
              <span className="absolute inset-x-2 inset-y-1 rounded-xl group-hover:bg-red-500/10 transition-all duration-200" />
              <LogOut size={18} className="relative z-10 text-slate-500 group-hover:text-red-400 transition-colors" />
              <span className="absolute left-[calc(100%+6px)] bg-[#1e293b] text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap pointer-events-none shadow-xl border border-slate-700/50 z-50 font-medium font-poppins">
                Logout
              </span>
            </button>
          </div>
        </div>

        {/* ── Mobile: Full sidebar with labels ── */}
        <div className="md:hidden w-64 h-full flex flex-col">
          {/* Navigation Section */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                    ? "bg-[#facc15] text-[#0f172a] font-bold shadow-lg shadow-[#facc15]/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon size={20} className={isActive ? "text-[#0f172a]" : "group-hover:text-[#facc15] transition-colors"} />
                  <span className="font-poppins text-sm tracking-wide font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Footer */}
          <div className="p-4 border-t border-slate-700 bg-[#0a1120] shrink-0">
            <div className="mb-3 px-3 flex items-center gap-3 py-2.5 bg-slate-900/50 rounded-lg border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-[#facc15] flex items-center justify-center text-[#0f172a] font-bold text-sm shrink-0 shadow-md">
                {dealerInfo ? getInitials(dealerInfo.full_name) : 'D'}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-white truncate font-poppins font-semibold">
                    {dealerInfo?.full_name || 'Loading...'}
                  </p>
                  {dealerInfo?.unique_dealer_id && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-yellow-400 text-slate-900 border border-yellow-500 shrink-0">
                      #{dealerInfo.unique_dealer_id}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {dealerInfo?.business_name || 'Dealer Center'}
                </p>
                {(dealerInfo?.location || dealerInfo?.address) && (
                  <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                    <MapPin className="inline w-3 h-3" />
                    {dealerInfo?.location || dealerInfo?.address}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 px-4 py-3 text-slate-300 hover:text-red-400 hover:bg-red-400/10 rounded-lg w-full transition-all group font-semibold text-sm border border-transparent hover:border-red-400/20"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen h-screen overflow-hidden pt-16 md:ml-16 md:pl-3">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}        <div className="h-full overflow-y-auto overflow-x-hidden overscroll-contain smooth-scroll" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' } as React.CSSProperties}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DealerAuthGuard>
      <DealerLayoutContent>{children}</DealerLayoutContent>
    </DealerAuthGuard>
  )
}