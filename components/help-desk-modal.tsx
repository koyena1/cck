"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  category: string;
  sub_category: string;
  reference_order_id: number | null;
  reference_order_number: string | null;
  status: string;
  priority: string;
  created_at: string;
  last_message_at: string;
  messages: TicketMessage[];
};

type CategoriesMap = Record<string, string[]>;

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

  if (normalizedRole === "admin") return roleLabel;
  if (!senderName) return roleLabel;
  if (senderName.toLowerCase() === roleLabel.toLowerCase()) return roleLabel;

  return `${senderName} (${roleLabel})`;
}

function parseAttachmentUrls(value?: string | null) {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item)).filter(Boolean);
  } catch {
    // Fall back to treating as a single URL string.
  }
  return [String(value)].filter(Boolean);
}

interface HelpDeskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDeskModal({ open, onOpenChange }: HelpDeskModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<CategoriesMap>({});
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [referenceOrderId, setReferenceOrderId] = useState("");
  const [explanation, setExplanation] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [sendMessage, setSendMessage] = useState("");
  const [sendAttachmentUrls, setSendAttachmentUrls] = useState<string[]>([]);
  const removeAttachment = (index: number) => {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFollowUpAttachment = (index: number) => {
    setSendAttachmentUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const customerName = typeof window !== "undefined" ? localStorage.getItem("customerName") || "Customer" : "Customer";
  const customerEmail = typeof window !== "undefined" ? localStorage.getItem("customerEmail") || "" : "";

  const subCategoryOptions = useMemo(() => {
    if (!category || !categories[category]) return [];
    return categories[category];
  }, [category, categories]);

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((ticket) => ticket.ticket_id === selectedTicketId) || null;
  }, [selectedTicketId, tickets]);

  const statusColor = (status: string) => {
    if (status === "resolved" || status === "closed") return "bg-green-100 text-green-700";
    if (status === "in_progress") return "bg-blue-100 text-blue-700";
    if (status === "awaiting_customer") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  const loadTickets = async () => {
    if (!customerEmail) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/support/tickets?viewer=customer&customerEmail=${encodeURIComponent(customerEmail)}&source=general_support`, {
        cache: "no-store"
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setCategories(data.categories || {});
        if (!selectedTicketId && data.tickets?.length) {
          setSelectedTicketId(data.tickets[0].ticket_id);
        }
      }
    } catch (error) {
      console.error("Failed to load support tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    loadTickets();
  }, [open]);

  const handleUpload = async (file: File) => {
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
      return data.url as string;
    } catch (error) {
      console.error("Attachment upload failed:", error);
      alert("Attachment upload failed. Please retry.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleUploads = async (
    files: FileList | null,
    setter: Dispatch<SetStateAction<string[]>>
  ) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map((file) => handleUpload(file))
      );
      const urls = uploads.filter((url): url is string => Boolean(url));
      if (urls.length) {
        setter((prev) => [...prev, ...urls]);
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setCategory("");
    setSubCategory("");
    setReferenceOrderId("");
    setExplanation("");
    setAttachmentUrls([]);
  };

  const createTicket = async () => {
    if (!customerEmail) {
      alert("Please login first to raise a support ticket.");
      return;
    }

    if (!category || !subCategory || !explanation.trim()) {
      alert("Please complete category, subcategory, and explanation.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          ticketSource: "general_support",
          category,
          subCategory,
          referenceOrderId: referenceOrderId.trim() || null,
          explanation,
          attachmentUrls: attachmentUrls.length ? attachmentUrls : null
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create ticket");
      }
      resetForm();
      await loadTickets();
      if (data.ticket?.ticket_id) {
        setSelectedTicketId(data.ticket.ticket_id);
      }
      alert("Ticket submitted successfully.");
    } catch (error: any) {
      alert(error?.message || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendFollowUpMessage = async () => {
    if (!selectedTicket) return;
    if (!sendMessage.trim() && sendAttachmentUrls.length === 0) {
      alert("Enter a message or upload attachment.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.ticket_id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          viewerRole: "customer",
          senderName: customerName,
          message: sendMessage,
          attachmentUrls: sendAttachmentUrls,
          channel: "customer"
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to send message");
      }
      setSendMessage("");
      setSendAttachmentUrls([]);
      await loadTickets();
    } catch (error: any) {
      alert(error?.message || "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help Desk</DialogTitle>
          <DialogDescription>
            Raise a new ticket and continue the conversation here.
          </DialogDescription>
        </DialogHeader>

        {!customerEmail && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Login is required to raise and track support tickets.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border p-4">
            <h3 className="text-sm font-bold">Raise New Ticket</h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Category</label>
              <Select
                value={category}
                onValueChange={(value: string) => {
                  setCategory(value);
                  setSubCategory("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(categories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Sub Category</label>
              <Select value={subCategory} onValueChange={setSubCategory} disabled={!category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Sub Category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryOptions.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Reference (Order ID)</label>
              <Input
                value={referenceOrderId}
                onChange={(event) => setReferenceOrderId(event.target.value)}
                placeholder="Please enter order/item ID for reference"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Explain Query</label>
              <Textarea
                rows={5}
                value={explanation}
                onChange={(event) => setExplanation(event.target.value)}
                placeholder="Describe your issue in detail"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Attachment</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={(event) => {
                    handleUploads(event.target.files, setAttachmentUrls);
                    event.currentTarget.value = "";
                  }}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              </div>
              {attachmentUrls.length > 0 && (
                <div className="flex flex-col gap-1">
                  {attachmentUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="flex items-center justify-between gap-2">
                      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                        View uploaded file {index + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="text-[11px] text-slate-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={createTicket} disabled={submitting || uploading || !customerEmail} className="w-full bg-[#e63946] hover:bg-red-700">
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <h3 className="text-sm font-bold">Your Tickets</h3>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-slate-500">No tickets yet.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.ticket_id}
                    onClick={() => setSelectedTicketId(ticket.ticket_id)}
                    className={`w-full rounded-lg border p-2 text-left transition ${
                      selectedTicketId === ticket.ticket_id ? "border-blue-500 bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-700">{ticket.ticket_number}</p>
                      <Badge className={statusColor(ticket.status)}>{ticket.status.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{ticket.category} / {ticket.sub_category}</p>
                  </button>
                ))}
              </div>
            )}

            {selectedTicket && (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Conversation</p>
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {selectedTicket.messages.map((message) => (
                    <div key={message.message_id} className="rounded-md bg-slate-50 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">{getSenderDisplayText(message)}</p>
                        <p className="text-[11px] text-slate-400">{new Date(message.created_at).toLocaleString("en-IN")}</p>
                      </div>
                      {message.message_text && <p className="mt-1 text-xs text-slate-600">{message.message_text}</p>}
                      {message.attachment_url && (
                        <div className="mt-1 space-y-1">
                          {parseAttachmentUrls(message.attachment_url).map((url, index) => (
                            <a key={url} href={url} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 underline">
                              Open attachment {index + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-2">
                  <Textarea
                    rows={3}
                    value={sendMessage}
                    onChange={(event) => setSendMessage(event.target.value)}
                    placeholder="Write a follow-up message"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("helpdesk-followup-file")?.click()}
                    >
                      <Paperclip className="mr-1 h-4 w-4" />
                      Attachment
                    </Button>
                    <input
                      id="helpdesk-followup-file"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        handleUploads(event.target.files, setSendAttachmentUrls);
                        event.currentTarget.value = "";
                      }}
                    />
                    <Button size="sm" onClick={sendFollowUpMessage} disabled={submitting || uploading}>
                      <Send className="mr-1 h-4 w-4" />
                      Send
                    </Button>
                  </div>
                  {sendAttachmentUrls.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {sendAttachmentUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="flex items-center justify-between gap-2">
                          <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                            View follow-up attachment {index + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() => removeFollowUpAttachment(index)}
                            className="text-[11px] text-slate-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
