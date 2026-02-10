"use client";
import { useEffect, useState } from "react";
import { notifyGlobalDataChange } from "@/lib/globalDataChangeEmitter";
import Image from "next/image";
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function QuotationManagementPage() {
  const [quotationSettings, setQuotationSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

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
        // Notify all pages that data has changed
        notifyGlobalDataChange();
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
      // Auto-generate display order for all item types
      let displayOrder = formData.display_order || 0;
      
      if (showAddModal === 'brands') {
        const maxOrder = quotationSettings?.brands?.reduce((max: number, brand: any) => 
          Math.max(max, brand.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      if (showAddModal === 'camera_types') {
        const maxOrder = quotationSettings?.cameraTypes?.reduce((max: number, item: any) => 
          Math.max(max, item.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      if (showAddModal === 'channel_options') {
        const maxOrder = quotationSettings?.channels?.reduce((max: number, channel: any) => 
          Math.max(max, channel.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      if (showAddModal === 'pixel_options') {
        const maxOrder = quotationSettings?.pixels?.reduce((max: number, pixel: any) => 
          Math.max(max, pixel.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      if (showAddModal === 'camera_tech_types') {
        const maxOrder = quotationSettings?.techTypes?.reduce((max: number, tech: any) => 
          Math.max(max, tech.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      if (showAddModal === 'storage_options') {
        const maxOrder = quotationSettings?.storage?.reduce((max: number, storage: any) => 
          Math.max(max, storage.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      if (showAddModal === 'cable_options') {
        const maxOrder = quotationSettings?.cables?.reduce((max: number, cable: any) => 
          Math.max(max, cable.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      if (showAddModal === 'accessories') {
        const maxOrder = quotationSettings?.accessories?.reduce((max: number, accessory: any) => 
          Math.max(max, accessory.display_order || 0), 0) || 0;
        displayOrder = maxOrder + 1;
      }
      
      // Handle image upload for brands
      let imageUrl = formData.image_url || '';
      if (showAddModal === 'brands' && imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        imageFormData.append('folder', 'brands');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        } else {
          alert('Failed to upload image');
          return;
        }
      }
      
      const response = await fetch('/api/quotation-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          table: showAddModal,
          display_order: displayOrder,
          image_url: imageUrl
        })
      });
      
      if (response.ok) {
        alert('Item added successfully!');
        setShowAddModal(null);
        setFormData({});
        setImageFile(null);
        setImagePreview('');
        fetchQuotationSettings();
        // Notify all pages that data has changed
        notifyGlobalDataChange();
      } else {
        alert('Failed to add item');
      }
    } catch (error) {
      console.error('Add error:', error);
      alert('Failed to add item');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  const handleEdit = async () => {
    try {
      console.log('Edit button clicked');
      console.log('Current editingItem:', editingItem);
      console.log('Image file:', imageFile);
      
      if (!editingItem) {
        alert('No item selected for editing');
        return;
      }
      
      // Handle image upload for brands during edit
      let imageUrl = editingItem.image_url || '';
      if (editingItem.table === 'brands' && imageFile) {
        console.log('Uploading new brand image...');
        const imageFormData = new FormData();
        imageFormData.append('file', imageFile);
        imageFormData.append('folder', 'brands');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
          console.log('Image uploaded successfully:', imageUrl);
        } else {
          const errorText = await uploadRes.text();
          console.error('Image upload failed:', errorText);
          alert('Failed to upload image');
          return;
        }
      }
      
      console.log('Sending update request...');
      const updateData = {
        ...editingItem,
        image_url: imageUrl
      };
      console.log('Update data:', updateData);
      
      const response = await fetch('/api/quotation-manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        console.log('Update successful');
        alert('Item updated successfully!');
        // Notify all pages that data has changed
        notifyGlobalDataChange();
        setEditingItem(null);
        setImageFile(null);
        setImagePreview('');
        fetchQuotationSettings();
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        alert(`Failed to update item: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert(`Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quotation Settings</h1>
          <p className="text-slate-600 mt-1">Configure dropdown options for the quotation calculator - changes reflect immediately on homepage</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900 text-sm">Configuration Options Only</p>
              <p className="text-blue-700 text-xs mt-1">
                Manage dropdown options for the quotation calculator (Camera Types, Brands, Channels, etc.). 
                For pricing, go to <strong>Product & Pricing Master</strong> page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different settings */}
      <Tabs defaultValue="camera-types" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="camera-types">Camera Types</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="pixels">Pixels</TabsTrigger>
          <TabsTrigger value="tech-types">Tech Types</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="cables">Cables</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
        </TabsList>

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
                <Button className="font-bold" onClick={() => { 
                  setShowAddModal('brands'); 
                  setFormData({ name: '', display_order: 0 }); 
                  setImageFile(null);
                  setImagePreview('');
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brand
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-slate-100 border-b-2">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Brand Logo</th>
                    <th className="px-6 py-4 text-left text-xs font-black text-slate-600 uppercase">Brand Name</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Display Order</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {brands.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        {item.image_url ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-slate-200 bg-white">
                            <Image 
                              src={item.image_url} 
                              alt={item.name}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                            No Logo
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold">{item.name}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline" className="font-mono">{item.display_order}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingItem({ ...item, table: 'brands' });
                            setImagePreview(item.image_url || '');
                          }}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item.id, 'brands')}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
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
                <Button className="font-bold" onClick={() => { setShowAddModal('camera_tech_types'); setFormData({ name: '', camera_type: 'HD', location: 'indoor', display_order: 0 }); }}>
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
                <Button className="font-bold" onClick={() => { setShowAddModal('storage_options'); setFormData({ capacity: '', display_order: 0 }); }}>
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
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {storage.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.capacity}</td>
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
                <Button className="font-bold" onClick={() => { setShowAddModal('cable_options'); setFormData({ name: '', cable_type: 'HD', length: '', display_order: 0 }); }}>
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
                <Button className="font-bold" onClick={() => { setShowAddModal('accessories'); setFormData({ name: '', display_order: 0 }); }}>
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
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-black text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {accessories.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold">{item.name}</td>
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

      {/* Edit Modal */}
      <Dialog open={editingItem !== null} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription className="sr-only">Edit the selected item details</DialogDescription>
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
                {editingItem?.table === 'brands' && (
                  <div className="space-y-2">
                    <Label>Brand Logo/Image</Label>
                    {imagePreview && (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-200 mb-2">
                        <Image 
                          src={imagePreview} 
                          alt="Preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    )}
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">Upload a brand logo (PNG, JPG, or WebP recommended)</p>
                  </div>
                )}
              </>
            )}
            {/* Hide display order field for all auto-generated items */}
            {editingItem?.table !== 'brands' && 
             editingItem?.table !== 'camera_types' && 
             editingItem?.table !== 'channel_options' && 
             editingItem?.table !== 'pixel_options' && 
             editingItem?.table !== 'camera_tech_types' && 
             editingItem?.table !== 'storage_options' && 
             editingItem?.table !== 'cable_options' && 
             editingItem?.table !== 'accessories' && (
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input 
                  type="number"
                  value={editingItem?.display_order || 0} 
                  onChange={(e) => setEditingItem({...editingItem, display_order: parseInt(e.target.value)})}
                />
              </div>
            )}
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
            <DialogDescription className="sr-only">Add a new item to the database</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {showAddModal === 'camera_types' || showAddModal === 'brands' || showAddModal === 'pixel_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter name"
                  />
                </div>
                {showAddModal === 'brands' && (
                  <div className="space-y-2">
                    <Label>Brand Logo/Image</Label>
                    {imagePreview && (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-slate-200 mb-2">
                        <Image 
                          src={imagePreview} 
                          alt="Preview"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    )}
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">Upload a brand logo (PNG, JPG, or WebP recommended)</p>
                    <p className="text-xs text-blue-600 font-semibold">Display order will be auto-generated based on entry sequence</p>
                  </div>
                )}
                {(showAddModal === 'camera_types' || showAddModal === 'pixel_options') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-2">
                    <p className="text-xs text-blue-700 font-semibold">ℹ️ Display order will be auto-generated based on entry sequence</p>
                  </div>
                )}
                <input type="hidden" value={formData.display_order || 0} />
              </>
            ) : showAddModal === 'channel_options' ? (
              <>
                <div className="space-y-2">
                  <Label>Channel Count *</Label>
                  <Input 
                    type="number"
                    value={formData.channel_count || ''} 
                    onChange={(e) => setFormData({...formData, channel_count: parseInt(e.target.value)})}
                    placeholder="e.g., 4, 8, 16, 32"
                  />
                  <p className="text-xs text-slate-500">Enter the number of channels (e.g., 4, 8, 16)</p>
                </div>
                <div className="space-y-2">
                  <Label>Features (Optional - one per line)</Label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                    value={Array.isArray(formData.features) ? formData.features.join('\n') : ''} 
                    onChange={(e) => setFormData({...formData, features: e.target.value.split('\n').filter((f: string) => f.trim())})}
                    placeholder="Supports up to 16 Cameras&#10;4K Resolution Support&#10;2 SATA Ports&#10;H.265+ Compression&#10;Smart Detection"
                  />
                  <p className="text-xs text-slate-500">These features will be displayed only on the Automated Quotation page</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 font-semibold">ℹ️ Display order will be auto-generated based on entry sequence</p>
                </div>
                <div className="space-y-2" style={{display: 'none'}}>
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
                  <Label>Capacity *</Label>
                  <Input 
                    value={formData.capacity || ''} 
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                    placeholder="e.g., 1TB, 2TB, 4TB"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 font-semibold">ℹ️ Display order will be auto-generated based on entry sequence</p>
                </div>
                <input type="hidden" value={formData.display_order || 0} />
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
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 font-semibold">ℹ️ Display order will be auto-generated based on entry sequence</p>
                </div>
                <input type="hidden" value={formData.display_order || 0} />
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
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 font-semibold">ℹ️ Display order will be auto-generated based on entry sequence</p>
                </div>
                <input type="hidden" value={formData.display_order || 0} />
              </>
            ) : showAddModal === 'accessories' ? (
              <>
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., BNC Connectors"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700 font-semibold">ℹ️ Display order will be auto-generated based on entry sequence</p>
                </div>
                <input type="hidden" value={formData.display_order || 0} />
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(null)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
