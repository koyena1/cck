"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Archive,
  ShoppingCart,
  MinusCircle,
  Flag
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface UrgencyFlag {
  flagType: string;
  note: string | null;
  flaggedAt: string;
}

interface StockItem {
  id: number | null;
  product_id: number;
  product_code?: string;
  company: string;
  segment: string;
  model_number: string;
  product_type: string;
  description: string;
  dealer_purchase_price: number;
  dealer_sale_price: number;
  quantity_purchased: number;
  quantity_sold: number;
  quantity_available: number;
  last_purchase_date: string | null;
  last_sale_date: string | null;
  created_at: string;
  updated_at: string;
}

interface StockTrend {
  product_id: number;
  recent_purchases: number;
  recent_sales: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export default function StockManagementPage() {
  const searchParams = useSearchParams();
  const filterParam = (searchParams?.get('filter') || 'all') as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  
  const [stock, setStock] = useState<StockItem[]>([]);
  const [filteredStock, setFilteredStock] = useState<StockItem[]>([]);
  const [trends, setTrends] = useState<Map<number, StockTrend>>(new Map());
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>(filterParam);
  const [urgencyFlags, setUrgencyFlags] = useState<Record<number, UrgencyFlag>>({});

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
      
      await fetchStock(dId);
      await fetchStockTrends(dId);
      await fetchUrgencyFlags(dId);

      setLoading(false);
    };

