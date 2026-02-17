"use client";
import { useState, useEffect } from "react";
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
  FileText
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
  rating: number;
  completed_jobs: number;
  created_at: string;
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchDealers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDealers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDealers = async () => {
    try {
      const response = await fetch('/api/dealers');
      const data = await response.json();
      
      if (data.success) {
        setDealers(data.dealers);
      }
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDealerStatus = async (dealerId: number, status: string) => {
    try {
      const response = await fetch('/api/dealers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealerId, status })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh dealers list
        fetchDealers();
        alert(`Dealer ${status === 'Active' ? 'approved' : 'rejected'} successfully!`);
      } else {
        alert(`Failed to update dealer: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to update dealer:', error);
      alert('Failed to update dealer status');
    }
  };

  const filteredDealers = dealers.filter(dealer => {
    if (filter === "all") return true;
    if (filter === "pending") return dealer.status === "Pending Approval";
    if (filter === "active") return dealer.status === "Active";
    if (filter === "rejected") return dealer.status === "Rejected";
    return true;
  });

  const stats = {
    total: dealers.length,
    pending: dealers.filter(d => d.status === "Pending Approval").length,
    active: dealers.filter(d => d.status === "Active").length,
    rejected: dealers.filter(d => d.status === "Rejected").length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dealer Management</h1>
        <p className="text-slate-600 mt-1">Approve, manage, and monitor dealer accounts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Total Dealers
            </CardTitle>
            <Users className="w-5 h-5 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900">{stats.total}</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Registered dealers</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Pending Approval
            </CardTitle>
            <Clock className="w-5 h-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Active Dealers
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-green-600">{stats.active}</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-slate-600">
              Rejected
            </CardTitle>
            <XCircle className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-red-600">{stats.rejected}</div>
            <p className="text-xs text-slate-500 mt-2 font-semibold">Verification failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setFilter("all")}
              variant={filter === "all" ? "default" : "outline"}
              className={filter === "all" ? "bg-[#e63946] hover:bg-red-700" : ""}
            >
              All Dealers ({stats.total})
            </Button>
            <Button
              onClick={() => setFilter("pending")}
              variant={filter === "pending" ? "default" : "outline"}
              className={filter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
            >
              Pending ({stats.pending})
            </Button>
            <Button
              onClick={() => setFilter("active")}
              variant={filter === "active" ? "default" : "outline"}
              className={filter === "active" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              Active ({stats.active})
            </Button>
            <Button
              onClick={() => setFilter("rejected")}
              variant={filter === "rejected" ? "default" : "outline"}
              className={filter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              Rejected ({stats.rejected})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dealers List */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="font-black text-slate-900">Dealer Applications</CardTitle>
          <CardDescription>Review and approve dealer registrations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20 animate-pulse" />
              <p className="font-semibold">Loading dealers...</p>
            </div>
          ) : filteredDealers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-semibold">No dealers found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDealers.map((dealer) => (
                <div key={dealer.dealer_id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    {/* Dealer Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{dealer.full_name}</h3>
                          <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                            <Building2 className="w-4 h-4" />
                            {dealer.business_name || "N/A"}
                          </p>
                        </div>
                        <Badge 
                          className={
                            dealer.status === "Active"
                              ? "bg-green-100 text-green-700 hover:bg-green-200 font-bold"
                              : dealer.status === "Pending Approval"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-bold"
                              : "bg-red-100 text-red-700 hover:bg-red-200 font-bold"
                          }
                        >
                          {dealer.status}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          <span>{dealer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{dealer.phone_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span>{dealer.location || dealer.business_address || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <FileText className="w-4 h-4" />
                          <span>GSTIN: {dealer.gstin || "N/A"}</span>
                        </div>
                      </div>

                      {/* Serviceable Pincodes */}
                      {dealer.serviceable_pincodes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900 mb-1">Serviceable Locations (Pincodes)</p>
                              <div className="flex flex-wrap gap-1">
                                {dealer.serviceable_pincodes.split(',').map((pincode, idx) => (
                                  <span key={idx} className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-300">
                                    {pincode.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{Number(dealer.rating || 0).toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Package className="w-4 h-4" />
                          <span>{dealer.completed_jobs || 0} jobs completed</span>
                        </div>
                        <span className="text-slate-400">
                          Registered: {formatDate(dealer.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {dealer.status === "Pending Approval" && (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => updateDealerStatus(dealer.dealer_id, "Active")}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateDealerStatus(dealer.dealer_id, "Rejected")}
                          variant="destructive"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
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
