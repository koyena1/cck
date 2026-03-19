"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Receipt,
  RefreshCw,
  Edit2,
  Save,
  Send,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Proforma {
  id: number;
  proforma_number: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  tax_rate: number;
  status: string;
  dealer_name: string;
  business_name: string;
  created_at: string;
}

interface ProformaItem {
  id?: number;
  product_id?: number | null;
  product_code?: string;
  product_name: string;
  description: string;
  sale_date: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface ProformaAllocation {
  id: number;
  proforma_id: number;
  proforma_item_id: number;
  selection_percentage: number;
  allocated_quantity: number;
}

interface SaleItem {
  product_id: number;
  product_name: string;
  model_number: string;
  quantity: number;
  unit_price: number;
  dealer_purchase_price: number;
  sale_date: string;
}

function DistrictProformaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealerIdParam = searchParams.get("dealerId");

  const [dealerId, setDealerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [items, setItems] = useState<ProformaItem[]>([]);
  const [allocations, setAllocations] = useState<ProformaAllocation[]>([]);
  const [taxRate, setTaxRate] = useState(5);
  const [proformaView, setProformaView] = useState<"50" | "100">("100");
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationItems, setGenerationItems] = useState<ProformaItem[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [district, setDistrict] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [cutoffDate, setCutoffDate] = useState(() => new Date().toISOString().split("T")[0]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const periodStartDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
  const periodLastDay = new Date(selectedYear, selectedMonth, 0).getDate();

  useEffect(() => {
    const districtUser = localStorage.getItem("district_user");
    if (!districtUser) {
      router.push("/district-portal/login");
      return;
    }

    try {
      const parsed = JSON.parse(districtUser);
      setDistrict(parsed?.district || "");
    } catch {
      setDistrict("");
    }

    if (dealerIdParam) {
      const id = parseInt(dealerIdParam, 10);
      if (!Number.isNaN(id)) {
        setDealerId(id);
      }
    }
  }, [dealerIdParam, router]);

  useEffect(() => {
    if (dealerId) {
      fetchProformas(dealerId);
      fetchDealerSales(dealerId);
    }
  }, [dealerId, district, selectedMonth, selectedYear, cutoffDate]);

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth = selectedMonth === (now.getMonth() + 1) && selectedYear === now.getFullYear();
    const defaultDay = isCurrentMonth ? Math.min(now.getDate(), periodLastDay) : periodLastDay;
    const defaultCutoff = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(defaultDay).padStart(2, "0")}`;

    setCutoffDate((prev) => {
      if (!prev) return defaultCutoff;
      const parts = prev.split("-").map((p) => parseInt(p, 10));
      if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return defaultCutoff;

      if (parts[0] === selectedYear && parts[1] === selectedMonth) {
        const clampedDay = Math.min(Math.max(parts[2], 1), periodLastDay);
        return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
      }

      return defaultCutoff;
    });
  }, [selectedMonth, selectedYear, periodLastDay]);

  const fetchProformas = async (id: number) => {
    try {
      setLoading(true);
      const districtQuery = district ? `&district=${encodeURIComponent(district)}` : "";
      const res = await fetch(`/api/dealer-proformas?dealerId=${id}${districtQuery}`);
      const data = await res.json();
      if (data.success) {
        setProformas(data.proformas || []);
      }
    } catch (error) {
      console.error("Failed to fetch proformas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealerSales = async (id: number) => {
    try {
      setLoadingSales(true);
      const districtQuery = district ? `&district=${encodeURIComponent(district)}` : "";
      const res = await fetch(
        `/api/dealer-proformas/sales?dealerId=${id}&month=${selectedMonth}&year=${selectedYear}&uptoDate=${cutoffDate}${districtQuery}`
      );
      const data = await res.json();
      if (data.success) {
        const mappedItems: ProformaItem[] = (data.sales || []).map((s: SaleItem) => ({
          product_id: s.product_id,
          product_name: s.product_name,
          description: s.model_number || "",
          sale_date: s.sale_date ? new Date(s.sale_date).toISOString().split("T")[0] : "",
          quantity: parseFloat(String(s.quantity)) || 0,
          rate: parseFloat(String(s.dealer_purchase_price || s.unit_price)) || 0,
          amount: (parseFloat(String(s.dealer_purchase_price || s.unit_price)) || 0) * (parseFloat(String(s.quantity)) || 0),
        }));
        setGenerationItems(mappedItems);
      } else {
        setGenerationItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch dealer sales:", error);
      setGenerationItems([]);
    } finally {
      setLoadingSales(false);
    }
  };

  const fetchProformaDetail = async (proformaId: number) => {
    try {
      const districtQuery = district ? `&district=${encodeURIComponent(district)}` : "";
      const res = await fetch(`/api/dealer-proformas?id=${proformaId}${districtQuery}`);
      const data = await res.json();
      if (data.success) {
        setSelectedProforma(data.proforma);
        setItems(
          (data.items || []).map((item: any) => ({
            id: item.id,
            product_name: item.product_name,
            description: item.description || "",
            sale_date: item.sale_date ? new Date(item.sale_date).toISOString().split("T")[0] : "",
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            amount: parseFloat(item.amount) || 0,
          }))
        );
        setAllocations(
          (data.allocations || []).map((row: any) => ({
            ...row,
            allocated_quantity: parseFloat(row.allocated_quantity) || 0,
          }))
        );
        setTaxRate(parseFloat(data.proforma.tax_rate) || 5);
        setProformaView("100");
        setEditMode(false);
      }
    } catch (error) {
      console.error("Failed to fetch proforma detail:", error);
    }
  };

  const formatDate = (d: string) => {
    if (!d) return "N/A";
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
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "edited":
        return "bg-yellow-100 text-yellow-700";
      case "finalized":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const allocatedQtyByItem = allocations.reduce<Record<number, number>>((acc, row) => {
    const itemId = Number(row.proforma_item_id);
    acc[itemId] = (acc[itemId] || 0) + (parseFloat(String(row.allocated_quantity)) || 0);
    return acc;
  }, {});

  const displayedItems = useMemo(() => {
    return items.map((item) => {
      const itemId = Number(item.id || 0);
      const consumedQty = allocatedQtyByItem[itemId] || 0;
      const baseQty = parseFloat(String(item.quantity)) || 0;
      const remainingQty = Math.max(baseQty - consumedQty, 0);
      const selectedQty = proformaView === "50" ? Math.ceil(remainingQty * 0.5) : remainingQty;
      return {
        ...item,
        quantity: selectedQty,
        amount: selectedQty * (parseFloat(String(item.rate)) || 0),
      };
    });
  }, [items, proformaView, allocatedQtyByItem]);

  const subTotal = displayedItems.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);
  const taxAmount = subTotal * (taxRate / 100);
  const totalAmount = subTotal + taxAmount;
  const generationSubTotal = generationItems.reduce((sum, item) => sum + (parseFloat(item.amount as any) || 0), 0);
  const generationTaxAmount = generationSubTotal * (taxRate / 100);
  const generationTotal = generationSubTotal + generationTaxAmount;

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      item.amount = (parseFloat(item.quantity as any) || 0) * (parseFloat(item.rate as any) || 0);
    }
    updated[index] = item;
    setItems(updated);
  };

  const saveDistrictEdits = async () => {
    if (!selectedProforma) return;
    try {
      setSaving(true);
      const response = await fetch('/api/dealer-proformas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proformaId: selectedProforma.id,
          items,
          taxRate,
          status: 'edited',
          updatedBy: 'district',
          district,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to save proforma changes');
        return;
      }
      setSelectedProforma(data.proforma);
      setItems((data.items || []).map((item: any) => ({
        id: item.id,
        product_name: item.product_name,
        description: item.description || "",
        sale_date: item.sale_date ? new Date(item.sale_date).toISOString().split("T")[0] : "",
        quantity: parseFloat(item.quantity) || 0,
        rate: parseFloat(item.rate) || 0,
        amount: parseFloat(item.amount) || 0,
      })));
      setTaxRate(parseFloat(data.proforma.tax_rate) || taxRate);
      setEditMode(false);
      alert('Proforma updated successfully');
    } catch (error) {
      console.error('Failed to save district edits:', error);
      alert('Failed to save proforma changes');
    } finally {
      setSaving(false);
    }
  };

  const generateProforma = async (sendEmail: boolean) => {
    if (!dealerId || generationItems.length === 0) {
      alert("No items found to generate proforma for selected period");
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch("/api/dealer-proformas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerId,
          items: generationItems,
          periodStart: periodStartDate,
          periodEnd: cutoffDate,
          taxRate,
          adminNotes: "",
          sendEmail,
          generatedBy: "district",
          district,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || "Failed to generate proforma");
        return;
      }

      alert(
        sendEmail
          ? `Proforma ${data.proformaNumber} generated and sent successfully`
          : `Proforma ${data.proformaNumber} generated as draft`
      );

      await fetchProformas(dealerId);
      if (data.proforma?.id) {
        await fetchProformaDetail(data.proforma.id);
      }
    } catch (error) {
      console.error("Failed to generate district proforma:", error);
      alert("Failed to generate proforma");
    } finally {
      setGenerating(false);
    }
  };

  const downloadProformaPDF = () => {
    if (!selectedProforma) return;

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 14;
    const pageHeight = 287;

    const addLine = (text: string, x: number, size = 10, align: "left" | "right" = "left") => {
      doc.setFontSize(size);
      if (align === "right") {
        doc.text(text, x, y, { align: "right" });
      } else {
        doc.text(text, x, y);
      }
      y += 6;
    };

    addLine("PROFORMA INVOICE", 14, 16);
    addLine(`Invoice: ${selectedProforma.proforma_number}`, 14);
    addLine(`Dealer: ${selectedProforma.dealer_name}`, 14);
    addLine(`Business: ${selectedProforma.business_name || "N/A"}`, 14);
    addLine(`Period: ${formatDate(selectedProforma.period_start)} - ${formatDate(selectedProforma.period_end)}`, 14);
    addLine(`View: ${proformaView}%`, 14);
    y += 2;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("#", 14, y);
    doc.text("Item", 24, y);
    doc.text("Qty", 130, y);
    doc.text("Rate", 155, y);
    doc.text("Amount", 196, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.line(14, y, 196, y);
    y += 5;

    displayedItems.forEach((item, idx) => {
      if (y > pageHeight) {
        doc.addPage();
        y = 14;
      }

      doc.text(String(idx + 1), 14, y);
      doc.text((item.product_name || "").slice(0, 56), 24, y);
      doc.text((item.quantity || 0).toFixed(2), 130, y);
      doc.text((item.rate || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 155, y);
      doc.text((item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 196, y, { align: "right" });
      y += 6;
    });

    y += 6;
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 14;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`Sub Total: ${subTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, y, { align: "right" });
    y += 6;
    doc.text(`Tax (${taxRate.toFixed(2)}%): ${taxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, y, { align: "right" });
    y += 6;
    doc.text(`Total: ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, y, { align: "right" });

    doc.save(`${selectedProforma.proforma_number}-${proformaView}.pdf`);
  };

