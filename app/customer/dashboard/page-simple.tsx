'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { LogOut, User, Package, ShoppingBag } from 'lucide-react';

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
}

export default function CustomerDashboardSimple() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerEmail');
    localStorage.removeItem('customerName');
    router.push('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'shipped':
      case 'in transit':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'success':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Navbar />

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="w-8 h-8" />
              <span className="text-3xl font-bold">{orders.length}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Orders</h3>
            <p className="text-sm opacity-90">All time purchases</p>
          </div>

          {/* Pending Orders */}
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

          {/* Delivered Orders */}
          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8" />
              <span className="text-3xl font-bold">
                {orders.filter(o => o.status?.toLowerCase() === 'delivered' || o.status?.toLowerCase() === 'completed').length}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Delivered</h3>
            <p className="text-sm opacity-90">Successfully completed</p>
          </div>
        </div>

        {/* Information Alert */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-500 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-3 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            About Rewards & Referrals
          </h3>
          <p className="text-gray-300 mb-3">
            Want to earn rewards and use referral codes? The referral system needs to be activated first.
          </p>
          <div className="bg-black/30 rounded-lg p-4 mb-3">
            <p className="text-yellow-300 text-sm font-mono mb-2">
              To enable rewards and referral features, run this command:
            </p>
            <code className="text-green-400 text-xs block">
              psql -U your_username -d your_database -f add-referral-system.sql
            </code>
          </div>
          <p className="text-gray-400 text-sm">
            After running the migration, you'll be able to:
            <br />• Get a unique referral code
            <br />• Earn 50 points Mystery Box after your first order
            <br />• Earn 100 points when friends use your referral code
            <br />• Redeem points for discounts (1 point = ₹1)
          </p>
        </div>

        {/* Orders List */}
        <div className="bg-[#1e293b] rounded-xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 font-orbitron flex items-center">
            <ShoppingBag className="w-6 h-6 mr-2 text-[#facc15]" />
            Your Orders
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">No orders yet</p>
              <p className="text-gray-500 text-sm">Start shopping to see your orders here</p>
              <Button
                onClick={() => router.push('/')}
                className="mt-6 bg-[#facc15] text-[#0f172a] hover:bg-[#fbbf24]"
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
                          Payment: <span className={`font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </p>
                        <p>
                          Method: <span className="text-gray-300">{order.payment_method?.toUpperCase()}</span>
                        </p>
                        <p>
                          Date:{' '}
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#facc15] mb-2">
                        ₹{parseFloat(order.total_amount?.toString() || '0').toLocaleString()}
                      </div>
                      <Button
                        onClick={() => router.push(`/track-order`)}
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

        {/* COD Payment Notice */}
        {orders.some(o => o.payment_method?.toLowerCase() === 'cod' && o.payment_status?.toLowerCase() === 'pending') && (
          <div className="bg-yellow-900/30 border-2 border-yellow-500 rounded-xl p-6 mt-8">
            <h3 className="text-xl font-bold text-yellow-300 mb-3 flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              COD Orders Pending
            </h3>
            <p className="text-gray-300">
              You have COD (Cash on Delivery) orders that are pending. These orders require payment on delivery.
              Once payment is received and verified by our team, your order status will be updated.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
