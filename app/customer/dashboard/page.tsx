'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Check, Coins, Award, TrendingUp, LogOut, User, Package, ShoppingBag, AlertCircle } from 'lucide-react';

interface RewardInfo {
  customer: {
    id: number;
    name: string;
    email: string;
    referralId: string;
    rewardPoints: number;
    firstOrderCompleted: boolean;
    mysteryBoxClaimed: boolean;
    mysteryBoxAvailable: boolean;
  };
  referralStats: {
    totalReferrals: number;
    successfulReferrals: number;
    totalEarnedFromReferrals: number;
  };
  recentTransactions: Array<{
    transaction_type: string;
    points: number;
    description: string;
    created_at: string;
  }>;
}

interface Order {
  order_id: number;
  order_number: string;
  total_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [rewardInfo, setRewardInfo] = useState<RewardInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [rewardSystemAvailable, setRewardSystemAvailable] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('customerToken');
    const email = localStorage.getItem('customerEmail');
    const name = localStorage.getItem('customerName');

    if (!token || !email) {
      router.push('/login');
      return;
    }

    setCustomerName(name || 'Customer');
    setCustomerEmail(email);
    
    // Try to fetch reward info (if reward system is set up)
    fetchRewardInfo(email);
    
    // Always fetch orders
    fetchOrders(email);
  }, [router]);

  const fetchOrders = async (email: string) => {
    try {
      const response = await fetch('/api/track-order/by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchRewardInfo = async (email: string) => {
    try {
      const response = await fetch('/api/rewards/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: email }),
      });

      const data = await response.json();

      if (data.success) {
        setRewardInfo(data);
        setRewardSystemAvailable(true);
      } else {
        console.log('Reward system not available yet:', data.error);
        setRewardSystemAvailable(false);
      }
    } catch (error) {
      console.error('Error fetching reward info:', error);
      setRewardSystemAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralId = () => {
    if (rewardInfo?.customer.referralId) {
      navigator.clipboard.writeText(rewardInfo.customer.referralId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClaimMysteryBox = async () => {
    const email = localStorage.getItem('customerEmail');
    if (!email) return;

    setClaiming(true);
    setClaimMessage('');

    try {
      const response = await fetch('/api/rewards/claim-mystery-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: email }),
      });

      const data = await response.json();

      if (data.success) {
        setClaimMessage(`🎉 ${data.message}`);
        // Refresh reward info
        fetchRewardInfo(email);
      } else {
        setClaimMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setClaimMessage('❌ Failed to claim mystery box. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerName');
    router.push('/login');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'mystery_box':
        return '🎁';
      case 'referral_reward':
        return '💰';
      case 'points_redeemed':
        return '🛒';
      case 'points_earned':
        return '⭐';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'shipped':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Suspense fallback={<div className="h-16" />}>
        <Navbar />
      </Suspense>

      <main className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-orbitron">
              Welcome back, {customerName}!
            </h1>
            <p className="text-gray-400">{customerEmail}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Reward System Not Available Notice */}
        {!rewardSystemAvailable && (
          <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-500 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-3 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2 text-yellow-400" />
              Reward System Not Activated
            </h3>
            <p className="text-gray-300 mb-4">
              The rewards and referral system is not yet activated in your database. Once activated, you'll be able to:
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
              <li>Get a unique referral code to share with friends</li>
              <li>Earn <strong className="text-yellow-300">50 points</strong> Mystery Box after your first paid order</li>
              <li>Earn <strong className="text-green-300">100 points</strong> when friends use your referral code</li>
              <li>Redeem points for discounts (1 point = ₹1)</li>
            </ul>
            <div className="bg-black/30 rounded-lg p-4">
              <p className="text-yellow-300 text-sm font-semibold mb-2">
                To activate rewards, run this SQL migration:
              </p>
              <code className="text-green-400 text-xs block font-mono">
                psql -U your_username -d your_database -f add-referral-system.sql
              </code>
              <p className="text-gray-400 text-xs mt-2">
                File location: <span className="text-blue-400">d:\cctv-website\add-referral-system.sql</span>
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid - Show if reward system is available */}
        {rewardSystemAvailable && rewardInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Reward Points Card */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Coins className="w-8 h-8" />
                <span className="text-2xl font-bold">{rewardInfo.customer.rewardPoints}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Reward Points</h3>
              <p className="text-sm opacity-90">1 Point = ₹1 Discount</p>
            </div>

            {/* Referrals Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-8 h-8" />
                <span className="text-2xl font-bold">{rewardInfo.referralStats.successfulReferrals}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Successful Referrals</h3>
              <p className="text-sm opacity-90">Earned ₹{rewardInfo.referralStats.totalEarnedFromReferrals}</p>
            </div>

            {/* Total Earned Card */}
            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8" />
                <span className="text-2xl font-bold">₹{rewardInfo.referralStats.totalEarnedFromReferrals}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Total Earned</h3>
              <p className="text-sm opacity-90">From {rewardInfo.referralStats.successfulReferrals} referrals</p>
            </div>
          </div>
        )}

        {/* Simple Stats - Show if reward system is NOT available */}
        {!rewardSystemAvailable && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <ShoppingBag className="w-8 h-8" />
                <span className="text-3xl font-bold">{orders.length}</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Total Orders</h3>
              <p className="text-sm opacity-90">All time purchases</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8" />
                <span className="text-3xl font-bold">
                  {orders.filter(o => o.status?.toLowerCase() === 'pending').length}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Pending Orders</h3>
              <p className="text-sm opacity-90">Awaiting processing</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8" />
                <span className="text-3xl font-bold">
                  {orders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase())).length}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Delivered</h3>
              <p className="text-sm opacity-90">Successfully completed</p>
            </div>
          </div>
        )}

        {/* Mystery Box Section - Only if reward system is available */}
        {rewardSystemAvailable && rewardInfo?.customer.mysteryBoxAvailable && (
          <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-xl p-8 mb-8 text-white shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <Gift className="w-16 h-16 mr-4 animate-bounce" />
                <div>
                  <h2 className="text-3xl font-bold mb-2 font-orbitron">Mystery Box Available! 🎁</h2>
                  <p className="text-lg">You've completed your first order. Claim your reward now!</p>
                </div>
              </div>
              <Button
                onClick={handleClaimMysteryBox}
                disabled={claiming}
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-bold"
              >
                {claiming ? 'Claiming...' : 'Claim Mystery Box'}
              </Button>
            </div>
            {claimMessage && (
              <div className="mt-4 text-center text-xl font-semibold">{claimMessage}</div>
            )}
          </div>
        )}

        {/* Referral Section - Only if reward system is available */}
        {rewardSystemAvailable && rewardInfo && (
          <div className="bg-[#1e293b] rounded-xl p-8 mb-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 font-orbitron flex items-center">
              <User className="w-6 h-6 mr-2 text-[#facc15]" />
              Your Referral Code
            </h2>
            <p className="text-gray-400 mb-6">
              Share your referral code with friends. They get ₹50 off on their first order, and you get 100 reward points!
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-[#0f172a] rounded-lg p-4 border-2 border-[#facc15]">
                <div className="text-sm text-gray-400 mb-1">Your Referral Code</div>
                <div className="text-3xl font-mono font-bold text-[#facc15]">
                  {rewardInfo.customer.referralId}
                </div>
              </div>
              <Button
                onClick={handleCopyReferralId}
                className="bg-[#facc15] text-[#0f172a] hover:bg-[#fbbf24] px-8"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-[#1e293b] rounded-xl p-8 mb-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 font-orbitron flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-[#facc15]" />
            Your Orders
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No orders yet</p>
              <p className="text-gray-500 text-sm mb-4">Start shopping to see your orders here</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-[#facc15] text-[#0f172a] hover:bg-[#fbbf24]"
              >
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="bg-[#0f172a] rounded-lg p-6 hover:bg-[#1a2332] transition border border-gray-700"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold text-lg">
                          Order #{order.order_number || order.order_id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm space-y-1">
                        <p>
                          Payment: <span className={order.payment_status?.toLowerCase() === 'paid' ? 'text-green-400' : 'text-yellow-400'}>
                            {order.payment_status}
                          </span>
                        </p>
                        <p>
                          Date:{' '}
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#facc15] mb-2">
                        ₹{parseFloat(order.total_amount?.toString() || '0').toLocaleString()}
                      </div>
                      <Button
                        onClick={() => router.push('/track-order')}
                        variant="outline"
                        className="border-[#facc15] text-[#facc15] hover:bg-[#facc15] hover:text-[#0f172a] text-sm"
                      >
                        Track Order
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COD Payment Info */}
        {orders.some(o => o.payment_status?.toLowerCase() === 'pending') && (
          <div className="bg-yellow-900/30 border-2 border-yellow-500 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center">
              <AlertCircle className="w-6 h-6 mr-2" />
              About COD Orders & Mystery Box
            </h3>
            <p className="text-gray-300 mb-3">
              For COD (Cash on Delivery) orders, the Mystery Box reward will appear after:
            </p>
            <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">
              <li>Your order is delivered</li>
              <li>Payment is collected by our delivery team</li>
              <li>Our admin updates the payment status to "Paid"</li>
            </ol>
            <p className="text-gray-400 text-sm">
              Once your payment is confirmed, the Mystery Box will automatically appear in your dashboard and you can claim your 50 reward points!
            </p>
          </div>
        )}

        {/* Recent Transactions - Only if reward system is available */}
        {rewardSystemAvailable && rewardInfo && rewardInfo.recentTransactions.length > 0 && (
          <div className="bg-[#1e293b] rounded-xl p-8 shadow-xl mt-8">
            <h2 className="text-2xl font-bold text-white mb-6 font-orbitron">Recent Transactions</h2>
            <div className="space-y-4">
              {rewardInfo.recentTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-[#0f172a] rounded-lg p-4 hover:bg-[#1a2332] transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getTransactionIcon(transaction.transaction_type)}</div>
                    <div>
                      <div className="text-white font-semibold">{transaction.description}</div>
                      <div className="text-gray-400 text-sm">
                        {new Date(transaction.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${transaction.points > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
