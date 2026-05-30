'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BUSINESS_SECTIONS = [
  { key: 'biometric-access', name: 'Biometric Access' },
  { key: 'gps-system', name: 'GPS System' },
  { key: 'system', name: 'System' },
  { key: 'fire-alarm', name: 'Fire Alarm' },
  { key: 'intercom-system', name: 'Intercom System' },
  { key: 'motion-detection', name: 'Motion Detection' },
  { key: 'pa-system', name: 'PA System' },
  { key: 'combo-products', name: 'Combo Products' },
] as const;

const BEST_SELLER_SECTION = { key: 'best-seller', name: 'Best Seller' } as const;
const ALL_SECTIONS = [BEST_SELLER_SECTION, ...BUSINESS_SECTIONS] as const;

type AdminBestsellerProduct = {
  id: number;
  product_name: string;
  brand_name: string;
  image: string;
  base_price: number;
  original_price: number | null;
  price_note: string;
  segment: string;
  product_description: string;
  product_specifications: string;
  sold: number;
  selected: boolean;
};

type CreateFormState = {
  product_name: string;
  base_price: string;
  original_price: string;
  price_note: string;
  product_description: string;
  product_specifications: string;
  segment: string;
  brand_name: string;
  sold: string;
  image_url: string;
};

const initialFormState: CreateFormState = {
  product_name: '',
  base_price: '0',
  original_price: '',
  price_note: '',
  product_description: '',
  product_specifications: '',
  segment: '',
  brand_name: '',
  sold: '0',
  image_url: '',
};

