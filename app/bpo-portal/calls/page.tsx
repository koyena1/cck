"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, PlusCircle, Search } from "lucide-react";

type CallItem = {
  call_id: number;
  customer_name: string;
  customer_phone: string;
  call_status: string;
  call_notes: string | null;
  follow_up_at: string | null;
  created_at: string;
};

export default function BpoCallsPage() {
  const [bpoUserId, setBpoUserId] = useState<number | null>(null);
  const [calls, setCalls] = useState<CallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [callStatus, setCallStatus] = useState("connected");
  const [callNotes, setCallNotes] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");

  const loadCalls = async (userId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bpo/calls?bpoUserId=${userId}`, { cache: "no-store" });
      const data = await response.json();
      if (data.success) setCalls(data.calls || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem("bpo_user");
    if (!raw) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const userId = Number(parsed?.bpo_user_id);
      if (!Number.isFinite(userId) || userId <= 0) {
        setLoading(false);
        return;
      }
      setBpoUserId(userId);
      loadCalls(userId);
    } catch {
      setLoading(false);
    }
  }, []);

  const filteredCalls = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return calls;
    return calls.filter((call) =>
      [call.customer_name, call.customer_phone, call.call_status, call.call_notes || ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [calls, search]);

  const addCall = async () => {
    if (!bpoUserId) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Customer name and phone are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/bpo/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bpoUserId,
          customerName,
          customerPhone,
          callStatus,
          callNotes,
          followUpAt: followUpAt || null,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Failed to save call log");
        return;
      }

      setCustomerName("");
      setCustomerPhone("");
      setCallStatus("connected");
      setCallNotes("");
      setFollowUpAt("");
      await loadCalls(bpoUserId);
    } catch {
      alert("Network error while saving call log");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-red-600" />Log New Call</CardTitle>
          <CardDescription>Store records of customer calls for future follow-up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" />
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Customer phone" />
            <select
              value={callStatus}
              onChange={(e) => setCallStatus(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="connected">Connected</option>
              <option value="not_connected">Not Connected</option>
              <option value="follow_up">Follow-up Required</option>
              <option value="resolved">Resolved</option>
            </select>
            <Input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
          </div>
          <textarea
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            rows={3}
            placeholder="Call notes"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <Button onClick={addCall} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
            {saving ? "Saving..." : "Save Call Record"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-red-600" />Call Records</CardTitle>
          <CardDescription>All customer calls logged by this BPO account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, phone, status" className="pl-9" />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading call records...</p>
          ) : filteredCalls.length === 0 ? (
            <p className="text-sm text-slate-500">No call logs found.</p>
          ) : (
            <div className="space-y-2">
              {filteredCalls.map((call) => (
                <div key={call.call_id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{call.customer_name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{call.call_status.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{call.customer_phone}</p>
                  {call.call_notes && <p className="mt-2 text-sm text-slate-700">{call.call_notes}</p>}
                  <div className="mt-2 text-xs text-slate-500">
                    Logged: {new Date(call.created_at).toLocaleString('en-IN')}
                    {call.follow_up_at ? ` · Follow-up: ${new Date(call.follow_up_at).toLocaleString('en-IN')}` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
