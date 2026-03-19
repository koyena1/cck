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
  purchase_source?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id?: number;
  transaction_id?: number;
  product_id: number;
  product_code?: string;
  product_name: string;
  model_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchase_source?: string;
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
    // Include all items (both Protechtur and External) in the total
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
            totalPrice: item.total_price,
            source: item.purchase_source || 'protechtur'
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('DEALER INVOICE', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 35);
    doc.text(`Transaction Type: ${invoice.transaction_type.toUpperCase()}`, 20, 42);
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString('en-IN')}`, 20, 49);

    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);

    let yPos = 65;

    if (invoice.transaction_type === 'purchase') {
      const protechturItems = items.filter(i => (i.purchase_source || 'protechtur') === 'protechtur');
      const externalItems = items.filter(i => i.purchase_source === 'external');

      if (protechturItems.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('THROUGH PROTECHTUR', 20, yPos);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        let ptSubtotal = 0;
        protechturItems.forEach((item, idx) => {
          if (yPos > 260) { doc.addPage(); yPos = 20; }
          const itemLabel = item.product_code ? `${item.product_name} (${item.product_code})` : item.product_name;
          doc.text(`${idx + 1}. ${itemLabel} (Protechtur)`, 25, yPos); yPos += 6;
          doc.text(`   Model: ${item.model_number}`, 25, yPos); yPos += 6;
          doc.text(`   Qty: ${item.quantity} x Rs. ${Number(item.unit_price).toLocaleString('en-IN')} = Rs. ${Number(item.total_price).toLocaleString('en-IN')}`, 25, yPos); yPos += 8;
          ptSubtotal += Number(item.total_price);
        });
        const ptGst = ptSubtotal * 0.18;
        const ptTotal = ptSubtotal + ptGst;
        doc.setLineWidth(0.3);
        doc.line(120, yPos, 190, yPos); yPos += 5;
        doc.text('Subtotal:', 120, yPos);
        doc.text(`Rs. ${ptSubtotal.toLocaleString('en-IN')}`, 190, yPos, { align: 'right' }); yPos += 6;
        doc.text('GST (18%):', 120, yPos);
        doc.text(`Rs. ${ptGst.toFixed(2)}`, 190, yPos, { align: 'right' }); yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 120, yPos);
        doc.text(`Rs. ${ptTotal.toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 12;
      }

      if (externalItems.length > 0) {
        if (yPos > 240) { doc.addPage(); yPos = 20; }
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 190, yPos); yPos += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('EXTERNAL', 20, yPos); yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        let extSubtotal = 0;
        externalItems.forEach((item, idx) => {
          if (yPos > 260) { doc.addPage(); yPos = 20; }
          const itemLabel = item.product_code ? `${item.product_name} (${item.product_code})` : item.product_name;
          doc.text(`${idx + 1}. ${itemLabel} (External)`, 25, yPos); yPos += 6;
          doc.text(`   Model: ${item.model_number}`, 25, yPos); yPos += 6;
          doc.text(`   Qty: ${item.quantity} x Rs. ${Number(item.unit_price).toLocaleString('en-IN')} = Rs. ${Number(item.total_price).toLocaleString('en-IN')}`, 25, yPos); yPos += 8;
          extSubtotal += Number(item.total_price);
        });
        const extGst = extSubtotal * 0.18;
        const extTotal = extSubtotal + extGst;
        doc.setLineWidth(0.3);
        doc.line(120, yPos, 190, yPos); yPos += 5;
        doc.text('Subtotal:', 120, yPos);
        doc.text(`Rs. ${extSubtotal.toLocaleString('en-IN')}`, 190, yPos, { align: 'right' }); yPos += 6;
        doc.text('GST (18%):', 120, yPos);
        doc.text(`Rs. ${extGst.toFixed(2)}`, 190, yPos, { align: 'right' }); yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 120, yPos);
        doc.text(`Rs. ${extTotal.toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 10;
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('ITEMS', 20, yPos); yPos += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      items.forEach((item, idx) => {
        if (yPos > 260) { doc.addPage(); yPos = 20; }
        const itemLabel = item.product_code ? `${item.product_name} (${item.product_code})` : item.product_name;
        doc.text(`${idx + 1}. ${itemLabel}`, 25, yPos); yPos += 6;
        doc.text(`   Model: ${item.model_number}`, 25, yPos); yPos += 6;
        doc.text(`   Qty: ${item.quantity} x Rs. ${Number(item.unit_price).toLocaleString('en-IN')} = Rs. ${Number(item.total_price).toLocaleString('en-IN')}`, 25, yPos); yPos += 8;
      });
    }

    if (yPos > 250) { doc.addPage(); yPos = 20; }
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos); yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    if (invoice.transaction_type !== 'purchase') {
      // Sale invoices: show full footer totals
      doc.text('Subtotal:', 20, yPos);
      doc.text(`Rs. ${Number(invoice.total_amount).toLocaleString('en-IN')}`, 190, yPos, { align: 'right' }); yPos += 7;
      doc.text('GST (18%):', 20, yPos);
      doc.text(`Rs. ${Number(invoice.gst_amount).toLocaleString('en-IN')}`, 190, yPos, { align: 'right' }); yPos += 10;
      doc.setLineWidth(0.8);
      doc.line(20, yPos, 190, yPos); yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TOTAL:', 20, yPos);
      doc.text(`Rs. ${Number(invoice.final_amount).toLocaleString('en-IN')}`, 190, yPos, { align: 'right' });
    } else {
      // Purchase invoices: totals already shown per-section above; just show grand total line
      doc.setLineWidth(0.8);
      doc.line(20, yPos, 190, yPos); yPos += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('TOTAL:', 20, yPos);
      doc.text(`Rs. ${Number(invoice.final_amount).toLocaleString('en-IN')}`, 190, yPos, { align: 'right' });
    }

    doc.save(`${invoice.invoice_number}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#facc15] mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dealerId) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-slate-600">Please log in to access invoices</p>
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
    <div className="min-h-screen bg-gray-50 text-slate-900 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-orbitron uppercase">
            My Invoices
          </h1>
          <p className="text-slate-600 mt-1 font-poppins text-sm sm:text-base">
            Manage your draft and finalized invoices
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 sm:gap-2 border-b border-slate-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => window.location.href = '/dealer/pricing'}
            className="px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors text-slate-500 hover:text-slate-900 whitespace-nowrap"
          >
            Statistics
          </button>
          <button
            onClick={() => window.location.href = '/dealer/pricing'}
            className="px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors text-slate-500 hover:text-slate-900 whitespace-nowrap"
          >
            Buy Products
          </button>
          <button
            onClick={() => window.location.href = '/dealer/pricing'}
            className="px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors text-slate-500 hover:text-slate-900 whitespace-nowrap"
          >
            Sale Products
          </button>
          <button
            className="px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors text-blue-700 border-b-2 border-blue-700 whitespace-nowrap"
          >
            Invoices
          </button>
          <button
            onClick={() => window.location.href = '/dealer/transactions'}
            className="px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors text-slate-500 hover:text-slate-900 whitespace-nowrap"
          >
            Transactions
          </button>
        </div>

        {/* Invoices List */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-900 font-orbitron uppercase">All Invoices</CardTitle>
            <CardDescription className="text-slate-600">
              View, edit, and finalize your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No invoices yet</p>
                <p className="text-sm mt-2">Create your first invoice from the Pricing Portal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-bold text-slate-900 font-mono text-base sm:text-lg">
                            {invoice.invoice_number}
                          </h3>
                          <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                            {invoice.transaction_type.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 space-y-1">
                          <p>Created: {new Date(invoice.created_at).toLocaleString()}</p>
                          {invoice.is_finalized && invoice.finalized_at && (
                            <p>Finalized: {new Date(invoice.finalized_at).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto gap-3 sm:gap-0 sm:text-right">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 font-orbitron sm:mb-3">
                          RS {Number(invoice.final_amount).toLocaleString('en-IN')}
                        </div>
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchInvoiceDetails(invoice.id)}
                            className="border-slate-300 bg-white hover:bg-slate-100 p-1.5 sm:p-2"
                          >
                            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditInvoice(invoice.id)}
                            className="border-blue-300 bg-white hover:bg-blue-50 p-1.5 sm:p-2"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                          </Button>
                          {!invoice.is_finalized && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInvoiceToFinalize(invoice.id);
                                  setShowFinalizeDialog(true);
                                }}
                                className="border-green-300 bg-white hover:bg-green-50 p-1.5 sm:p-2"
                              >
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setInvoiceToDelete(invoice.id);
                                  setShowDeleteDialog(true);
                                }}
                                className="border-red-300 bg-white hover:bg-red-50 p-1.5 sm:p-2"
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
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
        <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-[95vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-orbitron text-lg sm:text-xl">Invoice Details</DialogTitle>
            {selectedInvoice && (
              <DialogDescription className="text-slate-500 text-xs sm:text-sm">
                {selectedInvoice.invoice_number} - {selectedInvoice.transaction_type.toUpperCase()}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Items grouped by source */}
              <div className="space-y-2">
                {selectedInvoice.transaction_type === 'purchase' ? (
                  <>
                    {invoiceItems.filter(i => (i.purchase_source || 'protechtur') === 'protechtur').length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Through Protechtur</p>
                        {invoiceItems.filter(i => (i.purchase_source || 'protechtur') === 'protechtur').map((item, idx) => (
                          <div key={idx} className="border border-slate-200 bg-slate-50 rounded p-2 sm:p-3 mb-2">
                            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                              <div>
                                <p className="font-bold text-slate-900 text-sm sm:text-base">
                                  {item.product_name}
                                  <span className="ml-2 text-xs font-semibold text-blue-400">(Protechtur)</span>
                                </p>
                                {item.product_code && <p className="text-[11px] text-slate-500">{item.product_code}</p>}
                                <p className="text-xs text-slate-500 font-mono">{item.model_number}</p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-slate-900 text-xs sm:text-sm">{item.quantity} x RS {item.unit_price.toLocaleString('en-IN')}</p>
                                <p className="text-blue-700 font-bold text-sm sm:text-base">RS {item.total_price.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {invoiceItems.filter(i => i.purchase_source === 'external').length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-2">External</p>
                        {invoiceItems.filter(i => i.purchase_source === 'external').map((item, idx) => (
                          <div key={idx} className="border border-orange-200 bg-orange-50 rounded p-2 sm:p-3 mb-2">
                            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                              <div>
                                <p className="font-bold text-slate-900 text-sm sm:text-base">
                                  {item.product_name}
                                  <span className="ml-2 text-xs font-semibold text-orange-400">(External)</span>
                                </p>
                                {item.product_code && <p className="text-[11px] text-slate-500">{item.product_code}</p>}
                                <p className="text-xs text-slate-500 font-mono">{item.model_number}</p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-slate-900 text-xs sm:text-sm">{item.quantity} x RS {item.unit_price.toLocaleString('en-IN')}</p>
                                <p className="text-orange-400 font-bold text-sm sm:text-base">RS {item.total_price.toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  invoiceItems.map((item, idx) => (
                    <div key={idx} className="border border-slate-200 bg-slate-50 rounded p-2 sm:p-3">
                      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                        <div>
                          <p className="font-bold text-slate-900 text-sm sm:text-base">{item.product_name}</p>
                          {item.product_code && <p className="text-[11px] text-slate-500">{item.product_code}</p>}
                          <p className="text-xs text-slate-500 font-mono">{item.model_number}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-slate-900 text-xs sm:text-sm">{item.quantity} x RS {item.unit_price.toLocaleString('en-IN')}</p>
                          <p className="text-blue-700 font-bold text-sm sm:text-base">RS {item.total_price.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="text-slate-900 font-bold">RS {Number(selectedInvoice.total_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-500">GST (18%):</span>
                  <span className="text-slate-900 font-bold">RS {Number(selectedInvoice.gst_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg border-t border-slate-200 pt-2">
                  <span className="text-blue-700 font-bold">TOTAL:</span>
                  <span className="text-blue-700 font-black">RS {Number(selectedInvoice.final_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => selectedInvoice && downloadInvoicePDF(selectedInvoice, invoiceItems)}
              className="bg-slate-900 text-white hover:bg-slate-800 w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowViewDialog(false)}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full sm:w-auto text-xs sm:text-sm"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-[95vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-orbitron text-lg sm:text-xl">Edit Invoice</DialogTitle>
            {selectedInvoice && (
              <DialogDescription className="text-slate-500 text-xs sm:text-sm">
                {selectedInvoice.invoice_number} - Modify items and quantities
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Protechtur items */}
            {selectedInvoice?.transaction_type === 'purchase' && editingItems.filter(i => (i.purchase_source || 'protechtur') === 'protechtur').length > 0 && (
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 px-1">Through Protechtur</p>
            )}
            {editingItems.filter(i => selectedInvoice?.transaction_type !== 'purchase' || (i.purchase_source || 'protechtur') === 'protechtur').map((item, idx) => (
              <div key={idx} className="border border-slate-200 bg-slate-50 rounded p-2 sm:p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.product_name}
                      {selectedInvoice?.transaction_type === 'purchase' && (
                        <span className="ml-2 text-xs font-semibold text-blue-400">(Protechtur)</span>
                      )}
                    </p>
                    {item.product_code && <p className="text-[11px] text-slate-500">{item.product_code}</p>}
                    <p className="text-xs text-slate-500 font-mono">{item.model_number}</p>
                  </div>
                  <button onClick={() => removeEditingItem(editingItems.indexOf(item))} className="text-red-400 hover:text-red-300">
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={() => updateEditingItemQuantity(editingItems.indexOf(item), -1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center">
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <span className="text-slate-900 font-bold w-10 sm:w-12 text-center text-sm sm:text-base">{item.quantity}</span>
                    <button onClick={() => updateEditingItemQuantity(editingItems.indexOf(item), 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs sm:text-sm text-slate-500">RS {item.unit_price.toLocaleString('en-IN')} each</p>
                    <p className="text-blue-700 font-bold font-orbitron text-sm sm:text-base">RS {item.total_price.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* External items (purchase only) */}
            {selectedInvoice?.transaction_type === 'purchase' && editingItems.filter(i => i.purchase_source === 'external').length > 0 && (
              <>
                <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 px-1 mt-2">External</p>
                {editingItems.filter(i => i.purchase_source === 'external').map((item, idx) => (
                  <div key={`ext-${idx}`} className="border border-orange-200 bg-orange-50 rounded p-2 sm:p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 text-sm sm:text-base">
                          {item.product_name}
                          <span className="ml-2 text-xs font-semibold text-orange-400">(External)</span>
                        </p>
                        {item.product_code && <p className="text-[11px] text-slate-500">{item.product_code}</p>}
                        <p className="text-xs text-slate-500 font-mono">{item.model_number}</p>
                      </div>
                      <button onClick={() => removeEditingItem(editingItems.indexOf(item))} className="text-red-500 hover:text-red-600">
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={() => updateEditingItemQuantity(editingItems.indexOf(item), -1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center">
                          <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <span className="text-slate-900 font-bold w-10 sm:w-12 text-center text-sm sm:text-base">{item.quantity}</span>
                        <button onClick={() => updateEditingItemQuantity(editingItems.indexOf(item), 1)} className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-slate-500">RS {item.unit_price.toLocaleString('en-IN')} each</p>
                        <p className="text-orange-400 font-bold font-orbitron text-sm sm:text-base">RS {item.total_price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* Totals */}
            <div className="border-t border-slate-200 pt-4 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-500">Subtotal:</span>
                <span className="text-slate-900 font-bold">RS {calculateEditingTotals().subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-slate-500">GST (18%):</span>
                <span className="text-slate-900 font-bold">RS {calculateEditingTotals().gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg border-t border-slate-200 pt-2">
                <span className="text-blue-700 font-bold">TOTAL:</span>
                <span className="text-blue-700 font-black">RS {calculateEditingTotals().total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={saveInvoiceEdits}
              className="bg-slate-900 text-white hover:bg-slate-800 w-full sm:w-auto text-xs sm:text-sm"
              disabled={editingItems.length === 0}
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white text-slate-900 border-slate-200 max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 text-lg sm:text-xl">Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-xs sm:text-sm">
              This action cannot be undone. This will permanently delete the draft invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToDelete && deleteInvoice(invoiceToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto text-xs sm:text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize Confirmation Dialog */}
      <AlertDialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <AlertDialogContent className="bg-white text-slate-900 border-slate-200 max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 text-lg sm:text-xl">Finalize Invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-xs sm:text-sm">
              Once finalized, this invoice cannot be edited or deleted. Your inventory will be updated based on this transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full sm:w-auto text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToFinalize && finalizeInvoice(invoiceToFinalize)}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto text-xs sm:text-sm"
            >
              Finalize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
