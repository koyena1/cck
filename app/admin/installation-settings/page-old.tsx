'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save } from 'lucide-react';

interface AmcOption {
  id: string;
  name: string;
  pricePerCamera: number;
  description: string;
}

export default function InstallationSettingsPage() {
  const [installationCost, setInstallationCost] = useState('5000');
  const [amcOptions, setAmcOptions] = useState<AmcOption[]>([
    {
      id: 'amc-with-material-1yr',
      name: 'AMC WITH MATERIAL FOR 1 YEAR',
      pricePerCamera: 400,
      description: 'Annual maintenance with all materials included'
    },
    {
      id: 'amc-with-material-2yr',
      name: 'AMC WITH MATERIAL FOR 2 YEAR',
      pricePerCamera: 700,
      description: '2-year maintenance with all materials included'
    },
    {
      id: 'amc-without-material-1yr',
      name: 'AMC WITHOUT MATERIAL FOR 1 YEAR',
      pricePerCamera: 250,
      description: 'Annual maintenance without materials'
    },
    {
      id: 'amc-without-material-2yr',
      name: 'AMC WITHOUT MATERIAL FOR 2 YEAR',
      pricePerCamera: 200,
      description: '2-year maintenance without materials'
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/installation-settings');
      const data = await res.json();
      if (data.success) {
        setInstallationCost(data.settings.installationCost.toString());
        setAmcOptions(data.settings.amcOptions);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/installation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installationCost: parseFloat(installationCost),
          amcOptions
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Error saving settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateAmcOption = (index: number, field: keyof AmcOption, value: any) => {
    const updated = [...amcOptions];
    updated[index] = { ...updated[index], [field]: value };
    setAmcOptions(updated);
  };

  const addAmcOption = () => {
    const newOption: AmcOption = {
      id: `amc-${Date.now()}`,
      name: 'New AMC Option',
      pricePerCamera: 0,
      description: 'Description'
    };
    setAmcOptions([...amcOptions, newOption]);
  };

  const removeAmcOption = (index: number) => {
    if (confirm('Are you sure you want to remove this AMC option?')) {
      setAmcOptions(amcOptions.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Installation & AMC Settings</h1>
          <p className="text-gray-600 mt-1">Configure installation costs and AMC options</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Installation Cost */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Installation Service</h2>
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Installation Cost (₹)
          </label>
          <Input
            type="number"
            value={installationCost}
            onChange={(e) => setInstallationCost(e.target.value)}
            className="w-full"
            placeholder="Enter installation cost"
          />
          <p className="text-sm text-gray-500 mt-2">
            This is the one-time professional installation charge
          </p>
        </div>
      </div>

      {/* AMC Options */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">AMC Options</h2>
          <Button
            onClick={addAmcOption}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add AMC Option
          </Button>
        </div>

        <div className="space-y-4">
          {amcOptions.map((option, index) => (
            <div key={option.id} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AMC Name
                  </label>
                  <Input
                    value={option.name}
                    onChange={(e) => updateAmcOption(index, 'name', e.target.value)}
                    placeholder="AMC name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Per Camera (₹)
                  </label>
                  <Input
                    type="number"
                    value={option.pricePerCamera}
                    onChange={(e) => updateAmcOption(index, 'pricePerCamera', parseFloat(e.target.value) || 0)}
                    placeholder="Price per camera"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  value={option.description}
                  onChange={(e) => updateAmcOption(index, 'description', e.target.value)}
                  placeholder="AMC description"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => removeAmcOption(index)}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
