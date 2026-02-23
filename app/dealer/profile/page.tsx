'use client';

import { useState, useEffect } from "react"
import { 
  UserCircle, 
  ShieldCheck, 
  Users, 
  Wrench, 
  Trophy,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Building2,
  Edit,
  X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface DealerInfo {
  dealer_id: number;
  full_name: string;
  business_name: string;
  email: string;
  phone?: string;
  address?: string;
  location?: string;
  gst_number?: string;
  registration_number?: string;
  service_pin?: string;
  status: string;
  rating: string;
  completed_jobs: number;
  created_at: string;
}

export default function DealerProfile() {
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [technicians, setTechnicians] = useState(4);
  const [vehicles, setVehicles] = useState(2);
  
  // Editable form fields
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    gst_number: '',
    registration_number: ''
  });

  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        const dealerId = localStorage.getItem('dealerId');
        
        if (!dealerId) {
          console.warn('No dealer ID found');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/dealer/me?dealerId=${dealerId}`);
        const data = await response.json();
        
        if (data.success) {
          setDealer(data.dealer);
          // Initialize form data with dealer info
          setFormData({
            full_name: data.dealer.full_name || '',
            business_name: data.dealer.business_name || '',
            email: data.dealer.email || '',
            phone: data.dealer.phone || '',
            address: data.dealer.address || '',
            location: data.dealer.location || '',
            gst_number: data.dealer.gst_number || '',
            registration_number: data.dealer.registration_number || ''
          });
        } else {
          console.error('Failed to load dealer data');
        }
      } catch (error) {
        console.error('Failed to fetch dealer info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealerInfo();
  }, []);

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const dealerId = localStorage.getItem('dealerId');
      
      if (!dealerId) {
        alert('Please login to save changes');
        setSaving(false);
        return;
      }
      
      const response = await fetch('/api/dealer/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId,
          ...formData
        })
      });

      const data = await response.json();

      if (data.success) {
        setDealer(data.dealer);
        setIsEditing(false);
        alert('Profile updated successfully!');
        // Reload the page to update the sidebar with new dealer info
        window.location.reload();
      } else {
        alert(`Failed to update profile: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to original dealer data
    if (dealer) {
      setFormData({
        full_name: dealer.full_name || '',
        business_name: dealer.business_name || '',
        email: dealer.email || '',
        phone: dealer.phone || '',
        address: dealer.address || '',
        location: dealer.location || '',
        gst_number: dealer.gst_number || '',
        registration_number: dealer.registration_number || ''
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading dealer profile...</p>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="p-6 lg:p-10 flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-slate-600">Please log in to view your dealer profile</p>
        <Button
          onClick={() => window.location.href = '/login'}
          className="bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a]"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  const overallRating = parseFloat(dealer.rating || '0');
  const infrastructureRating = 90; // Can be calculated or stored separately
  const qualityRating = 82; // Can be calculated or stored separately

  return (
    <div className="p-6 lg:p-10 space-y-6 bg-[#f8fafc] min-h-screen">
      <div>
        <h1 className="text-3xl font-bold font-orbitron tracking-tight uppercase text-[#0f172a]">Dealer Profile</h1>
        <p className="text-muted-foreground mt-1 font-poppins">Manage your technical infrastructure and view performance ratings.</p>
      </div>

      {/* Dealer Information Card */}
      <Card className="border-none shadow-sm">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className="text-[#0f172a] w-5 h-5" />
              <CardTitle className="font-orbitron text-sm uppercase">Business Information</CardTitle>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={saving}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  size="sm"
                  className="gap-2 bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a]"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">Full Name</label>
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter full name"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <UserCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">{dealer?.full_name || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">Business Name</label>
              {isEditing ? (
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter business name"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">{dealer?.business_name || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter email"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">{dealer?.email || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">Phone</label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">{dealer?.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">Address</label>
              {isEditing ? (
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter complete business address"
                  rows={2}
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-sm font-medium">{dealer?.address || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">Location</label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter location/city"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">{dealer?.location || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">GST Number</label>
              {isEditing ? (
                <Input
                  value={formData.gst_number}
                  onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter GST number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">{dealer?.gst_number || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500">Status</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <CheckCircle2 className={`w-4 h-4 ${dealer?.status === 'Active' ? 'text-green-500' : 'text-slate-500'}`} />
                <span className={`text-sm font-bold ${dealer?.status === 'Active' ? 'text-green-600' : 'text-slate-600'}`}>
                  {dealer?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left: Infrastructure Management */}
        <div className="md:col-span-8 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center gap-2">
                <Users className="text-[#0f172a] w-5 h-5" />
                <CardTitle className="font-orbitron text-sm uppercase">Technical Team</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold font-poppins uppercase text-slate-500">Certified Technicians</label>
                  <Input 
                    type="number" 
                    value={technicians}
                    onChange={(e) => setTechnicians(parseInt(e.target.value) || 0)}
                    className="border-slate-200" 
                  />
                  <p className="text-[10px] text-muted-foreground italic">Affects job assignment priority</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold font-poppins uppercase text-slate-500">Service Vehicles</label>
                  <Input 
                    type="number" 
                    value={vehicles}
                    onChange={(e) => setVehicles(parseInt(e.target.value) || 0)}
                    className="border-slate-200" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="bg-white border-b">
              <div className="flex items-center gap-2">
                <Wrench className="text-[#0f172a] w-5 h-5" />
                <CardTitle className="font-orbitron text-sm uppercase">Inventory & Equipment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {["Long Ladders", "Drilling Kits", "Safety Gear", "Testing Monitors", "Cable Crimpers", "Signal Testers"].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-[#facc15] transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium font-poppins text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Performance Scorecard */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-[#0f172a] text-white border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#facc15]">
                <Trophy className="w-5 h-5" />
                <CardTitle className="font-orbitron uppercase text-sm">Rated Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center pb-4 border-b border-slate-700">
                <p className="text-5xl font-bold font-orbitron text-[#facc15]">{overallRating.toFixed(0)}%</p>
                <p className="text-xs text-slate-400 font-poppins uppercase mt-2 tracking-widest">
                  {overallRating >= 80 ? 'Excellent Score' : overallRating >= 60 ? 'Good Score' : 'Fair Score'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {dealer.completed_jobs} Jobs Completed
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span>Infrastructure Strength</span>
                    <span className="text-[#facc15]">{infrastructureRating}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-[#facc15] h-full" style={{width: `${infrastructureRating}%`}} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span>Installation Quality</span>
                    <span className="text-[#facc15]">{qualityRating}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-[#facc15] h-full" style={{width: `${qualityRating}%`}} />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-[#facc15] hover:bg-white text-[#0f172a] font-bold font-orbitron transition-all">
                <Save className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}