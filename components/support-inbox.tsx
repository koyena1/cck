"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";
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
};

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
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState("");
  const [replyChannel, setReplyChannel] = useState<"customer" | "dealer">("customer");
  const [statusValue, setStatusValue] = useState("open");
  const [dealerOptions, setDealerOptions] = useState<DealerOption[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState("");
  const [dealerNote, setDealerNote] = useState("");

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((ticket) => ticket.ticket_id === selectedTicketId) || null;
  }, [selectedTicketId, tickets]);

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

  useEffect(() => {
    loadDealerOptions();
  }, [viewerRole, district, selectedTicketId, selectedTicket?.district]);

  useEffect(() => {
    if (!selectedTicket) return;
    setStatusValue(selectedTicket.status || "open");
    if (selectedTicket.dealer_id) {
      setSelectedDealerId(String(selectedTicket.dealer_id));
    }
  }, [selectedTicket]);

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
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-slate-500">No tickets found.</p>
            ) : (
              tickets.map((ticket) => (
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
                <div className="rounded-lg border bg-slate-50/80 p-3 dark:bg-slate-900/40">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Ticket:</span> {selectedTicket.ticket_number}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Customer:</span> {selectedTicket.customer_name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Category:</span> {selectedTicket.category} / {selectedTicket.sub_category}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Order Ref:</span> {selectedTicket.reference_order_id || selectedTicket.reference_order_number || "-"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">District:</span> {selectedTicket.district || "-"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">Dealer:</span> {selectedTicket.dealer_name || "-"}</p>
                  </div>
                </div>

                {(viewerRole === "admin" || viewerRole === "district") && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={statusValue} onValueChange={(value: string) => setStatusValue(value)}>
                      <SelectTrigger className="w-45">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="awaiting_customer">Awaiting Customer</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => updateTicketStatus(statusValue)} disabled={submitting}>
                      Update Status
                    </Button>
                  </div>
                )}

                {(viewerRole === "district" || viewerRole === "admin") && (
                  <div className="rounded-lg border p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Raise Ticket to Dealer</p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Select value={selectedDealerId} onValueChange={setSelectedDealerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select dealer" />
                        </SelectTrigger>
                        <SelectContent>
                          {dealerOptions.length === 0 ? (
                            <SelectItem value="__none__" disabled>
                              No dealers found
                            </SelectItem>
                          ) : (
                            dealerOptions.map((dealer) => (
                              <SelectItem key={dealer.dealer_id} value={String(dealer.dealer_id)}>
                                {dealer.full_name} ({dealer.business_name || "Dealer"})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button onClick={assignDealer} disabled={submitting}>Assign Dealer</Button>
                    </div>
                    <Textarea
                      rows={2}
                      className="mt-2"
                      value={dealerNote}
                      onChange={(event) => setDealerNote(event.target.value)}
                      placeholder="Write message for dealer escalation"
                    />
                  </div>
                )}

                <div className="max-h-90 space-y-2 overflow-y-auto rounded-lg border p-3">
                  {selectedTicket.messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  ) : (
                    selectedTicket.messages.map((message) => (
                      <div key={message.message_id} className="rounded-md bg-slate-50 p-2 dark:bg-slate-800/80">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {message.sender_name || message.sender_role}
                            <span className="ml-1 text-[11px] font-normal text-slate-400">({message.channel})</span>
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

                <div className="space-y-2 rounded-lg border p-3">
                  {(viewerRole === "admin" || viewerRole === "district") && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Reply Channel:</p>
                      <Select value={replyChannel} onValueChange={(value: string) => setReplyChannel(value === "dealer" ? "dealer" : "customer")}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Channel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="dealer">Dealer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Textarea
                    rows={3}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={viewerRole === "dealer" ? "Reply to district manager" : "Write your reply"}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="file"
                      className="max-w-xs"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleUpload(file, setReplyAttachment);
                      }}
                    />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                    <Button onClick={sendReply} disabled={submitting || uploading}>
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
