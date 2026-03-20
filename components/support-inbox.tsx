"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip, RefreshCw, Search, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type SupportViewerRole = "admin" | "district" | "dealer";

type TicketMessage = {
  message_id: number;
  channel: "customer" | "dealer";
  sender_role: string;
  sender_name: string | null;
  message_text: string;
  attachment_url: string | null;
  created_at: string;
};

type TicketItem = {
  ticket_id: number;
  ticket_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  category: string;
  sub_category: string;
  reference_order_id: number | null;
  reference_order_number: string | null;
  district: string | null;
  dealer_id: number | null;
  dealer_unique_id: string | null;
  dealer_name: string | null;
  dealer_business_name: string | null;
  status: string;
  priority: string;
  created_at: string;
  last_message_at: string;
  messages: TicketMessage[];
};

type DealerOption = {
  dealer_id: number;
  full_name: string;
  business_name: string;
  unique_dealer_id?: string | null;
};

const roleLabelBySenderRole: Record<string, string> = {
  admin: "Admin(Protechtur)",
  district: "District Manager",
  dealer: "Dealer",
  customer: "Customer",
};

function getSenderRoleLabel(senderRole?: string | null) {
  const normalizedRole = String(senderRole || "").trim().toLowerCase();
  return roleLabelBySenderRole[normalizedRole] || "Support Team";
}

function getSenderDisplayText(message: Pick<TicketMessage, "sender_role" | "sender_name">) {
  const normalizedRole = String(message.sender_role || "").trim().toLowerCase();
  const roleLabel = getSenderRoleLabel(message.sender_role);
  const senderName = String(message.sender_name || "").trim();

  // Admin messages should always appear under the platform identity.
  if (normalizedRole === "admin") return roleLabel;
  if (!senderName) return roleLabel;
  if (senderName.toLowerCase() === roleLabel.toLowerCase()) return roleLabel;

  return `${senderName} (${roleLabel})`;
}

interface SupportInboxProps {
  viewerRole: SupportViewerRole;
  viewerName: string;
  district?: string;
  dealerId?: number;
  title?: string;
  subtitle?: string;
}