  if (!dealerId) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-slate-600">
            <p>Select a dealer from Dealer Management to view and download proforma invoices.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/district-portal/dashboard?tab=dealers")}>
              Open Dealer Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            <Receipt className="w-8 h-8 text-amber-600" />
            Dealer Proformas
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">View, edit, and download dealer proforma invoices for your district dealers</p>
        </div>
      </div>

      {!selectedProforma && (
        <Card className="border-2 border-amber-200 shadow-lg dark:border-amber-800">
          <CardHeader className="border-b bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
            <CardTitle className="font-black text-amber-800 dark:text-amber-300">Generate New Proforma</CardTitle>
            <CardDescription>
              Select month and cutoff date to auto-load finalized sales, then generate draft or send directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <p className="mb-1 text-xs text-slate-600 dark:text-slate-300">Month</p>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {monthNames.map((name, idx) => (
                    <option key={name} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-1 text-xs text-slate-600 dark:text-slate-300">Year</p>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <p className="mb-1 text-xs text-slate-600 dark:text-slate-300">Cutoff Date</p>
                <Input
                  type="date"
                  value={cutoffDate}
                  min={periodStartDate}
                  max={`${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(periodLastDay).padStart(2, "0")}`}
                  onChange={(e) => setCutoffDate(e.target.value)}
                />
              </div>

              <div>
                <p className="mb-1 text-xs text-slate-600 dark:text-slate-300">Tax %</p>
                <Input
                  type="number"
                  value={taxRate}
                  min="0"
                  max="100"
                  step="0.5"
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="text-sm text-slate-700 dark:text-slate-200">
                <p className="font-semibold">Items loaded: {generationItems.length}</p>
                <p>
                  Period: {periodStartDate} to {cutoffDate}
                </p>
                <p>
                  Total (with tax): {generationTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  onClick={() => dealerId && fetchDealerSales(dealerId)}
                  disabled={loadingSales || generating}
                >
                  {loadingSales ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                  Reload Sales
                </Button>
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={() => generateProforma(false)}
                  disabled={generating || loadingSales || generationItems.length === 0}
                >
                  {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Generate Draft
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => generateProforma(true)}
                  disabled={generating || loadingSales || generationItems.length === 0}
                >
                  {generating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Generate & Send
                </Button>
              </div>
            </div>

            {generationItems.length > 0 && (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generationItems.slice(0, 8).map((item, idx) => (
                      <tr key={`${item.product_id || idx}-${idx}`} className="border-t">
                        <td className="p-2">
                          <p className="font-semibold">{item.product_name}</p>
                          {getProductCode(item) && <p className="text-[11px] text-slate-500 dark:text-slate-400">{getProductCode(item)}</p>}
                          {item.description && <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
                        </td>
                        <td className="p-2">{item.sale_date ? formatDate(item.sale_date) : "-"}</td>
                        <td className="p-2 text-right">{item.quantity.toFixed(2)}</td>
                        <td className="p-2 text-right">{item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right font-bold">{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {generationItems.length > 8 && (
                  <div className="border-t bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    Showing first 8 of {generationItems.length} items.
                  </div>
                )}
                <div className="px-3 py-2 text-sm bg-amber-50 border-t flex justify-end gap-6">
                  <span>Sub Total: {generationSubTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span>Tax: {generationTaxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="font-bold">Total: {generationTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedProforma && (
        <Card className="border-2 shadow-lg dark:border-slate-700">
          <CardHeader className="border-b bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70">
            <CardTitle className="font-black">Proforma List</CardTitle>
            <CardDescription>Click any proforma to view details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                <p>Loading proformas...</p>
              </div>
            ) : proformas.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No proformas found for this dealer</p>
              </div>
            ) : (
              <div className="divide-y">
                {proformas.map((p) => (
                  <button
                    key={p.id}
                    className="w-full p-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => fetchProformaDetail(p.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{p.proforma_number}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Period: {formatDate(p.period_start)} - {formatDate(p.period_end)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Created: {formatDate(p.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColor(p.status)}>{p.status}</Badge>
                        <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                          {parseFloat(p.total_amount as any).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedProforma && (
        <Card className="border-2 border-amber-200 shadow-lg dark:border-amber-800">
          <CardHeader className="border-b bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-xl font-black text-amber-800">{selectedProforma.proforma_number}</CardTitle>
                <CardDescription className="mt-1">
                  <Badge className={statusColor(selectedProforma.status)}>{selectedProforma.status}</Badge>
                  <span className="ml-3">Period: {formatDate(selectedProforma.period_start)} - {formatDate(selectedProforma.period_end)}</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedProforma(null); setItems([]); }}>
                  Back to List
                </Button>
                {!editMode && (
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setEditMode(true)}>
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-1" /> Preview
                </Button>
                <Button variant="outline" size="sm" onClick={downloadProformaPDF}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Proforma Coverage</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  50% applies to each item's remaining quantity. 100% shows remaining quantity.
                </p>
              </div>
              <div className="inline-flex rounded-md border bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                <Button
                  size="sm"
                  variant={proformaView === "50" ? "default" : "ghost"}
                  className={proformaView === "50" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                  disabled={editMode}
                  onClick={() => setProformaView("50")}
                >
                  50%
                </Button>
                <Button
                  size="sm"
                  variant={proformaView === "100" ? "default" : "ghost"}
                  className={proformaView === "100" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                  disabled={editMode}
                  onClick={() => setProformaView("100")}
                >
                  100%
                </Button>
              </div>
            </div>

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
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-bold text-slate-600 dark:text-slate-300">{idx + 1}</td>
                      <td className="p-2">
                        {editMode ? (
                          <>
                            <Input
                              value={item.product_name}
                              onChange={(e) => updateItem(idx, 'product_name', e.target.value)}
                              className="mb-1 h-8"
                            />
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(idx, 'description', e.target.value)}
                              className="h-7 text-xs"
                            />
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">{item.product_name}</p>
                            {getProductCode(item) && <p className="text-[11px] text-slate-500 dark:text-slate-400">{getProductCode(item)}</p>}
                            {item.description && <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
                          </>
                        )}
                      </td>
                      <td className="p-2 text-xs">
                        {editMode ? (
                          <Input
                            type="date"
                            value={item.sale_date}
                            onChange={(e) => updateItem(idx, 'sale_date', e.target.value)}
                            className="h-8"
                          />
                        ) : item.sale_date ? formatDate(item.sale_date) : "-"}
                      </td>
                      <td className="p-2 text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                            min="0"
                            step="0.01"
                          />
                        ) : item.quantity.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                            className="h-8 text-right"
                            min="0"
                            step="0.01"
                          />
                        ) : item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-bold">{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-bold">{subTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">Tax Rate</span>
                  {editMode ? (
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
                      <span>%</span>
                    </div>
                  ) : (
                    <span>{taxRate.toFixed(2)}%</span>
                  )}
                </div>
                <div className="flex justify-between bg-amber-600 text-white p-3 rounded-lg font-bold text-lg">
                  <span>Total</span>
                  <span>{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {editMode && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={saveDistrictEdits} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-amber-700 text-2xl font-black tracking-wide">
              PROFORMA INVOICE
            </DialogTitle>
          </DialogHeader>

          {selectedProforma && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-sm text-slate-600">Bill To</p>
                  <p className="font-bold text-amber-700">{selectedProforma.dealer_name}</p>
                  <p className="text-sm text-slate-600">{selectedProforma.business_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Invoice: {selectedProforma.proforma_number}</p>
                  <p className="text-sm">View: {proformaView}%</p>
                </div>
              </div>

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
                  {displayedItems.map((item, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">
                        <p className="font-semibold">{item.product_name}</p>
                        {getProductCode(item) && <p className="text-[11px] text-slate-500">{getProductCode(item)}</p>}
                        {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                      </td>
                      <td className="p-2 text-right">{item.quantity.toFixed(2)}</td>
                      <td className="p-2 text-right">{item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right">{item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DistrictProformaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <DistrictProformaContent />
    </Suspense>
  );
}
