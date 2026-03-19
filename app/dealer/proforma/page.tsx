"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import {
  Receipt,
  Calendar,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Edit2,
  RefreshCw,
  Eye,
  Download,
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
  DialogFooter,
} from "@/components/ui/dialog";

interface ProformaItem {
  id?: number;
  product_id: number | null;
  product_code?: string;
  product_name: string;
  description: string;
  sale_date: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Proforma {
  id: number;
  proforma_number: string;
  dealer_id: number;
  period_start: string;
  period_end: string;
  sub_total: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  generated_by: string;
  dealer_notes: string;
  admin_notes: string;
  dealer_name: string;
  dealer_email: string;
  business_name: string;
  gstin: string;
  unique_dealer_id: string;
  dealer_phone: string;
  business_address: string;
  created_at: string;
  updated_at?: string;
  sent_at: string;
  finalized_at: string;
}

interface ProformaAllocation {
  id: number;
  proforma_id: number;
  proforma_item_id: number;
  selection_percentage: number;
  allocated_quantity: number;
  rate: number;
  amount: number;
}

function DealerProformaContent() {
  const searchParams = useSearchParams();
  const proformaIdParam = searchParams.get("id");

  const [dealerId, setDealerId] = useState<number | null>(null);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProforma, setSelectedProforma] = useState<Proforma | null>(null);
  const [items, setItems] = useState<ProformaItem[]>([]);
  const [allocations, setAllocations] = useState<ProformaAllocation[]>([]);
  const [taxRate, setTaxRate] = useState(5);
  const [dealerNotes, setDealerNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [proformaView, setProformaView] = useState<"50" | "100">("100");

  useEffect(() => {
    const id = localStorage.getItem("dealerId");
    if (id) {
      setDealerId(parseInt(id));
    }
  }, []);

  useEffect(() => {
    if (dealerId) {
      fetchProformas();
    }
  }, [dealerId]);

  useEffect(() => {
    if (proformaIdParam && dealerId) {
      fetchProformaDetail(parseInt(proformaIdParam));
    }
  }, [proformaIdParam, dealerId]);

  const fetchProformas = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dealer-proformas?dealerId=${dealerId}`);
      const data = await res.json();
      if (data.success) {
        setProformas(data.proformas || []);
        // If proformaId from URL, auto-select it
        if (proformaIdParam) {
          const found = data.proformas?.find((p: Proforma) => p.id === parseInt(proformaIdParam));
          if (found) {
            fetchProformaDetail(found.id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch proformas:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProformaDetail = async (proformaId: number) => {
    try {
      const res = await fetch(`/api/dealer-proformas?id=${proformaId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedProforma(data.proforma);
        setItems(
          data.items.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            description: item.description || "",
            sale_date: item.sale_date
              ? new Date(item.sale_date).toISOString().split("T")[0]
              : "",
            quantity: parseFloat(item.quantity),
            rate: parseFloat(item.rate),
            amount: parseFloat(item.amount),
          }))
        );
        setAllocations(
          (data.allocations || []).map((row: any) => ({
            ...row,
            allocated_quantity: parseFloat(row.allocated_quantity) || 0,
            rate: parseFloat(row.rate) || 0,
            amount: parseFloat(row.amount) || 0,
          }))
        );
        setTaxRate(parseFloat(data.proforma.tax_rate) || 5);
        setDealerNotes(data.proforma.dealer_notes || "");
        setEditMode(false);
        setProformaView("100");
      }
    } catch (err) {
      console.error("Failed to fetch proforma:", err);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      item.amount =
        (parseFloat(item.quantity as any) || 0) *
        (parseFloat(item.rate as any) || 0);
    }
    updated[index] = item;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addEmptyItem = () => {
    setItems([
      ...items,
      {
        product_id: null,
        product_name: "",
        description: "",
        sale_date: new Date().toISOString().split("T")[0],
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const allocatedQtyByItem = allocations.reduce<Record<number, number>>((acc, row) => {
    const itemId = Number(row.proforma_item_id);
    acc[itemId] = (acc[itemId] || 0) + (parseFloat(String(row.allocated_quantity)) || 0);
    return acc;
  }, {});

  const displayedItems = items.map((item) => {
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

  const displayedSubTotal = displayedItems.reduce(
    (sum, item) => sum + (parseFloat(String(item.amount)) || 0),
    0
  );
  const displayedTaxAmount = displayedSubTotal * (taxRate / 100);
  const displayedTotalAmount = displayedSubTotal + displayedTaxAmount;

  const applySelectionGeneration = async () => {
    if (!selectedProforma) return true;
    try {
      const res = await fetch("/api/dealer-proformas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proformaId: selectedProforma.id,
          updatedBy: "dealer",
          applySelection: true,
          selectionPercentage: proformaView,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(`Failed: ${data.error || "Could not generate selection"}`);
        return false;
      }
      setAllocations(
        (data.allocations || []).map((row: any) => ({
          ...row,
          allocated_quantity: parseFloat(row.allocated_quantity) || 0,
          rate: parseFloat(row.rate) || 0,
          amount: parseFloat(row.amount) || 0,
        }))
      );
      return true;
    } catch (err) {
      alert("Failed to apply proforma generation");
      return false;
    }
  };

  const downloadProformaPDF = async () => {
    if (!selectedProforma) return;

    const applied = await applySelectionGeneration();
    if (!applied) return;

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
    doc.text(`Sub Total: ${displayedSubTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, y, { align: "right" });
    y += 6;
    doc.text(`Tax (${taxRate.toFixed(2)}%): ${displayedTaxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, y, { align: "right" });
    y += 6;
    doc.text(`Total: ${displayedTotalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 196, y, { align: "right" });

    doc.save(`${selectedProforma.proforma_number}-${proformaView}.pdf`);
  };

  const saveChanges = async (finalize: boolean) => {
    if (!selectedProforma) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dealer-proformas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proformaId: selectedProforma.id,
          dealerNotes,
          status: finalize ? "finalized" : "edited",
          updatedBy: "dealer",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          finalize
            ? "Proforma finalized successfully!"
            : "Changes saved successfully!"
        );
        setSelectedProforma(data.proforma);
        setAllocations(
          (data.allocations || []).map((row: any) => ({
            ...row,
            allocated_quantity: parseFloat(row.allocated_quantity) || 0,
            rate: parseFloat(row.rate) || 0,
            amount: parseFloat(row.amount) || 0,
          }))
        );
        setEditMode(false);
        fetchProformas();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const quickFinalize = async () => {
    if (!selectedProforma || selectedProforma.status === "finalized") return;
    const confirmed = confirm("Finalize this proforma now? You can still view and download it after finalizing.");
    if (!confirmed) return;
    await saveChanges(true);
  };

  const formatDate = (d: string) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getLastUpdatedDate = (proforma: Proforma) => {
    return proforma.updated_at || proforma.created_at;
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <Receipt className="w-8 h-8 text-amber-600" />
          Proforma Invoices
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">
          View and finalize your proforma invoices
        </p>
      </div>

      {/* Proforma List */}
      {!selectedProforma && (
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
            <CardTitle className="font-black">Your Proformas</CardTitle>
            <CardDescription>Click on a proforma to view details</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin" />
                <p>Loading proformas...</p>
              </div>
            ) : proformas.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">No proformas yet</p>
                <p className="text-sm mt-1">
                  Proformas will appear here when generated by admin.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {proformas.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => fetchProformaDetail(p.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Receipt className="w-6 h-6 text-amber-600" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                            {p.proforma_number}
                          </p>
                          <p className="text-sm text-slate-500">
                            Period: {formatDate(p.period_start)} — {formatDate(p.period_end)}
                          </p>
                          <p className="text-xs text-slate-400">
                            Updated: {formatDate(getLastUpdatedDate(p))}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={statusColor(p.status)}>
                          {p.status}
                        </Badge>
                        <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                          {parseFloat(p.total_amount as any).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Proforma Detail View */}
      {selectedProforma && (
        <Card className="border-2 border-amber-200 shadow-lg">
          <CardHeader className="bg-amber-50 dark:bg-amber-950/30 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-amber-800 dark:text-amber-200">
                  {selectedProforma.proforma_number}
                </CardTitle>
                <CardDescription className="mt-1">
                  <Badge className={statusColor(selectedProforma.status)}>
                    {selectedProforma.status}
                  </Badge>
                  <span className="ml-3">
                    Period: {formatDate(selectedProforma.period_start)} —{" "}
                    {formatDate(selectedProforma.period_end)}
                  </span>
                  <span className="ml-3">
                    Updated: {formatDate(getLastUpdatedDate(selectedProforma))}
                  </span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProforma(null);
                    setItems([]);
                    setAllocations([]);
                    setEditMode(false);
                  }}
                >
                  Back to List
                </Button>
                {!editMode && selectedProforma.status !== "finalized" && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    onClick={quickFinalize}
                    disabled={saving}
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Finalize
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-1" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadProformaPDF}
                >
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {!editMode && items.length > 0 && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div>
                  <p className="text-sm font-bold text-amber-800">Proforma Coverage</p>
                  <p className="text-xs text-amber-700">
                    50% applies to each item's remaining quantity. 100% shows remaining quantity.
                  </p>
                </div>
                <div className="inline-flex rounded-md border bg-white p-1">
                  <Button
                    size="sm"
                    variant={proformaView === "50" ? "default" : "ghost"}
                    className={proformaView === "50" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    onClick={() => setProformaView("50")}
                  >
                    50%
                  </Button>
                  <Button
                    size="sm"
                    variant={proformaView === "100" ? "default" : "ghost"}
                    className={proformaView === "100" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    onClick={() => setProformaView("100")}
                  >
                    100%
                  </Button>
                </div>
              </div>
            )}

            {selectedProforma.admin_notes && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <span className="font-bold text-blue-800">Admin Notes:</span>{" "}
                <span className="text-blue-700">{selectedProforma.admin_notes}</span>
              </div>
            )}

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
                    {editMode && <th className="p-2 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <td className="p-2 font-bold text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="p-2">
                        {editMode ? (
                          <>
                            <Input
                              value={item.product_name}
                              onChange={(e) =>
                                updateItem(idx, "product_name", e.target.value)
                              }
                              className="mb-1 font-semibold h-8"
                              placeholder="Product Name"
                            />
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                updateItem(idx, "description", e.target.value)
                              }
                              className="text-xs h-7 text-slate-500"
                              placeholder="Description"
                            />
                          </>
                        ) : (
                          <>
                            <p className="font-semibold">{item.product_name}</p>
                            {getProductCode(item) && <p className="text-[11px] text-slate-500">{getProductCode(item)}</p>}
                            {item.description && (
                              <p className="text-xs text-slate-500">
                                {item.description}
                              </p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-2">
                        {editMode ? (
                          <Input
                            type="date"
                            value={item.sale_date}
                            onChange={(e) =>
                              updateItem(idx, "sale_date", e.target.value)
                            }
                            className="h-8 text-xs"
                          />
                        ) : (
                          <span className="text-xs">
                            {item.sale_date
                              ? formatDate(item.sale_date)
                              : "—"}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right h-8"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          item.quantity.toFixed(2)
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {editMode ? (
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="text-right h-8"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          item.rate.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })
                        )}
                      </td>
                      <td className="p-2 text-right font-bold">
                        {item.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      {editMode && (
                        <td className="p-2">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={addEmptyItem}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            )}

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-bold">
                    {displayedSubTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-1">
                  <span className="text-slate-600">Tax Rate</span>
                  {editMode ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={taxRate}
                        onChange={(e) =>
                          setTaxRate(parseFloat(e.target.value) || 0)
                        }
                        className="w-16 h-7 text-right text-sm"
                        min="0"
                        max="100"
                        step="0.5"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  ) : (
                    <span>{taxRate.toFixed(2)}%</span>
                  )}
                </div>
                <div className="flex justify-between bg-amber-600 text-white p-3 rounded-lg font-bold text-lg">
                  <span>Total</span>
                  <span>
                    {displayedTotalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between bg-amber-700 text-white p-3 rounded-lg font-bold text-lg">
                  <span>Balance Due</span>
                  <span>
                    {displayedTotalAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Dealer Notes */}
            {editMode && (
              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-600">
                  Your Notes
                </label>
                <textarea
                  value={dealerNotes}
                  onChange={(e) => setDealerNotes(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg text-sm resize-none"
                  rows={2}
                  placeholder="Add your notes or feedback..."
                />
              </div>
            )}

            {/* Actions */}
            {editMode && (
              <div className="mt-6 flex gap-3 justify-end flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveChanges(false)}
                  disabled={saving}
                  variant="outline"
                  className="border-amber-300"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  onClick={() => saveChanges(true)}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Finalize Proforma
                </Button>
              </div>
            )}

            {/* Terms */}
            <div className="mt-6 border-t pt-4">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Terms & Conditions
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All payments must be made in full before the commencement of any
                design work.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-amber-700 text-2xl font-black tracking-wide">
              PROFORMA INVOICE
            </DialogTitle>
          </DialogHeader>

          {selectedProforma && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-sm text-slate-600">Bill To</p>
                  <p className="font-bold text-amber-700">
                    {selectedProforma.dealer_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedProforma.business_name}
                  </p>
                  {selectedProforma.business_address && (
                    <p className="text-sm text-slate-600">
                      {selectedProforma.business_address}
                    </p>
                  )}
                  <p className="text-sm text-slate-600">
                    GSTIN: {selectedProforma.gstin || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block text-left">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="bg-amber-600 text-white px-2 py-1 font-bold">
                        Invoice#
                      </span>
                      <span className="px-2 py-1 border">
                        {selectedProforma.proforma_number}
                      </span>
                      <span className="bg-amber-600 text-white px-2 py-1 font-bold">
                        Invoice Date
                      </span>
                      <span className="px-2 py-1 border">
                        {formatDate(selectedProforma.created_at)}
                      </span>
                      <span className="bg-amber-600 text-white px-2 py-1 font-bold">
                        Terms
                      </span>
                      <span className="px-2 py-1 border">Due on Receipt</span>
                      <span className="bg-amber-600 text-white px-2 py-1 font-bold">
                        Due Date
                      </span>
                      <span className="px-2 py-1 border">
                        {formatDate(selectedProforma.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
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
                        {item.description && (
                          <p className="text-xs text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="p-2 text-right">
                        {item.quantity.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        {item.rate.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-right">
                        {item.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-xs text-slate-500 italic">
                Thanks for your business.
              </p>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between border-b pb-1">
                    <span>Sub Total</span>
                    <span className="font-bold">
                      {displayedSubTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span>Tax Rate</span>
                    <span>{taxRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between bg-slate-900 text-white p-2 rounded font-bold">
                    <span>Total</span>
                    <span>
                      {displayedTotalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between bg-amber-600 text-white p-2 rounded font-bold">
                    <span>Balance Due</span>
                    <span>
                      {displayedTotalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="mt-4 border-t pt-3">
                <p className="text-sm font-bold text-slate-700">
                  Terms & Conditions
                </p>
                <p className="text-xs text-slate-500">
                  All payments must be made in full before the commencement of
                  any design work.
                </p>
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

export default function DealerProformaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <DealerProformaContent />
    </Suspense>
  );
}
