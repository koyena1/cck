'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit3, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type AdminTestimonial = {
  id: number;
  customer_name: string;
  location: string;
  testimonial_text: string;
  rating: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type TestimonialForm = {
  customer_name: string;
  location: string;
  testimonial_text: string;
  rating: string;
  display_order: string;
  is_active: boolean;
};

const initialForm: TestimonialForm = {
  customer_name: '',
  location: '',
  testimonial_text: '',
  rating: '5',
  display_order: '0',
  is_active: true,
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TestimonialForm>(initialForm);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/testimonials', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to fetch testimonials');
      }

      setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
    } catch (error) {
      console.error('Admin testimonials load failed:', error);
      alert('Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.customer_name.trim()) {
      alert('Customer name is required.');
      return false;
    }

    if (!form.testimonial_text.trim()) {
      alert('Testimonial text is required.');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const response = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name,
          location: form.location,
          testimonial_text: form.testimonial_text,
          rating: Number(form.rating) || 5,
          display_order: Number(form.display_order) || 0,
          is_active: form.is_active,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to create testimonial');
      }

      alert('Testimonial created successfully.');
      resetForm();
      await fetchTestimonials();
    } catch (error) {
      console.error('Create testimonial failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to create testimonial.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm() || !editingId) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/admin/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          customer_name: form.customer_name,
          location: form.location,
          testimonial_text: form.testimonial_text,
          rating: Number(form.rating) || 5,
          display_order: Number(form.display_order) || 0,
          is_active: form.is_active,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to update testimonial');
      }

      alert('Testimonial updated successfully.');
      resetForm();
      await fetchTestimonials();
    } catch (error) {
      console.error('Update testimonial failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to update testimonial.');
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = (item: AdminTestimonial) => {
    setEditingId(item.id);
    setForm({
      customer_name: item.customer_name,
      location: item.location || '',
      testimonial_text: item.testimonial_text,
      rating: String(item.rating ?? 5),
      display_order: String(item.display_order ?? 0),
      is_active: item.is_active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (item: AdminTestimonial) => {
    try {
      const response = await fetch('/api/admin/testimonials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, is_active: !item.is_active }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to update status');
      }

      await fetchTestimonials();
    } catch (error) {
      console.error('Toggle testimonial failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to update status.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this testimonial permanently?')) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Failed to delete testimonial');
      }

      if (editingId === id) {
        resetForm();
      }

      await fetchTestimonials();
    } catch (error) {
      console.error('Delete testimonial failed:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete testimonial.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4 transition-colors">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">Testimonials Management</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Add customer testimonials here. Active testimonials are shown automatically on the public testimonial page.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Customer Name</label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Sunil D Bisht"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Location</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Zirakpur, India"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Display Order</label>
            <Input
              type="number"
              min={0}
              value={form.display_order}
              onChange={(e) => setForm((prev) => ({ ...prev, display_order: e.target.value }))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Rating (1 to 5)</label>
            <Input
              type="number"
              min={1}
              max={5}
              value={form.rating}
              onChange={(e) => setForm((prev) => ({ ...prev, rating: e.target.value }))}
              placeholder="5"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Testimonial Message</label>
          <Textarea
            value={form.testimonial_text}
            onChange={(e) => setForm((prev) => ({ ...prev, testimonial_text: e.target.value }))}
            placeholder="Write the customer testimonial here"
            rows={5}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={form.is_active ? 'default' : 'outline'}
            className={form.is_active ? 'bg-[#e63946] hover:bg-[#d62839] text-white' : ''}
            onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
          >
            {form.is_active ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {form.is_active ? 'Active' : 'Inactive'}
          </Button>

          {!isEditing ? (
            <Button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="bg-[#e63946] hover:bg-[#d62839] text-white"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Testimonial
            </Button>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleUpdate}
                disabled={updating}
                className="bg-[#e63946] hover:bg-[#d62839] text-white"
              >
                {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit3 className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>

              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-4">Saved Testimonials</h2>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-slate-500 dark:text-slate-300">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading testimonials...
          </div>
        ) : testimonials.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-300 text-sm">No testimonials found yet.</p>
        ) : (
          <div className="space-y-4">
            {testimonials.map((item) => (
              <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/60 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.customer_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-300">{item.location || 'India'}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 mt-2 leading-relaxed">{item.testimonial_text}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <span className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Order: {item.display_order}</span>
                      <span className="px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Rating: {item.rating}/5</span>
                      <span className={`px-2 py-1 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleToggleStatus(item)}>
                      {item.is_active ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {item.is_active ? 'Hide' : 'Show'}
                    </Button>

                    <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      {deletingId === item.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
