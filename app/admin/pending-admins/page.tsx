"use client";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldX,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PendingAdmin {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export default function PendingAdminsPage() {
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingAdmins();
    const interval = setInterval(fetchPendingAdmins, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingAdmins = async () => {
    try {
      const res = await fetch('/api/admin/pending-admins');
      const data = await res.json();
      if (data.success) setPendingAdmins(data.pendingAdmins);
    } catch (error) {
      console.error('Failed to fetch pending admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'approve' | 'reject', username: string) => {
    const msg = action === 'approve'
      ? `Approve admin registration for "${username}"?`
      : `Reject admin registration for "${username}"? They will NOT be able to log in.`;
    if (!confirm(msg)) return;

    setProcessing(id);
    try {
      const reviewedBy = localStorage.getItem('userName') || 'admin';
      const res = await fetch('/api/admin/pending-admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, reviewedBy })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchPendingAdmins();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const pending  = pendingAdmins.filter(a => a.status === 'Pending');
  const reviewed = pendingAdmins.filter(a => a.status !== 'Pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          Admin Registrations
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          Approve or reject new admin registration requests. Only approved admins can log in.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-300">Pending</CardTitle>
            <Clock className="w-5 h-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-yellow-600">{pending.length}</div>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-300">Approved</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-600">
              {pendingAdmins.filter(a => a.status === 'Approved').length}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Access granted</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-300">Rejected</CardTitle>
            <XCircle className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-red-600">
              {pendingAdmins.filter(a => a.status === 'Rejected').length}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Access denied</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-yellow-50 dark:bg-yellow-950 border-b dark:border-slate-700">
          <CardTitle className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Pending Requests
          </CardTitle>
          <CardDescription>These admin accounts are waiting for your approval to activate.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin opacity-30" />
              <p className="font-semibold">Loading...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No pending admin registration requests.</p>
            </div>
          ) : (
            <div className="divide-y">
              {pending.map((admin) => (
                <div key={admin.id} className="p-5 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100">{admin.username}</h3>
                          <Badge className="bg-yellow-100 text-yellow-700 font-bold text-xs">{admin.role}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{admin.email}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Requested: {formatDate(admin.requested_at)}</p>
                      </div>
                    </div>

                    {/* Warning + Action Row */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Granting admin access is irreversible unless manually removed.</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(admin.id, 'approve', admin.username)}
                          disabled={processing === admin.id}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold"
                          size="sm"
                        >
                          {processing === admin.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-1" />Approve</>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleAction(admin.id, 'reject', admin.username)}
                          disabled={processing === admin.id}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviewed History */}
      {reviewed.length > 0 && (
        <Card className="border-2">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
            <CardTitle className="font-black text-slate-900 dark:text-slate-100">Review History</CardTitle>
            <CardDescription>Previously reviewed admin registration requests</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {reviewed.map((admin) => (
                <div key={admin.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                    {admin.status === 'Approved'
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <ShieldX className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{admin.username}</span>
                      <Badge className={admin.status === 'Approved'
                        ? "bg-green-100 text-green-700 font-bold text-xs"
                        : "bg-red-100 text-red-700 font-bold text-xs"}>
                        {admin.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {admin.reviewed_at && <p>Reviewed: {formatDate(admin.reviewed_at)}</p>}
                    {admin.reviewed_by && <p>By: {admin.reviewed_by}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
