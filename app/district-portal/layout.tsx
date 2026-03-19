"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Boxes,
  Clock3,
  Headset,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Moon,
  ShoppingCart,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";

type ThemeMode = "light" | "dark";

interface DistrictUser {
  district_user_id: number;
  username: string;
  email?: string;
  full_name: string;
  district: string;
  state: string;
}

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

const DISTRICT_NAV_ITEMS = [
  {
    key: "overview",
    label: "Dashboard",
    description: "Overview and district summary",
    href: "/district-portal/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "dealers",
    label: "Dealer Management",
    description: "Approvals, dealers, and proformas",
    href: "/district-portal/dashboard?tab=dealers",
    icon: Users,
  },
  {
    key: "requests",
    label: "Dealer Requests",
    description: "Pending dealer responses",
    href: "/district-portal/dashboard?tab=requests",
    icon: Clock3,
  },
  {
    key: "orders",
    label: "Orders",
    description: "Track, assign, and manage orders",
    href: "/district-portal/orders",
    icon: ShoppingCart,
  },
  {
    key: "stock",
    label: "Stock",
    description: "District stock and email alerts",
    href: "/district-portal/stock",
    icon: Boxes,
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "All district alerts and updates",
    href: "/district-portal/notifications",
    icon: Bell,
  },
  {
    key: "service",
    label: "Service Support",
    description: "Customer support and dealer follow-up",
    href: "/district-portal/service-support",
    icon: Headset,
  },
] as const;

function DistrictPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<DistrictUser | null>(null);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const notificationRef = useRef<HTMLDivElement>(null);

  const isPublicRoute = pathname === "/district-portal" || pathname === "/district-portal/login";
  const activeDashboardTab = searchParams.get("tab") || "overview";

  useEffect(() => {
    if (isPublicRoute) {
      setIsReady(true);
      return;
    }

    const rawUser = localStorage.getItem("district_user");
    if (!rawUser) {
      router.push("/district-portal/login");
      return;
    }

    try {
      setUser(JSON.parse(rawUser));
      setIsReady(true);
    } catch {
      localStorage.removeItem("district_user");
      localStorage.removeItem("district_token");
      router.push("/district-portal/login");
    }
  }, [isPublicRoute, router]);

  useEffect(() => {
    if (!isReady) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isReady]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("districtTheme") as ThemeMode | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("districtTheme", theme);
  }, [theme]);

  const fetchNotifications = async (district: string) => {
    try {
      const response = await fetch(
        `/api/portal-notifications?portal=district&recipientKey=${encodeURIComponent(district)}`
      );
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch district notifications:", error);
    }
  };

  useEffect(() => {
    if (!user?.district || isPublicRoute) return;
    fetchNotifications(user.district);
    const interval = setInterval(() => fetchNotifications(user.district), 10000);
    return () => clearInterval(interval);
  }, [isPublicRoute, user?.district]);

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
      console.error("Failed to mark district notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const existing = notifications.find((notification) => notification.id === notificationId);
      await fetch(`/api/portal-notifications?notificationId=${notificationId}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
      if (existing && !existing.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to delete district notification:", error);
    }
  };

  const pageMeta = useMemo(() => {
    if (pathname.startsWith("/district-portal/orders")) {
      return {
        title: "District Orders",
        subtitle: "Full order tracking, reassignment, and progress visibility.",
      };
    }
    if (pathname.startsWith("/district-portal/stock")) {
      return {
        title: "District Stock",
        subtitle: "Monitor dealer inventory, urgency, and stock alert emails.",
      };
    }
    if (pathname.startsWith("/district-portal/notifications")) {
      return {
        title: "Notifications",
        subtitle: "Live district notifications and action alerts.",
      };
    }
    if (pathname.startsWith("/district-portal/service-support")) {
      return {
        title: "Service Support",
        subtitle: "Handle customer tickets and coordinate dealer resolution.",
      };
    }
    if (pathname.startsWith("/district-portal/proforma")) {
      return {
        title: "Dealer Proformas",
        subtitle: "Opened from dealer management for district-level review and edits.",
      };
    }
    if (pathname.startsWith("/district-portal/dashboard") && activeDashboardTab === "dealers") {
      return {
        title: "Dealer Management",
        subtitle: "Approve dealers, inspect records, and open proformas.",
      };
    }
    if (pathname.startsWith("/district-portal/dashboard") && activeDashboardTab === "requests") {
      return {
        title: "Dealer Requests",
        subtitle: "Review request queues and district follow-up work.",
      };
    }
    return {
      title: "District Dashboard",
      subtitle: "Organized district operations across dealers, stock, and orders.",
    };
  }, [activeDashboardTab, pathname]);

  const isActiveNav = (key: (typeof DISTRICT_NAV_ITEMS)[number]["key"]) => {
    if (key === "overview") {
      return pathname === "/district-portal/dashboard" && activeDashboardTab === "overview";
    }
    if (key === "dealers") {
      return (
        (pathname === "/district-portal/dashboard" && activeDashboardTab === "dealers") ||
        pathname.startsWith("/district-portal/proforma")
      );
    }
    if (key === "requests") {
      return pathname === "/district-portal/dashboard" && activeDashboardTab === "requests";
    }
    if (key === "orders") {
      return pathname.startsWith("/district-portal/orders");
    }
    if (key === "stock") {
      return pathname.startsWith("/district-portal/stock");
    }
    if (key === "notifications") {
      return pathname.startsWith("/district-portal/notifications");
    }
    if (key === "service") {
      return pathname.startsWith("/district-portal/service-support");
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem("district_user");
    localStorage.removeItem("district_token");
    router.push("/district-portal/login");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-300">
        <div className="text-center">
          <MapPinned className="mx-auto mb-3 h-8 w-8 animate-pulse text-blue-600" />
          <p className="text-sm font-medium">Loading district portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/45 dark:bg-black/65 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-200 bg-linear-to-br from-blue-600 via-blue-700 to-slate-900 px-5 py-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-100">District Portal</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Protechtur</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-blue-100 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-blue-100">Managing District</p>
            <p className="mt-1 text-lg font-black">{user.district}</p>
            <p className="text-xs text-blue-100/90">{user.full_name} · {user.username}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Operations
          </p>
          <nav className="space-y-1">
            {DISTRICT_NAV_ITEMS.map((item) => {
              const active = isActiveNav(item.key);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-start gap-3 rounded-2xl px-3 py-3 transition-all ${
                    active
                      ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/40"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-blue-700 dark:text-blue-300" : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{item.label}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Organization</p>
            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Use the sidebar as the primary navigation.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Dealer approvals and requests stay under Dashboard. Orders and Stock now live in dedicated sections.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${
          sidebarOpen ? "lg:pl-72" : "lg:pl-0"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen((open) => !open)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-slate-900 dark:text-slate-100">{pageMeta.title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{pageMeta.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen((open) => !open)}
                  className="relative rounded-xl border border-slate-200 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                  <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
                      {unreadCount > 0 && <span className="text-xs font-semibold text-blue-700">{unreadCount} unread</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                      ) : (
                        notifications.slice(0, 12).map((notification) => (
                          <div
                            key={notification.id}
                            className={`cursor-pointer border-b border-slate-100 px-4 py-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70 ${
                              !notification.is_read ? "bg-blue-50/50 dark:bg-blue-500/10" : ""
                            }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                markNotificationRead(notification.id);
                              }
                              if (notification.action_url) {
                                setIsNotificationOpen(false);
                                router.push(notification.action_url);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                  {new Date(notification.created_at).toLocaleString("en-IN")}
                                </p>
                              </div>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-slate-400 transition-colors hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 sm:block dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.full_name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.district}, {user.state}</p>
              </div>
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

export default function DistrictPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-950 dark:text-slate-300">
          <div className="text-center">
            <MapPinned className="mx-auto mb-3 h-8 w-8 animate-pulse text-blue-600" />
            <p className="text-sm font-medium">Loading district portal...</p>
          </div>
        </div>
      }
    >
      <DistrictPortalShell>{children}</DistrictPortalShell>
    </Suspense>
  );
}