"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

type BpoTicket = {
  ticket_id: number;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  category: string;
  sub_category: string;
  reference_order_id: number | null;
  reference_order_number: string | null;
  installation_address: string | null;
  customer_pincode: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_landmark: string | null;
  description: string;
  district: string | null;
  ticket_source: string;
  created_at: string;
};

type DealerOption = {
  dealer_id: number;
  full_name: string;
  business_name: string;
  unique_dealer_id?: string | null;
};

type BpoBoardViewerRole = "bpo" | "admin" | "district";

interface BpoServicesBoardProps {
  viewerName?: string;
  allowActions?: boolean;
  viewerRole?: BpoBoardViewerRole;
}

export function BpoServicesBoard({ viewerName = "BPO Agent", allowActions = false, viewerRole = "bpo" }: BpoServicesBoardProps) {
  const isBpoViewer = viewerRole === "bpo";
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<BpoTicket[]>([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [dealerOptions, setDealerOptions] = useState<DealerOption[]>([]);
  const [dealerSearch, setDealerSearch] = useState("");
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [dealerNote, setDealerNote] = useState("");

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((ticket) => ticket.ticket_id === selectedTicketId) || null;
  }, [selectedTicketId, tickets]);

  const filteredDealerOptions = useMemo(() => {
    const query = dealerSearch.trim().toLowerCase();
    if (!query) return dealerOptions;

    return dealerOptions.filter((dealer) => {
      const idText = String(dealer.unique_dealer_id || dealer.dealer_id).toLowerCase();
      const dealerIdText = String(dealer.dealer_id).toLowerCase();
      const nameText = (dealer.full_name || "").toLowerCase();
      const businessText = (dealer.business_name || "").toLowerCase();
      return (
        idText.includes(query) ||
        dealerIdText.includes(query) ||
        nameText.includes(query) ||
        businessText.includes(query)
      );
    });
  }, [dealerOptions, dealerSearch]);

  const filteredTickets = useMemo(() => {
    const query = ticketSearch.trim().toLowerCase();
    if (!query) return tickets;

    return tickets.filter((ticket) => {
      const ticketNumberText = (ticket.ticket_number || "").toLowerCase();
      const customerText = (ticket.customer_name || "").toLowerCase();
      const phoneText = (ticket.customer_phone || "").toLowerCase();
      const categoryText = (ticket.category || "").toLowerCase();
      const subCategoryText = (ticket.sub_category || "").toLowerCase();
      return (
        ticketNumberText.includes(query) ||
        customerText.includes(query) ||
        phoneText.includes(query) ||
        categoryText.includes(query) ||
        subCategoryText.includes(query)
      );
    });
  }, [tickets, ticketSearch]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/support/tickets?viewer=bpo&source=services_portal", { cache: "no-store" });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (!selectedTicketId && data.tickets?.length) {
          setSelectedTicketId(data.tickets[0].ticket_id);
        }
      }
    } catch (error) {
      console.error("Failed to load BPO tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (!selectedTicket) return;
    setDealerSearch("");
    setSelectedDealerId("");
  }, [selectedTicket]);

  useEffect(() => {
    if (filteredTickets.length === 0) {
      setSelectedTicketId(null);
      return;
    }

    if (!selectedTicketId || !filteredTickets.some((ticket) => ticket.ticket_id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].ticket_id);
    }
  }, [filteredTickets, selectedTicketId]);

  const loadDealerOptions = async () => {
    if (!selectedTicket?.district) {
      setDealerOptions([]);
      return;
    }

    try {
      const response = await fetch(`/api/district-portal/dealers?district=${encodeURIComponent(selectedTicket.district)}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (data.success) {
        setDealerOptions(data.dealers || []);
        return;
      }
      setDealerOptions([]);
    } catch (error) {
      console.error("Failed to load district dealers:", error);
      setDealerOptions([]);
    }
  };

  useEffect(() => {
    if (!allowActions) return;
    loadDealerOptions();
  }, [allowActions, selectedTicketId, selectedTicket?.district]);

  const assignDealer = async () => {
    if (!selectedTicket || !allowActions) return;
    if (isBpoViewer && !dealerNote.trim()) {
      alert("Service details note is required for BPO assignment.");
      return;
    }

    const parsedDealerId = Number(selectedDealerId);
    if (!Number.isFinite(parsedDealerId) || parsedDealerId <= 0) {
      alert("Select a dealer first.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.ticket_id}/assign-dealer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: parsedDealerId,
          senderRole: viewerRole,
          senderName: viewerName,
          note: dealerNote,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to assign dealer");
      }

      setDealerNote("");
      await loadTickets();
      await loadDealerOptions();
    } catch (error: any) {
      alert(error?.message || "Failed to assign dealer");
    } finally {
      setSubmitting(false);
    }
  };

  const assignAllDistrictDealers = async () => {
    if (!selectedTicket || !allowActions) return;
    if (isBpoViewer && !dealerNote.trim()) {
      alert("Service details note is required for BPO assignment.");
      return;
    }

    if (!selectedTicket.district) {
      alert("Ticket district is required to assign all dealers.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.ticket_id}/assign-dealer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignAllDistrict: true,
          district: selectedTicket.district,
          senderRole: viewerRole,
          senderName: viewerName,
          note: dealerNote,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to assign district dealers");
      }

      setDealerNote("");
      await loadTickets();
      await loadDealerOptions();
      alert(`Service request sent to ${data.assignedCount || 0} dealers in ${selectedTicket.district}.`);
    } catch (error: any) {
      alert(error?.message || "Failed to assign district dealers");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:col-span-1 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
        <h2 className="text-base font-black text-slate-900 dark:text-slate-100">BPO Services Requests</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Source locked: services_portal</p>
        <input
          type="text"
          value={ticketSearch}
          onChange={(event) => setTicketSearch(event.target.value)}
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
          placeholder="Search ticket no, customer, phone, category"
        />

        <div className="mt-4 space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading requests...
            </div>
          ) : filteredTickets.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No Services-page requests found.</p>
          ) : (
            filteredTickets.map((ticket) => (
              <button
                key={ticket.ticket_id}
                onClick={() => setSelectedTicketId(ticket.ticket_id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedTicketId === ticket.ticket_id
                    ? "border-red-400 bg-red-50 shadow-sm dark:border-red-500/60 dark:bg-red-500/10"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100">{ticket.ticket_number}</p>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{ticket.category} / {ticket.sub_category}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ticket.customer_name}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4 lg:col-span-2 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-black/20">
        {!selectedTicket ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Select a request to open details.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Ticket:</span> {selectedTicket.ticket_number}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Customer:</span> {selectedTicket.customer_name}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Phone:</span> {selectedTicket.customer_phone || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Email:</span> {selectedTicket.customer_email || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">District:</span> {selectedTicket.district || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Category:</span> {selectedTicket.category} / {selectedTicket.sub_category}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Order Ref:</span> {selectedTicket.reference_order_number || selectedTicket.reference_order_id || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Source:</span> {selectedTicket.ticket_source}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Installation Address:</span> {selectedTicket.installation_address || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Pincode:</span> {selectedTicket.customer_pincode || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">City:</span> {selectedTicket.customer_city || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">State:</span> {selectedTicket.customer_state || "-"}</p>
                <p className="text-xs text-slate-700 wrap-break-word dark:text-slate-200"><span className="font-semibold">Landmark:</span> {selectedTicket.customer_landmark || "-"}</p>
              </div>
              <p className="mt-3 rounded-lg bg-white p-3 text-xs text-slate-700 wrap-break-word dark:bg-slate-900/70 dark:text-slate-200">
                <span className="font-semibold">Request Details:</span> {selectedTicket.description}
              </p>
            </div>

            {allowActions && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dealer Assignment</p>
                <input
                  type="text"
                  value={dealerSearch}
                  onChange={(event) => setDealerSearch(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  placeholder="Search by Dealer ID or Dealer Name"
                />
                <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto]">
                  <select
                    value={selectedDealerId}
                    onChange={(event) => setSelectedDealerId(event.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  >
                    <option value="">Select dealer ({selectedTicket.district || "No district"})</option>
                    {filteredDealerOptions.map((dealer) => (
                      <option key={dealer.dealer_id} value={String(dealer.dealer_id)}>
                        #{dealer.unique_dealer_id || dealer.dealer_id} {dealer.full_name || `Dealer ${dealer.dealer_id}`}
                        {dealer.business_name ? ` (${dealer.business_name})` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={assignDealer}
                    disabled={submitting || !selectedDealerId || (isBpoViewer && !dealerNote.trim())}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-cyan-600 dark:hover:bg-cyan-500 lg:w-auto"
                  >
                    Assign Dealer
                  </button>
                  <button
                    type="button"
                    onClick={assignAllDistrictDealers}
                    disabled={submitting || !selectedTicket.district || (isBpoViewer && !dealerNote.trim())}
                    className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-rose-600 dark:hover:bg-rose-500 lg:w-auto"
                  >
                    Send to All District Dealers
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={dealerNote}
                  onChange={(event) => setDealerNote(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/30"
                  placeholder={isBpoViewer ? "Required: describe service details for dealer assignment" : "Optional note for dealer assignment"}
                />
                <div className="flex justify-stretch lg:justify-end">
                  <button
                    type="button"
                    onClick={assignDealer}
                    disabled={submitting || !selectedDealerId || (isBpoViewer && !dealerNote.trim())}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-cyan-600 dark:hover:bg-cyan-500 lg:w-auto"
                  >
                    Submit Assignment
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </section>
    </div>
  );
}
