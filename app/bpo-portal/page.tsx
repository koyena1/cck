"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ShoppingCart, Ticket, UserCircle } from "lucide-react";

export default function BpoPortalPage() {
  const [viewerName, setViewerName] = useState("BPO Agent");
  const [serviceRequestCount, setServiceRequestCount] = useState<number | null>(null);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [callsCount, setCallsCount] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("bpo_user");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const name = String(parsed?.full_name || "").trim();
      if (name) {
        setViewerName(name);
      }
    } catch {
      // ignore invalid local storage state
    }

    const loadCounts = async () => {
      try {
        const parsedUser = (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        })();
        const userId = Number(parsedUser?.bpo_user_id);

        const [supportRes, orderRes, callsRes] = await Promise.all([
          fetch("/api/support/tickets?viewer=bpo&source=services_portal", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" }),
          Number.isFinite(userId) && userId > 0
            ? fetch(`/api/bpo/calls?bpoUserId=${userId}`, { cache: "no-store" })
            : Promise.resolve(null),
        ]);

        const supportData = await supportRes.json();
        const orderData = await orderRes.json();
        const callsData = callsRes ? await callsRes.json() : null;

        if (supportData.success) setServiceRequestCount((supportData.tickets || []).length);
        if (orderData.success) setOrdersCount((orderData.orders || []).length);
        if (callsData?.success) setCallsCount((callsData.calls || []).length);
      } catch {
        // keep placeholders when API fails
      }
    };

    loadCounts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-600">BPO Dashboard</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Welcome, {viewerName}</h1>
        <p className="mt-1 text-sm text-slate-500">Quick overview of your main BPO sections.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Service Requests</span>
              <Ticket className="h-4 w-4 text-red-600" />
            </CardTitle>
            <CardDescription>Services-page tickets and dealer assignment flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-black text-slate-900">{serviceRequestCount !== null ? String(serviceRequestCount).padStart(2, '0') : '--'}</p>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/bpo-portal/service-requests">Open Service Requests</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Orders</span>
              <ShoppingCart className="h-4 w-4 text-red-600" />
            </CardTitle>
            <CardDescription>Order operations mirror Admin and District workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-black text-slate-900">{ordersCount !== null ? String(ordersCount).padStart(2, '0') : '--'}</p>
            <Button asChild variant="outline">
              <Link href="/bpo-portal/orders">Open Orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Calls</span>
              <Phone className="h-4 w-4 text-red-600" />
            </CardTitle>
            <CardDescription>Customer call logs and follow-up tracking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-black text-slate-900">{callsCount !== null ? String(callsCount).padStart(2, '0') : '--'}</p>
            <Button asChild variant="outline">
              <Link href="/bpo-portal/calls">Open Calls</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Profile</span>
              <UserCircle className="h-4 w-4 text-red-600" />
            </CardTitle>
            <CardDescription>Update your BPO profile and contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-black text-slate-900">ME</p>
            <Button asChild variant="outline">
              <Link href="/bpo-portal/profile">Open Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
