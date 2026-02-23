"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import {
  FileText,
  Edit,
  Download,
  CheckCircle,
  Trash2,
  Plus,
  Minus,
  Save,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Invoice {
  id: number;
  dealer_id: number;
  transaction_type: string;
  invoice_number: string;
  total_amount: number;
  gst_amount: number;
  final_amount: number;
  is_draft: boolean;
  is_finalized: boolean;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id?: number;
  transaction_id?: number;
  product_id: number;
  product_name: string;
  model_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function DealerInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [editingItems, setEditingItems] = useState<InvoiceItem[]>([]);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [invoiceToFinalize, setInvoiceToFinalize] = useState<number | null>(null);

  useEffect(() => {
    const storedDealerId = localStorage.getItem('dealerId');
    if (storedDealerId) {
      const dId = parseInt(storedDealerId);
      setDealerId(dId);
      fetchInvoices(dId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchInvoices = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-invoices?dealerId=${dId}&includeFinalized=true`);
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetails = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/dealer-invoices?id=${invoiceId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedInvoice(data.invoice);
        setInvoiceItems(data.items);
        setShowViewDialog(true);
      }
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
    }
  };

  const startEditInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/dealer-invoices?id=${invoiceId}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.invoice.is_finalized) {
          alert('Cannot edit finalized invoice');
          return;
        }
        setSelectedInvoice(data.invoice);
        setEditingItems(data.items.map((item: InvoiceItem) => ({ ...item })));
        setShowEditDialog(true);
      }
    } catch (error) {
      console.error('Failed to fetch invoice for editing:', error);
    }
  };

  const updateEditingItemQuantity = (index: number, delta: number) => {
    const newItems = [...editingItems];
    const newQuantity = Math.max(1, newItems[index].quantity + delta);
    newItems[index].quantity = newQuantity;
    newItems[index].total_price = newQuantity * newItems[index].unit_price;
    setEditingItems(newItems);
  };

  const removeEditingItem = (index: number) => {
    const newItems = editingItems.filter((_, i) => i !== index);
    setEditingItems(newItems);
  };

  const calculateEditingTotals = () => {
    const subtotal = editingItems.reduce((sum, item) => sum + Number(item.total_price), 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  };

  const saveInvoiceEdits = async () => {
    if (!selectedInvoice || editingItems.length === 0) {
      alert('Invoice must have at least one item');
      return;
    }

    try {
      const response = await fetch('/api/dealer-invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          items: editingItems.map(item => ({
            productId: item.product_id,
            productName: item.product_name,
            modelNumber: item.model_number,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price
          }))
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Invoice updated successfully!');
        setShowEditDialog(false);
        if (dealerId) {
          fetchInvoices(dealerId);
        }
      } else {
        alert(`Failed to update invoice: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice. Please try again.');
    }
  };

  const finalizeInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch('/api/dealer-invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoiceId,
          finalize: true
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Invoice finalized successfully! Inventory has been updated.');
        setShowFinalizeDialog(false);
        if (dealerId) {
          fetchInvoices(dealerId);
        }
      } else {
        alert(`Failed to finalize invoice: ${data.error}`);
      }
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      alert('Failed to finalize invoice. Please try again.');
    }
  };

  const deleteInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(`/api/dealer-invoices?id=${invoiceId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Invoice deleted successfully!');
        setShowDeleteDialog(false);
        if (dealerId) {
          fetchInvoices(dealerId);
        }
      } else {
        alert(`Failed to delete invoice: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  const downloadInvoicePDF = (invoice: Invoice, items: InvoiceItem[]) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("DEALER INVOICE", 105, 20, { align: "center" });
    
    // Invoice details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 35);
    doc.text(`Transaction Type: ${invoice.transaction_type.toUpperCase()}`, 20, 42);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 49);
    doc.text(`Status: ${invoice.is_finalized ? 'FINALIZED' : 'DRAFT'}`, 20, 56);
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 62, 190, 62);
    
    // Items header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ITEMS:", 20, 72);
    
    // Items list
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let yPos = 82;
    
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
    
    // Totals section
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal:", 20, yPos);
    doc.text(`Rs. ${Number(invoice.total_amount).toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    yPos += 7;
    
    doc.text("GST (18%):", 20, yPos);
    doc.text(`Rs. ${Number(invoice.gst_amount).toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    yPos += 10;
    
    doc.setLineWidth(0.8);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TOTAL:", 20, yPos);
    doc.text(`Rs. ${Number(invoice.final_amount).toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    
    // Download
    doc.save(`${invoice.invoice_number}.pdf`);
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
          <p className="text-xl text-slate-400">Please log in to access invoices</p>
          <Button
            onClick={() => window.location.href = '/dealer/login'}
            className="bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a]"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-[#facc15] font-orbitron uppercase">
            My Invoices
          </h1>
          <p className="text-slate-400 mt-1 font-poppins">
            Manage your draft and finalized invoices
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
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-[#facc15] border-b-2 border-[#facc15]"
          >
            Invoices
          </button>
          <button
            onClick={() => window.location.href = '/dealer/transactions'}
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-slate-400 hover:text-white"
          >
            Transactions
          </button>
        </div>

        {/* Invoices List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-[#facc15] font-orbitron uppercase">All Invoices</CardTitle>
            <CardDescription className="text-slate-400">
              View, edit, and finalize your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No invoices yet</p>
                <p className="text-sm mt-2">Create your first invoice from the Pricing Portal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-white font-mono text-lg">
                            {invoice.invoice_number}
                          </h3>
                          <Badge
                            variant={invoice.is_finalized ? "default" : "outline"}
                            className={invoice.is_finalized 
                              ? "bg-green-600 text-white" 
                              : "border-yellow-500 text-yellow-500"
                            }
                          >
                            {invoice.is_finalized ? 'Finalized' : 'Draft'}
                          </Badge>
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            {invoice.transaction_type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <p>Created: {new Date(invoice.created_at).toLocaleString()}</p>
                          {invoice.is_finalized && invoice.finalized_at && (
                            <p>Finalized: {new Date(invoice.finalized_at).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#facc15] font-orbitron mb-3">
                          ₹{Number(invoice.final_amount).toLocaleString('en-IN')}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchInvoiceDetails(invoice.id)}
                            className="border-slate-600 hover:bg-slate-700 p-2"
                          >
                            <FileText className="w-4 h-4 text-slate-400" />
                          </Button>
                          {!invoice.is_finalized && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditInvoice(invoice.id)}
                                className="border-blue-600 hover:bg-blue-900/30 p-2"
                              >
                                <Edit className="w-4 h-4 text-blue-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInvoiceToFinalize(invoice.id);
                                  setShowFinalizeDialog(true);
                                }}
                                className="border-green-600 hover:bg-green-900/30 p-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInvoiceToDelete(invoice.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="border-red-600 hover:bg-red-900/30 p-2"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Invoice Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#facc15] font-orbitron">Invoice Details</DialogTitle>
            {selectedInvoice && (
              <DialogDescription className="text-slate-400">
                {selectedInvoice.invoice_number} - {selectedInvoice.transaction_type.toUpperCase()}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-white">Items:</h4>
                {invoiceItems.map((item, idx) => (
                  <div key={idx} className="border border-slate-700 rounded p-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-bold text-white">{item.product_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{item.model_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">
                          {item.quantity} x ₹{item.unit_price.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[#facc15] font-bold">
                          ₹{item.total_price.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Totals */}
              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white font-bold">₹{Number(selectedInvoice.total_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GST (18%):</span>
                  <span className="text-white font-bold">₹{Number(selectedInvoice.gst_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-lg border-t border-slate-700 pt-2">
                  <span className="text-[#facc15] font-bold">TOTAL:</span>
                  <span className="text-[#facc15] font-black">
                    ₹{Number(selectedInvoice.final_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => selectedInvoice && downloadInvoicePDF(selectedInvoice, invoiceItems)}
              className="bg-[#facc15] text-[#0f172a] hover:bg-yellow-400"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowViewDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#facc15] font-orbitron">Edit Invoice</DialogTitle>
            {selectedInvoice && (
              <DialogDescription className="text-slate-400">
                {selectedInvoice.invoice_number} - Modify items and quantities
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {editingItems.map((item, idx) => (
              <div key={idx} className="border border-slate-700 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-white">{item.product_name}</p>
                    <p className="text-xs text-slate-400 font-mono">{item.model_number}</p>
                  </div>
                  <button
                    onClick={() => removeEditingItem(idx)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateEditingItemQuantity(idx, -1)}
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-white font-bold w-12 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateEditingItemQuantity(idx, 1)}
                      className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">
                      ₹{item.unit_price.toLocaleString('en-IN')} each
                    </p>
                    <p className="text-[#facc15] font-bold font-orbitron">
                      ₹{item.total_price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Totals */}
            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="text-white font-bold">₹{calculateEditingTotals().subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GST (18%):</span>
                <span className="text-white font-bold">₹{calculateEditingTotals().gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-lg border-t border-slate-700 pt-2">
                <span className="text-[#facc15] font-bold">TOTAL:</span>
                <span className="text-[#facc15] font-black">
                  ₹{calculateEditingTotals().total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={saveInvoiceEdits}
              className="bg-[#facc15] text-[#0f172a] hover:bg-yellow-400"
              disabled={editingItems.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 text-white border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#facc15]">Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the draft invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToDelete && deleteInvoice(invoiceToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize Confirmation Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent className="bg-slate-800 text-white border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#facc15]">Finalize Invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Once finalized, this invoice cannot be edited or deleted. Your inventory will be updated based on this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToFinalize && finalizeInvoice(invoiceToFinalize)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Finalize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
