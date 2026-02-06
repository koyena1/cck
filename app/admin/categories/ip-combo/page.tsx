'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useGlobalQuotationData } from '@/lib/useGlobalQuotationData';

interface Product {
  id: number;
  name: string;
  brand: string;
  channels: string;
  cameraType: string;
  resolution: string;
  hdd: string;
  cable: string;
  price: number;
  originalPrice: number;
  image: string;
  specs: string[];
  rating: number;
  reviews: number;
  isActive: boolean;
}

export default function IPComboAdmin() {
  // Get global data from admin quotation management
  const { data: globalData, loading: loadingGlobal } = useGlobalQuotationData();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    channels: '4',
    cameraType: 'Bullet',
    resolution: '2MP',
    hdd: '1TB',
    cable: '90 Meter',
    price: '',
    originalPrice: '',
    image: '',
    specs: [''],
    rating: '4.5',
    reviews: '0',
    isActive: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const res = await fetch(`/api/ip-combo-products?admin=true&t=${timestamp}`, {
        cache: 'no-store'
      });
      const data = await res.json();
      
      console.log('👨‍💻 Admin: Fetched', data.products?.length || 0, 'IP Combo products');
      
      if (data.success) {
        const mappedProducts = data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
          channels: p.channels,
          cameraType: p.camera_type,
          resolution: p.resolution,
          hdd: p.hdd,
          cable: p.cable,
        price: parseFloat(p.price),
        originalPrice: parseFloat(p.original_price),
        image: p.image || '',
        specs: Array.isArray(p.specs) ? p.specs : [],
        rating: parseFloat(p.rating) || 4.5,
        reviews: p.reviews || 0,
        isActive: p.is_active
      }));
      setProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, image: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSpec = () => {
    setFormData({ ...formData, specs: [...formData.specs, ''] });
  };

  const handleRemoveSpec = (index: number) => {
    const newSpecs = formData.specs.filter((_, i) => i !== index);
    setFormData({ ...formData, specs: newSpecs });
  };

  const handleSpecChange = (index: number, value: string) => {
    const newSpecs = [...formData.specs];
    newSpecs[index] = value;
    setFormData({ ...formData, specs: newSpecs });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Immediate validation before setting loading
    if (!formData.name || !formData.brand || !formData.price) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    console.log('🚀 Starting IP Combo form submission...');

    try {
      const url = editingProduct
        ? `/api/ip-combo-products?id=${editingProduct.id}`
        : '/api/ip-combo-products';

      const method = editingProduct ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        brand: formData.brand,
        channels: parseInt(formData.channels),
        camera_type: formData.cameraType,
        resolution: formData.resolution,
        hdd: formData.hdd,
        cable: formData.cable,
        price: parseFloat(formData.price),
        original_price: parseFloat(formData.originalPrice),
        image: formData.image,
        specs: formData.specs.filter(spec => spec.trim() !== ''),
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        is_active: formData.isActive
      };

      console.log('📤 Sending request to:', url);
      console.log('📦 Payload:', payload);

      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('⏱️ Request timeout after 10 seconds');
      }, 10000); // 10 second timeout

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📥 Response received:', res.status, res.statusText);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Success:', data);
        await fetchProducts();
        handleCloseModal();
        alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ API Error:', res.status, errorData);
        alert('Error: ' + (errorData.error || `Server returned ${res.status}`));
        setLoading(false); // Reset loading on error
      }
    } catch (error: any) {
      console.error('💥 Exception caught:', error);
      if (error.name === 'AbortError') {
        alert('Request timeout - Server is not responding. Please check:\n1. Next.js dev server is running\n2. Database connection is working\n3. Internet connection');
      } else if (error.message.includes('Failed to fetch')) {
        alert('Cannot connect to server. Make sure:\n1. Next.js dev server is running (npm run dev)\n2. Server is on http://localhost:3000');
      } else {
        alert('Error: ' + (error.message || 'Unknown error'));
      }
      setLoading(false); // Reset loading on error
    } finally {
      // Safety net - ensure loading is reset
      setTimeout(() => setLoading(false), 100);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      channels: product.channels.toString(),
      cameraType: product.cameraType,
      resolution: product.resolution,
      hdd: product.hdd,
      cable: product.cable,
      price: product.price.toString(),
      originalPrice: product.originalPrice.toString(),
      image: product.image,
      specs: product.specs && product.specs.length > 0 ? product.specs : [''],
      rating: product.rating.toString(),
      reviews: product.reviews.toString(),
      isActive: product.isActive
    });
    setImagePreview(product.image);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/ip-combo-products?id=${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchProducts();
        alert('Product deleted successfully!');
      } else {
        alert('Error deleting product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setImagePreview('');
    setFormData({
      name: '',
      brand: '',
    channels: '4',
    cameraType: 'Bullet',
    resolution: '2MP',
    hdd: '1TB',
    cable: '90 Meter',
      price: '',
      originalPrice: '',
      image: '',
      specs: [''],
      rating: '4.5',
      reviews: '0',
      isActive: true
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IP Combo Products</h1>
          <p className="text-gray-600 mt-1">Manage your IP Combo products</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channels</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Camera Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolution</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hard Disk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cable Length</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4">
                  <div className="h-16 w-16 relative bg-gray-100 rounded flex items-center justify-center">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No Image</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.brand}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.channels}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.cameraType}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.resolution}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.hdd}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{product.cable}</td>
                <td className="px-6 py-4 text-sm text-gray-900">₹{product.price}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Global Data Loading Banner */}
            {loadingGlobal && (
              <div className="mx-6 mt-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">🔄 Loading brands, channels, and options from Quotation Management...</p>
              </div>
            )}

            {/* Global Data Info Banner */}
            <div className="mx-6 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✨ <strong>Global Data System Active:</strong> All brands, channels, resolutions, storage, and cable lengths are managed in <strong>Quotation Management</strong>. 
                Any additions there will automatically appear in these dropdowns!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Brand - Dynamic from Admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand *
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Brand</option>
                    {globalData?.brands?.map((brand) => (
                      <option key={brand.id} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    📝 Add/edit brands in Quotation Management
                  </p>
                </div>

                {/* Channels - Dynamic from Admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channels *
                  </label>
                  <select
                    value={formData.channels}
                    onChange={(e) => setFormData({ ...formData, channels: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {globalData?.channels?.map((channel) => (
                      <option key={channel.id} value={channel.channel_count}>
                        {channel.channel_count} Channel
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    📝 Add/edit channels in Quotation Management
                  </p>
                </div>

                {/* Camera Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Type *
                  </label>
                  <input
                    type="text"
                    value={formData.cameraType}
                    onChange={(e) => setFormData({ ...formData, cameraType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Resolution - Dynamic from Admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution *
                  </label>
                  <select
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {globalData?.pixels?.map((pixel) => (
                      <option key={pixel.id} value={pixel.name}>
                        {pixel.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    📝 Add/edit resolutions in Quotation Management
                  </p>
                </div>

                {/* Hard Disk - Dynamic from Admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hard Disk *
                  </label>
                  <select
                    value={formData.hdd}
                    onChange={(e) => setFormData({ ...formData, hdd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {globalData?.storage?.map((storage) => (
                      <option key={storage.id} value={storage.capacity}>
                        {storage.capacity}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    📝 Add/edit storage in Quotation Management
                  </p>
                </div>

                {/* Cable Length - Dynamic from Admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cable Length *
                  </label>
                  <select
                    value={formData.cable}
                    onChange={(e) => setFormData({ ...formData, cable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {globalData?.cables?.map((cable) => (
                      <option key={cable.id} value={cable.length}>
                        {cable.length}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    📝 Add/edit cable lengths in Quotation Management
                  </p>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price
                  </label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Reviews */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reviews Count
                  </label>
                  <input
                    type="number"
                    value={formData.reviews}
                    onChange={(e) => setFormData({ ...formData, reviews: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Image Upload */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Image *
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100">
                      <Upload className="w-5 h-5" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {imagePreview && (
                      <div className="relative h-20 w-20">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Specifications */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specifications
                  </label>
                  {formData.specs.map((spec, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={spec}
                        onChange={(e) => handleSpecChange(index, e.target.value)}
                        placeholder={`Specification ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.specs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(index)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Specification
                  </button>
                </div>

                {/* Active Status */}
                <div className="col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