export default function AdminBestsellersPage() {
  const [activeBusiness, setActiveBusiness] = useState<string>(BEST_SELLER_SECTION.key);
  const [products, setProducts] = useState<AdminBestsellerProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formState, setFormState] = useState<CreateFormState>(initialFormState);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editFormState, setEditFormState] = useState<CreateFormState>(initialFormState);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bestseller-products?business=${encodeURIComponent(activeBusiness)}`, { cache: 'no-store' });
      const data = await response.json();

      if (data.success && Array.isArray(data.products)) {
        const mapped = data.products.map((p: any) => ({
          id: Number(p.id),
          product_name: p.product_name || '',
          brand_name: p.brand_name || '',
          image: p.image || '/pdt.png',
          base_price: Number(p.base_price) || 0,
          original_price: p.original_price !== null ? Number(p.original_price) || 0 : null,
          price_note: p.price_note || '',
          segment: p.segment || 'CCTV',
          product_description: p.product_description || '',
          product_specifications: p.product_specifications || '',
          sold: Number(p.sold) || 0,
          selected: Boolean(p.selected),
        }));

        setProducts(mapped);
        setSelectedIds(mapped.filter((item: AdminBestsellerProduct) => item.selected).map((item: AdminBestsellerProduct) => item.id));
      } else {
        setProducts([]);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Failed to fetch bestseller products:', error);
      setProducts([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [activeBusiness]);

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) =>
      p.product_name.toLowerCase().includes(q) ||
      p.brand_name.toLowerCase().includes(q) ||
      p.segment.toLowerCase().includes(q)
    );
  }, [products, searchText]);

  const toggleSelection = (productId: number) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/bestseller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business: activeBusiness, selectedProductIds: selectedIds }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to save selected products');
      }

      alert('Business section products updated successfully.');
      await fetchProducts();
    } catch (error) {
      console.error('Failed to save bestseller products:', error);
      alert('Failed to save business section products.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProduct = async () => {
    try {
      if (!formState.product_name.trim() || !formState.segment.trim() || !formState.brand_name.trim()) {
        alert('Please fill Product Name, Segment and Brand Name.');
        return;
      }

      setCreating(true);
      const response = await fetch('/api/admin/bestseller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createProduct',
          business: activeBusiness,
          ...formState,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to create product');
      }

      alert('Product created and added to selected business section.');
      setFormState(initialFormState);
      setShowCreateForm(false);
      await fetchProducts();
    } catch (error) {
      console.error('Failed to create bestseller product:', error);
      alert(error instanceof Error ? error.message : 'Failed to create product.');
    } finally {
      setCreating(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      setFormState((prev) => ({ ...prev, image_url: dataUrl }));
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to read selected image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveFromHomepage = async (productId: number) => {
    try {
      setRemovingId(productId);
      const response = await fetch('/api/admin/bestseller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeFromHomepage', business: activeBusiness, productId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to remove product from homepage');
      }

      setSelectedIds((prev) => prev.filter((id) => id !== productId));
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, selected: false } : p)));
      alert('Product removed from selected section.');

      // Re-sync with backend in case there are concurrent admin updates.
      await fetchProducts();
    } catch (error) {
      console.error('Failed to remove from homepage:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove product from homepage.');
    } finally {
      setRemovingId(null);
    }
  };

  const startEditing = (product: AdminBestsellerProduct) => {
    setEditingProductId(product.id);
    setEditFormState({
      product_name: product.product_name || '',
      base_price: String(product.base_price ?? 0),
      original_price: product.original_price !== null ? String(product.original_price) : '',
      price_note: product.price_note || '',
      product_description: product.product_description || '',
      product_specifications: product.product_specifications || '',
      segment: product.segment || '',
      brand_name: product.brand_name || '',
      sold: String(product.sold ?? 0),
      image_url: product.image || '',
    });
  };

  const handleEditImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setUploadingEditImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      setEditFormState((prev) => ({ ...prev, image_url: dataUrl }));
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to read selected image.');
    } finally {
      setUploadingEditImage(false);
    }
  };

  const handleUpdateProduct = async () => {
    try {
      if (!editingProductId) return;

      if (!editFormState.product_name.trim() || !editFormState.segment.trim() || !editFormState.brand_name.trim()) {
        alert('Please fill Product Name, Segment and Brand Name.');
        return;
      }

      setUpdating(true);
      const response = await fetch('/api/admin/bestseller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateProduct',
          business: activeBusiness,
          productId: editingProductId,
          ...editFormState,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to update product');
      }

      alert('Product updated successfully.');
      setEditingProductId(null);
      setEditFormState(initialFormState);
      await fetchProducts();
    } catch (error) {
      console.error('Failed to update product:', error);
      alert(error instanceof Error ? error.message : 'Failed to update product.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">Business Product Section Control</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Best Seller is managed separately. Business sections are also managed separately, and products appear only under their selected section.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeBusiness === BEST_SELLER_SECTION.key ? 'default' : 'outline'}
            onClick={() => setActiveBusiness(BEST_SELLER_SECTION.key)}
            className={
              activeBusiness === BEST_SELLER_SECTION.key
                ? 'bg-[#e63946] hover:bg-[#d62839] text-white'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700'
            }
          >
            {BEST_SELLER_SECTION.name}
          </Button>
        </div>

        <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
          Business Sections
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {BUSINESS_SECTIONS.map((section) => (
            <Button
              key={section.key}
              type="button"
              variant={activeBusiness === section.key ? 'default' : 'outline'}
              onClick={() => setActiveBusiness(section.key)}
              className={
                activeBusiness === section.key
                  ? 'bg-[#e63946] hover:bg-[#d62839] text-white'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-700'
              }
            >
              {section.name}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by product, brand, or segment"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-200 font-semibold">
              {ALL_SECTIONS.find((item) => item.key === activeBusiness)?.name}: {selectedIds.length} selected
            </div>
            <Button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {showCreateForm ? 'Close Create Form' : `Create Product For ${ALL_SECTIONS.find((item) => item.key === activeBusiness)?.name}`}
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/60 transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Create Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Product Name (required)" value={formState.product_name} onChange={(e) => setFormState((prev) => ({ ...prev, product_name: e.target.value }))} />
              <Input placeholder="Base Price" type="text" inputMode="decimal" value={formState.base_price} onChange={(e) => setFormState((prev) => ({ ...prev, base_price: e.target.value }))} />
              <Input placeholder="Original Price" type="text" inputMode="decimal" value={formState.original_price} onChange={(e) => setFormState((prev) => ({ ...prev, original_price: e.target.value }))} />
              <Input placeholder="Price Note (excl gst)" value={formState.price_note} onChange={(e) => setFormState((prev) => ({ ...prev, price_note: e.target.value }))} />
              <Input placeholder="Product Description" value={formState.product_description} onChange={(e) => setFormState((prev) => ({ ...prev, product_description: e.target.value }))} />
              <Input placeholder="Product Specifications" value={formState.product_specifications} onChange={(e) => setFormState((prev) => ({ ...prev, product_specifications: e.target.value }))} />
              <Input placeholder="Segment (required)" value={formState.segment} onChange={(e) => setFormState((prev) => ({ ...prev, segment: e.target.value }))} />
              <Input placeholder="Brand Name (required)" value={formState.brand_name} onChange={(e) => setFormState((prev) => ({ ...prev, brand_name: e.target.value }))} />
              <Input placeholder="Sold" type="number" value={formState.sold} onChange={(e) => setFormState((prev) => ({ ...prev, sold: e.target.value }))} />
              <Input placeholder="Image URL" value={formState.image_url} onChange={(e) => setFormState((prev) => ({ ...prev, image_url: e.target.value }))} />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">Upload Image From System</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-slate-700 dark:text-slate-200"
                />
                {uploadingImage && <p className="text-xs text-slate-500 dark:text-slate-300">Reading selected image...</p>}
              </div>
            </div>
            {!!formState.image_url && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Selected Image Preview</p>
                <img src={formState.image_url} alt="Selected product" className="h-24 w-24 object-cover rounded border border-slate-200 dark:border-slate-700" />
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={handleCreateProduct}
                disabled={creating}
                className="bg-[#e63946] hover:bg-[#d62839] text-white font-bold"
              >
                {creating ? 'Creating...' : 'Create and Add to Selected Section'}
              </Button>
            </div>
          </div>
        )}

        {editingProductId !== null && (
          <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 transition-colors">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Edit Product #{editingProductId}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Product Name (required)" value={editFormState.product_name} onChange={(e) => setEditFormState((prev) => ({ ...prev, product_name: e.target.value }))} />
              <Input placeholder="Base Price" type="text" inputMode="decimal" value={editFormState.base_price} onChange={(e) => setEditFormState((prev) => ({ ...prev, base_price: e.target.value }))} />
              <Input placeholder="Original Price" type="text" inputMode="decimal" value={editFormState.original_price} onChange={(e) => setEditFormState((prev) => ({ ...prev, original_price: e.target.value }))} />
              <Input placeholder="Price Note (excl gst)" value={editFormState.price_note} onChange={(e) => setEditFormState((prev) => ({ ...prev, price_note: e.target.value }))} />
              <Input placeholder="Product Description" value={editFormState.product_description} onChange={(e) => setEditFormState((prev) => ({ ...prev, product_description: e.target.value }))} />
              <Input placeholder="Product Specifications" value={editFormState.product_specifications} onChange={(e) => setEditFormState((prev) => ({ ...prev, product_specifications: e.target.value }))} />
              <Input placeholder="Segment (required)" value={editFormState.segment} onChange={(e) => setEditFormState((prev) => ({ ...prev, segment: e.target.value }))} />
              <Input placeholder="Brand Name (required)" value={editFormState.brand_name} onChange={(e) => setEditFormState((prev) => ({ ...prev, brand_name: e.target.value }))} />
              <Input placeholder="Sold" type="number" value={editFormState.sold} onChange={(e) => setEditFormState((prev) => ({ ...prev, sold: e.target.value }))} />
              <Input placeholder="Image URL" value={editFormState.image_url} onChange={(e) => setEditFormState((prev) => ({ ...prev, image_url: e.target.value }))} />
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">Upload Image From System</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  className="text-sm text-slate-700 dark:text-slate-200"
                />
                {uploadingEditImage && <p className="text-xs text-slate-500 dark:text-slate-300">Reading selected image...</p>}
              </div>
            </div>
            {!!editFormState.image_url && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Selected Image Preview</p>
                <img src={editFormState.image_url} alt="Selected product" className="h-24 w-24 object-cover rounded border border-slate-200 dark:border-slate-700" />
              </div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingProductId(null);
                  setEditFormState(initialFormState);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateProduct}
                disabled={updating}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                {updating ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {loading ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-300">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-slate-600 dark:text-slate-300">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225">
              <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Show</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Product</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Brand</th>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Segment</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Base Price</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Original Price</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Sold</th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const checked = selectedIds.includes(product.id);

                  return (
                    <tr key={product.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelection(product.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{product.product_name}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{product.brand_name}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{product.segment}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">RS {product.base_price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                        {product.original_price !== null ? `RS ${product.original_price.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#e63946]">{product.sold}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="text-slate-700 border-slate-300 hover:bg-slate-100 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700"
                            onClick={() => startEditing(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-300 dark:border-red-500 dark:hover:bg-red-950/50"
                            onClick={() => handleRemoveFromHomepage(product.id)}
                            disabled={removingId === product.id || !checked}
                          >
                            {removingId === product.id ? 'Removing...' : 'Remove'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-[#e63946] hover:bg-[#d62839] text-white font-bold"
        >
          {saving ? 'Saving...' : 'Save Bestseller Selection'}
        </Button>
      </div>
    </div>
  );
}