    initializePage();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterStatus, stock]);

  const fetchStock = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-inventory?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setStock(data.inventory);
      }
    } catch (error) {
      console.error('Failed to fetch stock:', error);
    }
  };

  const fetchUrgencyFlags = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer/stock-flags?dealerId=${dId}`);
      const data = await response.json();
      if (data.success) setUrgencyFlags(data.flags);
    } catch (error) {
      console.error('Failed to fetch urgency flags:', error);
    }
  };

  const fetchStockTrends = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-stock-trends?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        const trendsMap = new Map();
        data.trends.forEach((trend: StockTrend) => {
          trendsMap.set(trend.product_id, trend);
        });
        setTrends(trendsMap);
      }
    } catch (error) {
      console.error('Failed to fetch stock trends:', error);
    }
  };

  const applyFilters = () => {
    let filtered = stock;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        (item.product_code && item.product_code.toLowerCase().includes(query)) ||
        item.company.toLowerCase().includes(query) ||
        item.model_number.toLowerCase().includes(query) ||
        item.product_type.toLowerCase().includes(query) ||
        item.segment.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (filterStatus === 'out-of-stock') return item.quantity_available === 0;
        if (filterStatus === 'low-stock') return item.quantity_available > 0 && item.quantity_available < 5;
        if (filterStatus === 'in-stock') return item.quantity_available >= 5;
        return true;
      });
    }

    setFilteredStock(filtered);
  };

  const getTrendIndicator = (productId: number) => {
    const trend = trends.get(productId);
    if (!trend) return null;

    if (trend.trend === 'increasing') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-semibold">+{trend.recent_purchases}</span>
        </div>
      );
    } else if (trend.trend === 'decreasing') {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs font-semibold">-{trend.recent_sales}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <MinusCircle className="w-4 h-4" />
        <span className="text-xs font-semibold">Stable</span>
      </div>
    );
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">Out of Stock</Badge>;
    } else if (quantity < 5) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">In Stock</Badge>;
  };

  const calculateStats = () => {
    const totalProducts = stock.length;
    const inStock = stock.filter(item => item.quantity_available >= 5).length;
    const lowStock = stock.filter(item => item.quantity_available > 0 && item.quantity_available < 5).length;
    const outOfStock = stock.filter(item => item.quantity_available === 0).length;
    const totalValue = stock.reduce((sum, item) => sum + (item.quantity_available * item.dealer_purchase_price), 0);

    return { totalProducts, inStock, lowStock, outOfStock, totalValue };
  };

  const handleRefresh = async () => {
    if (dealerId) {
      setLoading(true);
      await fetchStock(dealerId);
      await fetchStockTrends(dealerId);
      await fetchUrgencyFlags(dealerId);
      setLoading(false);
    }
  };

  const FLAG_LABELS: Record<string, { label: string; color: string }> = {
    low_stock: { label: 'Low Stock', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    out_of_stock: { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-300' },
    stale: { label: 'Update Needed', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    urgent: { label: 'Urgent Update', color: 'bg-red-100 text-red-700 border-red-300' },
  };

  const exportToCSV = () => {
    const headers = ['Product ID', 'Company', 'Model Number', 'Type', 'Purchased', 'Sold', 'Available', 'Purchase Price', 'Sale Price', 'Stock Value'];
    const csvData = filteredStock.map(item => [
      item.product_code || '',
      item.company,
      item.model_number,
      item.product_type,
      item.quantity_purchased,
      item.quantity_sold,
      item.quantity_available,
      item.dealer_purchase_price,
      item.dealer_sale_price,
      (item.quantity_available * item.dealer_purchase_price).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-[#facc15] mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 bg-[#f8fafc] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] dark:text-slate-100 font-orbitron">Stock Management</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm sm:text-base">Track your inventory and product availability</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" className="gap-2 flex-1 sm:flex-initial">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={exportToCSV} className="bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a] font-semibold gap-2 flex-1 sm:flex-initial">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Admin Urgency Flags Banner */}
      {Object.keys(urgencyFlags).length > 0 && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Flag className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-300">
                  Admin Flagged: {Object.keys(urgencyFlags).length} item{Object.keys(urgencyFlags).length !== 1 ? 's' : ''} need urgent stock update
                </h3>
                <p className="text-sm text-red-800 dark:text-red-400 mt-0.5">
                  Items marked in red below require your immediate attention. Please update their stock levels.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-1 sm:gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
              <span className="truncate">Total Products</span>
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-[#0f172a] dark:text-slate-100">{stats.totalProducts}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-1 sm:gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              <span className="truncate">In Stock</span>
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{stats.inStock}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-1 sm:gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
              <span className="truncate">Low Stock</span>
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600">{stats.lowStock}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-1 sm:gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <Archive className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              <span className="truncate">Out of Stock</span>
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">{stats.outOfStock}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 col-span-2 sm:col-span-1">
          <CardHeader className="pb-2 sm:pb-3">
            <CardDescription className="flex items-center gap-1 sm:gap-2 dark:text-slate-400 text-xs sm:text-sm">
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
              <span className="truncate">Stock Value</span>
            </CardDescription>
            <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 truncate">RS {stats.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by Product ID, company, model, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-200 dark:border-slate-700"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-48 border-slate-200 dark:border-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Stock Table */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-700">
          <CardTitle className="font-orbitron text-xs sm:text-sm uppercase flex items-center gap-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#0f172a] dark:text-slate-100" />
            Inventory Stock
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {filteredStock.length} {filteredStock.length === 1 ? 'product' : 'products'} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800">
                  <TableHead className="font-semibold text-xs">Product ID</TableHead>
                  <TableHead className="font-semibold text-xs">Company</TableHead>
                  <TableHead className="font-semibold text-xs">Model Number</TableHead>
                  <TableHead className="font-semibold text-xs hidden sm:table-cell">Type</TableHead>
                  <TableHead className="font-semibold text-center text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-right text-xs hidden md:table-cell">Purchased</TableHead>
                  <TableHead className="font-semibold text-right text-xs hidden md:table-cell">Sold</TableHead>
                  <TableHead className="font-semibold text-right text-xs">Available</TableHead>
                  <TableHead className="font-semibold text-center text-xs hidden lg:table-cell">Trend</TableHead>
                  <TableHead className="font-semibold text-right text-xs hidden lg:table-cell">Unit Price</TableHead>
                  <TableHead className="font-semibold text-right text-xs hidden xl:table-cell">Stock Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-semibold">No stock found</p>
                      <p className="text-sm">Start purchasing products to build your inventory</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStock.map((item) => {
                    const flag = urgencyFlags[item.product_id];
                    return (
                    <TableRow key={item.product_id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      flag ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-400' : ''
                    }`}>
                      <TableCell>
                        <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.product_code || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-xs sm:text-sm">
                        {item.company}
                        {flag && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              FLAG_LABELS[flag.flagType]?.color
                            }`}>
                              <Flag className="w-2.5 h-2.5" />
                              {FLAG_LABELS[flag.flagType]?.label || flag.flagType}
                            </span>
                            {flag.note && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{flag.note}</p>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs sm:text-sm">{item.model_number}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{item.product_type}</TableCell>
                      <TableCell className="text-center">
                        {getStockBadge(item.quantity_available)}
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-xs sm:text-sm">
                          <TrendingUp className="w-3 h-3" />
                          {item.quantity_purchased}
                        </span>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-orange-600 font-semibold text-xs sm:text-sm">
                          <TrendingDown className="w-3 h-3" />
                          {item.quantity_sold}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold text-base sm:text-lg ${
                          item.quantity_available === 0 ? 'text-red-600' :
                          item.quantity_available <= 10 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {item.quantity_available}
                        </span>
                      </TableCell>
                      <TableCell className="text-center hidden lg:table-cell">
                        {getTrendIndicator(item.product_id)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm hidden lg:table-cell">
                        RS {item.dealer_purchase_price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-bold text-purple-600 text-xs sm:text-sm hidden xl:table-cell">
                        RS {(item.quantity_available * item.dealer_purchase_price).toLocaleString('en-IN')}
                      </TableCell>

                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Low Stock Alert</h3>
                <p className="text-sm text-yellow-800 mt-1">
                  You have {stats.lowStock} {stats.lowStock === 1 ? 'product' : 'products'} with low stock levels. Consider reordering soon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Out of Stock Alert */}
      {stats.outOfStock > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Archive className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Out of Stock Alert</h3>
                <p className="text-sm text-red-800 mt-1">
                  You have {stats.outOfStock} {stats.outOfStock === 1 ? 'product' : 'products'} that are out of stock. Reorder to maintain inventory.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
