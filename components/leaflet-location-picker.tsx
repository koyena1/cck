'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LocationPickerProps {
  businessName?: string;
  businessAddress?: string; // Full address to help with geocoding
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  isEditing: boolean;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function LeafletLocationPicker({
  businessName = '',
  businessAddress = '',
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
  const [mapError, setMapError] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(
    latitude && longitude ? { lat: Number(latitude), lng: Number(longitude) } : null
  );
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // Add window resize handler for map
  useEffect(() => {
    if (!map) return;

    const handleResize = () => {
      if (map && map.invalidateSize) {
        console.log('Window resized, invalidating map size');
        map.invalidateSize(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  // Load Leaflet CSS and JS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.L) {
      setIsLoading(false);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    link.onload = () => {
      console.log('✓ Leaflet CSS loaded successfully');
    };
    link.onerror = () => {
      console.error('❌ Failed to load Leaflet CSS');
    };
    document.head.appendChild(link);

    // Add critical CSS fixes for map tiles
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        background: #f1f5f9 !important;
        outline: none !important;
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }
      .leaflet-tile-container {
        transform: translate3d(0, 0, 0) !important;
        will-change: transform !important;
      }
      .leaflet-tile {
        max-width: none !important;
        max-height: none !important;
        opacity: 1 !important;
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        display: block !important;
      }
      .leaflet-tile-pane {
        z-index: 200 !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
      }
      .leaflet-overlay-pane {
        z-index: 400 !important;
      }
      .leaflet-marker-pane {
        z-index: 600 !important;
      }
      .leaflet-popup-pane {
        z-index: 700 !important;
      }
      .leaflet-tooltip-pane {
        z-index: 650 !important;
      }
      
      /* Custom marker animations */
      @keyframes pulse {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transform: rotate(-45deg) scale(1);
        }
        50% {
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.6);
          transform: rotate(-45deg) scale(1.05);
        }
      }
      
      .custom-marker-icon {
        background: transparent !important;
        border: none !important;
      }
      
      .custom-tooltip {
        background: #1f2937 !important;
        color: white !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 6px 10px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
      }
      
      .custom-tooltip::before {
        border-top-color: #1f2937 !important;
      }
      
      .leaflet-marker-icon {
        cursor: grab !important;
      }
      
      .leaflet-marker-icon:active {
        cursor: grabbing !important;
      }
    `;
    document.head.appendChild(style);
    console.log('✓ Critical map CSS injected');

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.async = true;
    script.onload = () => {
      console.log('✓ Leaflet JS loaded successfully');
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Leaflet JS');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize the map
  useEffect(() => {
    if (isLoading || !mapRef.current || !window.L || map) return;

    console.log('Initializing map...');

    // Wait a tick to ensure container is rendered with proper dimensions
    const initMap = () => {
      try {
        // Ensure the container has proper dimensions
        if (!mapRef.current) {
          console.error('Map container not found');
          return;
        }

        const rect = mapRef.current.getBoundingClientRect();
        console.log('Container dimensions:', { width: rect.width, height: rect.height });
        
        if (rect.height === 0 || rect.width === 0) {
          console.error('Container has no dimensions, retrying...');
          setTimeout(initMap, 100);
          return;
        }
        
        // Force container dimensions
        mapRef.current.style.height = '400px';
        mapRef.current.style.minHeight = '400px';
        mapRef.current.style.width = '100%';
        mapRef.current.style.position = 'relative';
        mapRef.current.style.zIndex = '0';
        mapRef.current.style.overflow = 'hidden';

        const defaultCenter: [number, number] = selectedLocation 
          ? [selectedLocation.lat, selectedLocation.lng] 
          : [20.5937, 78.9629]; // India center

        console.log('Creating map with center:', defaultCenter);

        const mapInstance = window.L.map(mapRef.current, {
          preferCanvas: false,
          attributionControl: true,
          zoomControl: true,
          scrollWheelZoom: true,
          fadeAnimation: false,
          zoomAnimation: false
        }).setView(
          defaultCenter, 
          selectedLocation ? 15 : 5
        );

        console.log('Map instance created, loading tiles...');

        // Track tile errors to avoid console spam
        let tileErrorCount = 0;
        let lastTileErrorTime = 0;
        let tilesLoadedSuccessfully = false;
        let tileLoadCount = 0;

        // Try CartoDB Voyager tiles (more reliable CDN) with OpenStreetMap as fallback
        console.log('🗺️ Initializing map tiles from CartoDB (Voyager)...');
        const tileLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 20,
          subdomains: 'abcd',
          minZoom: 1
        });

        // Track tile loading events
        tileLayer.on('tileerror', function(error: any) {
          const now = Date.now();
          if (now - lastTileErrorTime > 5000) {
            console.warn('⚠️ Some map tiles loading slowly. The map will still work. This is normal on slower connections.');
            lastTileErrorTime = now;
            tileErrorCount++;
          }
        });

        tileLayer.on('tileloadstart', function() {
          if (!tilesLoadedSuccessfully) {
            console.log('🔄 Starting to load map tiles from server...');
          }
        });

        tileLayer.on('tileload', function() {
          tileLoadCount++;
          if (!tilesLoadedSuccessfully && tileLoadCount > 0) {
            console.log(`✓ Map tiles are loading... (${tileLoadCount} tiles loaded)`);
            tilesLoadedSuccessfully = true;
          }
        });

        tileLayer.on('load', function() {
          console.log(`✅ All map tiles loaded successfully! (Total: ${tileLoadCount} tiles)`);
          tilesLoadedSuccessfully = true;
        });

        console.log('📍 Adding tile layer to map...');
        tileLayer.addTo(mapInstance);
        console.log('✓ Tile layer added, waiting for tiles to load...');

        // Force map to recalculate size and trigger tile loading
        setTimeout(() => {
          if (mapInstance && mapInstance.invalidateSize) {
            console.log('🔧 Invalidating map size for proper tile rendering...');
            mapInstance.invalidateSize({ pan: false });
            
            // Force a pan and zoom to trigger tile re-rendering
            const currentZoom = mapInstance.getZoom();
            const center = mapInstance.getCenter();
            mapInstance.setView(center, currentZoom, { animate: false });
            
            console.log(`📐 Map resized and refreshed at zoom level ${currentZoom}`);
          }
        }, 100);
        
        // Additional size check
        setTimeout(() => {
          if (mapInstance && mapInstance.invalidateSize) {
            mapInstance.invalidateSize({ pan: false });
            console.log('✓ Secondary size validation complete');
          }
        }, 300);

        // Additional validation after longer delay
        setTimeout(() => {
          if (mapInstance && mapInstance.invalidateSize) {
            console.log('🔄 Final map size validation...');
            mapInstance.invalidateSize(true);
            
            // Force a redraw by panning slightly and panning back
            const center = mapInstance.getCenter();
            mapInstance.panBy([1, 0]);
            setTimeout(() => {
              mapInstance.panTo(center);
              console.log('✅ Map fully initialized and ready!');
            }, 10);
          }
        }, 1000);

        setMap(mapInstance);

      } catch (error) {
        console.error('Failed to initialize map:', error);
        setMapError(true);
        setIsLoading(false);
        
        // Retry after a delay
        setTimeout(() => {
          console.log('Retrying map initialization...');
          setMapError(false);
          setIsLoading(true);
          initMap();
        }, 2000);
      }
    };

    // Start initialization with a small delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      initMap();
    }, 250);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      if (map) {
        console.log('Cleaning up map on unmount');
        try {
          map.remove();
        } catch (error) {
          console.error('Error during map cleanup:', error);
        }
      }
    };
  }, [isLoading]); // Removed isEditing to prevent map recreation

  // Periodically invalidate map size to ensure proper rendering
  useEffect(() => {
    if (!map) return;

    console.log('Map instance available, setting up size validation...');

    // Invalidate size immediately
    const immediate = setTimeout(() => {
      if (map && map.invalidateSize) {
        console.log('Initial map size invalidation');
        map.invalidateSize(true);
      }
    }, 50);

    // Invalidate after short delay
    const short = setTimeout(() => {
      if (map && map.invalidateSize) {
        console.log('Short delay map size invalidation');
        map.invalidateSize(true);
      }
    }, 200);

    // Also invalidate after a longer delay to catch late-rendering containers
    const long = setTimeout(() => {
      if (map && map.invalidateSize) {
        console.log('Re-validating map size for smooth rendering');
        map.invalidateSize(true);
        // Force a zoom refresh
        const currentZoom = map.getZoom();
        map.setZoom(currentZoom);
      }
    }, 500);

    // Final invalidation
    const final = setTimeout(() => {
      if (map && map.invalidateSize) {
        console.log('Final map size validation');
        map.invalidateSize(true);
      }
    }, 1000);

    return () => {
      clearTimeout(immediate);
      clearTimeout(short);
      clearTimeout(long);
      clearTimeout(final);
    };
  }, [map]);

  // Handle map size invalidation when isEditing changes
  useEffect(() => {
    if (!map || !mapRef.current) return;

    console.log('Edit mode changed, invalidating map size...');
    
    // Force container check
    const rect = mapRef.current.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) {
      console.warn('Container lost dimensions, forcing reset');
      mapRef.current.style.height = '400px';
      mapRef.current.style.minHeight = '400px';
    }
    
    // Invalidate map size multiple times to ensure proper rendering
    const t1 = setTimeout(() => {
      if (map && map.invalidateSize) {
        map.invalidateSize({ pan: false });
        console.log('Map size invalidated after edit mode change');
      }
    }, 0);

    const t2 = setTimeout(() => {
      if (map && map.invalidateSize) {
        map.invalidateSize({ pan: false });
        // Force redraw
        const center = map.getCenter();
        const zoom = map.getZoom();
        map.setView(center, zoom, { animate: false });
      }
    }, 100);

    const t3 = setTimeout(() => {
      if (map && map.invalidateSize) {
        map.invalidateSize({ pan: false });
      }
    }, 300);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isEditing, map]);

  // Create and manage marker
  useEffect(() => {
    if (!map || !window.L) return;

    console.log('Managing marker - isEditing:', isEditing, 'selectedLocation:', selectedLocation);

    // If marker already exists, update it
    if (marker) {
      // Update marker position if selectedLocation changed
      if (selectedLocation) {
        marker.setLatLng([selectedLocation.lat, selectedLocation.lng]);
      }

      // Update icon based on edit mode
      const customIcon = window.L.divIcon({
        className: 'custom-marker-icon',
        html: `
          <div style="position: relative;">
            <div style="
              width: 40px;
              height: 40px;
              background: #3b82f6;
              border: 4px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: ${isEditing ? 'move' : 'default'};
              animation: ${isEditing ? 'pulse 2s infinite' : 'none'};
            ">
              <svg style="transform: rotate(45deg); width: 20px; height: 20px;" fill="white" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            ${isEditing ? '<div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">📍 Drag me</div>' : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });
      marker.setIcon(customIcon);

      return; // Marker already exists and is updated
    }

    // Create new marker if needed
    let markerPosition;
    if (selectedLocation) {
      markerPosition = [selectedLocation.lat, selectedLocation.lng];
    } else if (isEditing) {
      // Place at map center if in edit mode but no location selected
      const center = map.getCenter();
      markerPosition = [center.lat, center.lng];
    }

    if (markerPosition) {
      console.log('Creating new marker at:', markerPosition);

      const customIcon = window.L.divIcon({
        className: 'custom-marker-icon',
        html: `
          <div style="position: relative;">
            <div style="
              width: 40px;
              height: 40px;
              background: #3b82f6;
              border: 4px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: ${isEditing ? 'move' : 'default'};
              animation: ${isEditing ? 'pulse 2s infinite' : 'none'};
            ">
              <svg style="transform: rotate(45deg); width: 20px; height: 20px;" fill="white" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            ${isEditing ? '<div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); background: #1f2937; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">📍 Drag me</div>' : ''}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const markerInstance = window.L.marker(markerPosition, {
        draggable: isEditing,
        icon: customIcon
      }).addTo(map);

      if (isEditing) {
        markerInstance.bindTooltip('Drag to set your business location', {
          permanent: false,
          direction: 'top',
          offset: [0, -45],
          className: 'custom-tooltip'
        });

        markerInstance.on('dragstart', () => {
          console.log('🎯 Started dragging marker');
          markerInstance.closeTooltip();
        });

        markerInstance.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          console.log('📍 Marker dropped at:', { lat: position.lat, lng: position.lng });
          handleLocationSelect(position.lat, position.lng);
        });

        // If no location was selected before, auto-select the center position
        if (!selectedLocation) {
          console.log('📌 Auto-selecting center position for new marker');
          handleLocationSelect(markerPosition[0], markerPosition[1]);
        }
      }

      setMarker(markerInstance);
    }
  }, [map, isEditing, selectedLocation]);

  // Update marker draggability and map click handlers when isEditing changes
  useEffect(() => {
    if (!map || !window.L) return;

    // Update map click handler
    map.off('click'); // Remove any existing click handlers
    if (isEditing) {
      map.on('click', (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        console.log('Map clicked at:', { lat, lng });
        handleLocationSelect(lat, lng);
      });
    }

    // Update marker draggability if marker exists
    if (marker) {
      if (isEditing) {
        marker.dragging.enable();
        
        // Add or update tooltip (only shows on hover, not automatically)
        if (!marker.getTooltip()) {
          marker.bindTooltip('Drag to adjust location', {
            permanent: false,
            direction: 'top',
            offset: [0, -45]
          });
        }
        
        // Remove old handlers and add new ones
        marker.off('dragstart');
        marker.off('dragend');
        
        marker.on('dragstart', () => {
          marker.closeTooltip();
        });
        
        marker.on('dragend', (e: any) => {
          const position = e.target.getLatLng();
          console.log('Marker dragged to:', { lat: position.lat, lng: position.lng });
          handleLocationSelect(position.lat, position.lng);
        });
      } else {
        marker.dragging.disable();
        marker.closeTooltip();
      }
    }
  }, [map, marker, isEditing]);

  // Update marker popup with fetched address
  useEffect(() => {
    if (!marker || !window.L || !locationAddress) return;

    // Bind popup with address
    const popupContent = `
      <div style="min-width: 200px; max-width: 300px; padding: 8px;">
        <div style="font-weight: bold; color: #059669; margin-bottom: 6px; font-size: 13px;">
          📍 Location Found
        </div>
        <div style="color: #374151; font-size: 12px; line-height: 1.5;">
          ${locationAddress}
        </div>
        ${selectedLocation ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; font-family: monospace;">
            ${Number(selectedLocation.lat).toFixed(6)}, ${Number(selectedLocation.lng).toFixed(6)}
          </div>
        ` : ''}
      </div>
    `;

    marker.bindPopup(popupContent, {
      offset: [0, -35],
      closeButton: false,
      autoClose: false,
      closeOnClick: false
    });

    // Open the popup automatically
    marker.openPopup();

    console.log('Popup updated with address:', locationAddress);
  }, [marker, locationAddress, selectedLocation]);

  // Auto-locate business based on name and address using Nominatim (OpenStreetMap geocoding)
  useEffect(() => {
    if (!map || selectedLocation || !isEditing) return;
    if (!businessName && !businessAddress) return;

    const geocodeAddress = async () => {
      // Try multiple search strategies
      const searchQueries = [];
      
      // Strategy 1: Combine business name + address (most specific)
      if (businessName && businessAddress) {
        searchQueries.push(`${businessName}, ${businessAddress}`);
      }
      
      // Strategy 2: Just the full address
      if (businessAddress) {
        searchQueries.push(businessAddress);
      }
      
      // Strategy 3: Just the business name
      if (businessName) {
        searchQueries.push(businessName);
      }
      
      console.log('Auto-geocoding with strategies:', searchQueries);
      
      for (const query of searchQueries) {
        try {
          console.log('Trying to geocode:', query);
          
          // Add delay to respect Nominatim usage policy
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const response = await fetch(
            `/api/geocode?type=search&q=${encodeURIComponent(query)}`
          );
          
          if (!response.ok) {
            console.error('Auto-geocoding failed with status:', response.status);
            continue; // Try next strategy
          }
          
          const result = await response.json();
          console.log('Auto-geocode response for', query, ':', result);
          
          if (result.success && result.data && result.data.length > 0) {
            const lat = parseFloat(result.data[0].lat);
            const lng = parseFloat(result.data[0].lon);
            
            console.log('Auto-locate found coordinates:', { lat, lng, query });
            
            // Ensure map is still available before using it
            if (map && map.setView && window.L) {
              try {
                map.setView([lat, lng], 15);
                await new Promise(resolve => setTimeout(resolve, 200));
                handleLocationSelect(lat, lng);
                return; // Success! Stop trying other strategies
              } catch (error) {
                console.error('Auto-locate map operation failed:', error);
              }
            }
          } else {
            console.log('No results found for:', query);
          }
        } catch (error) {
          console.error('Auto-geocoding error for', query, ':', error);
        }
      }
      
      console.log('Auto-locate: Could not find location with any strategy');
    };

    // Delay auto-geocoding to ensure map is fully initialized
    const timer = setTimeout(geocodeAddress, 1000);
    return () => clearTimeout(timer);
  }, [map, businessName, businessAddress]);

  const handleLocationSelect = (lat: number, lng: number) => {
    console.log('handleLocationSelect called with:', { lat, lng });
    
    // Check if map, window.L, and container are still valid
    if (!map || !window.L || !mapRef.current) {
      console.error('Map, Leaflet, or container not available in handleLocationSelect');
      alert('Map is not ready. Please wait a moment and try again.');
      return;
    }

    // Check if container is still in DOM
    if (!document.body.contains(mapRef.current)) {
      console.error('Map container not in DOM');
      alert('Map container was removed. Please refresh the page.');
      return;
    }

    // Ensure coordinates are valid numbers
    const validLat = Number(lat);
    const validLng = Number(lng);
    
    if (isNaN(validLat) || isNaN(validLng)) {
      console.error('Invalid coordinates:', { lat, lng });
      alert('Invalid coordinates. Please try again.');
      return;
    }

    const newLocation = { lat: validLat, lng: validLng };
    setSelectedLocation(newLocation);
    onLocationChange(validLat, validLng);

    // Update or create marker
    try {
      // Ensure map size is correct before marker operations
      map.invalidateSize();
      
      if (marker) {
        console.log('Updating existing marker');
        marker.setLatLng([validLat, validLng]);
      } else {
        console.log('Creating new marker');
        const newMarker = window.L.marker([validLat, validLng], {
          draggable: isEditing
        }).addTo(map);

        // Add tooltip to indicate draggability when in edit mode
        if (isEditing) {
          newMarker.bindTooltip('Drag me to adjust location', {
            permanent: false,
            direction: 'top',
            offset: [0, -20]
          }).openTooltip();

          newMarker.on('dragstart', () => {
            newMarker.closeTooltip();
          });

          newMarker.on('dragend', (e: any) => {
            const position = e.target.getLatLng();
            handleLocationSelect(position.lat, position.lng);
            // Reopen tooltip after drag
            setTimeout(() => {
              if (newMarker.getTooltip()) {
                newMarker.openTooltip();
              }
            }, 100);
          });
        }

        setMarker(newMarker);
      }

      // Center map on new location
      console.log('Panning map to new location');
      map.panTo([validLat, validLng]);
    } catch (error) {
      console.error('Error updating marker:', error);
      alert('Failed to place marker. The map may not be fully loaded.');
      return;
    }

    // Fetch address using reverse geocoding (run async without blocking)
    fetchAddress(validLat, validLng);
  };

  const fetchAddress = async (lat: number, lng: number) => {
    setIsFetchingAddress(true);
    setLocationAddress('');
    
    try {
      // Add delay to respect Nominatim usage policy
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(
        `/api/geocode?type=reverse&lat=${lat}&lon=${lng}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.display_name) {
        setLocationAddress(result.data.display_name);
      } else {
        setLocationAddress('Address not found');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setLocationAddress('Unable to fetch address');
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search term');
      return;
    }

    if (!map || !window.L) {
      console.error('Map not ready for search');
      alert('Map is not ready yet. Please wait a moment and try again.');
      return;
    }

    setIsSearching(true);
    console.log('Starting search for:', searchQuery);
    
    try {
      // Add delay to respect Nominatim usage policy (max 1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(
        `/api/geocode?type=search&q=${encodeURIComponent(searchQuery)}`
      );
      
      const result = await response.json();
      console.log('Search API response:', result);
      
      if (!response.ok) {
        console.error('API error:', result);
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }
      
      if (result.success && result.data && result.data.length > 0) {
        const firstResult = result.data[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);
        
        console.log('Location found:', { 
          lat, 
          lng, 
          name: firstResult.display_name,
          totalResults: result.data.length 
        });
        
        // Show info if multiple results found
        if (result.data.length > 1) {
          console.log(`Found ${result.data.length} matches. Using: ${firstResult.display_name}`);
        }
        
        // Verify map AND container are still valid
        if (!map || !map.setView || !window.L || !mapRef.current) {
          console.error('Map or container became invalid during search');
          alert('Map error. Please refresh the page and try again.');
          return;
        }
        
        // Check if map container is still in the DOM
        if (!document.body.contains(mapRef.current)) {
          console.error('Map container not in DOM');
          alert('Map container was removed. Please refresh the page.');
          return;
        }
        
        try {
          console.log('Invalidating map size before setView');
          // Force Leaflet to recalculate the map size
          map.invalidateSize();
          
          console.log('Setting map view to location');
          map.setView([lat, lng], 15);
          
          // Small delay to allow map to render before placing marker
          await new Promise(resolve => setTimeout(resolve, 200));
          
          console.log('Calling handleLocationSelect');
          handleLocationSelect(lat, lng);
          
          console.log('Search completed successfully');
        } catch (mapError) {
          console.error('Map operation error:', mapError);
          alert('Could not update map view. Please try clicking directly on the map instead.');
        }
      } else {
        console.log('No results found for:', searchQuery);
        
        // Check if API returned a helpful message
        const apiMessage = result.message;
        const suggestedRegion = result.suggestedRegion;
        
        // Provide more helpful error message based on input type
        const isPincode = /^\d{6}$/.test(searchQuery.trim());
        
        if (isPincode) {
          let message = `Pincode "${searchQuery}" not found in our database.\n\n`;
          
          if (suggestedRegion) {
            message += `📍 This pincode appears to be from: ${suggestedRegion}\n\n`;
          }
          
          message += `✅ Try these options:\n` +
                     `• Add your region: "${searchQuery}, ${suggestedRegion || '[Your City/District]'}"\n` +
                     `• Search by city/district name only\n` +
                     `• Click directly on the map to mark your location\n\n` +
                     `💡 The map will still save your location when you click on it!`;
          
          alert(message);
        } else {
          alert('Location not found.\n\n' +
                '✅ Try:\n' +
                '• Add more details (city, state, district)\n' +
                '• Search by nearby landmark\n' +
                '• Click directly on the map to mark your location');
        }
      }
    } catch (error: any) {
      console.error('Search error:', error);
      alert(`Search failed: ${error.message}. Please check your connection and try again.`);
    } finally {
      setIsSearching(false);
    }
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
          <p className="text-sm text-slate-600 font-semibold">Loading map library...</p>
          <p className="text-xs text-slate-500">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (!window.L && !isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center px-4">
          <p className="text-sm text-red-600 font-semibold mb-2">Failed to load map library</p>
          <p className="text-xs text-red-500 mb-3">Please check your internet connection</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-center px-4">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto mb-2" />
          <p className="text-sm text-yellow-700 font-semibold mb-1">Retrying map initialization...</p>
          <p className="text-xs text-yellow-600">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!window.L) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center px-4">
          <p className="text-sm text-red-600 font-semibold mb-2">Failed to load map</p>
          <p className="text-xs text-red-500">Please refresh the page and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isEditing && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Enter address, pincode, city, or business name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 border-slate-200"
              />
            </div>
            <Button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim() || !map}
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
            <Button
              type="button"
              onClick={() => {
                console.log('🔄 Manual map refresh requested');
                if (map) {
                  map.invalidateSize(true);
                  const center = map.getCenter();
                  const zoom = map.getZoom();
                  map.setView(center, zoom, { reset: true });
                  console.log('✓ Map refreshed');
                } else {
                  console.log('⚠️ Map not initialized yet');
                  window.location.reload();
                }
              }}
              variant="outline"
              className="border-slate-300 hover:bg-slate-100"
              title="Reload the map if tiles are not showing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </Button>
          </div>
          <div className="text-xs text-slate-500 px-1">
            <span className="font-semibold">💡 Tip:</span> Search works best with complete details:
            <ul className="mt-1 ml-4 list-disc text-[10px]">
              <li>Pincode with city: <span className="font-mono bg-slate-100 px-1 rounded">721637, Paschim Medinipur, West Bengal</span></li>
              <li>City or district name: <span className="font-mono bg-slate-100 px-1 rounded">Kharagpur</span></li>
              <li>Business landmark: <span className="font-mono bg-slate-100 px-1 rounded">Near IIT Kharagpur</span></li>
            </ul>
            <p className="mt-1">🔄 If map tiles don't show, click the refresh button.</p>
          </div>
        </div>
      )}

      <div className="relative">
        <div 
          ref={mapRef} 
          className={`w-full h-[400px] rounded-lg border-2 shadow-sm bg-slate-100 ${
            isEditing 
              ? 'border-blue-400 cursor-crosshair hover:border-blue-500 transition-colors' 
              : 'border-slate-200'
          }`}
          style={{ 
            minHeight: '400px', 
            height: '400px',
            position: 'relative',
            zIndex: 0,
            backgroundColor: '#f1f5f9'
          }}
          title={isEditing ? 'Click anywhere on the map to select a location' : 'Location map'}
        >
          {!map && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-lg">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Initializing map...</p>
              </div>
            </div>
          )}
        </div>
        
        {isEditing && map && (
          <div className="absolute top-3 left-3 right-3 pointer-events-none z-[1000]">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 max-w-fit">
              <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Drag the blue marker to set your exact location</span>
            </div>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex items-start gap-2 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div className="text-xs text-blue-800 flex-1">
            <p className="font-bold mb-2 text-sm text-blue-900">📍 How to set your business location:</p>
            <ul className="mt-2 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-lg shrink-0">🎯</span>
                <div>
                  <strong className="text-blue-900">Drag the Marker (Recommended):</strong>
                  <span className="block text-blue-700 mt-0.5">Simply grab and drag the blue location marker to your exact business location</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg shrink-0">👆</span>
                <div>
                  <strong className="text-blue-900">Click on Map:</strong>
                  <span className="block text-blue-700 mt-0.5">Click anywhere on the map to instantly move the marker there</span>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lg shrink-0">🔍</span>
                <div>
                  <strong className="text-blue-900">Search by Address:</strong>
                  <span className="block text-blue-700 mt-0.5">Type your city, area, or pincode (e.g., "721637, West Bengal") and click Search</span>
                </div>
              </li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-md">
              <p className="text-blue-900 font-bold text-xs">
                ⚡ Quick Tip: The blue marker appears automatically - just drag it to your location and save!
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedLocation && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border-2 border-green-300 shadow-sm">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-green-900 mb-1">✓ Location Selected</div>
              <div className="text-xs font-mono text-green-700 bg-green-100 px-2 py-1 rounded">
                {Number(selectedLocation.lat).toFixed(6)}, {Number(selectedLocation.lng).toFixed(6)}
              </div>
            </div>
          </div>

          {isFetchingAddress && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <Loader2 className="w-4 h-4 text-slate-600 animate-spin shrink-0" />
              <div className="text-xs text-slate-600">Fetching address...</div>
            </div>
          )}

          {!isFetchingAddress && locationAddress && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-amber-800 mb-1">Full Address</div>
                <div className="text-xs text-amber-700 leading-relaxed">
                  {locationAddress}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