export function SupportInbox({
  viewerRole,
  viewerName,
  district,
  dealerId,
  title = "Service Support",
  subtitle = "Track, reply, and resolve support tickets"
}: SupportInboxProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState("");
  const [replyChannel, setReplyChannel] = useState<"customer" | "dealer">("customer");
  const [statusValue, setStatusValue] = useState("open");
  const [dealerOptions, setDealerOptions] = useState<DealerOption[]>([]);
  const [dealerSearchInput, setDealerSearchInput] = useState("");
  const [dealerSearchQuery, setDealerSearchQuery] = useState("");
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [dealerNote, setDealerNote] = useState("");

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((ticket) => ticket.ticket_id === selectedTicketId) || null;
  }, [selectedTicketId, tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tickets;

    return tickets.filter((ticket) => {
      const haystack = [
        ticket.ticket_number,
        ticket.customer_name,
        ticket.category,
        ticket.sub_category,
        ticket.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [tickets, searchQuery]);

  const filteredDealerOptions = useMemo(() => {
    const q = dealerSearchQuery.trim().toLowerCase().replace(/^#/, "");
    if (!q) return dealerOptions;

    return dealerOptions.filter((dealer) => {
      const haystack = [
        dealer.full_name || "",
        dealer.business_name || "",
        String(dealer.dealer_id || ""),
        String(dealer.unique_dealer_id || ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [dealerOptions, dealerSearchQuery]);

  const selectedDealerOption = useMemo(() => {
    if (!selectedDealerId) return null;

    const fromOptions = dealerOptions.find((dealer) => String(dealer.dealer_id) === String(selectedDealerId));
    if (fromOptions) return fromOptions;

    if (selectedTicket?.dealer_id && String(selectedTicket.dealer_id) === String(selectedDealerId)) {
      return {
        dealer_id: selectedTicket.dealer_id,
        full_name: selectedTicket.dealer_name || `Dealer ${selectedTicket.dealer_id}`,
        business_name: selectedTicket.dealer_business_name || "",
        unique_dealer_id: selectedTicket.dealer_unique_id || null,
      };
    }

    return null;
  }, [selectedDealerId, dealerOptions, selectedTicket]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("viewer", viewerRole);
      if (viewerRole === "district" && district) {
        params.set("district", district);
      }
      if (viewerRole === "dealer" && dealerId) {
        params.set("dealerId", String(dealerId));
      }

      const response = await fetch(`/api/support/tickets?${params.toString()}`, {
        cache: "no-store"
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (!selectedTicketId && data.tickets?.length) {
          setSelectedTicketId(data.tickets[0].ticket_id);
          setStatusValue(data.tickets[0].status || "open");
        }
      }
    } catch (error) {
      console.error("Failed to load support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDealerOptions = async () => {
    try {
      // District manager: show dealers from their own district only.
      if (viewerRole === "district") {
        if (!district) {
          setDealerOptions([]);
          return;
        }

        const response = await fetch(`/api/district-portal/dealers?district=${encodeURIComponent(district)}`, {
          cache: "no-store"
        });
        const data = await response.json();
        if (data.success) {
          setDealerOptions(data.dealers || []);
          return;
        }
        setDealerOptions([]);
        return;
      }

      // Admin: prefer ticket district dealers when available, otherwise fallback to all active dealers.
      if (viewerRole === "admin") {
        const ticketDistrict = selectedTicket?.district?.trim();

        if (ticketDistrict) {
          const districtResponse = await fetch(`/api/district-portal/dealers?district=${encodeURIComponent(ticketDistrict)}`, {
            cache: "no-store"
          });
          const districtData = await districtResponse.json();
          if (districtData.success) {
            setDealerOptions(districtData.dealers || []);
            return;
          }
        }

        const response = await fetch("/api/dealers", { cache: "no-store" });
        const data = await response.json();
        if (data.success) {
          const activeDealers = (data.dealers || []).filter((dealer: any) => {
            const status = String(dealer?.status || "").toLowerCase();
            return status === "active" || status === "approved";
          });
          setDealerOptions(activeDealers);
          return;
        }
      }

      setDealerOptions([]);
    } catch (error) {
      console.error("Failed to load dealer options:", error);
      setDealerOptions([]);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [viewerRole, district, dealerId]);

  // Keep inbox synced so admin and district can see each other's latest replies automatically.
  useEffect(() => {
    const interval = setInterval(() => {
      loadTickets();
    }, 10000);
    return () => clearInterval(interval);
  }, [viewerRole, district, dealerId]);

  useEffect(() => {
    loadDealerOptions();
  }, [viewerRole, district, selectedTicketId, selectedTicket?.district]);

  // Auto-refresh dealer list so newly added dealers show up without page reload.
  useEffect(() => {
    if (!(viewerRole === "admin" || viewerRole === "district")) return;

    const interval = setInterval(() => {
      loadDealerOptions();
    }, 15000);

    return () => clearInterval(interval);
  }, [viewerRole, district, selectedTicketId, selectedTicket?.district]);

  useEffect(() => {
    if (!selectedTicket) return;
    setStatusValue(selectedTicket.status || "open");
    if (selectedTicket.dealer_id) {
      setSelectedDealerId(String(selectedTicket.dealer_id));
      if (viewerRole === "admin" || viewerRole === "district") {
        setReplyChannel("dealer");
      }
    }
  }, [selectedTicket, viewerRole]);

  const handleUpload = async (file: File, setter: (url: string) => void) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "support-tickets");
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }
      setter(data.url);
    } catch (error) {
      console.error("Support attachment upload failed:", error);
      alert("Attachment upload failed");
    } finally {
      setUploading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket) return;
    if (!replyText.trim() && !replyAttachment) {
      alert("Write a message or attach a file.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.ticket_id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerRole,
          senderName: viewerName,
          channel: viewerRole === "dealer" ? "dealer" : replyChannel,
          message: replyText,
          attachmentUrl: replyAttachment || null
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send reply");
      }
      setReplyText("");
      setReplyAttachment("");
      await loadTickets();
    } catch (error: any) {
      alert(error?.message || "Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/support/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.ticket_id,
          status
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update ticket");
      }
      await loadTickets();
    } catch (error: any) {
      alert(error?.message || "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const assignDealer = async () => {
    if (!selectedTicket) return;
    const parsed = Number(selectedDealerId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      alert("Select a dealer first.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.ticket_id}/assign-dealer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: parsed,
          senderRole: viewerRole,
          senderName: viewerName,
          note: dealerNote
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to assign dealer");
      }
      setDealerNote("");
      if (viewerRole === "admin" || viewerRole === "district") {
        setReplyChannel("dealer");
      }
      await loadTickets();
    } catch (error: any) {
      alert(error?.message || "Failed to assign dealer");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "resolved" || status === "closed") return "bg-green-100 text-green-700";
    if (status === "in_progress") return "bg-blue-100 text-blue-700";
    if (status === "awaiting_customer") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const surfaceInputClass = "bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder:text-slate-500";
  const actionButtonClass = "bg-[#0f172a] text-white hover:bg-[#1e293b] dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#1e293b]";
  const selectContentClass = "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
  const selectItemClass = "text-slate-900 focus:bg-slate-100 focus:text-slate-900 dark:text-slate-100 dark:focus:bg-slate-800 dark:focus:text-slate-100";

  const handleTicketSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleDealerSearch = () => {
    setDealerSearchQuery(dealerSearchInput);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="mb-3 flex items-center gap-2">
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleTicketSearch();
                  }
                }}
                placeholder="Search ticket, customer, category"
                className="h-9"
              />
              <Button type="button" size="sm" onClick={handleTicketSearch} className={actionButtonClass}>
                <Search className="mr-1 h-4 w-4" />
                Search
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <p className="text-sm text-slate-500">No tickets found.</p>
            ) : (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.ticket_id}
                  onClick={() => setSelectedTicketId(ticket.ticket_id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedTicketId === ticket.ticket_id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-200">{ticket.ticket_number}</p>
                    <Badge className={statusColor(ticket.status)}>{ticket.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{ticket.category} / {ticket.sub_category}</p>
                  <p className="mt-1 text-xs text-slate-400">{ticket.customer_name}</p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedTicket ? (
              <p className="text-sm text-slate-500">Select a ticket to view details.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Ticket:</span> {selectedTicket.ticket_number}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Customer:</span> {selectedTicket.customer_name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Category:</span> {selectedTicket.category} / {selectedTicket.sub_category}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Order Ref:</span> {selectedTicket.reference_order_id || selectedTicket.reference_order_number || "-"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">District:</span> {selectedTicket.district || "-"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Dealer:</span> {selectedTicket.dealer_name ? `#${selectedTicket.dealer_unique_id || selectedTicket.dealer_id || ""} ${selectedTicket.dealer_name}` : "-"}</p>
                  </div>
                </div>

                {(viewerRole === "admin" || viewerRole === "district") && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={statusValue} onValueChange={(value: string) => setStatusValue(value)}>
                      <SelectTrigger className={`w-45 ${surfaceInputClass}`}>
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent className={selectContentClass}>
                        <SelectItem value="open" className={selectItemClass}>Open</SelectItem>
                        <SelectItem value="in_progress" className={selectItemClass}>In Progress</SelectItem>
                        <SelectItem value="awaiting_customer" className={selectItemClass}>Awaiting Customer</SelectItem>
                        <SelectItem value="resolved" className={selectItemClass}>Resolved</SelectItem>
                        <SelectItem value="closed" className={selectItemClass}>Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => updateTicketStatus(statusValue)} disabled={submitting} className={actionButtonClass}>
                      Update Status
                    </Button>
                  </div>
                )}

                {(viewerRole === "district" || viewerRole === "admin") && (
                  <div className="rounded-lg border p-3 bg-white dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Raise Ticket to Dealer</p>
                    <div className="mb-2 flex items-center gap-2">
                      <Input
                        value={dealerSearchInput}
                        onChange={(event) => setDealerSearchInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleDealerSearch();
                          }
                        }}
                        placeholder="Search dealer by name, business, ID, unique ID"
                        className="h-9"
                      />
                      <Button type="button" size="sm" onClick={handleDealerSearch} className={actionButtonClass}>
                        <Search className="mr-1 h-4 w-4" />
                        Search
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await loadDealerOptions();
                        }}
                        className="shrink-0"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                        <SelectTrigger className={surfaceInputClass}>
                          <SelectValue
                            placeholder="Select dealer"
                          >
                            {selectedDealerOption
                              ? `#${selectedDealerOption.unique_dealer_id || selectedDealerOption.dealer_id} ${selectedDealerOption.full_name}${selectedDealerOption.business_name ? ` (${selectedDealerOption.business_name})` : ""}`
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className={selectContentClass}>
                          {filteredDealerOptions.length === 0 ? (
                            <SelectItem value="__none__" disabled className={selectItemClass}>
                              No dealers found
                            </SelectItem>
                          ) : (
                            filteredDealerOptions.map((dealer) => (
                              <SelectItem key={dealer.dealer_id} value={String(dealer.dealer_id)} className={selectItemClass}>
                                #{dealer.unique_dealer_id || dealer.dealer_id} {dealer.full_name || `Dealer ${dealer.dealer_id}`} ({dealer.business_name || "Dealer"})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button onClick={assignDealer} disabled={submitting} className={actionButtonClass}>Assign Dealer</Button>
                    </div>
                    {selectedDealerOption && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Selected dealer: #{selectedDealerOption.unique_dealer_id || selectedDealerOption.dealer_id} {selectedDealerOption.full_name || `Dealer ${selectedDealerOption.dealer_id}`}
                      </p>
                    )}
                    <Textarea
                      rows={2}
                      className={`mt-2 ${surfaceInputClass}`}
                      value={dealerNote}
                      onChange={(event) => setDealerNote(event.target.value)}
                      placeholder="Write message for dealer escalation (this is sent to dealer when you click Assign Dealer)"
                    />
                  </div>
                )}

                <div className="max-h-90 space-y-2 overflow-y-auto rounded-lg border p-3 bg-white dark:border-slate-700 dark:bg-slate-900/60">
                  {selectedTicket.messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  ) : (
                    selectedTicket.messages.map((message) => (
                      <div key={message.message_id} className="rounded-md bg-slate-50 p-2 dark:bg-slate-800/70">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {getSenderDisplayText(message)}
                          </p>
                          <p className="text-[11px] text-slate-400">{new Date(message.created_at).toLocaleString("en-IN")}</p>
                        </div>
                        {message.message_text && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{message.message_text}</p>}
                        {message.attachment_url && (
                          <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-blue-600 underline">
                            Open attachment
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 rounded-lg border p-3 bg-white dark:border-slate-700 dark:bg-slate-900/60">
                  {(viewerRole === "admin" || viewerRole === "district") && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Reply Channel:</p>
                      <Select value={replyChannel} onValueChange={(value: string) => setReplyChannel(value === "dealer" ? "dealer" : "customer")}>
                        <SelectTrigger className={`w-40 ${surfaceInputClass}`}>
                          <SelectValue placeholder="Channel" />
                        </SelectTrigger>
                        <SelectContent className={selectContentClass}>
                          <SelectItem value="customer" className={selectItemClass}>Customer</SelectItem>
                          <SelectItem value="dealer" className={selectItemClass}>Dealer</SelectItem>
                        </SelectContent>
                      </Select>
                        {replyChannel !== "dealer" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyChannel("dealer")}
                            disabled={!selectedTicket?.dealer_id}
                          >
                            Switch to Dealer
                          </Button>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {replyChannel === "dealer"
                            ? "Dealer channel is selected. Message will be visible in dealer portal support inbox."
                            : "Customer channel is selected. Message will be sent to the customer conversation."}
                        </p>
                    </div>
                  )}
                  <Textarea
                    rows={3}
                    className={surfaceInputClass}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={viewerRole === "dealer" ? "Reply to district manager" : "Write your reply"}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="file"
                      className={`max-w-xs ${surfaceInputClass}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleUpload(file, setReplyAttachment);
                      }}
                    />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                    <Button onClick={sendReply} disabled={submitting || uploading} className={actionButtonClass}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                  {replyAttachment && (
                    <a href={replyAttachment} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-600 underline">
                      <Paperclip className="mr-1 h-3.5 w-3.5" />
                      View uploaded file
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
