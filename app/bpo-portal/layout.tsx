"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Headset, LayoutDashboard, LogOut, Menu, Phone, ShoppingCart, Ticket, Trash2, UserCircle, X } from "lucide-react";

interface PortalNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

const BPO_NAV_ITEMS = [
  {
    key: "dashboard",
    label: "BPO Dashboard",
    description: "Overview of services requests",
    href: "/bpo-portal",
    icon: LayoutDashboard,
  },
  {
    key: "requests",
    label: "Service Requests",
    description: "Requests from Services page only",
    href: "/bpo-portal/service-requests",
    icon: Ticket,
  },
  {
    key: "orders",
    label: "Orders",
    description: "Same order operations as Admin panel",
    href: "/bpo-portal/orders",
    icon: ShoppingCart,
  },
  {
    key: "profile",
    label: "Profile",
    description: "Update location and personal details",
    href: "/bpo-portal/profile",
    icon: UserCircle,
  },
  {
    key: "calls",
    label: "Calls",
    description: "Log and track customer call records",
    href: "/bpo-portal/calls",
    icon: Phone,
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "All portal notifications in one place",
    href: "/bpo-portal/notifications",
    icon: Bell,
  },
] as const;

function resolveBpoActionUrl(actionUrl?: string | null): string | null {
  if (!actionUrl) return null;

  if (actionUrl.startsWith('/bpo-portal')) return actionUrl;
  if (actionUrl.startsWith('/district-portal/service-support')) return '/bpo-portal/service-requests';
  if (actionUrl.startsWith('/district-portal/orders')) return '/bpo-portal/orders';
  if (actionUrl.startsWith('/district-portal')) return '/bpo-portal';
  if (actionUrl.startsWith('/admin/service')) return '/bpo-portal/service-requests';
  if (actionUrl.startsWith('/admin/orders')) return '/bpo-portal/orders';
  if (actionUrl.startsWith('/admin')) return '/bpo-portal';

  return actionUrl;
}

function BpoPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewerName, setViewerName] = useState("BPO Agent");
  const [viewerUniqueId, setViewerUniqueId] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const isPublicRoute = pathname === "/bpo-portal/login" || pathname === "/bpo-portal/register";

  useEffect(() => {
    const rawUser = localStorage.getItem("bpo_user");

    if (isPublicRoute) {
      if (rawUser) {
        router.push("/bpo-portal");
        return;
      }
      setIsReady(true);
      return;
    }

    if (!rawUser) {
      router.push("/bpo-portal/login");
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);
      const name = String(parsed?.full_name || "").trim();
      const uniqueId = String(parsed?.bpo_unique_id || "").trim();
      if (name) {
        setViewerName(name);
      }
      if (uniqueId) {
        setViewerUniqueId(uniqueId);
      }
      setIsReady(true);
    } catch {
      localStorage.removeItem("bpo_user");
      localStorage.removeItem("bpo_token");
      router.push("/bpo-portal/login");
    }
  }, [isPublicRoute, router]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/portal-notifications?portal=bpo", { cache: "no-store" });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch BPO notifications:", error);
    }
  };

  useEffect(() => {
    if (!isReady || isPublicRoute) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [isReady, isPublicRoute]);

  const markNotificationRead = async (notificationId: number) => {
    try {
      await fetch("/api/portal-notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark BPO notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const selected = notifications.find((notification) => notification.id === notificationId);
      await fetch(`/api/portal-notifications?notificationId=${notificationId}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
      if (selected && !selected.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete BPO notification:", error);
    }
  };

  const handleLogout = async () => {
    const rawUser = localStorage.getItem('bpo_user');
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        const userId = Number(parsed?.bpo_user_id);
        const fullName = String(parsed?.full_name || 'BPO Agent');

        if (Number.isFinite(userId) && userId > 0) {
          await fetch('/api/login-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'bpo',
              entityId: String(userId),
              entityName: fullName,
              portal: 'bpo',
              eventType: 'logout',
            }),
          });
        }
      } catch (error) {
        console.error('Failed to record BPO logout activity:', error);
      }
    }

    localStorage.removeItem('bpo_user');
    localStorage.removeItem('bpo_token');
    window.location.href = '/bpo-portal/login';
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">
        Loading BPO portal...
      </div>
    );
  }

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 bg-linear-to-br from-red-500 via-red-600 to-slate-900 px-5 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-red-100">BPO Portal</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Protechtur</h2>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-red-100 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-red-100">Logged in as</p>
            <p className="mt-1 text-lg font-black">{viewerName}</p>
            <p className="text-xs text-red-100/90">Services request operations</p>
            {viewerUniqueId ? (
              <p className="mt-1 text-[11px] font-black tracking-[0.08em] text-red-100">ID: {viewerUniqueId}</p>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Operations</p>
          <nav className="space-y-1">
            {BPO_NAV_ITEMS.map((item) => {
              const active = item.href === "/bpo-portal" ? pathname === "/bpo-portal" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`group flex items-start gap-3 rounded-2xl px-3 py-3 transition-all ${
                    active ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-red-700" : "text-slate-400 group-hover:text-slate-700"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{item.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

        </div>

        <div className="border-t border-slate-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Exit Portal
          </button>
        </div>
      </aside>

      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${sidebarOpen ? "lg:pl-72" : "lg:pl-0"}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen((open) => !open)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-slate-900">BPO Service Operations</p>
                <p className="truncate text-xs text-slate-500">Dedicated workflow for Services page requests</p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex">
              <Headset className="h-4 w-4 text-red-600" />
              <p className="text-xs font-semibold text-slate-700">BPO Agent: {viewerName}{viewerUniqueId ? ` (${viewerUniqueId})` : ''}</p>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen((open) => !open)}
                className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && <span className="text-xs font-semibold text-red-700">{unreadCount} unread</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-sm text-slate-500">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 12).map((notification) => (
                        <div
                          key={notification.id}
                          className={`cursor-pointer border-b border-slate-100 px-4 py-3 hover:bg-slate-50 ${
                            !notification.is_read ? "bg-red-50/40" : ""
                          }`}
                          onClick={() => {
                            if (!notification.is_read) {
                              markNotificationRead(notification.id);
                            }
                            const actionUrl = resolveBpoActionUrl(notification.action_url);
                            if (actionUrl) {
                              setIsNotificationOpen(false);
                              router.push(actionUrl);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                              <p className="mt-0.5 text-xs text-slate-600">{notification.message}</p>
                              <p className="mt-1 text-[11px] text-slate-400">{new Date(notification.created_at).toLocaleString("en-IN")}</p>
                            </div>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="text-slate-400 transition-colors hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    href="/bpo-portal/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="block border-t border-slate-200 px-4 py-3 text-center text-sm font-semibold text-red-700 hover:bg-slate-50"
                  >
                    See All Notifications
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <section className="px-4 py-4 sm:px-6 sm:py-6">{children}</section>
        </main>
      </div>
    </div>
  );
}

export default function BpoPortalLayout({ children }: { children: React.ReactNode }) {
  return <BpoPortalShell>{children}</BpoPortalShell>;
}
