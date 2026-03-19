'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Trophy, Star, TrendingUp, Clock, Award } from 'lucide-react';

interface RewardsData {
  total_points: number;
  points_to_next_gift: number;
  points_needed_for_gift: number;
  total_gifts_redeemed: number;
  pending_gifts: number;
  total_earned_transactions: number;
  last_gift_redeemed_at: string | null;
  member_since: string;
}

interface Transaction {
  transaction_id: number;
  order_id: number | null;
  transaction_type: string;
  points: number;
  description: string;
  delivery_time_hours: number | null;
  created_at: string;
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState<RewardsData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealerId, setDealerId] = useState<number | null>(null);

  useEffect(() => {
    const loadRewards = async () => {
      setLoading(true);
      
      const storedDealerId = localStorage.getItem('dealerId');
      if (!storedDealerId) {
        console.warn('No dealer ID found');
        setLoading(false);
        return;
      }
      
      const dId = parseInt(storedDealerId);
      setDealerId(dId);

      try {
        const response = await fetch(`/api/dealer-rewards?dealerId=${dId}`);
        const data = await response.json();
        
        if (data.success) {
          setRewards(data.rewards);
          setTransactions(data.recent_transactions);
        }
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRewards();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const progressPercentage = rewards 
    ? ((5000 - rewards.points_to_next_gift) / 5000) * 100 
    : 0;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading rewards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Rewards Program
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Earn points for fast delivery and redeem exciting gifts!
          </p>
        </div>
      </div>

      {/* Rewards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950">
          <CardHeader className="pb-3">
            <CardDescription className="text-yellow-700 dark:text-yellow-300 font-medium">
              Total Points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              <span className="text-4xl font-bold text-yellow-800 dark:text-yellow-200">
                {rewards?.total_points || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Gifts Redeemed */}
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700 dark:text-green-300 font-medium">
              Gifts Redeemed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <Gift className="w-8 h-8 text-green-600 dark:text-green-400" />
              <span className="text-4xl font-bold text-green-800 dark:text-green-200">
                {rewards?.total_gifts_redeemed || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Gifts */}
        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950">
          <CardHeader className="pb-3">
            <CardDescription className="text-purple-700 dark:text-purple-300 font-medium">
              Gifts Available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <span className="text-4xl font-bold text-purple-800 dark:text-purple-200">
                {rewards?.pending_gifts || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Fast Deliveries */}
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardHeader className="pb-3">
            <CardDescription className="text-blue-700 dark:text-blue-300 font-medium">
              Fast Deliveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <span className="text-4xl font-bold text-blue-800 dark:text-blue-200">
                {rewards?.total_earned_transactions || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Gift */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-yellow-600" />
            Progress to Next Gift
          </CardTitle>
          <CardDescription>
            Collect 5,000 points to unlock a special gift!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {5000 - (rewards?.points_to_next_gift || 5000)} / 5,000 points
              </span>
              <span className="text-sm font-bold text-yellow-600">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Star className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-bold">{rewards?.points_to_next_gift || 5000} points</span> needed for your next gift!
            </p>
          </div>

          {(rewards?.pending_gifts || 0) > 0 && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-500 rounded-lg">
              <div className="flex items-start gap-3">
                <Gift className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-green-900 dark:text-green-100 text-base mb-1">
                    🎊 Congratulations!
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    You have <span className="font-bold">{rewards?.pending_gifts || 0} gift(s)</span> available for redemption! 
                    Contact admin to claim your reward.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            How Rewards Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                  Admin Reward Points
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Reward points are assigned by <span className="font-bold">admin</span> based on your performance, delivery quality, and service excellence!
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-1">
                  Automatic Gift Redemption
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Collect <span className="font-bold">5,000 points</span> and receive a special gift automatically! Keep earning to unlock more rewards.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest reward point activities</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">
                No reward transactions yet
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Keep delivering excellent service! Admin will assign reward points based on your performance.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      transaction.transaction_type === 'earned' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      {transaction.transaction_type === 'earned' ? (
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Gift className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {transaction.description}
                      </p>
                      {transaction.delivery_time_hours && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Delivered in {Number(transaction.delivery_time_hours).toFixed(1)} hours
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${
                    transaction.points > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
