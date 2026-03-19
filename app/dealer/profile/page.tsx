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
import LeafletLocationPicker from "@/components/leaflet-location-picker"
import { stateDistrictMapping } from "@/lib/state-district-mapping"

interface DealerInfo {
  dealer_id: number;
  full_name: string;
  business_name: string;
  email: string;
  phone?: string;
  address?: string;
  location?: string;
  district?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  registration_number?: string;
  service_pin?: string;
  serviceable_pincodes?: string;
  latitude?: number | null;
  longitude?: number | null;
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
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [pincodeInput, setPincodeInput] = useState('');
  const [serviceablePincodes, setServiceablePincodes] = useState<string[]>([]);
  
  // Editable form fields
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    district: '',
    state: '',
    pincode: '',
    gst_number: '',
    registration_number: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  const indianStates = Object.keys(stateDistrictMapping).sort();

  // Update available districts when state changes
  useEffect(() => {
    if (formData.state) {
      setAvailableDistricts(stateDistrictMapping[formData.state] || []);
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.state]);

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
            district: data.dealer.district || '',
            state: data.dealer.state || '',
            pincode: data.dealer.pincode || '',
            gst_number: data.dealer.gst_number || '',
            registration_number: data.dealer.registration_number || '',
            latitude: data.dealer.latitude || null,
            longitude: data.dealer.longitude || null
          });
          // Load serviceable pincodes as array
          const spRaw = data.dealer.serviceable_pincodes || '';
          setServiceablePincodes(spRaw ? spRaw.split(',').map((p: string) => p.trim()).filter(Boolean) : []);
          // Set available districts based on state
          if (data.dealer.state) {
            setAvailableDistricts(stateDistrictMapping[data.dealer.state] || []);
          }
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
      
      // Trim all text values
      const trimmedData = {
        ...formData,
        full_name: formData.full_name.trim(),
        business_name: formData.business_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        location: formData.location.trim(),
        pincode: formData.pincode.trim(),
        gst_number: formData.gst_number.trim(),
        registration_number: formData.registration_number.trim()
      };
      
      const response = await fetch('/api/dealer/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId,
          ...trimmedData,
          serviceable_pincodes: serviceablePincodes.join(', ')
        })
      });

      const data = await response.json();

      if (data.success) {
        setDealer(data.dealer);
        setIsEditing(false);
        // Re-sync serviceable pincodes from the updated response
        const spRaw = data.dealer.serviceable_pincodes || '';
        setServiceablePincodes(spRaw ? spRaw.split(',').map((p: string) => p.trim()).filter(Boolean) : []);
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
        district: dealer.district || '',
        state: dealer.state || '',
        pincode: dealer.pincode || '',
        gst_number: dealer.gst_number || '',
        registration_number: dealer.registration_number || '',
        latitude: dealer.latitude || null,
        longitude: dealer.longitude || null
      });
      // Reset serviceable pincodes
      const spRaw = dealer.serviceable_pincodes || '';
      setServiceablePincodes(spRaw ? spRaw.split(',').map((p: string) => p.trim()).filter(Boolean) : []);
      setPincodeInput('');
      // Reset available districts
      if (dealer.state) {
        setAvailableDistricts(stateDistrictMapping[dealer.state] || []);
      }
    }
    setIsEditing(false);
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData({...formData, latitude: lat, longitude: lng});
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-10 flex items-center justify-center min-h-screen">
        <p className="text-lg text-slate-600 dark:text-slate-300">Loading dealer profile...</p>
      </div>
    );
  }

  if (!dealer) {
    return (
      <div className="p-6 lg:p-10 flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-lg text-slate-600 dark:text-slate-300">Please log in to view your dealer profile</p>
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
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 space-y-4 sm:space-y-6 bg-[#f8fafc] min-h-screen">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-orbitron tracking-tight uppercase text-[#0f172a] dark:text-slate-100">Dealer Profile</h1>
        <p className="text-muted-foreground mt-1 font-poppins text-sm sm:text-base">Manage your technical infrastructure and view performance ratings.</p>
      </div>

      {/* Dealer Information Card */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <UserCircle className="text-[#0f172a] w-4 h-4 sm:w-5 sm:h-5" />
              <CardTitle className="font-orbitron text-xs sm:text-sm uppercase">Business Information</CardTitle>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="gap-2 text-xs w-full sm:w-auto"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-1 sm:flex-initial text-xs"
                  disabled={saving}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  size="sm"
                  className="gap-2 bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a] flex-1 sm:flex-initial text-xs"
                  disabled={saving}
                >
                  <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Full Name</label>
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter full name"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <UserCircle className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">{dealer?.full_name || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Business Name</label>
              {isEditing ? (
                <Input
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter business name"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.business_name || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Email</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter email"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.email || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Phone</label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter phone number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Address</label>
              {isEditing ? (
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter complete business address"
                  rows={2}
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="text-sm font-medium">{dealer?.address || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Location</label>
              {isEditing ? (
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter location/city"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.location || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">State</label>
              {isEditing ? (
                <select
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({...formData, state: e.target.value, district: ''});
                  }}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.state || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">District</label>
              {isEditing ? (
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm"
                  disabled={!formData.state}
                >
                  <option value="">Select District</option>
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.district || 'Not provided'}</span>
                </div>
              )}
              {isEditing && !formData.state && (
                <p className="text-xs text-slate-500">Please select a state first</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Pincode</label>
              {isEditing ? (
                <Input
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter pincode"
                  maxLength={10}
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.pincode || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Serviceable Pincodes</label>
              <p className="text-xs text-slate-500">Add all pincodes your business can service. Orders near these pincodes will be assigned to you.</p>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={pincodeInput}
                      onChange={(e) => setPincodeInput(e.target.value.replace(/[^0-9,]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const codes = pincodeInput.split(',').map(p => p.trim()).filter(p => p.length >= 5 && p.length <= 8);
                          const newCodes = codes.filter(c => !serviceablePincodes.includes(c));
                          if (newCodes.length > 0) {
                            setServiceablePincodes([...serviceablePincodes, ...newCodes]);
                          }
                          setPincodeInput('');
                        }
                      }}
                      placeholder="Type a pincode and press Enter (e.g. 700001)"
                      className="border-slate-200 flex-1"
                      maxLength={50}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const codes = pincodeInput.split(',').map(p => p.trim()).filter(p => p.length >= 5 && p.length <= 8);
                        const newCodes = codes.filter(c => !serviceablePincodes.includes(c));
                        if (newCodes.length > 0) setServiceablePincodes([...serviceablePincodes, ...newCodes]);
                        setPincodeInput('');
                      }}
                      className="px-4 py-2 bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a] text-sm font-semibold rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                  {serviceablePincodes.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[44px]">
                      {serviceablePincodes.map((pin) => (
                        <span key={pin} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          <MapPin className="w-3 h-3" />
                          {pin}
                          <button
                            type="button"
                            onClick={() => setServiceablePincodes(serviceablePincodes.filter(p => p !== pin))}
                            className="ml-1 text-blue-500 hover:text-red-600 font-bold leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[44px]">
                  {serviceablePincodes.length > 0 ? serviceablePincodes.map((pin) => (
                    <span key={pin} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full">
                      <MapPin className="w-3 h-3" />
                      {pin}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-400">No serviceable pincodes added</span>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">GST Number</label>
              {isEditing ? (
                <Input
                  value={formData.gst_number}
                  onChange={(e) => setFormData({...formData, gst_number: e.target.value})}
                  className="border-slate-200"
                  placeholder="Enter GST number"
                />
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-medium">{dealer?.gst_number || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold font-poppins uppercase text-slate-500 dark:text-slate-400">Status</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <CheckCircle2 className={`w-4 h-4 ${dealer?.status === 'Active' ? 'text-green-500' : 'text-slate-500'}`} />
                <span className={`text-sm font-bold ${dealer?.status === 'Active' ? 'text-green-600' : 'text-slate-600'}`}>
                  {dealer?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Location Map */}
      <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <MapPin className="text-[#0f172a] w-4 h-4 sm:w-5 sm:h-5" />
            <CardTitle className="font-orbitron text-xs sm:text-sm uppercase">Business Location</CardTitle>
          </div>
          <CardDescription className="text-[10px] sm:text-xs mt-1">
            {isEditing 
              ? 'Select your business location on the map. The system will attempt to locate your business automatically.'
              : 'Your business location is displayed on the map below.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <LeafletLocationPicker
            businessName={formData.business_name}
            businessAddress={formData.address || formData.location}
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
            isEditing={isEditing}
          />
          {/* Hidden fields for latitude and longitude */}
          <input type="hidden" name="latitude" value={formData.latitude || ''} />
          <input type="hidden" name="longitude" value={formData.longitude || ''} />
        </CardContent>
      </Card>
    </div>
  )
}