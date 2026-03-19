'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationPickerProps {
  businessName?: string;
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  isEditing: boolean;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapsLocationPicker({
  businessName = '',
  latitude,
  longitude,
  onLocationChange,
  isEditing
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setIsLoading(false);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize the map
  useEffect(() => {
    if (isLoading || !mapRef.current || !window.google) return;

    const defaultCenter = selectedLocation || { lat: 20.5937, lng: 78.9629 }; // India center

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: selectedLocation ? 15 : 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(mapInstance);

    // Add click listener to map (only in edit mode)
    if (isEditing) {
      mapInstance.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        handleLocationSelect(lat, lng);
      });
    }

    // If we have existing coordinates, place a marker
    if (selectedLocation) {
      const markerInstance = new window.google.maps.Marker({
        position: selectedLocation,
        map: mapInstance,
        draggable: isEditing,
        animation: window.google.maps.Animation.DROP,
      });

      if (isEditing) {
        markerInstance.addListener('dragend', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          handleLocationSelect(lat, lng);
        });
      }

      setMarker(markerInstance);
    }
  }, [isLoading, isEditing]);

  // Auto-locate business based on name
  useEffect(() => {
    if (!map || !businessName || selectedLocation || !isEditing) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: businessName }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        map.setCenter(location);
        map.setZoom(15);
        
        handleLocationSelect(lat, lng);
      }
    });
  }, [map, businessName, isEditing]);

  const handleLocationSelect = (lat: number, lng: number) => {
    const newLocation = { lat, lng };
    setSelectedLocation(newLocation);
    onLocationChange(lat, lng);

    // Update or create marker
    if (marker) {
      marker.setPosition(newLocation);
    } else if (map) {
      const newMarker = new window.google.maps.Marker({
        position: newLocation,
        map: map,
        draggable: isEditing,
        animation: window.google.maps.Animation.DROP,
      });

      if (isEditing) {
        newMarker.addListener('dragend', (e: any) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          handleLocationSelect(newLat, newLng);
        });
      }

      setMarker(newMarker);
    }

    // Center map on new location
    if (map) {
      map.panTo(newLocation);
    }
  };

  const handleSearch = () => {
    if (!map || !searchQuery.trim()) return;

    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address: searchQuery }, (results: any, status: any) => {
      setIsSearching(false);
      
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        map.setCenter(location);
        map.setZoom(15);
        
        handleLocationSelect(lat, lng);
      } else {
        alert('Location not found. Please try a different search term or click on the map.');
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#facc15]" />
          <p className="text-sm text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center px-4">
          <MapPin className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 font-semibold">Google Maps API key is missing</p>
          <p className="text-xs text-red-500 mt-1">Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isEditing && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for your business or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 border-slate-200"
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-[#facc15] hover:bg-[#e6b800] text-[#0f172a] font-semibold"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      )}

      <div 
        ref={mapRef} 
        className="w-full h-[400px] rounded-lg border-2 border-slate-200 shadow-sm"
      />

      {isEditing && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-semibold">How to select your location:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Click anywhere on the map to place a marker</li>
              <li>Drag the marker to adjust the position</li>
              <li>Use the search bar to find your business or area</li>
            </ul>
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
          <MapPin className="w-4 h-4 text-green-600" />
          <div className="text-xs font-mono text-green-700">
            <span className="font-semibold">Selected Location:</span> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}
