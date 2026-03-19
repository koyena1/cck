'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Trophy, Plus, Minus, Search, CheckCircle, AlertCircle } from 'lucide-react';

interface Dealer {
  dealer_id: number;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  status: string;
  total_points: number;
  total_gifts_redeemed: number;
  last_gift_redeemed_at: string | null;
  pending_gifts: number;
  points_to_next_gift: number;
}

export default function AdminRewardsPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [filteredDealers, setFilteredDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadDealers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDealers(dealers);
    } else {
      const filtered = dealers.filter(dealer => 
        dealer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dealer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDealers(filtered);
    }
  }, [searchTerm, dealers]);

  const loadDealers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/assign-rewards');
      const data = await response.json();
      
      if (data.success) {
        setDealers(data.dealers);
        setFilteredDealers(data.dealers);
      }
    } catch (error) {
      console.error('Failed to fetch dealers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPoints = async () => {
    if (!selectedDealer || points === 0) {
      setMessage({ type: 'error', text: 'Please select a dealer and enter valid points' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/assign-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealerId: selectedDealer.dealer_id,
          points: points,
          description: description || `Admin ${points > 0 ? 'awarded' : 'deducted'} ${Math.abs(points)} points`
        })
      });

      const data = await response.json();

      if (data.success) {
        let successMsg = `Successfully ${points > 0 ? 'added' : 'deducted'} ${Math.abs(points)} points`;
        
        if (data.gift_milestone_reached && data.gifts_awarded) {
          successMsg += ` 🎁 ${selectedDealer.full_name} earned ${data.gifts_awarded} gift(s)!`;
        }
        
        setMessage({ type: 'success', text: successMsg });
        
        // Reset form
        setPoints(0);
        setDescription('');
        setSelectedDealer(null);
        
        // Reload dealers
        await loadDealers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign points' });
      }
    } catch (error) {
      console.error('Error assigning points:', error);
      setMessage({ type: 'error', text: 'Failed to assign points' });
    } finally {
      setSubmitting(false);
    }
  };

  const quickAssign = (dealerObj: Dealer, pointValue: number) => {
    setSelectedDealer(dealerObj);
    setPoints(pointValue);
    setDescription(`Quick ${pointValue > 0 ? 'bonus' : 'adjustment'}: ${Math.abs(pointValue)} points`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading dealers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Dealer Rewards Management</h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Assign and manage dealer reward points</p>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="font-medium">{message.text}</p>
          </div>
        </div>
      )}

      {/* Assign Points Form */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Reward Points</CardTitle>
          <CardDescription>Add or deduct points from dealer accounts. Gifts are automatically awarded at 5,000 points.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-4">
              <div>
                <Label>Selected Dealer</Label>
                {selectedDealer ? (
                  <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-900 dark:text-white">{selectedDealer.full_name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedDealer.business_name}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                        🏆 {selectedDealer.total_points} points
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        🎁 {selectedDealer.total_gifts_redeemed} gifts
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {selectedDealer.points_to_next_gift} to next gift
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No dealer selected. Choose from the list below.</p>
                )}
              </div>

              <div>
                <Label htmlFor="points">Points to Assign</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="points"
                    type="number"
                    value={points || ''}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    placeholder="Enter points (+ to add, - to deduct)"
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoints(100)}
                    className="text-green-600 flex-1 sm:flex-none min-w-[70px]"
                  >
                    <Plus className="w-4 h-4 mr-1" /> 100
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoints(500)}
                    className="text-green-600 flex-1 sm:flex-none min-w-[70px]"
                  >
                    <Plus className="w-4 h-4 mr-1" /> 500
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoints(1000)}
                    className="text-green-600 flex-1 sm:flex-none min-w-[70px]"
                  >
                    <Plus className="w-4 h-4 mr-1" /> 1000
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPoints(-100)}
                    className="text-red-600 flex-1 sm:flex-none min-w-[70px]"
                  >
                    <Minus className="w-4 h-4 mr-1" /> 100
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Reason for assigning points"
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleAssignPoints}
                disabled={!selectedDealer || points === 0 || submitting}
                className="w-full"
              >
                {submitting ? 'Assigning...' : 'Assign Points'}
              </Button>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
              <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">📊 Rewards System Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Point System</p>
                    <p className="text-slate-600 dark:text-slate-400">Manually assign points to dealers from admin panel</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Gift className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Gift Threshold</p>
                    <p className="text-slate-600 dark:text-slate-400">Every 5,000 points = 1 automatic gift redemption</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Auto Gift Assignment</p>
                    <p className="text-slate-600 dark:text-slate-400">Gifts are automatically assigned when dealers reach milestones</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dealers List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Active Dealers</CardTitle>
              <CardDescription>Click on a dealer to assign points</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search dealers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredDealers.length === 0 ? (
              <p className="text-center py-8 text-slate-500 dark:text-slate-400">No dealers found</p>
            ) : (
              filteredDealers.map((dealer) => (
                <div
                  key={dealer.dealer_id}
                  onClick={() => setSelectedDealer(dealer)}
                  className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedDealer?.dealer_id === dealer.dealer_id
                      ? 'border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                          {dealer.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{dealer.full_name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{dealer.business_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
                      <div className="text-center sm:text-right">
                        <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {dealer.total_points}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">points</p>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                          {dealer.total_gifts_redeemed}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">gifts</p>
                      </div>
                      <div className="flex-1 sm:text-right min-w-[100px]">
                        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                          {dealer.points_to_next_gift} to go
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${((5000 - dealer.points_to_next_gift) / 5000) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            quickAssign(dealer, 100);
                          }}
                          className="text-green-600"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            quickAssign(dealer, -100);
                          }}
                          className="text-red-600"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
