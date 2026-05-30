"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SupportInbox } from "@/components/support-inbox";

export default function DealerServiceSupportPage() {
  const [dealerId, setDealerId] = useState<number | undefined>(undefined);
  const [dealerName, setDealerName] = useState("Dealer");
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStatus, setActiveStatus] = useState("all");

  const urlStatus = useMemo(() => {
    const raw = searchParams?.get("status") || "all";
    return raw.trim().toLowerCase().replace(/\s+/g, "_");
  }, [searchParams]);

  useEffect(() => {
    const storedDealerId = localStorage.getItem("dealerId");
    const storedName = localStorage.getItem("userName");

    if (storedDealerId) {
      const parsed = Number(storedDealerId);
      if (Number.isFinite(parsed) && parsed > 0) {
        setDealerId(parsed);
      }
    }

    if (storedName) {
      setDealerName(storedName);
    }
  }, []);

  useEffect(() => {
    setActiveStatus(urlStatus || "all");
  }, [urlStatus]);

  const applyStatusFilter = (status: string) => {
    const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");
    const nextStatus = normalized || "all";
    if (nextStatus === activeStatus) {
      return;
    }
    setActiveStatus(nextStatus);
    const params = new URLSearchParams(searchParams?.toString());
    if (!nextStatus || nextStatus === "all") {
      params.delete("status");
    } else {
      params.set("status", nextStatus);
    }
    const query = params.toString();
    if (typeof window !== "undefined") {
      const nextUrl = query ? `/dealer/service-support?${query}` : "/dealer/service-support";
      window.history.replaceState(null, "", nextUrl);
    }
  };

  const handleTicketsLoaded = (tickets: any[]) => {
    const normalized = tickets.map((ticket) => String(ticket.status || "").toLowerCase());
    setTicketStats({
      total: tickets.length,
      inProgress: normalized.filter((status) => status === "in_progress" || status === "open").length,
      resolved: normalized.filter((status) => status === "resolved").length,
      closed: normalized.filter((status) => status === "closed").length,
    });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => applyStatusFilter("all")}
          className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
            activeStatus === "all" ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Claim</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ticketStats.total.toString().padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-slate-500">All claims</p>
        </button>

        <button
          type="button"
          onClick={() => applyStatusFilter("in_progress")}
          className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
            activeStatus === "in_progress" ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">In Progress Claim</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ticketStats.inProgress.toString().padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-slate-500">Open + in progress</p>
        </button>

        <button
          type="button"
          onClick={() => applyStatusFilter("resolved")}
          className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
            activeStatus === "resolved" ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resolved Claim</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ticketStats.resolved.toString().padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-slate-500">Resolved only</p>
        </button>

        <button
          type="button"
          onClick={() => applyStatusFilter("closed")}
          className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
            activeStatus === "closed" ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Closed Claim</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ticketStats.closed.toString().padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-slate-500">Closed only</p>
        </button>
      </div>
      <SupportInbox
        viewerRole="dealer"
        viewerName={dealerName}
        dealerId={dealerId}
        sourceFilter="general_support"
        statusFilter={activeStatus}
        onTicketsLoaded={handleTicketsLoaded}
        title="Claim"
        subtitle="View and reply to claim/support tickets"
      />
    </div>
  );
}
