"use client";
import { useEffect, useState } from "react";
import { Package, Plus, Edit, Trash2, DollarSign, Cable, Wrench, Shield, Save, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function PricingManagementPage() {
  const [loading, setLoading] = useState(true);
  const [pricingData, setPricingData] = useState<any>({});
  const [quotationSettings, setQuotationSettings] = useState<any>(null);
  
  // Modals
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showHDAccessoryModal, setShowHDAccessoryModal] = useState(false);
  const [showIPAccessoryModal, setShowIPAccessoryModal] = useState(false);
  const [showCableModal, setShowCableModal] = useState(false);
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showAMCModal, setShowAMCModal] = useState(false);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Bulk price adjustment
  const [bulkPercentage, setBulkPercentage] = useState<string>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  // Global settings
  const [globalSettings, setGlobalSettings] = useState<any>({});
  const [amcOptions, setAmcOptions] = useState<any>({
    with_1year: 400,
    with_2year: 700,
    without_1year: 250,
    without_2year: 200
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Base pricing edits (temporary state before saving)
  const [basePriceEdits, setBasePriceEdits] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchPricingData();
    fetchQuotationSettings();
  }, []);

  const fetchPricingData = async () => {
    try {
      const response = await fetch('/api/enhanced-pricing');
      if (response.ok) {
        const data = await response.json();
        setPricingData(data.data || {});
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotationSettings = async () => {
    try {
      const response = await fetch('/api/quotation-settings');
      if (response.ok) {
        const data = await response.json();
        setQuotationSettings(data);
        setGlobalSettings(data.settings || { gst_rate: 18, default_discount: 0, installation_charges_base: 5000, cod_advance_amount: 200, cod_percentage: 10 });
      }
      
      // Fetch COD settings and AMC options from installation settings
      try {
        const installationResponse = await fetch('/api/installation-settings');
        if (installationResponse.ok) {
          const installationData = await installationResponse.json();
          console.log('🔍 Installation settings loaded:', installationData);
          console.log('🔍 COD Advance from API:', installationData.settings?.codAdvanceAmount);
          console.log('🔍 COD Percentage from API:', installationData.settings?.codPercentage);
          
          if (installationData.success && installationData.settings) {
            const codAmount = installationData.settings.codAdvanceAmount ?? 200;
            const codPercent = installationData.settings.codPercentage ?? 10;
            console.log('💰 Setting COD values to:', { codAmount, codPercent });
            
            setGlobalSettings(prev => ({
              ...prev,
              cod_advance_amount: codAmount,
              cod_percentage: codPercent
            }));
            setAmcOptions(installationData.settings.amcOptions || {
              with_1year: 400,
              with_2year: 700,
              without_1year: 250,
              without_2year: 200
            });
          }
        }
      } catch (installError) {
        console.warn('Installation settings table not found - using defaults:', installError);
        // Don't override if values already exist from previous fetch
        setGlobalSettings(prev => ({
          ...prev,
          cod_advance_amount: prev.cod_advance_amount ?? 200,
          cod_percentage: prev.cod_percentage ?? 10
        }));
      }
    } catch (error) {
      console.error('Failed to fetch quotation settings:', error);
    }
  };

  const handleSaveGlobalSettings = async () => {
    setIsSavingSettings(true);
    let quotationSuccess = false;
    let installationSuccess = false;
    let installationMessage = '';
    
    try {
      // Save quotation settings
      const response = await fetch('/api/quotation-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'settings',
          id: 1,
          gst_rate: globalSettings.gst_rate,
          default_discount: globalSettings.default_discount,
          installation_charges_base: globalSettings.installation_charges_base
        })
      });
      
      quotationSuccess = response.ok;
      
      // Try to save COD settings to installation settings
      try {
        console.log('🔍 Saving COD Settings - globalSettings:', globalSettings);
        console.log('🔍 cod_advance_amount value:', globalSettings.cod_advance_amount);
        console.log('🔍 cod_percentage value:', globalSettings.cod_percentage);
        
        const codAdvanceValue = globalSettings.cod_advance_amount ?? 200;
        const codPercentageValue = globalSettings.cod_percentage ?? 10;
        console.log('💾 Final COD values being sent:', { codAdvanceValue, codPercentageValue });
        
        const installationResponse = await fetch('/api/installation-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            installationCost: globalSettings.installation_charges_base ?? 5000,
            codAdvanceAmount: codAdvanceValue,
            codPercentage: codPercentageValue,
            amcOptions: amcOptions
          })
        });
        
        installationSuccess = installationResponse.ok;
        
        if (!installationSuccess) {
          const errorData = await installationResponse.json().catch(() => ({}));
          console.warn('Installation settings save failed:', errorData);
          installationMessage = '\n\n⚠️ Note: COD settings could not be saved. Please run the database migration first.\n\nRun in PowerShell:\n.\\run-cod-percentage-migration.ps1';
        }
      } catch (installError) {
        console.warn('Installation settings error (table may not exist):', installError);
        installationMessage = '\n\n⚠️ Note: COD settings not saved. Run database migration script first.';
      }
      
      if (quotationSuccess) {
        if (installationSuccess) {
          alert('✅ All global settings (including COD settings) saved successfully!');
        } else {
          alert('✅ GST, Discount & Installation charges saved successfully!' + installationMessage);
        }
        fetchQuotationSettings(); // Refresh data
      } else {
        const responseData = await response.json().catch(() => ({}));
        console.error('Quotation settings save failed:', responseData);
        alert('❌ Failed to save quotation settings. Check console for details.');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      alert('❌ Failed to save settings: ' + (error as Error).message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDelete = async (id: number, type: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`/api/enhanced-pricing?type=${type}&id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Item deleted successfully!');
        fetchPricingData();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete item');
    }
  };

  const handleSave = async (type: string) => {
    try {
      const method = editingItem?.id ? 'PUT' : 'POST';
      const response = await fetch('/api/enhanced-pricing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingItem, type })
      });
      
      if (response.ok) {
        alert(editingItem?.id ? 'Updated successfully!' : 'Added successfully!');
        setEditingItem(null);
        setShowCameraModal(false);
        setShowHDAccessoryModal(false);
        setShowIPAccessoryModal(false);
        setShowCableModal(false);
        setShowInstallationModal(false);
        setShowAMCModal(false);
        fetchPricingData();
      } else {
        alert('Failed to save item');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save item');
    }
  };

  const handleBulkPriceAdjustment = async () => {
    const percentage = parseFloat(bulkPercentage);
    
    if (isNaN(percentage) || percentage === 0) {
      alert('Please enter a valid percentage (e.g., 10 or -10)');
      return;
    }
    
    if (!confirm(`Are you sure you want to ${percentage > 0 ? 'increase' : 'decrease'} all product prices by ${Math.abs(percentage)}%? This will affect all cameras, accessories, cables, installation, and AMC prices.`)) {
      return;
    }
    
    setIsBulkUpdating(true);
    
    try {
      const response = await fetch('/api/enhanced-pricing/bulk-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Success! Prices updated:\n- Cameras: ${data.updated.cameras}\n- HD Accessories: ${data.updated.hd_accessories}\n- IP Accessories: ${data.updated.ip_accessories}\n- Cables: ${data.updated.cables}\n- Installation: ${data.updated.installation}\n- AMC: ${data.updated.amc}`);
        setBulkPercentage('');
        fetchPricingData();
      } else {
        alert(`Failed to update prices: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      alert('Failed to update prices');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleUpdateQuotationPrice = async (table: string, id: number, price: number) => {
    try {
      console.log('Updating price:', { table, id, price });
      const response = await fetch('/api/quotation-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id, price })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        alert('Price updated successfully!');
        fetchQuotationSettings();
      } else {
        alert(`Failed to update price: ${data.error || 'Unknown error'}`);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Update price error:', error);
      alert(`Failed to update price: ${error}`);
    }
  };

  const handleUpdateBrandPrice = async (brandId: number, cameraTypeId: number, price: number) => {
    try {
      console.log('Updating brand price:', { brandId, cameraTypeId, price });
      const response = await fetch('/api/quotation-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table: 'brand_camera_type_pricing',
          brand_id: brandId,
          camera_type_id: cameraTypeId,
          price: price
        })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        alert('Brand price updated successfully!');
        fetchQuotationSettings();
      } else {
        alert(`Failed to update brand price: ${data.error || 'Unknown error'}`);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Update brand price error:', error);
      alert(`Failed to update brand price: ${error}`);
    }
  };

  const handleUpdateTechTypePrice = async (id: number, hdPrice: number, ipPrice: number) => {
    try {
      console.log('Updating tech type price:', { id, hdPrice, ipPrice });
      const response = await fetch('/api/quotation-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'camera_tech_types', id, hd_price: hdPrice, ip_price: ipPrice })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        alert('Tech type prices updated successfully!');
        fetchQuotationSettings();
      } else {
        alert(`Failed to update tech type prices: ${data.error || 'Unknown error'}`);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Update tech type price error:', error);
      alert(`Failed to update tech type prices: ${error}`);
    }
  };

  const handleUpdateStoragePrice = async (id: number, hdPrice: number, ipPrice: number) => {
    try {
      console.log('Updating storage price:', { id, hdPrice, ipPrice });
      const response = await fetch('/api/quotation-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'storage_options', id, hd_price: hdPrice, ip_price: ipPrice })
      });
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (response.ok) {
        alert('Storage prices updated successfully!');
        fetchQuotationSettings();
      } else {
        alert(`Failed to update storage prices: ${data.error || 'Unknown error'}`);
        console.error('API Error:', data);
      }
    } catch (error) {
      console.error('Update storage price error:', error);
      alert(`Failed to update storage prices: ${error}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  const { cameras = [], hd_accessories = [], ip_accessories = [], cables = [], installation = [], amc = [] } = pricingData;
  const { cameraTypes, brands, pixels, techTypes } = quotationSettings || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Product & Pricing Master</h1>
        <p className="text-slate-600 mt-1">Complete product catalog with pricing - Single source of truth for all products</p>
      </div>

      {/* Bulk Price Adjustment Section */}
      <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <DollarSign className="w-5 h-5" />
            Bulk Price Adjustment (Backend Only)
          </CardTitle>
          <CardDescription className="text-orange-700">
            Adjust all product prices by a percentage. Use positive values to increase (e.g., 10) or negative values to decrease (e.g., -10). 
            <strong className="block mt-1">Note: This changes database prices but does NOT affect frontend display.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-md">
            <div className="flex-1 space-y-2">
              <Label htmlFor="bulkPercentage">Percentage Change</Label>
              <Input
                id="bulkPercentage"
                type="number"
                step="0.01"
                placeholder="Enter percentage (e.g., 10 or -10)"
                value={bulkPercentage}
                onChange={(e) => setBulkPercentage(e.target.value)}
                disabled={isBulkUpdating}
              />
            </div>
            <Button 
              onClick={handleBulkPriceAdjustment}
              disabled={isBulkUpdating || !bulkPercentage}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isBulkUpdating ? 'Updating...' : 'Apply to All Products'}
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Example: Enter "10" to increase all prices by 10%, or "-5" to decrease by 5%
          </p>
        </CardContent>
      </Card>

      {/* Global Settings Section */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Settings className="w-5 h-5" />
            Global Pricing Settings
          </CardTitle>
          <CardDescription className="text-blue-700">
            Configure GST, default discounts, and base installation charges for all quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gst" className="font-bold">GST Rate (%)</Label>
              <Input 
                id="gst" 
                type="number" 
                value={globalSettings?.gst_rate ?? 18}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setGlobalSettings({...globalSettings, gst_rate: isNaN(value) ? 0 : value});
                }}
                disabled={isSavingSettings}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount" className="font-bold">Default Discount (%)</Label>
              <Input 
                id="discount" 
                type="number" 
                value={globalSettings?.default_discount ?? 0}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setGlobalSettings({...globalSettings, default_discount: isNaN(value) ? 0 : value});
                }}
                disabled={isSavingSettings}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installation" className="font-bold">Base Installation Charges (₹)</Label>
              <Input 
                id="installation" 
                type="number" 
                value={globalSettings?.installation_charges_base ?? 5000}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setGlobalSettings({...globalSettings, installation_charges_base: isNaN(value) ? 0 : value});
                }}
                disabled={isSavingSettings}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codAdvance" className="font-bold">COD Advance Amount (₹)</Label>
              <Input 
                id="codAdvance" 
                type="number" 
                value={globalSettings?.cod_advance_amount ?? 200}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setGlobalSettings({...globalSettings, cod_advance_amount: isNaN(value) ? 0 : value});
                }}
                disabled={isSavingSettings}
              />
              <p className="text-xs text-slate-600">Extra COD charges added to order total</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="codPercentage" className="font-bold">COD Advance Percentage (%)</Label>
              <Input 
                id="codPercentage" 
                type="number" 
                step="0.01"
                min="0"
                max="100"
                value={globalSettings?.cod_percentage ?? 10}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setGlobalSettings({...globalSettings, cod_percentage: isNaN(value) ? 0 : value});
                }}
                disabled={isSavingSettings}
              />
              <p className="text-xs text-slate-600">Percentage of (Product + COD charges) to pay upfront</p>
            </div>
          </div>
          <Button 
            onClick={handleSaveGlobalSettings}
            disabled={isSavingSettings}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingSettings ? 'Saving...' : 'Save Global Settings'}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="base-pricing" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="base-pricing">Base Pricing</TabsTrigger>
          <TabsTrigger value="tech-types">Camera Tech Types</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
          <TabsTrigger value="hd-accessories">HD Accessories</TabsTrigger>
          <TabsTrigger value="ip-accessories">IP Accessories</TabsTrigger>
          <TabsTrigger value="cables">Cables</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="amc">AMC</TabsTrigger>
        </TabsList>

        {/* Base Pricing Tab - Camera Types, Brands, Channels, Pixels */}
        <TabsContent value="base-pricing">
          <div className="space-y-6">
            {/* Camera Type Pricing */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Camera Type Pricing
                </CardTitle>
                <CardDescription>Set base prices for IP and HD camera types</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Camera Type</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase">Price (₹)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quotationSettings?.cameraTypes?.map((ct: any) => (
                      <tr key={ct.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold">{ct.name}</td>
                        <td className="px-4 py-3 text-right">
                          <Input 
                            type="number" 
                            className="w-32 ml-auto text-right"
                            defaultValue={ct.price || 0}
                            onChange={(e) => setBasePriceEdits(prev => ({ ...prev, [`ct_${ct.id}`]: parseFloat(e.target.value) || 0 }))}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const price = basePriceEdits[`ct_${ct.id}`] ?? ct.price ?? 0;
                              handleUpdateQuotationPrice('camera_types', ct.id, price);
                            }}
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Brand Pricing */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Brand Pricing
                </CardTitle>
                <CardDescription>Set different prices for each brand based on camera type</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Brand</th>
                      {quotationSettings?.cameraTypes?.map((ct: any) => (
                        <th key={ct.id} className="px-4 py-3 text-right text-xs font-bold uppercase">
                          {ct.name} Price (₹)
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quotationSettings?.brands?.map((brand: any) => (
                      <tr key={brand.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold">{brand.name}</td>
                        {quotationSettings?.cameraTypes?.map((ct: any) => (
                          <td key={ct.id} className="px-4 py-3 text-right">
                            <Input 
                              type="number" 
                              className="w-32 ml-auto text-right"
                              defaultValue={brand.pricing?.[`camera_type_${ct.id}`] || 0}
                              onChange={(e) => setBasePriceEdits(prev => ({ 
                                ...prev, 
                                [`brand_${brand.id}_ct_${ct.id}`]: parseFloat(e.target.value) || 0 
                              }))}
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={async () => {
                              // Update all camera type prices for this brand
                              for (const ct of quotationSettings?.cameraTypes || []) {
                                const price = basePriceEdits[`brand_${brand.id}_ct_${ct.id}`] 
                                  ?? brand.pricing?.[`camera_type_${ct.id}`] 
                                  ?? 0;
                                await handleUpdateBrandPrice(brand.id, ct.id, price);
                              }
                            }}
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Channel Pricing */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  DVR/NVR Channel Pricing
                </CardTitle>
                <CardDescription>Set prices for different channel options (4CH, 8CH, 16CH)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Channels</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase">Price (₹)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quotationSettings?.channels?.map((ch: any) => (
                      <tr key={ch.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold">{ch.channel_count} CH</td>
                        <td className="px-4 py-3 text-right">
                          <Input 
                            type="number" 
                            className="w-32 ml-auto text-right"
                            defaultValue={ch.price || 0}
                            onChange={(e) => setBasePriceEdits(prev => ({ ...prev, [`ch_${ch.id}`]: parseFloat(e.target.value) || 0 }))}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const price = basePriceEdits[`ch_${ch.id}`] ?? ch.price ?? 0;
                              handleUpdateQuotationPrice('channel_options', ch.id, price);
                            }}
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Pixel Pricing */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pixel/Resolution Pricing
                </CardTitle>
                <CardDescription>Set premium prices for higher resolution options (2MP, 5MP, 8MP)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase">Megapixel</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase">Premium Price (₹)</th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {quotationSettings?.pixels?.map((px: any) => (
                      <tr key={px.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold">{px.name}</td>
                        <td className="px-4 py-3 text-right">
                          <Input 
                            type="number" 
                            className="w-32 ml-auto text-right"
                            defaultValue={px.price || 0}
                            onChange={(e) => setBasePriceEdits(prev => ({ ...prev, [`px_${px.id}`]: parseFloat(e.target.value) || 0 }))}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              const price = basePriceEdits[`px_${px.id}`] ?? px.price ?? 0;
                              handleUpdateQuotationPrice('pixel_options', px.id, price);
                            }}
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Camera Tech Type Pricing Tab */}
        <TabsContent value="tech-types">
          <Card>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Camera Technology Type Pricing (HD vs IP)
              </CardTitle>
              <CardDescription>Set different prices for each camera tech type based on HD or IP camera</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tech Type</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">Camera Type</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">HD Price (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">IP Price (₹)</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotationSettings?.techTypes?.map((tech: any) => (
                    <tr key={tech.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold">{tech.name}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={tech.camera_type === 'IP' ? 'default' : 'secondary'}>
                          {tech.camera_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{tech.location}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Input 
                          type="number" 
                          className="w-32 ml-auto text-right"
                          defaultValue={tech.hd_price || tech.base_price || 0}
                          onChange={(e) => setBasePriceEdits(prev => ({ ...prev, [`tech_hd_${tech.id}`]: parseFloat(e.target.value) || 0 }))}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Input 
                          type="number" 
                          className="w-32 ml-auto text-right"
                          defaultValue={tech.ip_price || tech.base_price || 0}
                          onChange={(e) => setBasePriceEdits(prev => ({ ...prev, [`tech_ip_${tech.id}`]: parseFloat(e.target.value) || 0 }))}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            const hdPrice = basePriceEdits[`tech_hd_${tech.id}`] ?? tech.hd_price ?? tech.base_price ?? 0;
                            const ipPrice = basePriceEdits[`tech_ip_${tech.id}`] ?? tech.ip_price ?? tech.base_price ?? 0;
                            await handleUpdateTechTypePrice(tech.id, hdPrice, ipPrice);
                          }}
                        >
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Pricing Tab */}
        <TabsContent value="storage">
          <Card>
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Storage Pricing (HD vs IP)
              </CardTitle>
              <CardDescription>Set different prices for each storage capacity based on HD or IP camera system</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Capacity</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">HD Price (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase">IP Price (₹)</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotationSettings?.storage?.map((storage: any) => (
                    <tr key={storage.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold">{storage.capacity}</td>
                      <td className="px-4 py-3 text-right">
                        <Input 
                          type="number" 
                          className="w-32 ml-auto text-right"
                          defaultValue={storage.hd_price || storage.price || 0}
                          onChange={(e) => setBasePriceEdits(prev => ({ ...prev, [`storage_hd_${storage.id}`]: parseFloat(e.target.value) || 0 }))}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Input 
                          type="number" 
                          className="w-32 ml-auto text-right"
                          defaultValue={storage.ip_price || storage.price || 0}
                          onChange={(e) => setBasePriceEdits(prev => ({ ...prev, [`storage_ip_${storage.id}`]: parseFloat(e.target.value) || 0 }))}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={async () => {
                            const hdPrice = basePriceEdits[`storage_hd_${storage.id}`] ?? storage.hd_price ?? storage.price ?? 0;
                            const ipPrice = basePriceEdits[`storage_ip_${storage.id}`] ?? storage.ip_price ?? storage.price ?? 0;
                            await handleUpdateStoragePrice(storage.id, hdPrice, ipPrice);
                          }}
                        >
                          Update
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cameras Tab */}
        <TabsContent value="cameras">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />Camera Pricing</CardTitle>
                  <CardDescription>Complete camera models with specifications and prices</CardDescription>
                </div>
                <Button onClick={() => { setEditingItem({}); setShowCameraModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Camera
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b-2">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase">Model</th>
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase">Type/Brand</th>
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase">Shape</th>
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase">Pixel</th>
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase">Tech</th>
                      <th className="px-3 py-3 text-left text-xs font-bold uppercase">IR</th>
                      <th className="px-3 py-3 text-right text-xs font-bold uppercase">Price</th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cameras.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-3 py-3 font-mono text-xs">{item.model_number}</td>
                        <td className="px-3 py-3">
                          <div className="text-xs"><Badge className="bg-blue-100 text-blue-800">{item.camera_type}</Badge></div>
                          <div className="text-xs font-bold mt-1">{item.brand}</div>
                        </td>
                        <td className="px-3 py-3 text-xs">{item.shape}</td>
                        <td className="px-3 py-3"><Badge className="bg-green-100 text-green-800">{item.pixel}</Badge></td>
                        <td className="px-3 py-3 text-xs">{item.tech_type}</td>
                        <td className="px-3 py-3 text-xs">{item.ir_distance}</td>
                        <td className="px-3 py-3 text-right font-bold text-green-600">₹{parseFloat(item.price).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowCameraModal(true); }}><Edit className="w-3 h-3" /></Button>
                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'camera')}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HD Accessories Tab */}
        <TabsContent value="hd-accessories">
          <Card>
            <CardHeader className="bg-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />HD Camera Accessories</CardTitle>
                  <CardDescription>SMPS, BNC, DC Jack packages by channel count</CardDescription>
                </div>
                <Button onClick={() => { setEditingItem({}); setShowHDAccessoryModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Package
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Ch Count</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">SMPS Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">BNC Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">DC Jack Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {hd_accessories.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.ch_count} CH</td>
                      <td className="px-6 py-4">{item.smps_qty} pc</td>
                      <td className="px-6 py-4">{item.bnc_qty} pc</td>
                      <td className="px-6 py-4">{item.dc_jack_qty} pc</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">₹{parseFloat(item.total_cost).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowHDAccessoryModal(true); }}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'hd_accessories')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Accessories Tab */}
        <TabsContent value="ip-accessories">
          <Card>
            <CardHeader className="bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Cable className="w-5 h-5" />IP Camera Accessories</CardTitle>
                  <CardDescription>POE & RJ45 Connector packages by channel count</CardDescription>
                </div>
                <Button onClick={() => { setEditingItem({}); setShowIPAccessoryModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Package
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Ch Count</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">POE Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">RJ45 Qty</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase">Total Cost</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ip_accessories.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.ch_count} CH</td>
                      <td className="px-6 py-4">{item.poe_qty} pc</td>
                      <td className="px-6 py-4">{item.rj45_qty} pc</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">₹{parseFloat(item.total_cost).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowIPAccessoryModal(true); }}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'ip_accessories')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cables Tab */}
        <TabsContent value="cables">
          <Card>
            <CardHeader className="bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Cable className="w-5 h-5" />Cable Pricing</CardTitle>
                  <CardDescription>3+1 HD Cables & CAT6 IP Cables</CardDescription>
                </div>
                <Button onClick={() => { setEditingItem({}); setShowCableModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Cable
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Cable Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Length</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">For Camera Type</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase">Price</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cables.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.cable_name}</td>
                      <td className="px-6 py-4">{item.length}</td>
                      <td className="px-6 py-4"><Badge className="bg-blue-100 text-blue-800">{item.camera_type}</Badge></td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">₹{parseFloat(item.price).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowCableModal(true); }}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'cables')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Installation Tab */}
        <TabsContent value="installation">
          <Card>
            <CardHeader className="bg-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" />Installation Pricing</CardTitle>
                  <CardDescription>Installation charges based on camera quantity</CardDescription>
                </div>
                <Button onClick={() => { setEditingItem({}); setShowInstallationModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Camera Qty Range</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase">Price/Camera</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {installation.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.camera_qty_from} - {item.camera_qty_to} cameras</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">₹{parseFloat(item.price_per_camera).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm">{item.description}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowInstallationModal(true); }}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'installation')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AMC Tab */}
        <TabsContent value="amc">
          <Card>
            <CardHeader className="bg-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />AMC Pricing</CardTitle>
                  <CardDescription>Annual Maintenance Contract pricing options</CardDescription>
                </div>
                <Button onClick={() => { setEditingItem({}); setShowAMCModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />Add AMC Plan
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Duration</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase">Price/Camera</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {amc.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <Badge className={item.amc_type === 'with_material' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                          {item.amc_type === 'with_material' ? 'With Material' : 'Without Material'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold">{item.duration} Year{item.duration > 1 ? 's' : ''}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">₹{parseFloat(item.price_per_camera).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-sm">{item.description}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowAMCModal(true); }}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'amc')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Camera Modal */}
      <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Camera' : 'Add New Camera'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem?.id ? 'Edit existing camera details' : 'Add a new camera to the database'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Model Number *</Label>
              <Input value={editingItem?.model_number || ''} onChange={(e) => setEditingItem({...editingItem, model_number: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Shape *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.shape || ''} onChange={(e) => setEditingItem({...editingItem, shape: e.target.value})}>
                <option value="">Select...</option>
                <option value="Dome">Dome</option>
                <option value="Bullet">Bullet</option>
                <option value="VF Dome">VF Dome</option>
                <option value="VF Bullet">VF Bullet</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Camera Type *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.camera_type_id || ''} onChange={(e) => setEditingItem({...editingItem, camera_type_id: e.target.value})}>
                <option value="">Select...</option>
                {cameraTypes?.map((ct: any) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Brand *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.brand_id || ''} onChange={(e) => setEditingItem({...editingItem, brand_id: e.target.value})}>
                <option value="">Select...</option>
                {brands?.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pixel *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.pixel_id || ''} onChange={(e) => setEditingItem({...editingItem, pixel_id: e.target.value})}>
                <option value="">Select...</option>
                {pixels?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tech Type *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.tech_type_id || ''} onChange={(e) => setEditingItem({...editingItem, tech_type_id: e.target.value})}>
                <option value="">Select...</option>
                {techTypes?.map((tt: any) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>IR Distance *</Label>
              <Input placeholder="20 mtr" value={editingItem?.ir_distance || ''} onChange={(e) => setEditingItem({...editingItem, ir_distance: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Price (₹) *</Label>
              <Input type="number" step="0.01" value={editingItem?.price || ''} onChange={(e) => setEditingItem({...editingItem, price: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Specifications *</Label>
              <textarea className="w-full px-3 py-2 border rounded-md" rows={3} placeholder="1080P Resolution, CMOS Image Sensor..." value={editingItem?.specifications || ''} onChange={(e) => setEditingItem({...editingItem, specifications: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Warranty</Label>
              <Input placeholder="2 years Warranty" value={editingItem?.warranty || '2 years Warranty'} onChange={(e) => setEditingItem({...editingItem, warranty: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={editingItem?.display_order || 0} onChange={(e) => setEditingItem({...editingItem, display_order: parseInt(e.target.value)})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCameraModal(false)}>Cancel</Button>
            <Button onClick={() => handleSave('camera')}>Save Camera</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HD Accessory Modal */}
      <Dialog open={showHDAccessoryModal} onOpenChange={setShowHDAccessoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit HD Accessory Package' : 'Add HD Accessory Package'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem?.id ? 'Edit existing HD accessory package' : 'Add a new HD accessory package'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Channel Count *</Label>
              <Input type="number" placeholder="4, 8, 16" value={editingItem?.ch_count || ''} onChange={(e) => setEditingItem({...editingItem, ch_count: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>SMPS Qty *</Label>
              <Input type="number" value={editingItem?.smps_qty || ''} onChange={(e) => setEditingItem({...editingItem, smps_qty: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>BNC Qty *</Label>
              <Input type="number" value={editingItem?.bnc_qty || ''} onChange={(e) => setEditingItem({...editingItem, bnc_qty: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>DC Jack Qty *</Label>
              <Input type="number" value={editingItem?.dc_jack_qty || ''} onChange={(e) => setEditingItem({...editingItem, dc_jack_qty: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Total Cost (₹) *</Label>
              <Input type="number" step="0.01" value={editingItem?.total_cost || ''} onChange={(e) => setEditingItem({...editingItem, total_cost: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Input placeholder="4CH SMPS 1pc, BNC 8pc, DC Jack 4pc" value={editingItem?.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHDAccessoryModal(false)}>Cancel</Button>
            <Button onClick={() => handleSave('hd_accessories')}>Save Package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IP Accessory Modal */}
      <Dialog open={showIPAccessoryModal} onOpenChange={setShowIPAccessoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit IP Accessory Package' : 'Add IP Accessory Package'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem?.id ? 'Edit existing IP accessory package' : 'Add a new IP accessory package'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Channel Count *</Label>
              <Input type="number" placeholder="4, 8, 16" value={editingItem?.ch_count || ''} onChange={(e) => setEditingItem({...editingItem, ch_count: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>POE Qty *</Label>
              <Input type="number" value={editingItem?.poe_qty || ''} onChange={(e) => setEditingItem({...editingItem, poe_qty: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>RJ45 Connector Qty *</Label>
              <Input type="number" value={editingItem?.rj45_qty || ''} onChange={(e) => setEditingItem({...editingItem, rj45_qty: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Total Cost (₹) *</Label>
              <Input type="number" step="0.01" value={editingItem?.total_cost || ''} onChange={(e) => setEditingItem({...editingItem, total_cost: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Input placeholder="4CH POE 1pc, RJ45 Connector 12pc" value={editingItem?.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIPAccessoryModal(false)}>Cancel</Button>
            <Button onClick={() => handleSave('ip_accessories')}>Save Package</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cable Modal */}
      <Dialog open={showCableModal} onOpenChange={setShowCableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Cable' : 'Add New Cable'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem?.id ? 'Edit existing cable details' : 'Add a new cable to the database'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Cable Type *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.cable_type || ''} onChange={(e) => setEditingItem({...editingItem, cable_type: e.target.value})}>
                <option value="">Select...</option>
                <option value="hd_cable">HD Cable</option>
                <option value="ip_cable">IP Cable</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Camera Type *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.camera_type_id || ''} onChange={(e) => setEditingItem({...editingItem, camera_type_id: e.target.value})}>
                <option value="">Select...</option>
                {cameraTypes?.map((ct: any) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Cable Name *</Label>
              <Input placeholder="3+1 Cable, CAT6 Cable" value={editingItem?.cable_name || ''} onChange={(e) => setEditingItem({...editingItem, cable_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Length *</Label>
              <Input placeholder="90 MTR, 305 MTR" value={editingItem?.length || ''} onChange={(e) => setEditingItem({...editingItem, length: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Price (₹) *</Label>
              <Input type="number" step="0.01" value={editingItem?.price || ''} onChange={(e) => setEditingItem({...editingItem, price: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCableModal(false)}>Cancel</Button>
            <Button onClick={() => handleSave('cables')}>Save Cable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Installation Modal */}
      <Dialog open={showInstallationModal} onOpenChange={setShowInstallationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit Installation Tier' : 'Add Installation Tier'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem?.id ? 'Edit existing installation tier' : 'Add a new installation tier'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Camera Qty From *</Label>
              <Input type="number" value={editingItem?.camera_qty_from || ''} onChange={(e) => setEditingItem({...editingItem, camera_qty_from: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Camera Qty To *</Label>
              <Input type="number" value={editingItem?.camera_qty_to || ''} onChange={(e) => setEditingItem({...editingItem, camera_qty_to: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Price Per Camera (₹) *</Label>
              <Input type="number" step="0.01" value={editingItem?.price_per_camera || ''} onChange={(e) => setEditingItem({...editingItem, price_per_camera: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Input placeholder="Installation for 1-8 cameras" value={editingItem?.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallationModal(false)}>Cancel</Button>
            <Button onClick={() => handleSave('installation')}>Save Tier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AMC Modal */}
      <Dialog open={showAMCModal} onOpenChange={setShowAMCModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit AMC Plan' : 'Add AMC Plan'}</DialogTitle>
            <DialogDescription className="sr-only">
              {editingItem?.id ? 'Edit existing AMC plan' : 'Add a new AMC plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>AMC Type *</Label>
              <select className="w-full px-3 py-2 border rounded-md" value={editingItem?.amc_type || ''} onChange={(e) => setEditingItem({...editingItem, amc_type: e.target.value})}>
                <option value="">Select...</option>
                <option value="with_material">With Material</option>
                <option value="without_material">Without Material</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Duration (Years) *</Label>
              <Input type="number" value={editingItem?.duration || ''} onChange={(e) => setEditingItem({...editingItem, duration: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Price Per Camera (₹) *</Label>
              <Input type="number" step="0.01" value={editingItem?.price_per_camera || ''} onChange={(e) => setEditingItem({...editingItem, price_per_camera: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Input placeholder="AMC with Material - 1 Year" value={editingItem?.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAMCModal(false)}>Cancel</Button>
            <Button onClick={() => handleSave('amc')}>Save AMC Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
