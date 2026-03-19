"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Receipt,
  Calendar,
  Send,
  Download,
  Edit2,
  Save,
  Plus,
  Trash2,
  Eye,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SaleItem {
  product_id: number;
  product_code?: string;
  product_name: string;
  model_number: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  transaction_id: number;
  invoice_number: string;
  dealer_purchase_price: number;
}

interface ProformaItem {
  product_id: number | null;
  product_code?: string;
  product_name: string;
  description: string;
  sale_date: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface DealerInfo {
  dealer_id: number;
  full_name: string;
  email: string;
  business_name: string;
  gstin: string;
  unique_dealer_id: string;
}

interface Proforma {
  id: number;
  proforma_number: string;
  period_start: string;
  period_end: string;
  sub_total: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  dealer_name: string;
  dealer_email: string;
  business_name: string;
  created_at: string;
}

function ProformaPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dealerId = searchParams.get("dealerId");
  const existingProformaId = searchParams.get("proformaId");

  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [salesByDate, setSalesByDate] = useState<Record<string, SaleItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [proformaItems, setProformaItems] = useState<ProformaItem[]>([]);
  const [taxRate, setTaxRate] = useState(5);
  const [adminNotes, setAdminNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [existingProformas, setExistingProformas] = useState<Proforma[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProforma, setSelectedProforma] = useState<any>(null);
  const [selectedProformaItems, setSelectedProformaItems] = useState<ProformaItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [cutoffDate, setCutoffDate] = useState(() => new Date().toISOString().split("T")[0]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const periodStartDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const periodLastDay = new Date(selectedYear, selectedMonth, 0).getDate();
  const periodEndMaxDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(periodLastDay).padStart(2, '0')}`;

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth = selectedMonth === (now.getMonth() + 1) && selectedYear === now.getFullYear();
    const defaultDay = isCurrentMonth ? Math.min(now.getDate(), periodLastDay) : periodLastDay;
    const defaultCutoff = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(defaultDay).padStart(2, '0')}`;

    setCutoffDate((prev) => {
      if (!prev) return defaultCutoff;
      const parts = prev.split("-").map((p) => parseInt(p, 10));
      if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return defaultCutoff;

      if (parts[0] === selectedYear && parts[1] === selectedMonth) {
        const clampedDay = Math.min(Math.max(parts[2], 1), periodLastDay);
        return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
      }

      return defaultCutoff;
    });
  }, [selectedMonth, selectedYear, periodLastDay]);

  useEffect(() => {
    if (dealerId) {
      fetchDealerInfo();
      fetchDealerSales();
      fetchExistingProformas();
    }
  }, [dealerId, selectedMonth, selectedYear, cutoffDate]);

  useEffect(() => {
    if (existingProformaId) {
      fetchProformaDetails(parseInt(existingProformaId));
    }
  }, [existingProformaId]);

  const fetchDealerInfo = async () => {
    try {
      const res = await fetch(`/api/dealers?dealerId=${dealerId}`);
      const data = await res.json();
      if (data.success && data.dealers) {
        const d = data.dealers.find((dl: any) => dl.dealer_id === parseInt(dealerId!));
        if (d) setDealer(d);
      }
    } catch (err) {
      console.error("Failed to fetch dealer:", err);
    }
  };

  const fetchDealerSales = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dealer-proformas/sales?dealerId=${dealerId}&month=${selectedMonth}&year=${selectedYear}&uptoDate=${cutoffDate}`);
      const data = await res.json();
      if (data.success) {
        setSales(data.sales);
        setSalesByDate(data.salesByDate || {});

        // Auto-populate proforma items from sales using dealer purchase prices
        const items: ProformaItem[] = data.sales.map((s: SaleItem) => ({
          product_id: s.product_id,
          product_name: s.product_name,
          description: `${s.model_number}`,
          sale_date: new Date(s.sale_date).toISOString().split("T")[0],
          quantity: s.quantity,
          rate: s.dealer_purchase_price || s.unit_price,
          amount: (s.dealer_purchase_price || s.unit_price) * s.quantity,
        }));
        setProformaItems(items);
      }
    } catch (err) {
      console.error("Failed to fetch sales:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingProformas = async () => {
    try {
      const res = await fetch(`/api/dealer-proformas?dealerId=${dealerId}`);
      const data = await res.json();
      if (data.success) {
        setExistingProformas(data.proformas || []);
      }
    } catch (err) {
      console.error("Failed to fetch proformas:", err);
    }
  };

  const fetchProformaDetails = async (proformaId: number) => {
    try {
      const res = await fetch(`/api/dealer-proformas?id=${proformaId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedProforma(data.proforma);
        setSelectedProformaItems(data.items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          description: item.description,
          sale_date: item.sale_date ? new Date(item.sale_date).toISOString().split("T")[0] : "",
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.amount),
        })));
        setTaxRate(parseFloat(data.proforma.tax_rate) || 5);
        setAdminNotes(data.proforma.admin_notes || "");
        setEditMode(true);
      }
    } catch (err) {
      console.error("Failed to fetch proforma details:", err);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const items = editMode ? [...selectedProformaItems] : [...proformaItems];
    const item = { ...items[index], [field]: value };

    if (field === "quantity" || field === "rate") {
      item.amount = (parseFloat(item.quantity as any) || 0) * (parseFloat(item.rate as any) || 0);
    }
    items[index] = item;

    if (editMode) {
      setSelectedProformaItems(items);
    } else {
      setProformaItems(items);
    }
  };

  const removeItem = (index: number) => {
    if (editMode) {
      setSelectedProformaItems(selectedProformaItems.filter((_, i) => i !== index));
    } else {
      setProformaItems(proformaItems.filter((_, i) => i !== index));
    }
  };

  const addEmptyItem = () => {
    const newItem: ProformaItem = {
      product_id: null,
      product_name: "",
      description: "",
      sale_date: new Date().toISOString().split("T")[0],
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    if (editMode) {
      setSelectedProformaItems([...selectedProformaItems, newItem]);
    } else {
      setProformaItems([...proformaItems, newItem]);
    }
  };

  const currentItems = editMode ? selectedProformaItems : proformaItems;
  const subTotal = currentItems.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);
  const taxAmount = subTotal * (taxRate / 100);
  const totalAmount = subTotal + taxAmount;

  const generateProforma = async (sendEmail: boolean) => {
    if (currentItems.length === 0) {
      alert("No items to generate proforma");
      return;
    }

    setGenerating(true);
    try {
      const periodStart = periodStartDate;
      const periodEnd = cutoffDate;

      const res = await fetch("/api/dealer-proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId: parseInt(dealerId!),
          items: currentItems,
          periodStart,
          periodEnd,
          taxRate,
          adminNotes,
          sendEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          sendEmail
            ? `Proforma ${data.proformaNumber} generated and sent to dealer's email!`
            : `Proforma ${data.proformaNumber} generated as draft.`
        );
        fetchExistingProformas();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to generate proforma:", err);
      alert("Failed to generate proforma");
    } finally {
      setGenerating(false);
    }
  };

  const saveProformaEdits = async () => {
    if (!selectedProforma) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/dealer-proformas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proformaId: selectedProforma.id,
          items: selectedProformaItems,
          taxRate,
          adminNotes,
          status: "edited",
          updatedBy: "admin",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Proforma updated successfully!");
        setSelectedProforma(data.proforma);
        fetchExistingProformas();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to save changes");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getProductCode = (item: { product_code?: string; product_id?: number | null }) => {
    if (item.product_code) return item.product_code;
    if (item.product_id) return `PIC${String(item.product_id).padStart(3, '0')}`;
    return null;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-700";
      case "sent": return "bg-blue-100 text-blue-700";
      case "edited": return "bg-yellow-100 text-yellow-700";
      case "finalized": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (!dealerId) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No dealer selected. Please go back to Dealer Management.</p>
        <Button onClick={() => router.push("/admin/dealers")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dealers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/dealers")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Proforma Invoice
            </h1>
          </div>
          {dealer && (
            <p className="text-slate-600 dark:text-slate-300 mt-1">
              {dealer.full_name} — {dealer.business_name || "N/A"} — {dealer.email}
            </p>
          )}
        </div>
      </div>

      {/* Existing Proformas */}
      {existingProformas.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Existing Proformas</CardTitle>
            <CardDescription>Previously generated proformas for this dealer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {existingProformas.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Receipt className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{p.proforma_number}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(p.period_start)} - {formatDate(p.period_end)} | Created: {formatDate(p.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColor(p.status)}>{p.status}</Badge>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {parseFloat(p.total_amount as any).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        fetchProformaDetails(p.id);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" /> View / Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Existing Proforma Mode */}
      {editMode && selectedProforma && (
        <Card className="border-2 border-amber-200">
          <CardHeader className="bg-amber-50 dark:bg-amber-950 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-amber-800 dark:text-amber-200">
                  Editing: {selectedProforma.proforma_number}
                </CardTitle>
                <CardDescription>
                  Status: <Badge className={statusColor(selectedProforma.status)}>{selectedProforma.status}</Badge>
                  {selectedProforma.dealer_notes && (
                    <span className="ml-4 text-green-700">Dealer Notes: {selectedProforma.dealer_notes}</span>
                  )}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setSelectedProforma(null); setSelectedProformaItems([]); }}>
                Close Editor
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Proforma Items Editor */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-amber-600 text-white">
                    <th className="p-2 text-left w-10">#</th>
                    <th className="p-2 text-left">Item & Description</th>
                    <th className="p-2 text-left w-28">Date</th>
                    <th className="p-2 text-right w-20">Qty</th>
                    <th className="p-2 text-right w-28">Rate</th>
                    <th className="p-2 text-right w-28">Amount</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProformaItems.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="p-2 font-bold text-slate-600">{idx + 1}</td>
                      <td className="p-2">
                        <Input
                          value={item.product_name}
                          onChange={(e) => updateItem(idx, "product_name", e.target.value)}
                          className="mb-1 font-semibold h-8"
                          placeholder="Product Name"
                        />
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          className="text-xs h-7 text-slate-500"
                          placeholder="Description"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={item.sale_date}
                          onChange={(e) => updateItem(idx, "sale_date", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                          className="text-right h-8"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(idx, "rate", parseFloat(e.target.value) || 0)}
                          className="text-right h-8"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="p-2 text-right font-bold">
                        {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2">
                        <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button variant="outline" size="sm" onClick={addEmptyItem} className="mt-2">
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-bold">{subTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-1">
                  <span className="text-slate-600">Tax Rate</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-right text-sm"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <span className="text-sm">%</span>
                  </div>
                </div>
                <div className="flex justify-between bg-amber-600 text-white p-3 rounded-lg font-bold text-lg">
                  <span>Total</span>
                  <span>{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <label className="text-sm font-semibold text-slate-600">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full mt-1 p-2 border rounded-lg text-sm resize-none"
                rows={2}
                placeholder="Add notes for this proforma..."
              />
            </div>

            <div className="mt-4 flex gap-3 justify-end">
              <Button onClick={saveProformaEdits} disabled={generating} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales Data & New Proforma Generation */}
      {!editMode && (
        <>
          {/* Sales by Date */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="font-black">Products Sold — {monthNames[selectedMonth - 1]} {selectedYear}</CardTitle>
                  <CardDescription>
                    {sales.length} items sold — prices from Buy Product section
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
                  >
                    {monthNames.map((name, idx) => (
                      <option key={idx} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <Input
                    type="date"
                    value={cutoffDate}
                    min={periodStartDate}
                    max={periodEndMaxDate}
                    onChange={(e) => setCutoffDate(e.target.value)}
                    className="h-9 w-40"
                  />
                  <span className="text-sm text-slate-500 ml-2">{Object.keys(salesByDate).length} days with sales</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                  <p>Loading sales data...</p>
                </div>
              ) : sales.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No sales found for {monthNames[selectedMonth - 1]} {selectedYear}</p>
                </div>
              ) : (
                <div>
                  {Object.entries(salesByDate)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([date, items]) => (
                      <div key={date} className="border-b last:border-b-0">
                        <div className="px-6 py-3 bg-amber-50 dark:bg-amber-950/30 font-bold text-amber-800 dark:text-amber-200 text-sm">
                          {formatDate(date)}
                        </div>
                        <div className="divide-y">
                          {items.map((item: SaleItem, idx: number) => (
                            <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800">
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.product_name}</p>
                                {getProductCode(item) && <p className="text-[11px] text-slate-500">{getProductCode(item)}</p>}
                                <p className="text-xs text-slate-500">{item.model_number} — Invoice: {item.invoice_number}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">Qty: {item.quantity} × {(item.dealer_purchase_price || item.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                                <p className="text-xs text-slate-500">
                                  Total: {((item.dealer_purchase_price || item.unit_price) * item.quantity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proforma Editor */}
          {proformaItems.length > 0 && (
            <Card className="border-2 border-amber-200 shadow-lg">
              <CardHeader className="bg-amber-50 dark:bg-amber-950/30 border-b">
                <CardTitle className="font-black text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Generate Proforma Invoice
                </CardTitle>
                <CardDescription>Review, edit items and generate proforma. Prices are from Buy Product section.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-amber-600 text-white">
                        <th className="p-2 text-left w-10">#</th>
                        <th className="p-2 text-left">Item & Description</th>
                        <th className="p-2 text-left w-28">Date</th>
                        <th className="p-2 text-right w-20">Qty</th>
                        <th className="p-2 text-right w-28">Rate</th>
                        <th className="p-2 text-right w-28">Amount</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {proformaItems.map((item, idx) => (
                        <tr key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="p-2 font-bold text-slate-600">{idx + 1}</td>
                          <td className="p-2">
                            <Input
                              value={item.product_name}
                              onChange={(e) => updateItem(idx, "product_name", e.target.value)}
                              className="mb-1 font-semibold h-8"
                              placeholder="Product Name"
                            />
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(idx, "description", e.target.value)}
                              className="text-xs h-7 text-slate-500"
                              placeholder="Description"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="date"
                              value={item.sale_date}
                              onChange={(e) => updateItem(idx, "sale_date", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                              className="text-right h-8"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(idx, "rate", parseFloat(e.target.value) || 0)}
                              className="text-right h-8"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="p-2 text-right font-bold">
                            {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2">
                            <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button variant="outline" size="sm" onClick={addEmptyItem} className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>

                {/* Totals Section */}
                <div className="mt-4 flex justify-end">
                  <div className="w-72 space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-600">Sub Total</span>
                      <span className="font-bold">{subTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1">
                      <span className="text-slate-600">Tax Rate</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                          className="w-16 h-7 text-right text-sm"
                          min="0"
                          max="100"
                          step="0.5"
                        />
                        <span className="text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex justify-between bg-amber-600 text-white p-3 rounded-lg font-bold text-lg">
                      <span>Total</span>
                      <span>{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="text-sm font-semibold text-slate-600">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg text-sm resize-none"
                    rows={2}
                    placeholder="Optional notes..."
                  />
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3 justify-end flex-wrap">
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" /> Preview
                  </Button>
                  <Button
                    onClick={() => generateProforma(false)}
                    disabled={generating}
                    variant="outline"
                    className="border-amber-300"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => generateProforma(true)}
                    disabled={generating}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Generate & Send to Dealer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-amber-700 text-2xl font-black">PROFORMA INVOICE</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Bill To */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-sm text-slate-600">Bill To</p>
                <p className="font-bold text-amber-700">{dealer?.full_name}</p>
                <p className="text-sm text-slate-600">{dealer?.business_name}</p>
                <p className="text-sm text-slate-600">GSTIN: {dealer?.gstin || "N/A"}</p>
              </div>
              <div className="text-right">
                <div className="inline-block text-left">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="bg-amber-600 text-white px-2 py-1 font-bold">Invoice Date</span>
                    <span className="px-2 py-1 border">{formatDate(new Date().toISOString())}</span>
                    <span className="bg-amber-600 text-white px-2 py-1 font-bold">Terms</span>
                    <span className="px-2 py-1 border">Due on Receipt</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-amber-600 text-white">
                  <th className="p-2 text-left w-10">#</th>
                  <th className="p-2 text-left">Item & Description</th>
                  <th className="p-2 text-right w-16">Qty</th>
                  <th className="p-2 text-right w-24">Rate</th>
                  <th className="p-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{idx + 1}</td>
                    <td className="p-2">
                      <p className="font-semibold">{item.product_name}</p>
                      {getProductCode(item) && <p className="text-[11px] text-slate-500">{getProductCode(item)}</p>}
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </td>
                    <td className="p-2 text-right">{item.quantity.toFixed(2)}</td>
                    <td className="p-2 text-right">{item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right">{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between border-b pb-1">
                  <span>Sub Total</span>
                  <span className="font-bold">{subTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span>Tax Rate</span>
                  <span>{taxRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between bg-slate-900 text-white p-2 rounded font-bold">
                  <span>Total</span>
                  <span>{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between bg-amber-600 text-white p-2 rounded font-bold">
                  <span>Balance Due</span>
                  <span>{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mt-4 border-t pt-3">
              <p className="text-sm font-bold text-slate-700">Terms & Conditions</p>
              <p className="text-xs text-slate-500">All payments must be made in full before the commencement of any design work.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDealerProformaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ProformaPageContent />
    </Suspense>
  );
}
