"use client";

import { useEffect, useState } from "react";
import { SupportInbox } from "@/components/support-inbox";

export default function ServicePage() {
  const [viewerName, setViewerName] = useState("Admin");
  const [activeStatus, setActiveStatus] = useState("all");
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setViewerName(name);
  }, []);

  const applyStatusFilter = (status: string) => {
    const normalized = status.trim().toLowerCase().replace(/\s+/g, "_");
    const nextStatus = normalized || "all";
    if (nextStatus === activeStatus) {
      return;
    }
    setActiveStatus(nextStatus);
  };

  const handleTicketsLoaded = (tickets: any[]) => {
    const normalized = tickets.map((ticket) => String(ticket.status || "").toLowerCase());
    setTicketStats({
      total: tickets.length,
      open: normalized.filter((status) => status === "open").length,
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ticketStats.total.toString().padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-slate-500">All tickets</p>
        </button>

        <button
          type="button"
          onClick={() => applyStatusFilter("resolved")}
          className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
            activeStatus === "resolved" ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resolved</p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Closed</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ticketStats.closed.toString().padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-slate-500">Closed only</p>
        </button>

        <button
          type="button"
          onClick={() => applyStatusFilter("open")}
          className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
            activeStatus === "open" ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{ticketStats.open.toString().padStart(2, "0")}</p>
          <p className="mt-1 text-xs text-slate-500">Open only</p>
        </button>
      </div>

      <SupportInbox
        viewerRole="admin"
        viewerName={viewerName}
        sourceFilter="general_support"
        statusFilter={activeStatus}
        onTicketsLoaded={handleTicketsLoaded}
        title="Support"
        subtitle="Customer tickets, district responses, and dealer escalations"
      />
    </div>
  );
}
