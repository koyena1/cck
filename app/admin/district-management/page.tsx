"use client";
import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  MapPin,
  Shield,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from "lucide-react";
import { stateDistrictMapping } from "@/lib/state-district-mapping";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DistrictUser {
  district_user_id: number;
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  district: string;
  state: string;
  pincodes: string;
  is_active: boolean;
  can_view_dealers: boolean;
  can_view_orders: boolean;
  can_contact_dealers: boolean;
  created_at: string;
  last_login: string;
}

interface DistrictStats {
  district: string;
  state: string;
  total_dealers: number;
  active_dealers: number;
  pending_dealers: number;
  average_rating: number;
  total_completed_jobs: number;
}

export default function DistrictManagementPage() {
  const [districtUsers, setDistrictUsers] = useState<DistrictUser[]>([]);
  const [districtStats, setDistrictStats] = useState<DistrictStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone_number: "",
    district: "",
    state: "",
    pincodes: "",
    can_view_dealers: true,
    can_view_orders: true,
    can_contact_dealers: true
  });
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  const indianStates = Object.keys(stateDistrictMapping).sort();

  // Update available districts when state changes
  useEffect(() => {
    if (formData.state) {
      setAvailableDistricts(stateDistrictMapping[formData.state] || []);
      // Reset district when state changes
      setFormData(prev => ({ ...prev, district: "" }));
    } else {
      setAvailableDistricts([]);
    }
  }, [formData.state]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/district-users'),
        fetch('/api/admin/district-stats')
      ]);

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) setDistrictUsers(usersData.users);
      if (statsData.success) setDistrictStats(statsData.stats);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim all text input values to prevent whitespace issues
    const trimmedData = {
      ...formData,
      username: formData.username.trim(),
      email: formData.email.trim(),
      full_name: formData.full_name.trim(),
      phone_number: formData.phone_number.trim(),
      pincodes: formData.pincodes.trim()
    };
    
    try {
      const response = await fetch('/api/admin/district-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmedData)
      });

      const data = await response.json();

      if (data.success) {
        alert('District manager created successfully!');
        setShowCreateForm(false);
        setFormData({
          username: "",
          email: "",
          password: "",
          full_name: "",
          phone_number: "",
          district: "",
          state: "",
          pincodes: "",
          can_view_dealers: true,
          can_view_orders: true,
          can_contact_dealers: true
        });
        fetchData();
      } else {
        alert(`Failed to create user: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create district user');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/district-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          district_user_id: userId, 
          is_active: !currentStatus 
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        fetchData();
      } else {
        alert(`Failed to update user: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

    try {
      const response = await fetch('/api/admin/district-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ district_user_id: userId })
      });

      const data = await response.json();

      if (data.success) {
        alert('User deleted successfully!');
        fetchData();
      } else {
        alert(`Failed to delete user: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading district management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">District Management Portal</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-xs sm:text-sm">
            Manage district-wise users and view dealer statistics
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5"
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          <span className="truncate">Create District Manager</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Total Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">{districtUsers.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="truncate">Active Users</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
              {districtUsers.filter(u => u.is_active).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Districts Covered</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">
              {new Set(districtUsers.map(u => u.district)).size}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="truncate">Total Dealers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
              {districtStats.reduce((sum, stat) => sum + stat.total_dealers, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              Create New Manager
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1.5">
              Create a new district manager account for district-level management
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Secure password"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">State</label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select State</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">District</label>
                <select
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  className="w-full p-2 border rounded"
                  disabled={!formData.state}
                >
                  <option value="">Select District</option>
                  {availableDistricts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {!formData.state && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Please select a state first</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Pincodes (comma-separated)</label>
                <input
                  type="text"
                  value={formData.pincodes}
                  onChange={(e) => setFormData({...formData, pincodes: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="e.g., 400001, 400002, 400003"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter multiple pincodes separated by commas</p>
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Permissions</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.can_view_dealers}
                      onChange={(e) => setFormData({...formData, can_view_dealers: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">View Dealers</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.can_view_orders}
                      onChange={(e) => setFormData({...formData, can_view_orders: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">View Orders</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.can_contact_dealers}
                      onChange={(e) => setFormData({...formData, can_contact_dealers: e.target.checked})}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Contact Dealers</span>
                  </label>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2">
                <Button type="submit" className="flex-1 w-full sm:w-auto">
                  Create Manager
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* District Users List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            District Users ({districtUsers.length})
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage users with district-level access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="space-y-3 sm:space-y-4">
            {districtUsers.map((user) => (
              <div
                key={user.district_user_id}
                className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base sm:text-lg truncate text-gray-900 dark:text-white">{user.full_name}</h3>
                      <Badge variant={user.is_active ? "default" : "destructive"} className="text-xs">
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Shield className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">Username: {user.username}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{user.district}, {user.state}</span>
                      </div>
                      <div className="truncate">Email: {user.email}</div>
                      <div>Phone: {user.phone_number || "N/A"}</div>
                      <div>Created: {new Date(user.created_at).toLocaleDateString()}</div>
                      <div>Last Login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}</div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                      {user.can_view_dealers && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">View Dealers</Badge>
                      )}
                      {user.can_view_orders && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">View Orders</Badge>
                      )}
                      {user.can_contact_dealers && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">Contact Dealers</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 sm:gap-2 justify-end sm:justify-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user.district_user_id, user.is_active)}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      {user.is_active ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.district_user_id, user.username)}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {districtUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No district managers created yet</p>
                <p className="text-sm">Click "Create District Manager" to add your first manager</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* District Statistics */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
            District-wise Dealer Statistics
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Overview of dealers across all districts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">District</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">State</th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">Total</th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">Active</th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">Pending</th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">Avg Rating</th>
                  <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold">Jobs</th>
                </tr>
              </thead>
              <tbody>
                {districtStats.map((stat, index) => (
                  <tr key={index} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm text-gray-900 dark:text-white">{stat.district}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{stat.state}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-white">{stat.total_dealers}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-green-600 dark:text-green-400 text-xs sm:text-sm">
                      {stat.active_dealers}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm">
                      {stat.pending_dealers}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-white">
                      {stat.average_rating ? Number(stat.average_rating).toFixed(1) : "N/A"}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-white">
                      {stat.total_completed_jobs}
                    </td>
                  </tr>
                ))}
                {districtStats.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                      No district statistics available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
