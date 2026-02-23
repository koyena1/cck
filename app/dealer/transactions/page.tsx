"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import {
  History,
  Download,
  Filter,
  ShoppingCart,
  TrendingUp,
  Calendar,
  FileText,
  Package
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Transaction {
  id: number;
  transaction_type: string;
  invoice_number: string;
  total_amount: number;
  gst_amount: number;
  final_amount: number;
  payment_status: string;
  transaction_date: string;
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

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'purchase' | 'sale'>('all');

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      
      const storedDealerId = localStorage.getItem('dealerId');
      if (!storedDealerId) {
        console.warn('No dealer ID found');
        setLoading(false);
        return;
      }
      
      const dId = parseInt(storedDealerId);
      setDealerId(dId);
      
      await fetchTransactions(dId);
      
      setLoading(false);
    };

    initializePage();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filterType, transactions]);

  const fetchTransactions = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-transactions?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const applyFilter = () => {
    if (filterType === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.transaction_type === filterType));
    }
  };

  const downloadInvoice = async (transactionId: number, invoiceNumber: string) => {
    try {
      // Fetch transaction details with items
      const response = await fetch(`/api/dealer-transactions?id=${transactionId}`);
      const data = await response.json();
      
      if (!data.success) {
        alert('Failed to fetch invoice details');
        return;
      }

      const { transaction, items } = data;
      
      // Generate PDF invoice
      const doc = new jsPDF();
      
      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("DEALER INVOICE", 105, 20, { align: "center" });
      
      // Invoice details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice Number: ${transaction.invoice_number}`, 20, 35);
      doc.text(`Transaction Type: ${transaction.transaction_type.toUpperCase()}`, 20, 42);
      doc.text(`Date: ${new Date(transaction.created_at).toLocaleDateString()}`, 20, 49);
      doc.text(`Status: ${transaction.payment_status}`, 20, 56);
      
      // Dealer details
      doc.text(`Dealer: ${transaction.dealer_name}`, 120, 35);
      doc.text(`Business: ${transaction.business_name || 'N/A'}`, 120, 42);
      if (transaction.gstin) {
        doc.text(`GSTIN: ${transaction.gstin}`, 120, 49);
      }
      
      // Draw line
      doc.setLineWidth(0.5);
      doc.line(20, 65, 190, 65);
      
      // Items header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("ITEMS:", 20, 75);
      
      // Table header
      doc.setFontSize(9);
      doc.text("Product", 20, 85);
      doc.text("Model", 80, 85);
      doc.text("Qty", 130, 85);
      doc.text("Price", 150, 85);
      doc.text("Total", 170, 85);
      
      doc.setLineWidth(0.3);
      doc.line(20, 88, 190, 88);
      
      // Items list
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      let yPos = 95;
      
      items.forEach((item: TransactionItem, idx: number) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(item.product_name.substring(0, 25), 20, yPos);
        doc.text(item.model_number.substring(0, 20), 80, yPos);
        doc.text(item.quantity.toString(), 130, yPos);
        doc.text(`Rs. ${item.unit_price.toLocaleString('en-IN')}`, 150, yPos);
        doc.text(`Rs. ${item.total_price.toLocaleString('en-IN')}`, 170, yPos);
        
        yPos += 7;
      });
      
      // Draw line before totals
      yPos += 5;
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
      
      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("Thank you for your business!", 105, 280, { align: "center" });
      
      // Download PDF
      doc.save(`${invoiceNumber}.pdf`);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#facc15] mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dealerId) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-slate-400">Please log in to access transaction history</p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a]"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const purchaseCount = transactions.filter(t => t.transaction_type === 'purchase').length;
  const saleCount = transactions.filter(t => t.transaction_type === 'sale').length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-[#facc15] font-orbitron uppercase">
            Transaction History
          </h1>
          <p className="text-slate-400 mt-1 font-poppins">
            View and download all your completed transactions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => window.location.href = '/dealer/pricing'}
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-slate-400 hover:text-white"
          >
            Statistics
          </button>
          <button
            onClick={() => window.location.href = '/dealer/pricing'}
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-slate-400 hover:text-white"
          >
            Buy Products
          </button>
          <button
            onClick={() => window.location.href = '/dealer/pricing'}
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-slate-400 hover:text-white"
          >
            Sale Products
          </button>
          <button
            onClick={() => window.location.href = '/dealer/invoices'}
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-slate-400 hover:text-white"
          >
            Invoices
          </button>
          <button
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-[#facc15] border-b-2 border-[#facc15]"
          >
            Transactions
          </button>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-400" />
          <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
            <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Filter transactions" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="purchase">Buy Transactions</SelectItem>
              <SelectItem value="sale">Sale Transactions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-orbitron uppercase text-sm">
                <FileText className="w-5 h-5 text-blue-400" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white font-orbitron">
                {transactions.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-orbitron uppercase text-sm">
                <ShoppingCart className="w-5 h-5 text-orange-400" />
                Buy Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-orange-400 font-orbitron">
                {purchaseCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 font-orbitron uppercase text-sm">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Sale Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-green-400 font-orbitron">
                {saleCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-[#facc15] font-orbitron uppercase text-sm">
              Transaction Records
            </CardTitle>
            <CardDescription className="text-slate-400">
              {filterType === 'all' 
                ? `Showing all ${filteredTransactions.length} transactions`
                : `Showing ${filteredTransactions.length} ${filterType} transactions`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-700/50">
                      <TableHead className="text-slate-300 font-bold">Date</TableHead>
                      <TableHead className="text-slate-300 font-bold">Invoice #</TableHead>
                      <TableHead className="text-slate-300 font-bold">Type</TableHead>
                      <TableHead className="text-slate-300 font-bold text-right">Amount</TableHead>
                      <TableHead className="text-slate-300 font-bold text-right">GST</TableHead>
                      <TableHead className="text-slate-300 font-bold text-right">Total</TableHead>
                      <TableHead className="text-slate-300 font-bold">Status</TableHead>
                      <TableHead className="text-slate-300 font-bold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-slate-700 hover:bg-slate-700/30">
                        <TableCell className="text-white">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-300">
                          {transaction.invoice_number}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              transaction.transaction_type === 'purchase' 
                                ? 'text-orange-400 border-orange-400' 
                                : 'text-green-400 border-green-400'
                            }
                          >
                            {transaction.transaction_type === 'purchase' ? 'BUY' : 'SALE'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-white">
                          ₹{transaction.total_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-slate-400 text-sm">
                          ₹{transaction.gst_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell className="text-right text-[#facc15] font-bold font-orbitron">
                          ₹{transaction.final_amount.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              transaction.payment_status === 'completed' 
                                ? 'text-green-400 border-green-400' 
                                : transaction.payment_status === 'pending'
                                ? 'text-yellow-400 border-yellow-400'
                                : 'text-red-400 border-red-400'
                            }
                          >
                            {transaction.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => downloadInvoice(transaction.id, transaction.invoice_number)}
                            variant="outline"
                            size="sm"
                            className="bg-[#facc15] text-[#0f172a] hover:bg-yellow-400 border-0 font-bold"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
