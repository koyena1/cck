"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ExternalLink, RefreshCw, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function BpoNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const loadNotifications = async (withSpinner = false) => {
    if (withSpinner) setRefreshing(true);
    try {
      const response = await fetch("/api/portal-notifications?portal=bpo", { cache: "no-store" });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
      if (withSpinner) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(() => loadNotifications(), 10000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (notificationId: number) => {
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
  };

  const deleteNotification = async (notificationId: number) => {
    await fetch(`/api/portal-notifications?notificationId=${notificationId}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((notification) => !notification.is_read);
    await Promise.all(unread.map((notification) => markRead(notification.id)));
  };

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.is_read).length, [notifications]);
  const visible = useMemo(() => {
    if (filter === "unread") return notifications.filter((notification) => !notification.is_read);
    return notifications;
  }, [filter, notifications]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-slate-500">
        <RefreshCw className="h-4 w-4 animate-spin" /> Loading notifications...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <Bell className="h-6 w-6 text-red-600" />
            BPO Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">Complete notification feed for BPO operations.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => loadNotifications(true)} disabled={refreshing}>
            {refreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" className="w-full sm:w-auto" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-1 h-4 w-4" /> Mark All Read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            filter === "all" ? "border-red-300 bg-red-100 text-red-700" : "border-slate-200 bg-white text-slate-600"
          }`}
          onClick={() => setFilter("all")}
        >
          All ({notifications.length})
        </button>
        <button
          className={`rounded-full border px-3 py-1 text-xs font-bold ${
            filter === "unread" ? "border-amber-300 bg-amber-100 text-amber-700" : "border-slate-200 bg-white text-slate-600"
          }`}
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base">Notification Feed</CardTitle>
          <CardDescription>Shows all notifications, auto-refreshing every 10 seconds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {visible.length === 0 ? (
            <div className="py-10 text-center text-slate-400">No notifications found.</div>
          ) : (
            visible.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border p-3 ${
                  notification.is_read ? "border-slate-200 bg-white" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 wrap-break-word">{notification.title}</p>
                      {!notification.is_read && <Badge className="bg-red-600 text-white text-[10px]">Unread</Badge>}
                      <Badge variant="outline" className="text-[10px]">{notification.priority || "normal"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{new Date(notification.created_at).toLocaleString("en-IN")}</p>
                  </div>

                  <div className="flex w-full shrink-0 flex-wrap items-center gap-1 sm:w-auto sm:justify-end">
                    {!notification.is_read && (
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => markRead(notification.id)}>
                        Read
                      </Button>
                    )}
                    {notification.action_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          if (!notification.is_read) {
                            markRead(notification.id);
                          }
                          const actionUrl = resolveBpoActionUrl(notification.action_url);
                          if (actionUrl) {
                            router.push(actionUrl);
                          }
                        }}
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 w-full sm:w-auto"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
