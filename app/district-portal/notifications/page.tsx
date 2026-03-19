"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  RefreshCw,
  Trash2,
  CheckCheck,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DistrictUser {
  district: string;
  full_name: string;
}

interface PortalNotification {
  id: number;
  portal: string;
  recipient_key: string | null;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  action_url?: string | null;
  created_at: string;
}

function iconForType(type: string) {
  const value = (type || "").toLowerCase();
  if (value.includes("error") || value.includes("alert")) return <AlertTriangle className="w-4 h-4 text-red-500" />;
  if (value.includes("success")) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  return <Info className="w-4 h-4 text-blue-500" />;
}

export default function DistrictNotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<DistrictUser | null>(null);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async (showRefreshing = false) => {
    if (!user?.district) return;
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(
        `/api/portal-notifications?portal=district&recipientKey=${encodeURIComponent(user.district)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("district_user");
    if (!raw) {
      router.push("/district-portal/login");
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setUser(parsed);
    } catch {
      localStorage.removeItem("district_user");
      localStorage.removeItem("district_token");
      router.push("/district-portal/login");
    }
  }, [router]);

  useEffect(() => {
    if (!user?.district) return;
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 10000);
    return () => clearInterval(interval);
  }, [user?.district]);

  const markRead = async (notificationId: number) => {
    await fetch("/api/portal-notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId }),
    });

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const deleteNotification = async (notificationId: number) => {
    await fetch(`/api/portal-notifications?notificationId=${notificationId}`, {
      method: "DELETE",
    });
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => markRead(n.id)));
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
  const visible = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.is_read);
    return notifications;
  }, [notifications, filter]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-slate-500 dark:text-slate-300">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading notifications...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            <Bell className="w-6 h-6 text-blue-600" />
            District Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Real-time notifications for {user?.district || "your district"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchNotifications(true)} disabled={refreshing}>
            {refreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
          <Button size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4 mr-1" /> Mark All Read
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded-full text-xs font-bold border ${filter === "all" ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700" : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"}`}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-bold border ${filter === "unread" ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700" : "bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600"}`}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Feed</CardTitle>
          <CardDescription>Auto-refreshes every 10 seconds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {visible.length === 0 ? (
            <div className="text-center text-slate-400 py-10">No notifications found.</div>
          ) : (
            visible.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border p-3 ${notification.is_read ? "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700" : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <div className="mt-0.5">{iconForType(notification.type)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{notification.title}</p>
                        {!notification.is_read && (
                          <Badge className="bg-blue-600 text-white text-[10px]">Unread</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {notification.priority || "normal"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        {new Date(notification.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.is_read && (
                      <Button variant="outline" size="sm" onClick={() => markRead(notification.id)}>
                        Read
                      </Button>
                    )}
                    {notification.action_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!notification.is_read) markRead(notification.id);
                          router.push(notification.action_url as string);
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
