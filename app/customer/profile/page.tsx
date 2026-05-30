'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, UserCircle, Mail, Phone, MapPin, Hash } from 'lucide-react';

export default function CustomerProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    pincode: '',
    city: '',
    landmark: '',
    district: '',
    state: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const email = localStorage.getItem('customerEmail');

    if (!token || !email) {
      router.push('/login');
      return;
    }

    setCustomerEmail(email);
    loadProfile(email);
  }, [router]);

  const loadProfile = async (email: string) => {
    try {
      const response = await fetch(`/api/customer/profile?customerEmail=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success && data.customer) {
        const nextProfile = {
          full_name: data.customer.full_name || '',
          phone: data.customer.phone || '',
          address: data.customer.address || '',
          pincode: data.customer.pincode || '',
          city: data.customer.city || '',
          landmark: data.customer.landmark || '',
          district: data.customer.district || '',
          state: data.customer.state || '',
        };
        setFormData({
          full_name: nextProfile.full_name,
          phone: nextProfile.phone,
          address: nextProfile.address,
          pincode: nextProfile.pincode,
          city: nextProfile.city,
          landmark: nextProfile.landmark,
          district: nextProfile.district,
          state: nextProfile.state,
        });
        if (nextProfile.full_name) {
          localStorage.setItem('customerName', nextProfile.full_name);
        }
        if (data.customer.email) {
          localStorage.setItem('customerEmail', data.customer.email);
        }
        if (nextProfile.phone) {
          localStorage.setItem('customerPhone', nextProfile.phone);
        }
        if (nextProfile.address) {
          localStorage.setItem('customerAddress', nextProfile.address);
        }
        if (nextProfile.pincode) {
          localStorage.setItem('customerPincode', nextProfile.pincode);
        }
        if (nextProfile.city) {
          localStorage.setItem('customerCity', nextProfile.city);
        }
        if (nextProfile.landmark) {
          localStorage.setItem('customerLandmark', nextProfile.landmark);
        }
        if (nextProfile.district) {
          localStorage.setItem('customerDistrict', nextProfile.district);
        }
        if (nextProfile.state) {
          localStorage.setItem('customerState', nextProfile.state);
        }
        setMessage('');
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error loading customer profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          pincode: formData.pincode,
          city: formData.city,
          landmark: formData.landmark,
          district: formData.district,
          state: formData.state,
        }),
      });

      const data = await response.json();

      if (data.success && data.customer) {
        localStorage.setItem('customerName', data.customer.full_name || 'Customer');
        localStorage.setItem('customerEmail', data.customer.email || customerEmail);
        localStorage.setItem('customerPhone', data.customer.phone || '');

        if (data.customer.address) {
          localStorage.setItem('customerAddress', data.customer.address);
        } else {
          localStorage.removeItem('customerAddress');
        }

        if (data.customer.pincode) {
          localStorage.setItem('customerPincode', data.customer.pincode);
        } else {
          localStorage.removeItem('customerPincode');
        }
        const nextCity = formData.city.trim();
        const nextLandmark = formData.landmark.trim();
        const nextDistrict = formData.district.trim();
        const nextState = formData.state.trim();

        if (nextCity) {
          localStorage.setItem('customerCity', nextCity);
        } else {
          localStorage.removeItem('customerCity');
        }
        if (nextLandmark) {
          localStorage.setItem('customerLandmark', nextLandmark);
        } else {
          localStorage.removeItem('customerLandmark');
        }
        if (nextDistrict) {
          localStorage.setItem('customerDistrict', nextDistrict);
        } else {
          localStorage.removeItem('customerDistrict');
        }
        if (nextState) {
          localStorage.setItem('customerState', nextState);
        } else {
          localStorage.removeItem('customerState');
        }

        window.dispatchEvent(new Event('customer-profile-updated'));
        setMessage('Profile updated successfully');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating customer profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex min-h-[70vh] items-center justify-center text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading profile...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-24">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e63946]">Customer Portal</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Edit Profile</h1>
          <p className="mt-2 text-slate-600">Update your name, phone number, address, and PIN code. Buy Now will use the saved details automatically.</p>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="border-b border-slate-100 bg-white">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
              <UserCircle className="h-5 w-5 text-[#e63946]" /> Profile Details
            </CardTitle>
            <CardDescription>Keep your checkout details current across the portal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <UserCircle className="h-4 w-4" /> Full Name
                </label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Mail className="h-4 w-4" /> Email
                </label>
                <Input value={customerEmail} disabled className="bg-slate-100" />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Phone className="h-4 w-4" /> Phone Number
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Hash className="h-4 w-4" /> PIN Code
                </label>
                <Input
                  value={formData.pincode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="6-digit PIN code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MapPin className="h-4 w-4" /> Address
              </label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your full address"
                rows={4}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4" /> City
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter your city"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4" /> Landmark
                </label>
                <Input
                  value={formData.landmark}
                  onChange={(e) => setFormData((prev) => ({ ...prev, landmark: e.target.value }))}
                  placeholder="Enter nearby landmark"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4" /> District
                </label>
                <Input
                  value={formData.district}
                  onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                  placeholder="Enter your district"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4" /> State
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter your state"
                />
              </div>
            </div>

            {(error || message) && (
              <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                {error || message}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => router.push('/customer/dashboard')}>
                Back to Rewards
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#e63946] text-white hover:bg-red-700">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}