"use client";

import { useState, useEffect, useCallback } from 'react';
import { globalDataChangeEmitter } from './globalDataChangeEmitter';

export interface QuotationSettings {
  cameraTypes: Array<{ id: number; name: string; display_order: number; is_active: boolean }>;
  brands: Array<{ 
    id: number; 
    name: string; 
    display_order: number; 
    is_active: boolean;
    image_url?: string;
    pricing?: Record<string, number>;
  }>;
  channels: Array<{ 
    id: number; 
    channel_count: number; 
    features: string[]; 
    display_order: number; 
    is_active: boolean;
  }>;
  pixels: Array<{ id: number; name: string; display_order: number; is_active: boolean }>;
  techTypes: Array<{ 
    id: number; 
    name: string; 
    camera_type: string; 
    location: string;
    base_price: number;
    display_order: number; 
    is_active: boolean;
  }>;
  storage: Array<{ 
    id: number; 
    capacity: string; 
    price: number; 
    display_order: number; 
    is_active: boolean;
  }>;
  cables: Array<{ 
    id: number; 
    name: string; 
    cable_type: string;
    length: string;
    price: number; 
    display_order: number; 
    is_active: boolean;
  }>;
  accessories: Array<{ 
    id: number; 
    name: string; 
    price: number; 
    display_order: number; 
    is_active: boolean;
  }>;
  settings: Record<string, string>;
}

/**
 * Global hook for accessing quotation settings across the entire application.
 * All data added by admin from Quotation Management will automatically appear everywhere.
 * 
 * Usage:
 * const { data, loading, error, refresh } = useGlobalQuotationData();
 */
export function useGlobalQuotationData() {
  const [data, setData] = useState<QuotationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/quotation-settings', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      
      const settings = await response.json();
      setData(settings);
    } catch (err) {
      console.error('Error fetching global quotation data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Subscribe to global data change events
    const unsubscribe = globalDataChangeEmitter.subscribe(() => {
      console.log('📥 Received global data change notification - refreshing...');
      fetchData();
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
}

/**
 * Helper function to extract brand names from quotation settings
 */
export function extractBrandNames(settings: QuotationSettings | null): string[] {
  return settings?.brands?.map(b => b.name) || [];
}

/**
 * Helper function to extract camera type names from quotation settings
 */
export function extractCameraTypes(settings: QuotationSettings | null): string[] {
  return settings?.cameraTypes?.map(ct => ct.name) || [];
}

/**
 * Helper function to extract pixel options from quotation settings
 */
export function extractPixelOptions(settings: QuotationSettings | null): string[] {
  return settings?.pixels?.map(p => p.name) || [];
}

/**
 * Helper function to extract channel options from quotation settings
 */
export function extractChannelOptions(settings: QuotationSettings | null): Array<{ value: number; label: string }> {
  return settings?.channels?.map(ch => ({
    value: ch.channel_count,
    label: `${ch.channel_count} Channel${ch.channel_count > 1 ? 's' : ''}`
  })) || [];
}

/**
 * Helper function to extract storage options from quotation settings
 */
export function extractStorageOptions(settings: QuotationSettings | null): Array<{ label: string; price: number }> {
  return settings?.storage?.map(s => ({
    label: s.capacity,
    price: s.price
  })) || [];
}
