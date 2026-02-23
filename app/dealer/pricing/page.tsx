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
  productId: number;
  productName: string;
  modelNumber: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
      await fetchProducts();
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/dealer-products?active=true');
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
      const response = await fetch(`/api/dealer-inventory?dealerId=${dId}`);
      const data = await response.json();
      
      if (data.success) {
        setInventory(data.inventory);
        console.log('Dealer inventory loaded:', data.inventory.length, 'items');
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  const addToCart = (product: any, priceType: 'purchase' | 'sale') => {
    const price = Number(priceType === 'purchase' ? product.dealer_purchase_price : product.dealer_sale_price);
    const productId = priceType === 'sale' ? product.product_id : product.id;
    const existingItem = cart.find(item => item.productId === productId);

    console.log('=== Add to Cart ===');
    console.log('Product:', product.model_number);
    console.log('Price Type:', priceType);
    console.log('Unit Price:', price);
    console.log('Product ID:', productId);

    if (existingItem) {
      // For sales, check inventory limit
      if (priceType === 'sale') {
        const maxQty = product.quantity_available;
        if (existingItem.quantity + 1 > maxQty) {
          alert(`Cannot add more. Only ${maxQty} units available in your inventory.`);
          return;
        }
      }

      // Update quantity for existing item
      const updatedCart = cart.map(item =>
        item.productId === productId
          ? {
            ...item,
            quantity: item.quantity + 1,
            totalPrice: Number((item.quantity + 1) * item.unitPrice)
          }
          : item
      );
      setCart(updatedCart);
      console.log('Updated existing item. New quantity:', existingItem.quantity + 1);
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: productId,
        productName: `${product.company} ${product.segment}`,
        modelNumber: product.model_number,
        quantity: 1,
        unitPrice: price,
        totalPrice: price
      };
      setCart([...cart, newItem]);
      console.log('Added new item to cart:', newItem);
    }
    
    console.log('Total cart items:', cart.length + 1);
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.unitPrice
        };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const calculateCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  };

  const getFilteredProducts = () => {
    // For sale tab, show only inventory items
    const sourceData = activeTab === 'sale' ? inventory : products;
    if (!searchTerm) return sourceData;
    
    const search = searchTerm.toLowerCase();
    return sourceData.filter((p: any) => 
      p.company.toLowerCase().includes(search) ||
      p.segment.toLowerCase().includes(search) ||
      p.model_number.toLowerCase().includes(search) ||
      p.product_type.toLowerCase().includes(search) ||
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
      const response = await fetch('/api/dealer-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId: dealerId,
          transactionType: type,
          items: cart
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Invoice ${data.invoiceNumber} generated successfully! You can edit it before finalizing.`);
        setCart([]);
        // Redirect to invoices page where they can view and edit
        window.location.href = '/dealer/invoices';
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
      doc.text(`${idx + 1}. ${item.productName}`, 25, yPos);
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
          <p className="text-xl text-slate-400">Please log in to access pricing portal</p>
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
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-[#facc15] font-orbitron uppercase">
            Pricing Portal
          </h1>
          <p className="text-slate-400 mt-1 font-poppins">
            View your pricing statistics and manage transactions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors ${
              activeTab === 'stats'
                ? 'text-[#facc15] border-b-2 border-[#facc15]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors ${
              activeTab === 'purchase'
                ? 'text-[#facc15] border-b-2 border-[#facc15]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Buy Products
          </button>
          <button
            onClick={() => setActiveTab('sale')}
            className={`px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors ${
              activeTab === 'sale'
                ? 'text-[#facc15] border-b-2 border-[#facc15]'
                : 'text-slate-400 hover:text-white'
            }`}
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
            onClick={() => window.location.href = '/dealer/transactions'}
            className="px-6 py-3 font-bold font-poppins uppercase text-xs tracking-widest transition-colors text-slate-400 hover:text-white"
          >
            Transactions
          </button>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-blue-400 flex items-center gap-2 font-orbitron uppercase text-sm">
                  <ShoppingCart className="w-5 h-5" />
                  Total Purchase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white font-orbitron">
                  ₹{(stats.totalPurchaseAmount || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mt-2 font-poppins">
                  {stats.totalPurchases || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2 font-orbitron uppercase text-sm">
                  <DollarSign className="w-5 h-5" />
                  Total Sale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white font-orbitron">
                  ₹{(stats.totalSaleAmount || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mt-2 font-poppins">
                  {stats.totalSales || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-700">
              <CardHeader>
                <CardTitle className="text-[#facc15] flex items-center gap-2 font-orbitron uppercase text-sm">
                  <TrendingUp className="w-5 h-5" />
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-white font-orbitron">
                  ₹{(stats.totalProfit || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-300 mt-2 font-poppins">
                  Profit margin
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Buy/Sale Tabs */}
        {(activeTab === 'purchase' || activeTab === 'sale') && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Products List */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-[#facc15] font-orbitron uppercase text-sm">
                    Available Products
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {activeTab === 'purchase' 
                      ? 'Purchase products at dealer buying price' 
                      : 'Sell products at dealer sale price'}
                  </CardDescription>
                  
                  {/* Search Input */}
                  <div className="mt-4">
                    <Input
                      type="text"
                      placeholder="Search by company, model, segment, type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    {getFilteredProducts().length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        {activeTab === 'sale' && !searchTerm 
                          ? 'No products in your inventory. Please purchase products first to sell them.' 
                          : searchTerm 
                          ? 'No products found matching your search' 
                          : 'No products available'
                        }
                      </div>
                    ) : (
                      getFilteredProducts().map((product) => (
                      <div
                        key={product.id}
                        className="p-4 border-b border-slate-700 hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-white font-poppins">
                              {product.company} - {product.product_type}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono mt-1">
                              {product.model_number}
                            </p>
                            <p className="text-sm text-slate-300 mt-2">
                              {product.description}
                            </p>
                            <div className="flex gap-4 mt-3">
                              <Badge variant="outline" className="text-blue-400 border-blue-400">
                                {product.segment}
                              </Badge>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                {activeTab === 'sale' 
                                  ? `Available: ${product.quantity_available || 0}`
                                  : `Stock: ${product.stock_quantity || 0}`
                                }
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-2xl font-black text-[#facc15] font-orbitron">
                              ₹{Number(activeTab === 'purchase' 
                                ? product.dealer_purchase_price 
                                : product.dealer_sale_price
                              ).toLocaleString('en-IN')}
                            </div>
                            <Button
                              onClick={() => addToCart(product, activeTab as 'purchase' | 'sale')}
                              className="mt-2 bg-[#facc15] text-[#0f172a] hover:bg-yellow-400 font-bold"
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
              <Card className="bg-slate-800 border-slate-700 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-[#facc15] font-orbitron uppercase text-sm flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Cart ({cart.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">Cart is empty</p>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.productId} className="border border-slate-700 rounded p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-bold text-white text-sm">{item.productName}</p>
                                <p className="text-xs text-slate-400 font-mono">{item.modelNumber}</p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuantity(item.productId, -1)}
                                  className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="text-white font-bold w-8 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.productId, 1)}
                                  className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="text-[#facc15] font-bold font-orbitron">
                                  ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-700 pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Subtotal:</span>
                          <span className="text-white font-bold">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">GST (18%):</span>
                          <span className="text-white font-bold">₹{totals.gst.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-lg border-t border-slate-700 pt-2">
                          <span className="text-[#facc15] font-bold font-orbitron">TOTAL:</span>
                          <span className="text-[#facc15] font-black font-orbitron">
                            ₹{totals.total.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => generateInvoice(activeTab as 'purchase' | 'sale')}
                        className="w-full bg-[#facc15] text-[#0f172a] hover:bg-yellow-400 font-bold font-poppins uppercase"
                      >
                        Generate Invoice
                      </Button>
                      <Button
                        onClick={viewInvoices}
                        variant="outline"
                        className="w-full border-[#facc15] text-[#facc15] hover:bg-[#facc15] hover:text-[#0f172a] font-poppins uppercase"
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
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-[#facc15] font-orbitron">Invoice Generated</DialogTitle>
            <DialogDescription className="text-slate-400">
              Your {generatedInvoice?.type} invoice has been created successfully
            </DialogDescription>
          </DialogHeader>
          {generatedInvoice && (
            <div className="space-y-4">
              <div className="bg-slate-900 p-4 rounded">
                <p className="text-sm text-slate-400">Invoice Number</p>
                <p className="text-lg font-black text-[#facc15] font-mono">{generatedInvoice.invoice_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">Total Amount</p>
                  <p className="text-white font-bold">₹{generatedInvoice.total_amount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">GST</p>
                  <p className="text-white font-bold">₹{generatedInvoice.gst_amount.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="bg-yellow-900/30 p-3 rounded">
                <p className="text-xs text-slate-400">Final Amount (Inc. GST)</p>
                <p className="text-2xl font-black text-[#facc15] font-orbitron">
                  ₹{generatedInvoice.final_amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={downloadInvoice}
              className="bg-[#facc15] text-[#0f172a] hover:bg-yellow-400 font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
              className="border-slate-600 text-white hover:bg-slate-700"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
