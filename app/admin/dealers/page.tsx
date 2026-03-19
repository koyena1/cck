"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Package,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileText,
  Hash,
  Search,
  RefreshCw,
  Pencil,
  Receipt
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import DealerDetailsModal from "@/components/DealerDetailsModal"
import SendAlertModal from "@/components/SendAlertModal"

interface Dealer {
  dealer_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  business_name: string;
  business_address: string;
  gstin: string;
  registration_number: string;
  serviceable_pincodes: string;
  location: string;
  status: string;
  unique_dealer_id: string | null;
  rating: number;
  completed_jobs: number;
  created_at: string;
}

export default function DealersPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDealerId, setSelectedDealerId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertDealerInfo, setAlertDealerInfo] = useState<{id: number, name: string, email: string} | null>(null);

  // Approval modal state
  const [approvalDealer, setApprovalDealer] = useState<Dealer | null>(null);
  const [approvalMode, setApprovalMode] = useState<'auto' | 'manual'>('auto');
  const [autoUniqueId, setAutoUniqueId] = useState<string>('');
  const [manualUniqueId, setManualUniqueId] = useState<string>('');
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState('');

  useEffect(() => {
    fetchDealers();
    const interval = setInterval(fetchDealers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDealers = async () => {
    try {
      const response = await fetch('/api/dealers');
      const data = await response.json();
      if (data.success) setDealers(data.dealers);
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = async (dealer: Dealer) => {
    setApprovalDealer(dealer);
    setApprovalMode('auto');
    setManualUniqueId('');
    setApprovalError('');
    // Fetch next auto ID
    try {
      const res = await fetch('/api/dealers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'next-uid' })
      });
      const data = await res.json();
      if (data.success) setAutoUniqueId(data.nextUniqueId);
    } catch {
      setAutoUniqueId('101');
    }
  };

  const confirmApproval = async () => {
    if (!approvalDealer) return;
    const finalId = approvalMode === 'auto' ? autoUniqueId : manualUniqueId.trim();
    if (!finalId) {
      setApprovalError('Please provide a Unique Dealer ID.');
      return;
    }
    setApproving(true);
    setApprovalError('');
    try {
      const response = await fetch('/api/dealers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerId: approvalDealer.dealer_id, status: 'Active', uniqueDealerId: finalId })
      });
      const data = await response.json();
      if (data.success) {
        setApprovalDealer(null);
        fetchDealers();
        alert(`Dealer approved successfully! Assigned Unique ID: ${data.assignedUniqueId}`);
      } else {
        setApprovalError(data.error || 'Failed to approve dealer.');
      }
    } catch {
      setApprovalError('Network error. Please try again.');
    } finally {
      setApproving(false);
    }
  };

  const rejectDealer = async (dealerId: number) => {
    if (!confirm('Are you sure you want to reject this dealer?')) return;
    try {
      const response = await fetch('/api/dealers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerId, status: 'Rejected' })
      });
      const data = await response.json();
      if (data.success) {
        fetchDealers();
        alert('Dealer rejected.');
      } else {
        alert(`Failed to reject dealer: ${data.error}`);
      }
    } catch {
      alert('Network error.');
    }
  };

  const filteredDealers = dealers.filter(dealer => {
    const statusMatch =
      filter === "all"
        ? true
        : filter === "pending"
          ? dealer.status === "Pending Approval"
          : filter === "active"
            ? dealer.status === "Active"
            : filter === "rejected"
              ? dealer.status === "Rejected"
              : true;

    const query = searchQuery.trim().toLowerCase();
    const searchMatch =
      !query ||
      dealer.email.toLowerCase().includes(query) ||
      (dealer.unique_dealer_id || "").toLowerCase().includes(query);

    return statusMatch && searchMatch;
  });

  const stats = {
    total: dealers.length,
    pending: dealers.filter(d => d.status === "Pending Approval").length,
    active: dealers.filter(d => d.status === "Active").length,
    rejected: dealers.filter(d => d.status === "Rejected").length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const handleDealerClick = (dealerId: number) => {
    setSelectedDealerId(dealerId);
    setShowDetailsModal(true);
  };

  const handleSendAlert = (dealerId: number) => {
    const dealer = dealers.find(d => d.dealer_id === dealerId);
    if (dealer) {
      setAlertDealerInfo({ id: dealer.dealer_id, name: dealer.full_name, email: dealer.email });
      setShowAlertModal(true);
      setShowDetailsModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Dealer Management</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Approve, manage, and monitor dealer accounts</p>
      </div>

      {/* Filter Buttons */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-65 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by dealer email or unique ID"
                className="pl-9"
              />
            </div>

            <Button onClick={() => setFilter("all")} variant={filter === "all" ? "default" : "outline"} className={filter === "all" ? "bg-[#e63946] hover:bg-red-700" : ""}>All Dealers ({stats.total})</Button>
            <Button onClick={() => setFilter("pending")} variant={filter === "pending" ? "default" : "outline"} className={filter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : ""}>Pending ({stats.pending})</Button>
            <Button onClick={() => setFilter("active")} variant={filter === "active" ? "default" : "outline"} className={filter === "active" ? "bg-green-600 hover:bg-green-700" : ""}>Active ({stats.active})</Button>
            <Button onClick={() => setFilter("rejected")} variant={filter === "rejected" ? "default" : "outline"} className={filter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}>Rejected ({stats.rejected})</Button>
          </div>
        </CardContent>
      </Card>

      {/* Dealers List */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
          <CardTitle className="font-black text-slate-900 dark:text-slate-100">Dealer Applications</CardTitle>
          <CardDescription>Review and approve dealer registrations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20 animate-pulse" />
              <p className="font-semibold">Loading dealers...</p>
            </div>
          ) : filteredDealers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No dealers found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDealers.map((dealer) => (
                <div key={dealer.dealer_id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 text-sm">
                        <div className="md:col-span-4 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className="truncate text-base font-bold text-slate-900 dark:text-slate-100 hover:text-[#facc15] cursor-pointer transition-colors"
                              onClick={() => handleDealerClick(dealer.dealer_id)}
                            >
                              {dealer.full_name}
                            </h3>
                            <Badge className={
                              dealer.status === "Active"
                                ? "bg-green-100 text-green-700 hover:bg-green-200 font-bold dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40"
                                : dealer.status === "Pending Approval"
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-bold dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/40"
                                  : "bg-red-100 text-red-700 hover:bg-red-200 font-bold dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/40"
                            }>
                              {dealer.status}
                            </Badge>
                          </div>
                          <p className="truncate text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-1">
                            <Building2 className="w-3.5 h-3.5" />
                            {dealer.business_name || "N/A"}
                          </p>
                          {dealer.unique_dealer_id && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              <Hash className="w-3 h-3" />
                              ID: {dealer.unique_dealer_id}
                            </span>
                          )}
                        </div>

                        <div className="md:col-span-4 min-w-0 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 truncate"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{dealer.email}</span></div>
                          <div className="flex items-center gap-1.5 truncate"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{dealer.phone_number}</span></div>
                          <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{dealer.location || dealer.business_address || "N/A"}</span></div>
                        </div>

                        <div className="md:col-span-4 min-w-0 space-y-1 text-xs">
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />{Number(dealer.rating || 0).toFixed(1)}</span>
                            <span className="inline-flex items-center gap-1"><Package className="w-3.5 h-3.5" />{dealer.completed_jobs || 0} jobs</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate"><FileText className="w-3.5 h-3.5 shrink-0" /><span>GSTIN: {dealer.gstin || "N/A"}</span></div>
                          <p className="text-slate-400 dark:text-slate-500">Registered: {formatDate(dealer.created_at)}</p>
                        </div>
                      </div>

                      {dealer.serviceable_pincodes && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1.5 text-[11px] text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold">Serviceable PINs:</span> {dealer.serviceable_pincodes}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {dealer.status === "Active" && (
                        <Button
                          onClick={() => router.push(`/admin/dealers/proforma?dealerId=${dealer.dealer_id}`)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                          size="sm"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Proforma
                        </Button>
                      )}
                      {dealer.status === "Pending Approval" && (
                        <>
                          <Button
                            onClick={() => openApprovalModal(dealer)}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => rejectDealer(dealer.dealer_id)}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={!!approvalDealer} onOpenChange={(open) => { if (!open) setApprovalDealer(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approve Dealer
            </DialogTitle>
            <DialogDescription>
              Approving <span className="font-semibold text-slate-800 dark:text-slate-200">{approvalDealer?.full_name}</span> â€” Assign a Unique Dealer ID
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mode Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setApprovalMode('auto')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  approvalMode === 'auto'
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Auto Generate
              </button>
              <button
                onClick={() => setApprovalMode('manual')}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  approvalMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Pencil className="w-4 h-4" />
                Manual
              </button>
            </div>

            {approvalMode === 'auto' ? (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300 font-semibold mb-2">System will automatically assign:</p>
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-black text-green-700 dark:text-green-400">{autoUniqueId}</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  This is the next available sequential ID.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enter Unique Dealer ID</label>
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="e.g. 005 or D-007 or CUSTOM01"
                    value={manualUniqueId}
                    onChange={(e) => setManualUniqueId(e.target.value)}
                    className="font-mono font-bold"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-slate-500">You can use numbers, letters, or a combination. Max 20 characters.</p>
              </div>
            )}

            {approvalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                {approvalError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApprovalDealer(null)} disabled={approving}>Cancel</Button>
            <Button
              onClick={confirmApproval}
              disabled={approving || (approvalMode === 'manual' && !manualUniqueId.trim())}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {approving ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Approving...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" />Approve & Assign ID</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {selectedDealerId && (
        <DealerDetailsModal
          dealerId={selectedDealerId}
          isOpen={showDetailsModal}
          onClose={() => { setShowDetailsModal(false); setSelectedDealerId(null); }}
          onSendAlert={handleSendAlert}
        />
      )}
      {alertDealerInfo && (
        <SendAlertModal
          dealerId={alertDealerInfo.id}
          dealerName={alertDealerInfo.name}
          dealerEmail={alertDealerInfo.email}
          isOpen={showAlertModal}
          onClose={() => { setShowAlertModal(false); setAlertDealerInfo(null); }}
          onSuccess={fetchDealers}
        />
      )}
    </div>
  );
}

