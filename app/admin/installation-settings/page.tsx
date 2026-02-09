'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Save } from 'lucide-react';

interface AmcOptions {
  with_1year: number;
  with_2year: number;
  without_1year: number;
  without_2year: number;
}

export default function InstallationSettingsPage() {
  const [installationCost, setInstallationCost] = useState(5000);
  const [codAdvanceAmount, setCodAdvanceAmount] = useState(200);
  const [codPercentage, setCodPercentage] = useState(10);
  const [amcOptions, setAmcOptions] = useState<AmcOptions>({
    with_1year: 400,
    with_2year: 700,
    without_1year: 250,
    without_2year: 200
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/installation-settings');
      const data = await response.json();
      
      if (data.success && data.settings) {
        setInstallationCost(data.settings.installationCost);
        setCodAdvanceAmount(data.settings.codAdvanceAmount || 200);
        setCodPercentage(data.settings.codPercentage || 10);
        setAmcOptions(data.settings.amcOptions);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/installation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installationCost,
          codPercentage,
          codAdvanceAmount,
          amcOptions
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e63946] mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Installation & COD Settings</h1>
        <p className="text-slate-600 mt-2">Configure pricing for installation, COD payment system, and AMC options</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <AlertCircle className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Installation Cost */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Installation Cost (₹)
          </label>
          <input
            type="number"
            value={installationCost}
            onChange={(e) => setInstallationCost(parseFloat(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
            placeholder="5000"
          />
        </div>

        {/* COD Settings Section */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-slate-900">COD Payment Settings</h3>
          </div>
          
          {/* COD Advance Amount */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              📦 Extra COD Amount (₹)
            </label>
            <p className="text-sm text-slate-600 mb-2">
              Additional charges applied when customer selects Cash on Delivery payment method
            </p>
            <input
              type="number"
              value={codAdvanceAmount}
              onChange={(e) => setCodAdvanceAmount(parseFloat(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-semibold"
              placeholder="200"
            />
            <p className="text-xs text-slate-500 mt-1">
              💡 This amount covers COD processing costs (recommended: ₹200)
            </p>
          </div>

          {/* COD Percentage */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              💳 COD Advance Payment Percentage (%)
            </label>
            <p className="text-sm text-slate-600 mb-2">
              Percentage of (Product Amount + Extra COD Amount) that customer must pay upfront via Razorpay
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={codPercentage}
              onChange={(e) => setCodPercentage(parseFloat(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-lg font-semibold"
              placeholder="10"
            />
            <p className="text-xs text-slate-500 mt-1">
              💡 Example: 10% means if order is ₹10,200, customer pays ₹1,020 advance
            </p>
          </div>

          {/* Visual Example */}
          <div className="bg-white border border-amber-300 rounded-lg p-4 mt-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">📊 CALCULATION EXAMPLE:</p>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Product Price:</span>
                <span className="font-medium">₹10,000</span>
              </div>
              <div className="flex justify-between">
                <span>+ Extra COD Amount:</span>
                <span className="font-medium text-amber-600">₹{codAdvanceAmount}</span>
              </div>
              <div className="flex justify-between border-t pt-1">
                <span>= Base Amount:</span>
                <span className="font-semibold">₹{(10000 + codAdvanceAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-orange-600 font-bold">
                <span>Advance Payment ({codPercentage}%):</span>
                <span>₹{((10000 + codAdvanceAmount) * codPercentage / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-700 font-bold">
                <span>Pay on Delivery:</span>
                <span>₹{((10000 + codAdvanceAmount) - ((10000 + codAdvanceAmount) * codPercentage / 100)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">AMC Pricing (Per Camera)</h2>
          
          {/* With Material */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-900 mb-3">With Material</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">For 1 Year (₹/Camera)</label>
                <input
                  type="number"
                  value={amcOptions.with_1year}
                  onChange={(e) => setAmcOptions({...amcOptions, with_1year: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  placeholder="400"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">For 2 Years (₹/Camera)</label>
                <input
                  type="number"
                  value={amcOptions.with_2year}
                  onChange={(e) => setAmcOptions({...amcOptions, with_2year: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  placeholder="700"
                />
              </div>
            </div>
          </div>

          {/* Without Material */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Without Material</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">For 1 Year (₹/Camera)</label>
                <input
                  type="number"
                  value={amcOptions.without_1year}
                  onChange={(e) => setAmcOptions({...amcOptions, without_1year: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  placeholder="250"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">For 2 Years (₹/Camera)</label>
                <input
                  type="number"
                  value={amcOptions.without_2year}
                  onChange={(e) => setAmcOptions({...amcOptions, without_2year: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e63946] focus:border-transparent"
                  placeholder="200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#e63946] hover:bg-[#d62839] text-white flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
