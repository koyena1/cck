"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Download,
  Plus,
  Minus
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
  dealer_purchase_price: number;
  dealer_sale_price: number;
  stock_quantity: number;
  in_stock: boolean;
}

interface CartItem {
  cartId: string;
  productId: number;
  productCode?: string;
  productName: string;
  modelNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  source: 'protechtur' | 'external';
}

export default function DealerPricingPage() {
  const [stats, setStats] = useState<any>({});
  const [products, setProducts] = useState<DealerProduct[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'purchase' | 'sale'>('stats');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);
  const [dealerId, setDealerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseSource, setPurchaseSource] = useState<'protechtur' | 'external'>('protechtur');
  const [showPriceInputDialog, setShowPriceInputDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [externalPrice, setExternalPrice] = useState('');

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      
      // Get dealer ID from localStorage
      const storedDealerId = localStorage.getItem('dealerId');
      console.log('Dealer Pricing Page - dealerId from localStorage:', storedDealerId);
      
      if (!storedDealerId) {
        console.warn('No dealer ID found in localStorage');
        setLoading(false);
        return;
      }
      
      const dId = parseInt(storedDealerId);
      console.log('Parsed dealer ID:', dId);
      setDealerId(dId);
      
      await fetchStats(dId);
      await fetchProducts(dId);
      await fetchInventory(dId);
      
      setLoading(false);
      console.log('Dealer pricing page loaded successfully');
    };

    initializePage();
  }, []);

  const fetchStats = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-transactions/stats?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchProducts = async (dId: number) => {
    try {
      const response = await fetch(`/api/dealer-products?active=true&dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products.filter((p: DealerProduct) => p.in_stock));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchInventory = async (dId: number) => {
    try {
      console.log('Fetching inventory for dealer:', dId);
      const response = await fetch(`/api/dealer-inventory?dealerId=${dId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Dealer inventory loaded - Total items:', data.inventory.length);
        
        // Log all products with their quantities
        const inventoryByProduct = data.inventory.filter((item: any) => item.quantity_available > 0)
          .map((item: any) => ({
            name: `${item.company} - ${item.product_type}`,
            model: item.model_number,
            available: item.quantity_available,
            source: item.purchase_source
          }));
        console.table(inventoryByProduct);
        
        setInventory(data.inventory);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const confirmPriceAndAddToCart = () => {
    if (!externalPrice || parseFloat(externalPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    const price = parseFloat(externalPrice);
    setShowPriceInputDialog(false);
    setExternalPrice('');
    
    if (selectedProduct) {
      addToCart(selectedProduct, 'purchase', price);
      setSelectedProduct(null);
    }
  };

  const addToCart = (product: any, priceType: 'purchase' | 'sale', customPrice?: number) => {
    const source: 'protechtur' | 'external' = priceType === 'purchase' ? purchaseSource : 'protechtur';
    
    // For external products in purchase mode, show price input dialog
    if (priceType === 'purchase' && source === 'external' && customPrice === undefined) {
      setSelectedProduct(product);
      setShowPriceInputDialog(true);
      return;
    }
    
    const price = customPrice !== undefined 
      ? customPrice 
      : Number(priceType === 'purchase' ? product.dealer_purchase_price : product.dealer_sale_price);
    const productId = priceType === 'sale' ? product.product_id : product.id;
    const cartId = priceType === 'purchase' ? `${productId}-${source}` : `${productId}-sale`;

    const existingItem = cart.find(item => item.cartId === cartId);

    if (existingItem) {
      if (priceType === 'sale') {
        const maxQty = product.quantity_available;
        if (existingItem.quantity + 1 > maxQty) {
          alert(`Cannot add more. Only ${maxQty} units available in your inventory.`);
          return;
        }
      }
      setCart(cart.map(item =>
        item.cartId === cartId
          ? { ...item, quantity: item.quantity + 1, totalPrice: Number((item.quantity + 1) * item.unitPrice) }
          : item
      ));
    } else {
      const newItem: CartItem = {
        cartId,
        productId,
        productCode: product.product_code,
        productName: `${product.company} ${product.segment}`,
        modelNumber: product.model_number,
        quantity: 1,
        unitPrice: price,
        totalPrice: price,
        source,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.cartId === cartId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const calculateCartTotal = () => {
    const protechturItems = cart.filter(i => i.source === 'protechtur');
    const externalItems = cart.filter(i => i.source === 'external');
    
    const protechturSubtotal = protechturItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const externalSubtotal = externalItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    
    const subtotal = protechturSubtotal + externalSubtotal;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    
    return {
      protechturSubtotal: Number(protechturSubtotal.toFixed(2)),
      externalSubtotal: Number(externalSubtotal.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  const getFilteredProducts = () => {
    // For sale tab, show only inventory items with available quantity
    let sourceData = activeTab === 'sale' 
      ? inventory.filter((p: any) => p.quantity_available > 0)
      : products;
    
    if (!searchTerm) return sourceData;
    
    const search = searchTerm.toLowerCase();
    return sourceData.filter((p: any) => 
      p.company.toLowerCase().includes(search) ||
      p.segment.toLowerCase().includes(search) ||
      p.model_number.toLowerCase().includes(search) ||
      p.product_type.toLowerCase().includes(search) ||
      (p.product_code && p.product_code.toLowerCase().includes(search)) ||
      (p.description && p.description.toLowerCase().includes(search))
    );
  };

  const viewInvoices = () => {
    window.location.href = '/dealer/invoices';
  };

  const generateInvoice = async (type: 'purchase' | 'sale') => {
    if (cart.length === 0) {
      alert('Cart is empty. Please add products before generating invoice.');
      return;
    }

    if (!dealerId) {
      alert('Session expired. Please login again.');
      return;
    }

    try {
      // Step 1: Create invoice
      console.log('Creating invoice with items:', cart);
      const response = await fetch('/api/dealer-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId: dealerId,
          transactionType: type,
          items: cart.map(item => ({ ...item, source: item.source || 'protechtur' })),
        })
      });

      const data = await response.json();
      console.log('Invoice creation response:', JSON.stringify(data, null, 2));

      if (data.success) {
        const invoiceId = data.invoice.id;
        
        // Step 2: Auto-finalize purchase invoices to update inventory immediately
        if (type === 'purchase') {
          console.log('Finalizing purchase invoice:', invoiceId);
          const finalizeResponse = await fetch('/api/dealer-invoices', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: invoiceId,
              finalize: true
            })
          });

          const finalizeData = await finalizeResponse.json();
          console.log('Finalize response:', JSON.stringify(finalizeData, null, 2));
          
          if (finalizeData.success) {
            // Clear cart first
            setCart([]);
            
            // Wait a moment for database to commit
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Step 3: Refresh inventory to show updated counts
            console.log('Refreshing inventory after purchase...');
            await fetchInventory(dealerId);
            await fetchProducts(dealerId);
            
            console.log('Inventory state after refresh:', inventory);
            
            // Switch to Sale Products tab to see the updated inventory
            setTimeout(() => {
              setActiveTab('sale');
              alert(`Purchase completed! Inventory updated. Check Sale Products tab to see your new stock.`);
            }, 100);
          } else {
            alert(`Invoice created but failed to finalize: ${finalizeData.error}`);
          }
        } else {
          // For sales, let them review first
          alert(`Sale invoice ${data.invoiceNumber} generated successfully! You can edit it before finalizing.`);
          setCart([]);
          window.location.href = '/dealer/invoices';
        }
      } else {
        alert(`Failed to create invoice: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice. Please try again.');
    }
  };

  const downloadInvoice = () => {
    if (!generatedInvoice) return;

    // Generate PDF invoice
    const doc = new jsPDF();
    
    // Set font styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("DEALER INVOICE", 105, 20, { align: "center" });
    
    // Invoice details
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice Number: ${generatedInvoice.invoice_number}`, 20, 35);
    doc.text(`Transaction Type: ${generatedInvoice.type.toUpperCase()}`, 20, 42);
    doc.text(`Date: ${new Date(generatedInvoice.created_at).toLocaleDateString()}`, 20, 49);
    
    // Draw line
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);
    
    // Items header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ITEMS:", 20, 65);
    
    // Items list
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let yPos = 75;
    generatedInvoice.items.forEach((item: CartItem, idx: number) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      const itemLabel = item.productCode ? `${item.productName} (${item.productCode})` : item.productName;
      doc.text(`${idx + 1}. ${itemLabel}`, 25, yPos);
      yPos += 7;
      doc.text(`   Model: ${item.modelNumber}`, 25, yPos);
      yPos += 7;
      doc.text(`   Qty: ${item.quantity} x Rs. ${item.unitPrice.toLocaleString('en-IN')} = Rs. ${item.totalPrice.toLocaleString('en-IN')}`, 25, yPos);
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
    doc.text(`Rs. ${generatedInvoice.total_amount.toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    yPos += 7;
    
    doc.text("GST (18%):", 20, yPos);
    doc.text(`Rs. ${generatedInvoice.gst_amount.toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    yPos += 10;
    
    // Draw line before total
    doc.setLineWidth(0.8);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;
    
    // Final total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("TOTAL:", 20, yPos);
    doc.text(`Rs. ${generatedInvoice.final_amount.toLocaleString('en-IN')}`, 190, yPos, { align: "right" });
    
    // Download PDF automatically
    doc.save(`${generatedInvoice.invoice_number}.pdf`);
  };

  const totals = calculateCartTotal();

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
          <p className="text-xl text-slate-600">Please log in to access pricing portal</p>
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

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-orbitron uppercase">
            Pricing Portal
          </h1>
          <p className="text-slate-600 mt-1 font-poppins text-sm sm:text-base">
            View your pricing statistics and manage transactions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors whitespace-nowrap ${
              activeTab === 'stats'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors whitespace-nowrap ${
              activeTab === 'purchase'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Buy Products
          </button>
          <button
            onClick={() => setActiveTab('sale')}
            className={`px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors whitespace-nowrap ${
              activeTab === 'sale'
                ? 'text-blue-700 border-b-2 border-blue-700'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sale Products
          </button>
          <button
            onClick={() => window.location.href = '/dealer/invoices'}
            className="px-3 sm:px-6 py-2 sm:py-3 font-bold font-poppins uppercase text-[10px] sm:text-xs tracking-widest transition-colors text-slate-500 hover:text-slate-900 whitespace-nowrap"
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

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2 font-orbitron uppercase text-sm">
                  <ShoppingCart className="w-5 h-5" />
                  Total Purchase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 font-orbitron">
                  RS {(stats.totalPurchaseAmount || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-poppins">
                  {stats.totalPurchases || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2 font-orbitron uppercase text-sm">
                  <DollarSign className="w-5 h-5" />
                  Total Sale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 font-orbitron">
                  RS {(stats.totalSaleAmount || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 mt-2 font-poppins">
                  {stats.totalSales || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-700 flex items-center gap-2 font-orbitron uppercase text-sm">
                  <TrendingUp className="w-5 h-5" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-slate-900 font-orbitron">
                  RS {(stats.totalProfit || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-600 mt-2 font-poppins">
                  Profit margin
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Buy/Sale Tabs */}
        {(activeTab === 'purchase' || activeTab === 'sale') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Products List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-white border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900 font-orbitron uppercase text-sm">
                    Available Products
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    {activeTab === 'purchase' 
                      ? 'Purchase products from Protechtur or external market' 
                      : 'Sell Protechtur catalog products at fixed price'}
                  </CardDescription>
                  
                  {/* Purchase Source Dropdown (Buy Products only) */}
                  {activeTab === 'purchase' && (
                    <div className="mt-4">
                      <label className="text-xs text-slate-500 font-poppins uppercase tracking-widest mb-1 block">
                        Purchase Source
                      </label>
                      <Select
                        value={purchaseSource}
                        onValueChange={(val: string) => setPurchaseSource(val as 'protechtur' | 'external')}
                      >
                        <SelectTrigger className="bg-white border border-slate-200 text-slate-800 w-full h-11 rounded-lg shadow-sm hover:border-slate-300 focus:ring-2 focus:ring-[#facc15]/50 focus:border-[#facc15] font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 rounded-lg shadow-xl text-slate-800">
                          <SelectItem value="protechtur" className="text-slate-800 font-medium focus:bg-slate-100 focus:text-slate-900 cursor-pointer">
                            Through Protechtur
                          </SelectItem>
                          <SelectItem value="external" className="text-slate-800 font-medium focus:bg-slate-100 focus:text-slate-900 cursor-pointer">
                            External
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="mt-4">
                    <Input
                      type="text"
                      placeholder="Search by Product ID, company, model, segment, type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-150 overflow-y-auto">
                    {getFilteredProducts().length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        {activeTab === 'sale' && !searchTerm 
                          ? 'No products in your inventory. Please purchase products first to sell them.' 
                          : searchTerm 
                          ? 'No products found matching your search' 
                          : 'No products available'
                        }
                      </div>
                    ) : (
                      getFilteredProducts().map((product, index) => (
                      <div
                        key={product.id || `product-${index}-${product.model_number}`}
                        className="p-3 sm:p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                          <div className="flex-1 w-full sm:w-auto">
                            <h3 className="font-bold text-slate-900 font-poppins text-sm sm:text-base">
                              {product.company} - {product.product_type}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono mt-1">
                              {product.model_number}
                            </p>
                            {product.product_code && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                Product ID: <span className="font-bold">{product.product_code}</span>
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-slate-600 mt-2">
                              {product.description}
                            </p>
                            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3">
                              <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                                {product.segment}
                              </Badge>
                              {activeTab === 'sale' && (
                                <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                                  Available: {product.quantity_available || 0}
                                </Badge>
                              )}
                              {activeTab === 'purchase' && (
                                <Badge variant="outline" className="text-slate-400 border-slate-400 text-xs">
                                  {product.product_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto sm:text-right sm:ml-4 gap-3 sm:gap-0">
                            {/* Hide price for external purchases */}
                            {!(activeTab === 'purchase' && purchaseSource === 'external') && (
                              <div>
                                <div className="text-xl sm:text-2xl font-black text-slate-900 font-orbitron">
                                  RS {Number(activeTab === 'purchase' 
                                    ? product.dealer_purchase_price 
                                    : product.dealer_sale_price
                                  ).toLocaleString('en-IN')}
                                </div>
                                {activeTab === 'purchase' && (
                                  <p className="text-xs text-slate-500 mt-1 text-right">
                                    Purchase Price
                                  </p>
                                )}
                                {activeTab === 'sale' && (
                                  <p className="text-xs text-slate-500 mt-1 text-right">
                                    Sale Price (Set by Protechtur)
                                  </p>
                                )}
                              </div>
                            )}
                            <Button
                              onClick={() => addToCart(product, activeTab as 'purchase' | 'sale')}
                              className="mt-0 sm:mt-2 bg-[#facc15] text-[#0f172a] hover:bg-yellow-400 font-bold"
                              size="sm"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cart */}
            <div className="space-y-4">
              <Card className="bg-white border-slate-200 lg:sticky lg:top-4">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-slate-900 font-orbitron uppercase text-xs sm:text-sm flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  {cart.length === 0 ? (
                    <p className="text-slate-500 text-sm text-center py-8">Cart is empty</p>
                  ) : (
                    <>
                      <div className="space-y-1 max-h-60 overflow-y-auto">
                        {/* Protechtur items */}
                        {cart.filter(i => i.source === 'protechtur').length > 0 && (
                          <div className="mb-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 px-1 mb-1">Protechtur</p>
                            {cart.filter(i => i.source === 'protechtur').map(item => (
                              <div key={item.cartId} className="border border-slate-200 rounded p-2 mb-1 bg-slate-50">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex-1">
                                    <p className="font-bold text-slate-900 text-xs">{item.productName}</p>
                                    {item.productCode && <p className="text-[10px] text-slate-500">{item.productCode}</p>}
                                    <p className="text-[10px] text-slate-500 font-mono">{item.modelNumber}</p>
                                  </div>
                                  <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-300 ml-1">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => updateQuantity(item.cartId, -1)} className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center text-xs">-</button>
                                    <span className="text-slate-900 font-bold w-6 text-center text-xs">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.cartId, 1)} className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center text-xs">+</button>
                                  </div>
                                  <p className="text-slate-900 font-bold font-orbitron text-sm">RS {Number(item.totalPrice).toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* External items */}
                        {cart.filter(i => i.source === 'external').length > 0 && (
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 px-1 mb-1">External</p>
                            {cart.filter(i => i.source === 'external').map(item => (
                              <div key={item.cartId} className="border border-orange-200 rounded p-2 mb-1 bg-orange-50">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex-1">
                                    <p className="font-bold text-slate-900 text-xs">{item.productName}</p>
                                    {item.productCode && <p className="text-[10px] text-slate-500">{item.productCode}</p>}
                                    <p className="text-[10px] text-slate-500 font-mono">{item.modelNumber}</p>
                                  </div>
                                  <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-300 ml-1">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => updateQuantity(item.cartId, -1)} className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center text-xs">-</button>
                                    <span className="text-slate-900 font-bold w-6 text-center text-xs">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.cartId, 1)} className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center justify-center text-xs">+</button>
                                  </div>
                                  <p className="text-slate-900 font-bold font-orbitron text-sm">RS {Number(item.totalPrice).toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-3 space-y-1.5">
                        {totals.protechturSubtotal > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-500">Protechtur Items:</span>
                            <span className="text-slate-900 font-bold">RS {totals.protechturSubtotal.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {totals.externalSubtotal > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-slate-500">External Items:</span>
                            <span className="text-orange-400 font-bold">RS {totals.externalSubtotal.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        {totals.subtotal > 0 && (
                          <>
                            <div className="flex justify-between text-xs sm:text-sm border-t border-slate-200 pt-1.5">
                              <span className="text-slate-500">Subtotal:</span>
                              <span className="text-slate-900 font-bold">RS {totals.subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-slate-500">GST (18%):</span>
                              <span className="text-slate-900 font-bold">RS {totals.gst.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm sm:text-lg border-t border-slate-200 pt-2">
                              <span className="text-blue-700 font-bold font-orbitron">TOTAL:</span>
                              <span className="text-blue-700 font-black font-orbitron">RS {totals.total.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )}
                        {totals.subtotal === 0 && (
                          <p className="text-xs text-slate-500 text-center pt-1">Cart is empty</p>
                        )}
                      </div>

                      <Button
                        onClick={() => generateInvoice(activeTab as 'purchase' | 'sale')}
                        className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold font-poppins uppercase text-xs sm:text-sm"
                      >
                        Generate Invoice
                      </Button>
                      <Button
                        onClick={viewInvoices}
                        variant="outline"
                        className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-poppins uppercase text-xs sm:text-sm"
                      >
                        View My Invoices
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-orbitron text-lg sm:text-xl">Invoice Generated</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs sm:text-sm">
              Your {generatedInvoice?.type} invoice has been created successfully
            </DialogDescription>
          </DialogHeader>
          {generatedInvoice && (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-slate-50 p-3 sm:p-4 rounded border border-slate-200">
                <p className="text-xs sm:text-sm text-slate-500">Invoice Number</p>
                <p className="text-base sm:text-lg font-black text-blue-700 font-mono break-all">{generatedInvoice.invoice_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-slate-500">Total Amount</p>
                  <p className="text-slate-900 font-bold text-sm sm:text-base">RS {generatedInvoice.total_amount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">GST</p>
                  <p className="text-slate-900 font-bold text-sm sm:text-base">RS {generatedInvoice.gst_amount.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-xs text-slate-600">Final Amount (Inc. GST)</p>
                <p className="text-xl sm:text-2xl font-black text-blue-700 font-orbitron">
                  RS {generatedInvoice.final_amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={downloadInvoice}
              className="bg-slate-900 text-white hover:bg-slate-800 font-bold w-full sm:w-auto text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Download Invoice
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full sm:w-auto text-xs sm:text-sm"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Input Dialog for External Products */}
      <Dialog open={showPriceInputDialog} onOpenChange={setShowPriceInputDialog}>
        <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-orbitron text-lg sm:text-xl">Put the Price</DialogTitle>
            <DialogDescription className="text-slate-500 text-xs sm:text-sm">
              Enter the price you purchased this product for
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <p className="text-xs text-slate-500">Product</p>
                <p className="text-base font-bold text-slate-900">{selectedProduct.company} - {selectedProduct.product_type}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">{selectedProduct.model_number}</p>
                {selectedProduct.product_code && (
                  <p className="text-[10px] text-slate-500 mt-1">Product ID: {selectedProduct.product_code}</p>
                )}
              </div>
              
              <div>
                <label className="text-sm text-slate-700 font-medium mb-2 block">
                  Purchase Price (RS)
                </label>
                <Input
                  type="number"
                  placeholder="Enter price"
                  value={externalPrice}
                  onChange={(e) => setExternalPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      confirmPriceAndAddToCart();
                    }
                  }}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 text-lg"
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={confirmPriceAndAddToCart}
              className="bg-slate-900 text-white hover:bg-slate-800 font-bold w-full sm:w-auto"
            >
              Add to Cart
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowPriceInputDialog(false);
                setExternalPrice('');
                setSelectedProduct(null);
              }}
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
