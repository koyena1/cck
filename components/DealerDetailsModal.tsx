"use client";

import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Package,
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  FileText,
  Clock,
  Plus,
  Minus,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DealerDetailsModalProps {
  dealerId: number;
  isOpen: boolean;
  onClose: () => void;
  onSendAlert: (dealerId: number) => void;
}

interface DealerDetails {
  dealer: any;
  currentStock: any[];
  updateHistory: any[];
  lastStockUpdate: string | null;
  daysSinceUpdate: number;
  stats: {
    totalProducts: number;
    totalStockAvailable: number;
    totalPurchased: number;
    totalSold: number;
  };
}

export default function DealerDetailsModal({ 
  dealerId, 
  isOpen, 
  onClose,
  onSendAlert 
}: DealerDetailsModalProps) {
  const [details, setDetails] = useState<DealerDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && dealerId) {
      console.log('Fetching dealer details for ID:', dealerId);
      fetchDealerDetails();
    }
  }, [isOpen, dealerId]);

  const fetchDealerDetails = async () => {
    setLoading(true);
    try {
      console.log('Making API request to:', `/api/dealers/${dealerId}`);
      const response = await fetch(`/api/dealers/${dealerId}`);
      const data = await response.json();
      
      console.log('API response:', data);
      
      if (data.success) {
        setDetails(data);
      } else {
        console.error('Failed to fetch dealer details:', data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching dealer details:', error);
      alert('Failed to load dealer details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4 pr-8">
            <DialogTitle className="text-2xl font-bold">
              Dealer Details
            </DialogTitle>
            {details && (
              <Button
                onClick={() => onSendAlert(dealerId)}
                variant={details.daysSinceUpdate >= 10 ? "destructive" : "default"}
                size="sm"
                className="shrink-0"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Alert
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-slate-400" />
            <p className="text-slate-500">Loading dealer details...</p>
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Dealer Info Card */}
            <Card>
              <CardHeader className="bg-slate-50 dark:bg-slate-900">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Dealer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Full Name</p>
                    <p className="text-lg font-bold">{details.dealer.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Business Name</p>
                    <p className="text-lg font-bold">{details.dealer.business_name || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Email</p>
                      <p>{details.dealer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Phone</p>
                      <p>{details.dealer.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Location</p>
                      <p>{details.dealer.location || details.dealer.business_address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold text-slate-500">GSTIN</p>
                      <p>{details.dealer.gstin || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">
                    Total Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-blue-600">{details.stats.totalProducts}</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">
                    Available Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-green-600">{details.stats.totalStockAvailable}</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">
                    Total Purchased
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-purple-600">{details.stats.totalPurchased}</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-600">
                    Total Sold
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black text-orange-600">{details.stats.totalSold}</p>
                </CardContent>
              </Card>
            </div>

            {/* Last Update Alert */}
            {details.daysSinceUpdate >= 10 && (
              <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-bold text-red-900 text-lg">Stock Update Required</p>
                      <p className="text-red-700 mt-1">
                        This dealer hasn't updated their stock for <span className="font-bold">{details.daysSinceUpdate} days</span>.
                        Last update: <span className="font-bold">{formatDate(details.lastStockUpdate)}</span>
                      </p>
                      <Button
                        onClick={() => onSendAlert(dealerId)}
                        variant="destructive"
                        size="sm"
                        className="mt-3"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Send Reminder Alert
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs for Stock and History */}
            <Tabs defaultValue="current-stock" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current-stock">
                  <Package className="w-4 h-4 mr-2" />
                  Current Stock
                </TabsTrigger>
                <TabsTrigger value="update-history">
                  <History className="w-4 h-4 mr-2" />
                  Update History
                </TabsTrigger>
              </TabsList>

              {/* Current Stock Tab */}
              <TabsContent value="current-stock" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Inventory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details.currentStock.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No stock items found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead className="text-right">Purchased</TableHead>
                            <TableHead className="text-right">Sold</TableHead>
                            <TableHead className="text-right">Available</TableHead>
                            <TableHead>Last Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.currentStock.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div>
                                  <p className="font-semibold">{item.model_number}</p>
                                  <p className="text-xs text-slate-500">{item.product_type}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.company}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {item.quantity_purchased}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {item.quantity_sold}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge 
                                  variant={item.quantity_available > 0 ? "default" : "destructive"}
                                  className="font-bold"
                                >
                                  {item.quantity_available}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">
                                {formatDateOnly(item.updated_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Update History Tab */}
              <TabsContent value="update-history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Update History (Last 50)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {details.updateHistory.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No update history found</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Previous</TableHead>
                            <TableHead className="text-right">New</TableHead>
                            <TableHead className="text-right">Change</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.updateHistory.map((update: any) => (
                            <TableRow key={update.id}>
                              <TableCell className="text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {formatDate(update.updated_at)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-semibold text-sm">{update.model_number}</p>
                                  <p className="text-xs text-slate-500">{update.product_type}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{update.company}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    update.update_type === 'purchase' ? 'default' : 
                                    update.update_type === 'sale' ? 'secondary' : 
                                    'outline'
                                  }
                                  className="text-xs"
                                >
                                  {update.update_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {update.previous_quantity}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-sm">
                                {update.new_quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {update.quantity_change > 0 ? (
                                    <>
                                      <TrendingUp className="w-4 h-4 text-green-600" />
                                      <span className="font-bold text-green-600">+{update.quantity_change}</span>
                                    </>
                                  ) : (
                                    <>
                                      <TrendingDown className="w-4 h-4 text-red-600" />
                                      <span className="font-bold text-red-600">{update.quantity_change}</span>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <p>No dealer details available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
