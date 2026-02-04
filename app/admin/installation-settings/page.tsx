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
        <h1 className="text-3xl font-bold text-slate-900">Installation & AMC Settings</h1>
        <p className="text-slate-600 mt-2">Configure pricing for installation and AMC options</p>
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
