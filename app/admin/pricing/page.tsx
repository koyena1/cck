"use client";
import { useEffect, useState } from "react";
import { Package, Plus, Edit, Trash2, DollarSign, Cable, Wrench, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
      }
    } catch (error) {
      console.error('Failed to fetch quotation settings:', error);
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

  if (loading) return <div>Loading...</div>;

  const { cameras = [], hd_accessories = [], ip_accessories = [], cables = [], installation = [], amc = [] } = pricingData;
  const { cameraTypes, brands, pixels, techTypes } = quotationSettings || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Complete Pricing Management</h1>
        <p className="text-slate-600 mt-1">Manage all pricing: cameras, accessories, cables, installation & AMC</p>
      </div>

      <Tabs defaultValue="cameras" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
          <TabsTrigger value="hd-accessories">HD Accessories</TabsTrigger>
          <TabsTrigger value="ip-accessories">IP Accessories</TabsTrigger>
          <TabsTrigger value="cables">Cables</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="amc">AMC</TabsTrigger>
        </TabsList>

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
