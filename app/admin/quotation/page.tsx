"use client";
import { useEffect, useState } from "react";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  Package,
  Camera,
  Tag,
  Grid,
  Monitor,
  HardDrive,
  Cable,
  Box
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function QuotationManagementPage() {
  const [quotationSettings, setQuotationSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [cameraPricing, setCameraPricing] = useState<any[]>([]);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<any>(null);

  useEffect(() => {
    fetchQuotationSettings();
    fetchCameraPricing();
  }, []);

  const fetchCameraPricing = async () => {
    try {
      const response = await fetch('/api/camera-pricing');
      if (response.ok) {
        const data = await response.json();
        setCameraPricing(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch camera pricing:', error);
    }
  };

  useEffect(() => {
    fetchQuotationSettings();
  }, []);

  const fetchQuotationSettings = async () => {
    try {
      const response = await fetch('/api/quotation-settings', {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuotationSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch quotation settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, table: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch('/api/quotation-manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, table })
      });
      
      if (response.ok) {
        alert('Item deleted successfully!');
        fetchQuotationSettings();
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete item');
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/quotation-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, table: showAddModal })
      });
      
      if (response.ok) {
        alert('Item added successfully!');
        setShowAddModal(null);
        setFormData({});
        fetchQuotationSettings();
      } else {
        alert('Failed to add item');
      }
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add item');
    }
  };

  const handleDeletePricing = async (id: number) => {
    if (!confirm('Are you sure you want to delete this price?')) return;
    
    try {
      const response = await fetch(`/api/camera-pricing?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Price deleted successfully!');
        fetchCameraPricing();
      } else {
        alert('Failed to delete price');
      }
    } catch (error) {
      console.error('Delete pricing error:', error);
      alert('Failed to delete price');
    }
  };

  const handleSavePricing = async () => {
    try {
      const method = editingPricing?.id ? 'PUT' : 'POST';
      const response = await fetch('/api/camera-pricing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPricing)
      });
      
      if (response.ok) {
        alert(editingPricing?.id ? 'Price updated!' : 'Price added!');
        setShowPricingModal(false);
        setEditingPricing(null);
        fetchCameraPricing();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save price');
      }
    } catch (error) {
      console.error('Save pricing error:', error);
      alert('Failed to save price');
    }
  };

  const handleEdit = async () => {
    try {
      console.log('Sending update request:', editingItem);
      const response = await fetch('/api/quotation-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      
      if (response.ok) {
        alert('Item updated successfully!');
        setEditingItem(null);
        fetchQuotationSettings();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`Failed to update item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Loading quotation settings...</div>
      </div>
    );
  }

  if (!quotationSettings) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Failed to load settings</div>
      </div>
    );
  }

  const { cameraTypes, brands, channels, pixels, techTypes, storage, cables, accessories, settings } = quotationSettings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quotation Management</h1>
          <p className="text-slate-600 mt-1">Control all automated quotation settings - changes reflect immediately on homepage</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900 text-sm">Live Quotation Control</p>
              <p className="text-blue-700 text-xs mt-1">
                All settings here directly control the customer-facing quotation engine on the homepage. 
                Add, edit, or remove options to customize what customers see.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different settings */}
      <Tabs defaultValue="pricing-matrix" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="pricing-matrix">Pricing Matrix</TabsTrigger>
          <TabsTrigger value="camera-types">Camera Types</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="pixels">Pixels</TabsTrigger>
          <TabsTrigger value="tech-types">Tech Types</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="cables">Cables</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
        </TabsList>

        {/* Pricing Matrix Tab */}
        <TabsContent value="pricing-matrix">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Camera Pricing Matrix
                  </CardTitle>
                  <CardDescription>Manage prices for each camera combination (Type + Brand + Pixel + Tech)</CardDescription>
                </div>
                <Button className="font-bold bg-purple-600 hover:bg-purple-700" onClick={() => { setShowPricingModal(true); setEditingPricing({ camera_type_id: '', brand_id: '', pixel_id: '', tech_type_id: '', base_price: '', notes: '' }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Price
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase">Camera Type</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase">Brand</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase">Pixel</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase">Tech Type</th>
                    <th className="px-4 py-4 text-right text-xs font-black text-slate-600 uppercase">Price</th>
                    <th className="px-4 py-4 text-left text-xs font-black text-slate-600 uppercase">Notes</th>
                    <th className="px-4 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cameraPricing.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <Badge className="bg-blue-100 text-blue-800">{item.camera_type}</Badge>
                      </td>
                      <td className="px-4 py-4 font-bold">{item.brand}</td>
                      <td className="px-4 py-4">
                        <Badge className="bg-green-100 text-green-800">{item.pixel}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm">{item.tech_type}</td>
                      <td className="px-4 py-4 text-right font-bold text-green-600">₹{parseFloat(item.base_price).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{item.notes || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingPricing(item); setShowPricingModal(true); }}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeletePricing(item.id)}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cameraPricing.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No pricing data available. Click "Add Price" to create your first price entry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Types Tab */}
        <TabsContent value="camera-types">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Camera Types
                  </CardTitle>
                  <CardDescription>IP Camera, HD Camera options in Step 1</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('camera_types'); setFormData({ name: '', display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Camera Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Name</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Display Order</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cameraTypes.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.name}</td>
                      <td className="px-6 py-4 text-center">{item.display_order}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'camera_types' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'camera_types')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brands Tab */}
        <TabsContent value="brands">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Camera Brands
                  </CardTitle>
                  <CardDescription>Hikvision, CP Plus, Honeywell options in Step 2</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('brands'); setFormData({ name: '', display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Brand Name</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Display Order</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {brands.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.name}</td>
                      <td className="px-6 py-4 text-center">{item.display_order}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'brands' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'brands')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Grid className="w-5 h-5" />
                    Channel Options
                  </CardTitle>
                  <CardDescription>4Ch, 8Ch, 16Ch DVR/NVR options in Step 3</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('channel_options'); setFormData({ channel_count: '', features: [''], display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Channel Option
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Channels</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Features</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {channels.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.channel_count} Ch</td>
                      <td className="px-6 py-4">
                        <ul className="text-xs space-y-1">
                          {(Array.isArray(item.features) ? item.features : JSON.parse(item.features || '[]')).map((feature: string, idx: number) => (
                            <li key={idx}>• {feature}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'channel_options' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'channel_options')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pixels Tab */}
        <TabsContent value="pixels">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Pixel Options
                  </CardTitle>
                  <CardDescription>2MP, 5MP resolution options in Step 4</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('pixel_options'); setFormData({ name: '', display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pixel Option
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Resolution</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Display Order</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pixels.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.name}</td>
                      <td className="px-6 py-4 text-center">{item.display_order}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'pixel_options' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'pixel_options')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tech Types Tab */}
        <TabsContent value="tech-types">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Camera Technology Types
                  </CardTitle>
                  <CardDescription>HD Non Audio, HD Audio, HD Smart Hybrid pricing in Step 5</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('camera_tech_types'); setFormData({ name: '', camera_type: 'HD', location: 'indoor', base_price: '', display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tech Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Type Name</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Camera</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Location</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">Price</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {techTypes.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.name}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline">{item.camera_type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline">{item.location}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-[#e63946]">
                        ₹{parseFloat(item.base_price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'camera_tech_types' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'camera_tech_types')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Storage Options
                  </CardTitle>
                  <CardDescription>HDD capacity options in Step 7</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('storage_options'); setFormData({ capacity: '', price: '', display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Storage Option
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Capacity</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">Price</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {storage.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.capacity}</td>
                      <td className="px-6 py-4 text-right font-black text-[#e63946]">
                        ₹{parseFloat(item.price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'storage_options' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'storage_options')}><Trash2 className="w-3 h-3" /></Button>
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
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Cable className="w-5 h-5" />
                    Cable Options
                  </CardTitle>
                  <CardDescription>Coaxial and LAN cable options in Step 9</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('cable_options'); setFormData({ name: '', cable_type: 'HD', length: '', price: '', display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Cable Option
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Cable Name</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Type</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Length</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">Price</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cables.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.name}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline">{item.cable_type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">{item.length}</td>
                      <td className="px-6 py-4 text-right font-black text-[#e63946]">
                        ₹{parseFloat(item.price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'cable_options' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'cable_options')}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accessories Tab */}
        <TabsContent value="accessories">
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-black text-slate-900 flex items-center gap-2">
                    <Box className="w-5 h-5" />
                    Accessories
                  </CardTitle>
                  <CardDescription>Additional items like BNC connectors, SMPS in Step 10</CardDescription>
                </div>
                <Button className="font-bold" onClick={() => { setShowAddModal('accessories'); setFormData({ name: '', price: 0, display_order: 0 }); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Accessory
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Accessory Name</th>
                    <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">Price</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accessories.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.name}</td>
                      <td className="px-6 py-4 text-right font-black text-[#e63946]">
                        ₹{parseFloat(item.price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, table: 'accessories' })}><Edit className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'accessories')}><Trash2 className="w-3 h-3" /></Button>
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

      {/* Global Settings */}
      <Card className="border-2">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="font-black text-slate-900">Global Settings</CardTitle>
          <CardDescription>Configure GST, discounts, and other general settings</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gst" className="font-bold">GST Rate (%)</Label>
              <Input 
                id="gst" 
                type="number" 
                defaultValue={settings?.gst_rate || "18"} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount" className="font-bold">Default Discount (%)</Label>
              <Input 
                id="discount" 
                type="number" 
                defaultValue={settings?.default_discount || "0"} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installation" className="font-bold">Base Installation Charges (₹)</Label>
              <Input 
                id="installation" 
                type="number" 
                defaultValue={settings?.installation_charges_base || "5000"} 
              />
            </div>
          </div>
          <Button className="w-full font-bold">
            <Save className="w-4 h-4 mr-2" />
            Save Global Settings
          </Button>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editingItem !== null} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingItem?.table === 'channel_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Channel Count</Label>
                  <Input 
                    type="number"
                    value={editingItem?.channel_count || ''} 
                    onChange={(e) => setEditingItem({...editingItem, channel_count: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features (one per line)</Label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    value={Array.isArray(editingItem?.features) ? editingItem.features.join('\n') : (typeof editingItem?.features === 'string' ? JSON.parse(editingItem.features).join('\n') : '')} 
                    onChange={(e) => setEditingItem({...editingItem, features: e.target.value.split('\n').filter((f: string) => f.trim())})}
                  />
                </div>
              </>
            ) : editingItem?.table === 'camera_tech_types' ? (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={editingItem?.name || ''} 
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Camera Type</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={editingItem?.camera_type || 'HD'}
                    onChange={(e) => setEditingItem({...editingItem, camera_type: e.target.value})}
                  >
                    <option value="HD">HD</option>
                    <option value="IP">IP</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={editingItem?.location || 'indoor'}
                    onChange={(e) => setEditingItem({...editingItem, location: e.target.value})}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Base Price (₹)</Label>
                  <Input 
                    type="number"
                    value={editingItem?.base_price || ''} 
                    onChange={(e) => setEditingItem({...editingItem, base_price: parseFloat(e.target.value)})}
                  />
                </div>
              </>
            ) : editingItem?.table === 'cable_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Cable Name</Label>
                  <Input 
                    value={editingItem?.name || ''} 
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cable Type</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={editingItem?.cable_type || 'HD'}
                    onChange={(e) => setEditingItem({...editingItem, cable_type: e.target.value})}
                  >
                    <option value="HD">HD (Coaxial)</option>
                    <option value="IP">IP (CAT6 LAN)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Length</Label>
                  <Input 
                    value={editingItem?.length || ''} 
                    onChange={(e) => setEditingItem({...editingItem, length: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input 
                    type="number"
                    value={editingItem?.price || ''} 
                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={editingItem?.name || editingItem?.capacity || ''} 
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value, capacity: e.target.value})}
                  />
                </div>
                {editingItem?.base_price !== undefined && editingItem?.table !== 'camera_tech_types' && (
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input 
                      type="number"
                      value={editingItem?.base_price || editingItem?.price || ''} 
                      onChange={(e) => setEditingItem({...editingItem, base_price: e.target.value, price: e.target.value})}
                    />
                  </div>
                )}
                {editingItem?.price !== undefined && !editingItem?.base_price && (
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input 
                      type="number"
                      value={editingItem?.price || ''} 
                      onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                    />
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input 
                type="number"
                value={editingItem?.display_order || 0} 
                onChange={(e) => setEditingItem({...editingItem, display_order: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Modal */}
      <Dialog open={showAddModal !== null} onOpenChange={() => setShowAddModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {showAddModal === 'camera_types' || showAddModal === 'brands' || showAddModal === 'pixel_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    type="number"
                    value={formData.display_order || 0} 
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </>
            ) : showAddModal === 'channel_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Channel Count</Label>
                  <Input 
                    type="number"
                    value={formData.channel_count || ''} 
                    onChange={(e) => setFormData({...formData, channel_count: parseInt(e.target.value)})}
                    placeholder="e.g., 4, 8, 16"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Features (one per line)</Label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    value={Array.isArray(formData.features) ? formData.features.join('\n') : ''} 
                    onChange={(e) => setFormData({...formData, features: e.target.value.split('\n').filter((f: string) => f.trim())})}
                    placeholder="Supports up to 4 Cameras&#10;1080p/5MP Lite Resolution&#10;1 SATA Port&#10;H.265+ Compression"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    type="number"
                    value={formData.display_order || 0} 
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </>
            ) : showAddModal === 'storage_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input 
                    value={formData.capacity || ''} 
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    placeholder="e.g., 1TB"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.price || ''} 
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    type="number"
                    value={formData.display_order || 0} 
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </>
            ) : showAddModal === 'camera_tech_types' ? (
              <>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., HD Non Audio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Camera Type *</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.camera_type || 'HD'}
                    onChange={(e) => setFormData({...formData, camera_type: e.target.value})}
                  >
                    <option value="HD">HD</option>
                    <option value="IP">IP</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Location *</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.location || 'indoor'}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Base Price (₹) *</Label>
                  <Input 
                    type="number"
                    value={formData.base_price || ''} 
                    onChange={(e) => setFormData({...formData, base_price: parseFloat(e.target.value)})}
                    placeholder="e.g., 1200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    type="number"
                    value={formData.display_order || 0} 
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </>
            ) : showAddModal === 'cable_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Cable Name *</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., 3+1 Coaxial Cable 90M"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cable Type *</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.cable_type || 'HD'}
                    onChange={(e) => setFormData({...formData, cable_type: e.target.value})}
                  >
                    <option value="HD">HD (Coaxial)</option>
                    <option value="IP">IP (CAT6 LAN)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Length *</Label>
                  <Input 
                    value={formData.length || ''} 
                    onChange={(e) => setFormData({...formData, length: e.target.value})}
                    placeholder="e.g., 90M, 180M, 305M"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹) *</Label>
                  <Input 
                    type="number"
                    value={formData.price || ''} 
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    placeholder="e.g., 1800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    type="number"
                    value={formData.display_order || 0} 
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </>
            ) : showAddModal === 'accessories' ? (
              <>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., BNC Connectors"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.price || ''} 
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input 
                    type="number"
                    value={formData.display_order || 0} 
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  />
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(null)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pricing Matrix Modal */}
      <Dialog open={showPricingModal} onOpenChange={() => setShowPricingModal(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPricing?.id ? 'Edit Price' : 'Add New Price'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Camera Type *</Label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={editingPricing?.camera_type_id || ''}
                onChange={(e) => setEditingPricing({...editingPricing, camera_type_id: e.target.value})}
                disabled={!!editingPricing?.id}
              >
                <option value="">Select...</option>
                {cameraTypes?.map((ct: any) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Brand *</Label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={editingPricing?.brand_id || ''}
                onChange={(e) => setEditingPricing({...editingPricing, brand_id: e.target.value})}
                disabled={!!editingPricing?.id}
              >
                <option value="">Select...</option>
                {brands?.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Pixel *</Label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={editingPricing?.pixel_id || ''}
                onChange={(e) => setEditingPricing({...editingPricing, pixel_id: e.target.value})}
                disabled={!!editingPricing?.id}
              >
                <option value="">Select...</option>
                {pixels?.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tech Type *</Label>
              <select 
                className="w-full px-3 py-2 border rounded-md"
                value={editingPricing?.tech_type_id || ''}
                onChange={(e) => setEditingPricing({...editingPricing, tech_type_id: e.target.value})}
                disabled={!!editingPricing?.id}
              >
                <option value="">Select...</option>
                {techTypes?.map((tt: any) => (
                  <option key={tt.id} value={tt.id}>{tt.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Base Price (₹) *</Label>
              <Input 
                type="number"
                step="0.01"
                placeholder="2500.00"
                value={editingPricing?.base_price || ''}
                onChange={(e) => setEditingPricing({...editingPricing, base_price: e.target.value})}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Notes (Optional)</Label>
              <Input 
                placeholder="e.g., Hikvision 2MP IP Non-Audio"
                value={editingPricing?.notes || ''}
                onChange={(e) => setEditingPricing({...editingPricing, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingModal(false)}>Cancel</Button>
            <Button onClick={handleSavePricing}>Save Price</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
