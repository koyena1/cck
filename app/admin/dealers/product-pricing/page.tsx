"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  Download,
  Package,
  TrendingUp,
  Edit,
  Trash2,
  Plus,
  FileSpreadsheet,
  Search,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DealerProduct {
  id: number;
  product_code?: string;
  company: string;
  segment: string;
  model_number: string;
  product_type: string;
  description: string;
  specifications: string;
  base_price: number;
  purchase_percentage: number;
  sale_percentage: number;
  dealer_purchase_price: number;
  dealer_sale_price: number;
  stock_quantity: number;
  in_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DealerOption {
  dealer_id: number;
  business_name?: string;
  full_name?: string;
  unique_dealer_id?: string;
  status?: string;
}

const DEFAULT_PRODUCT_TYPES = ['Single Product', 'Combo Product'];

export default function DealerProductPricingPage() {
  const [products, setProducts] = useState<DealerProduct[]>([]);
  const [dealers, setDealers] = useState<DealerOption[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<string>('global');
  const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false);
  const [dealerSearch, setDealerSearch] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Percentage adjustment states
  const [adjustmentFilter, setAdjustmentFilter] = useState("all");
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [percentage, setPercentage] = useState("");
  const [priceType, setPriceType] = useState("both");
  const [adjusting, setAdjusting] = useState(false);

  // Add/Edit Product Dialog states
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DealerProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [productForm, setProductForm] = useState({
    company: '',
    segment: '',
    model_number: '',
    product_type: '',
    description: '',
    specifications: '',
    base_price: '',
    purchase_percentage: '',
    sale_percentage: '',
    stock_quantity: '',
    in_stock: true,
    is_active: true
  });

  useEffect(() => {
    fetchDealers();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedDealerId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchDealers();
    }, 30000);

    const handleWindowFocus = () => {
      fetchDealers();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const fetchDealers = async () => {
    try {
      const response = await fetch('/api/dealers');
      const data = await response.json();
      if (data.success) {
        setDealers((data.dealers || []).filter((d: DealerOption) => d.status !== 'Rejected'));
      }
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const dealerQuery = selectedDealerId !== 'global' ? `?dealerId=${selectedDealerId}` : '';
      const response = await fetch(`/api/dealer-products${dealerQuery}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        setFilters(data.filters);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('uploadedBy', localStorage.getItem('userName') || 'admin');
    if (selectedDealerId !== 'global') {
      formData.append('dealerId', selectedDealerId);
    }

    try {
      const response = await fetch('/api/dealer-products/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const sampleErrors = (data.stats?.errors || []).slice(0, 3);
        const errorBlock = sampleErrors.length > 0
          ? `\n\nSample Errors:\n- ${sampleErrors.join('\n- ')}`
          : '';
        alert(`Upload successful!\nTotal: ${data.stats.total}\nSuccessful: ${data.stats.successful}\nFailed: ${data.stats.failed}${errorBlock}`);
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchProducts();
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Download the sample Excel template
    window.open('/templates/dealer-product-pricing-template.xlsx', '_blank');
  };

  const handlePriceAdjustment = async () => {
    const pct = parseFloat(percentage);
    
    if (isNaN(pct) || pct === 0) {
      alert('Please enter a valid percentage');
      return;
    }

    if (adjustmentFilter !== 'all' && !adjustmentValue) {
      alert('Please select a value for the filter');
      return;
    }

    const confirmMsg = `Are you sure you want to ${pct > 0 ? 'increase' : 'decrease'} ${
      priceType === 'both' ? 'purchase and sale prices' : priceType === 'purchase' ? 'purchase prices' : 'sale prices'
    } by ${Math.abs(pct)}% for ${adjustmentFilter === 'all' ? 'ALL products' : `${adjustmentFilter}: ${adjustmentValue}`}?`;

    if (!confirm(confirmMsg)) return;

    setAdjusting(true);

    try {
      const response = await fetch('/api/dealer-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterType: adjustmentFilter,
          filterValue: adjustmentValue,
          percentage: pct,
          priceType,
          dealerId: selectedDealerId !== 'global' ? Number(selectedDealerId) : null
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Prices updated successfully!');
        setPercentage('');
        setAdjustmentValue('');
        fetchProducts();
      } else {
        alert(`Failed to update prices: ${data.error}`);
      }
    } catch (error) {
      console.error('Price adjustment error:', error);
      alert('Failed to adjust prices');
    } finally {
      setAdjusting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const isDealerSpecific = selectedDealerId !== 'global';
    const confirmMessage = isDealerSpecific
      ? 'Are you sure you want to remove this selected dealer pricing for this product?'
      : 'Are you sure you want to delete this product?';

    if (!confirm(confirmMessage)) return;

    try {
      const deleteUrl = selectedDealerId !== 'global'
        ? `/api/dealer-products?id=${id}&dealerId=${selectedDealerId}`
        : `/api/dealer-products?id=${id}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Product deleted successfully');
        fetchProducts();
      } else {
        alert(`Failed to delete product: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete product');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      company: '',
      segment: '',
      model_number: '',
      product_type: '',
      description: '',
      specifications: '',
      base_price: '',
      purchase_percentage: '',
      sale_percentage: '',
      stock_quantity: '0',
      in_stock: true,
      is_active: true
    });
    setShowProductDialog(true);
  };

  const handleEditProduct = (product: DealerProduct) => {
    setEditingProduct(product);
    setProductForm({
      company: product.company,
      segment: product.segment,
      model_number: product.model_number,
      product_type: product.product_type,
      description: product.description || '',
      specifications: product.specifications || '',
      base_price: product.base_price.toString(),
      purchase_percentage: product.purchase_percentage.toString(),
      sale_percentage: product.sale_percentage.toString(),
      stock_quantity: product.stock_quantity.toString(),
      in_stock: product.in_stock,
      is_active: product.is_active
    });
    setShowProductDialog(true);
  };

  const handleSaveProduct = async () => {
    // Validate required fields
    if (!productForm.company || !productForm.segment || !productForm.model_number || !productForm.product_type) {
      alert('Please fill in all required fields: Company, Segment, Model Number, and Product Type');
      return;
    }

    if (!productForm.base_price || parseFloat(productForm.base_price) <= 0) {
      alert('Please enter a valid base price');
      return;
    }

    setSaving(true);

    try {
      const basePrice = parseFloat(productForm.base_price);
      const purchasePercentage = parseFloat(productForm.purchase_percentage) || 0;
      const salePercentage = parseFloat(productForm.sale_percentage) || 0;

      const payload = {
        id: editingProduct?.id,
        dealerId: selectedDealerId !== 'global' ? Number(selectedDealerId) : null,
        company: productForm.company,
        segment: productForm.segment,
        model_number: productForm.model_number,
        product_type: productForm.product_type,
        description: productForm.description,
        specifications: productForm.specifications,
        base_price: basePrice,
        purchase_percentage: purchasePercentage,
        sale_percentage: salePercentage,
        stock_quantity: parseInt(productForm.stock_quantity) || 0,
        in_stock: productForm.in_stock,
        is_active: productForm.is_active
      };

      const response = await fetch('/api/dealer-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
        setShowProductDialog(false);
        fetchProducts();
      } else {
        alert(`Failed to save product: ${data.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [
      product.product_code || '',
      product.company,
      product.segment,
      product.model_number,
      product.product_type,
      product.description || '',
    ].some((value) => value.toLowerCase().includes(q));
  });

  const selectedDealerLabel = selectedDealerId === 'global'
    ? 'Global Default (All Dealers)'
    : (() => {
        const d = dealers.find((dealer) => String(dealer.dealer_id) === selectedDealerId);
        if (!d) return 'Select Dealer';
        return `${d.business_name || d.full_name || `Dealer ${d.dealer_id}`}${d.unique_dealer_id ? ` (${d.unique_dealer_id})` : ''}`;
      })();

  const visibleDealers = dealers.filter((dealer) => {
    const q = dealerSearch.trim().toLowerCase();
    if (!q) return true;
    return [
      dealer.business_name || '',
      dealer.full_name || '',
      dealer.unique_dealer_id || '',
      String(dealer.dealer_id),
    ].some((value) => value.toLowerCase().includes(q));
  });

  const productTypeOptions = Array.from(
    new Set([...(filters.productTypes || []), ...DEFAULT_PRODUCT_TYPES])
  ).sort((a, b) => a.localeCompare(b));

  if (loading) {
    return <div className="p-8 dark:text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Dealer Product Pricing</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage dealer products and pricing through Excel upload or manual adjustments
        </p>
      </div>

      {/* Excel Upload Section */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-linear-to-r from-blue-50 dark:from-blue-950 to-indigo-50 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <FileSpreadsheet className="w-5 h-5" />
            Upload Pricing Excel File
          </CardTitle>
          <CardDescription className="text-blue-700 dark:text-blue-300">
            Upload your product pricing Excel file to update dealer prices in bulk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download Template Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="gap-2 border-green-600 text-green-700 hover:bg-green-50"
            >
              <Download className="w-4 h-4" />
              Download Sample Template
            </Button>
          </div>

          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : uploadFile
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className={`w-12 h-12 mx-auto mb-4 ${uploadFile ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`} />
            {uploadFile ? (
              <div>
                <p className="text-green-700 dark:text-green-300 font-semibold mb-2">File selected:</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{uploadFile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ({(uploadFile.size / 1024).toFixed(2)} KB)
                </p>
              </div>
            ) : (
              <div>
                <p className="text-slate-600 dark:text-slate-400 font-semibold mb-2">
                  Drag & drop your Excel file here, or click to browse
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Supports .xlsx and .xls files</p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {uploadFile && (
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Clear
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? 'Uploading...' : 'Upload & Update Prices'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Adjustment Section */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-linear-to-r from-purple-50 dark:from-purple-950 to-pink-50 dark:to-pink-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <TrendingUp className="w-5 h-5" />
            Bulk Price Adjustment
          </CardTitle>
          <CardDescription className="text-purple-700 dark:text-purple-300">
            Adjust prices by percentage based on segment, company, product type, or all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2 lg:col-span-2 relative">
              <Label className="font-bold">Dealer</Label>
              <button
                type="button"
                className="w-full h-10 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 px-3 text-left text-sm flex items-center justify-between"
                onClick={() => setDealerDropdownOpen((v) => !v)}
              >
                <span className="truncate">{selectedDealerLabel}</span>
                <ChevronDown className="w-4 h-4 opacity-70" />
              </button>
              {dealerDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-2 space-y-2">
                  <Input
                    value={dealerSearch}
                    onChange={(e) => setDealerSearch(e.target.value)}
                    placeholder="Search dealer by name or unique ID"
                    className="h-8"
                  />
                  <div className="max-h-52 overflow-y-auto space-y-1">
                    <button
                      type="button"
                      className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => {
                        setSelectedDealerId('global');
                        setDealerDropdownOpen(false);
                        setDealerSearch('');
                      }}
                    >
                      Global Default (All Dealers)
                    </button>
                    {visibleDealers.map((dealer) => (
                      <button
                        key={dealer.dealer_id}
                        type="button"
                        className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => {
                          setSelectedDealerId(String(dealer.dealer_id));
                          setDealerDropdownOpen(false);
                          setDealerSearch('');
                        }}
                      >
                        {(dealer.business_name || dealer.full_name || `Dealer ${dealer.dealer_id}`)
                          + (dealer.unique_dealer_id ? ` (${dealer.unique_dealer_id})` : '')}
                      </button>
                    ))}
                    {visibleDealers.length === 0 && (
                      <p className="text-xs text-slate-500 px-2 py-1">No dealers found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentFilter" className="font-bold">Filter By</Label>
              <Select value={adjustmentFilter} onValueChange={setAdjustmentFilter}>
                <SelectTrigger id="adjustmentFilter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="segment">Segment</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="product_type">Product Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {adjustmentFilter !== 'all' && (
              <div className="space-y-2">
                <Label htmlFor="adjustmentValue" className="font-bold">Select {adjustmentFilter}</Label>
                <Select value={adjustmentValue} onValueChange={setAdjustmentValue}>
                  <SelectTrigger id="adjustmentValue">
                    <SelectValue placeholder={`Choose ${adjustmentFilter}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentFilter === 'segment' && filters.segments?.map((seg: string) => (
                      <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                    ))}
                    {adjustmentFilter === 'company' && filters.companies?.map((comp: string) => (
                      <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                    ))}
                    {adjustmentFilter === 'product_type' && productTypeOptions.map((type: string) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="priceType" className="font-bold">Price Type</Label>
              <Select value={priceType} onValueChange={setPriceType}>
                <SelectTrigger id="priceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both Prices</SelectItem>
                  <SelectItem value="purchase">Purchase Price</SelectItem>
                  <SelectItem value="sale">Sale Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage" className="font-bold">Set New Percentage</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                placeholder="e.g., -10 for 10% discount, +15 for 15% markup"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex items-end">
              <Button
                onClick={handlePriceAdjustment}
                disabled={adjusting || !percentage}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {adjusting ? 'Applying...' : 'Set Percentage'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Sets new percentage (replaces old value). Purchase from Base: -10 = 10% discount. Sale from Purchase: +15 = 15% markup. Example: -10% on RS 3500 base = RS 3150 purchase.
          </p>
        </CardContent>
      </Card>

      {/* Products Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-100">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">{filters.companies?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-600">{filters.segments?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-600">
              {products.filter(p => p.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Package className="w-5 h-5" />
              All Dealer Products
            </CardTitle>
            <Button
              onClick={handleAddProduct}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          </div>
          <div className="mt-3 max-w-xs">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Product ID, model, company"
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase dark:text-slate-300">Product ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase dark:text-slate-300">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase dark:text-slate-300">Segment</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase dark:text-slate-300">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase dark:text-slate-300">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase dark:text-slate-300">Base Price</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase dark:text-slate-300">
                    <div>Purchase %</div>
                    <div className="font-normal text-[10px] text-gray-500 dark:text-gray-400">(from Base)</div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase dark:text-slate-300">
                    <div>Sale %</div>
                    <div className="font-normal text-[10px] text-gray-500 dark:text-gray-400">(from Purchase)</div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase dark:text-slate-300">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-700">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${!product.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {product.product_code || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{product.company}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{product.segment}</td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">
                      {product.model_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{product.product_type}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                      RS {product.base_price.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-blue-600">{product.purchase_percentage > 0 ? '+' : ''}{product.purchase_percentage}%</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">RS {product.dealer_purchase_price.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-600">{product.sale_percentage > 0 ? '+' : ''}{product.sale_percentage}%</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">RS {product.dealer_sale_price.toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        product.in_stock
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditProduct(product)}
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No products match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-900 dark:text-slate-100">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {editingProduct ? 'Update product details below' : 'Fill in the details to add a new dealer product'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Row 1: Company and Segment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="font-bold">Company *</Label>
                <Input
                  id="company"
                  value={productForm.company}
                  onChange={(e) => setProductForm({...productForm, company: e.target.value})}
                  placeholder="e.g., CP PLUS, Hikvision"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segment" className="font-bold">Segment *</Label>
                <Input
                  id="segment"
                  value={productForm.segment}
                  onChange={(e) => setProductForm({...productForm, segment: e.target.value})}
                  placeholder="e.g., CCTV, Access Control"
                />
              </div>
            </div>

            {/* Row 2: Model Number and Product Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model_number" className="font-bold">Model Number *</Label>
                <Input
                  id="model_number"
                  value={productForm.model_number}
                  onChange={(e) => setProductForm({...productForm, model_number: e.target.value})}
                  placeholder="e.g., CP-UNC-TA22L2-V3"
                  disabled={!!editingProduct}
                />
                {editingProduct && <p className="text-xs text-gray-500 dark:text-gray-400">Model number cannot be changed</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="product_type" className="font-bold">Product Type *</Label>
                <Input
                  id="product_type"
                  list="product-type-options"
                  value={productForm.product_type}
                  onChange={(e) => setProductForm({...productForm, product_type: e.target.value})}
                  placeholder="e.g., Single Product, Combo Product"
                />
                <datalist id="product-type-options">
                  {productTypeOptions.map((type: string) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Row 3: Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="font-bold">Description</Label>
              <Input
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="Product description"
              />
            </div>

            {/* Row 4: Specifications */}
            <div className="space-y-2">
              <Label htmlFor="specifications" className="font-bold">Specifications</Label>
              <Input
                id="specifications"
                value={productForm.specifications}
                onChange={(e) => setProductForm({...productForm, specifications: e.target.value})}
                placeholder="Technical specifications"
              />
            </div>

            {/* Row 5: Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price" className="font-bold">Base Price (RS) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={productForm.base_price}
                  onChange={(e) => setProductForm({...productForm, base_price: e.target.value})}
                  placeholder="3500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase_percentage" className="font-bold">Purchase % (from Base)</Label>
                <Input
                  id="purchase_percentage"
                  type="number"
                  step="0.01"
                  value={productForm.purchase_percentage}
                  onChange={(e) => setProductForm({...productForm, purchase_percentage: e.target.value})}
                  placeholder="-10 (10% discount)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Negative for discount</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_percentage" className="font-bold">Sale % (from Purchase)</Label>
                <Input
                  id="sale_percentage"
                  type="number"
                  step="0.01"
                  value={productForm.sale_percentage}
                  onChange={(e) => setProductForm({...productForm, sale_percentage: e.target.value})}
                  placeholder="15 (15% markup)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Positive for markup</p>
              </div>
            </div>

            {/* Price Preview */}
            {productForm.base_price && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">Price Preview:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Base Price:</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-slate-100">RS {parseFloat(productForm.base_price).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Dealer Purchase:</p>
                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">
                      RS {(parseFloat(productForm.base_price) * (1 + (parseFloat(productForm.purchase_percentage) || 0) / 100)).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Dealer Sale:</p>
                    <p className="font-bold text-lg text-green-600 dark:text-green-400">
                      RS {(parseFloat(productForm.base_price) * (1 + (parseFloat(productForm.purchase_percentage) || 0) / 100) * (1 + (parseFloat(productForm.sale_percentage) || 0) / 100)).toLocaleString('en-IN', {maximumFractionDigits: 2})}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Row 6: Stock */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity" className="font-bold">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={productForm.stock_quantity}
                  onChange={(e) => setProductForm({...productForm, stock_quantity: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="in_stock" className="font-bold">In Stock</Label>
                <Select 
                  value={productForm.in_stock.toString()} 
                  onValueChange={(v: string) => setProductForm({...productForm, in_stock: v === 'true'})}
                >
                  <SelectTrigger id="in_stock">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active" className="font-bold">Active</Label>
                <Select 
                  value={productForm.is_active.toString()} 
                  onValueChange={(v: string) => setProductForm({...productForm, is_active: v === 'true'})}
                >
                  <SelectTrigger id="is_active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
