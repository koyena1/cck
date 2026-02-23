"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import {
  FileText,
  Eye,
  Download,
  Filter,
  ShoppingBag,
  DollarSign,
  Calendar,
  User
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Transaction {
  id: number;
  dealer_id: number;
  dealer_name: string;
  business_name: string;
  transaction_type: string;
  transaction_date: string;
  invoice_number: string;
  total_amount: number;
  gst_amount: number;
  final_amount: number;
  payment_status: string;
  payment_method: string;
  notes: string;
  created_at: string;
}

interface TransactionItem {
  id: number;
  product_name: string;
  model_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function DealerInvoicesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    try {
      let url = '/api/dealer-transactions';
      const params = new URLSearchParams();
      
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      
      // Only show finalized invoices in admin panel
      params.append('finalized', 'true');
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionDetails = async (transactionId: number) => {
    try {
      const response = await fetch(`/api/dealer-transactions?id=${transactionId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedTransaction(data.transaction);
        setTransactionItems(data.items);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      console.error('Failed to fetch transaction details:', error);
    }
  };

  const downloadInvoice = (transaction: Transaction, items: TransactionItem[]) => {
    // Generate PDF invoice
    const doc = new jsPDF();
    
    // Set font styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("DEALER INVOICE", 105, 20, { align: "center" });
    
    // Invoice details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice Number: ${transaction.invoice_number}`, 20, 35);
    doc.text(`Transaction Type: ${transaction.transaction_type.toUpperCase()}`, 20, 42);
    doc.text(`Date: ${new Date(transaction.transaction_date).toLocaleDateString()}`, 20, 49);
    
    // Draw line
    doc.setLineWidth(0.5);
    doc.line(20, 56, 190, 56);
    
    // Dealer information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DEALER INFORMATION:", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name: ${transaction.dealer_name}`, 20, 72);
    doc.text(`Business: ${transaction.business_name}`, 20, 79);
    
    // Draw line
    doc.line(20, 85, 190, 85);
    
    // Items header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ITEMS:", 20, 95);
    
    // Items list
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let yPos = 105;
    items.forEach((item, idx) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${idx + 1}. ${item.product_name}`, 25, yPos);
      yPos += 7;
      doc.text(`   Model: ${item.model_number}`, 25, yPos);
      yPos += 7;
      doc.text(`   Qty: ${item.quantity} x Rs. ${item.unit_price.toLocaleString('en-IN')} = Rs. ${item.total_price.toLocaleString('en-IN')}`, 25, yPos);
      yPos += 10;
    });
    
    // Draw line before totals
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Totals with better formatting
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Subtotal:", 20, yPos);
    doc.text(`Rs. ${transaction.total_amount.toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    yPos += 7;
    
    doc.text("GST (18%):", 20, yPos);
    doc.text(`Rs. ${transaction.gst_amount.toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    yPos += 10;
    
    // Draw line before total
    doc.setLineWidth(0.8);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Final total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TOTAL:", 20, yPos);
    doc.text(`Rs. ${transaction.final_amount.toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    yPos += 10;
    
    // Payment information
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    yPos += 5;
    doc.text(`Payment Status: ${transaction.payment_status.toUpperCase()}`, 20, yPos);
    if (transaction.payment_method) {
      yPos += 7;
      doc.text(`Payment Method: ${transaction.payment_method}`, 20, yPos);
    }
    if (transaction.notes) {
      yPos += 7;
      doc.text(`Notes: ${transaction.notes}`, 20, yPos);
    }
    
    // Download PDF automatically
    doc.save(`${transaction.invoice_number}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge className={type === 'purchase' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const stats = {
    total: transactions.length,
    purchases: transactions.filter(t => t.transaction_type === 'purchase').length,
    sales: transactions.filter(t => t.transaction_type === 'sale').length,
    totalAmount: transactions.reduce((sum, t) => sum + parseFloat(t.final_amount.toString()), 0)
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">Dealer Invoices</h1>
        <p className="text-slate-600 mt-1">
          View and manage all dealer purchase and sale invoices
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Purchase Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{stats.purchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Sale Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">{stats.sales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-green-600">
              ₹{stats.totalAmount.toLocaleString('en-IN')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-600" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="purchase">Purchase Only</SelectItem>
                <SelectItem value="sale">Sale Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All Invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b-2">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Dealer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">GST</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-sm font-bold">
                      {transaction.invoice_number}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">{transaction.dealer_name}</p>
                        <p className="text-xs text-slate-500">{transaction.business_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getTypeBadge(transaction.transaction_type)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(transaction.transaction_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ₹{parseFloat(transaction.total_amount.toString()).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      ₹{parseFloat(transaction.gst_amount.toString()).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">
                      ₹{parseFloat(transaction.final_amount.toString()).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(transaction.payment_status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchTransactionDetails(transaction.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Details
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction && `Invoice ${selectedTransaction.invoice_number}`}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Invoice Number</p>
                  <p className="font-mono font-bold">{selectedTransaction.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Date</p>
                  <p className="font-semibold">
                    {new Date(selectedTransaction.transaction_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Dealer</p>
                  <p className="font-semibold">{selectedTransaction.dealer_name}</p>
                  <p className="text-sm text-slate-600">{selectedTransaction.business_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Type</p>
                  {getTypeBadge(selectedTransaction.transaction_type)}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Items ({transactionItems.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-bold">#</th>
                        <th className="px-4 py-2 text-left text-xs font-bold">Product</th>
                        <th className="px-4 py-2 text-center text-xs font-bold">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-bold">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactionItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-sm">{item.product_name}</p>
                            <p className="text-xs text-slate-500 font-mono">{item.model_number}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">
                            ₹{parseFloat(item.unit_price.toString()).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            ₹{parseFloat(item.total_price.toString()).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-bold">
                    ₹{parseFloat(selectedTransaction.total_amount.toString()).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">GST (18%):</span>
                  <span className="font-bold">
                    ₹{parseFloat(selectedTransaction.gst_amount.toString()).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Total Amount:</span>
                  <span className="font-black text-green-600">
                    ₹{parseFloat(selectedTransaction.final_amount.toString()).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Payment Status</p>
                  {getStatusBadge(selectedTransaction.payment_status)}
                </div>
                {selectedTransaction.payment_method && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Payment Method</p>
                    <p className="font-semibold">{selectedTransaction.payment_method}</p>
                  </div>
                )}
              </div>

              {selectedTransaction.notes && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Notes</p>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => downloadInvoice(selectedTransaction, transactionItems)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
