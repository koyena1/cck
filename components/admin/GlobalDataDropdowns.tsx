/**
 * Reusable dropdown components that pull data from Global Quotation Management
 * Any changes made in admin/quotation will automatically reflect in these dropdowns
 */

import React from 'react';
import { useGlobalQuotationData } from '@/lib/useGlobalQuotationData';

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export function BrandDropdown({ value, onChange, required = true, className = '' }: DropdownProps) {
  const { data: globalData } = useGlobalQuotationData();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Brand {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`}
        required={required}
      >
        <option value="">Select Brand</option>
        {globalData?.brands?.map((brand) => (
          <option key={brand.id} value={brand.name}>
            {brand.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        📝 Add/edit brands in Quotation Management
      </p>
    </div>
  );
}

export function ChannelDropdown({ value, onChange, required = true, className = '' }: DropdownProps) {
  const { data: globalData } = useGlobalQuotationData();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Channels {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`}
        required={required}
      >
        {globalData?.channels?.map((channel) => (
          <option key={channel.id} value={channel.channel_count}>
            {channel.channel_count} Channel
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        📝 Add/edit channels in Quotation Management
      </p>
    </div>
  );
}

export function ResolutionDropdown({ value, onChange, required = true, className = '' }: DropdownProps) {
  const { data: globalData } = useGlobalQuotationData();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Resolution {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`}
        required={required}
      >
        {globalData?.pixels?.map((pixel) => (
          <option key={pixel.id} value={pixel.name}>
            {pixel.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        📝 Add/edit resolutions in Quotation Management
      </p>
    </div>
  );
}

export function StorageDropdown({ value, onChange, required = true, className = '', label = 'Hard Disk' }: DropdownProps & { label?: string }) {
  const { data: globalData } = useGlobalQuotationData();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`}
        required={required}
      >
        {globalData?.storage?.map((storage) => (
          <option key={storage.id} value={storage.capacity}>
            {storage.capacity}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        📝 Add/edit storage options in Quotation Management
      </p>
    </div>
  );
}

export function CableDropdown({ value, onChange, required = true, className = '' }: DropdownProps) {
  const { data: globalData } = useGlobalQuotationData();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Cable Length {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`}
        required={required}
      >
        {globalData?.cables?.map((cable) => (
          <option key={cable.id} value={cable.name}>
            {cable.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        📝 Add/edit cable options in Quotation Management
      </p>
    </div>
  );
}

export function CameraTypeDropdown({ value, onChange, required = true, className = '' }: DropdownProps) {
  const { data: globalData } = useGlobalQuotationData();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Camera Type {required && '*'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`}
        required={required}
      >
        {globalData?.cameraTypes?.map((type) => (
          <option key={type.id} value={type.name}>
            {type.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        📝 Add/edit camera types in Quotation Management
      </p>
    </div>
  );
}

/**
 * Show loading state banner when global data is loading
 */
export function GlobalDataLoadingBanner() {
  const { loading } = useGlobalQuotationData();

  if (!loading) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <p className="text-sm text-blue-700">
        🔄 Loading global data from Quotation Management...
      </p>
    </div>
  );
}

/**
 * Show info banner about global data
 */
export function GlobalDataInfoBanner() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <h4 className="font-semibold text-green-900 mb-2">
        ✨ Global Data Management Active
      </h4>
      <p className="text-sm text-green-700">
        All dropdown options (Brands, Channels, Resolution, Storage, etc.) are automatically
        synced from <strong>Quotation Management</strong>. Any changes you make there will
        instantly appear in all admin panels and frontend pages.
      </p>
    </div>
  );
}
