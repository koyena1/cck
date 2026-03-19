/**
 * Distance Calculator Utility
 * Calculates distance between two geographic coordinates using Haversine formula
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a = 
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get coordinates for a pincode (mock implementation)
 * In production, you should use a pincode geocoding service or database
 */
export async function getPincodeCoordinates(pincode: string): Promise<Coordinates | null> {
  // This is a mock implementation
  // In production, you would:
  // 1. Query a pincode database
  // 2. Use Google Maps Geocoding API
  // 3. Use any other geocoding service
  
  // For now, return null if pincode is not available
  // The system will fall back to pincode-based matching
  return null;
}

/**
 * Sort dealers by distance from customer location
 */
export function sortDealersByDistance(
  dealers: any[],
  customerCoords: Coordinates
): any[] {
  return dealers
    .map(dealer => {
      if (!dealer.latitude || !dealer.longitude) {
        return {
          ...dealer,
          distance_km: 9999, // Put dealers without coordinates at the end
          has_coordinates: false
        };
      }

      const distance = calculateDistance(
        customerCoords,
        { latitude: parseFloat(dealer.latitude), longitude: parseFloat(dealer.longitude) }
      );

      return {
        ...dealer,
        distance_km: distance,
        has_coordinates: true
      };
    })
    .sort((a, b) => a.distance_km - b.distance_km);
}

/**
 * Check if a dealer services a particular pincode
 */
export function isDealerServicingPincode(dealer: any, pincode: string): boolean {
  if (!dealer.serviceable_pincodes && !dealer.service_pin) {
    return true; // If no restriction, dealer services all pincodes
  }

  // Check exact service_pin match
  if (dealer.service_pin === pincode) {
    return true;
  }

  // Check serviceable_pincodes list
  if (dealer.serviceable_pincodes) {
    const serviceablePins = dealer.serviceable_pincodes
      .split(',')
      .map((pin: string) => pin.trim());
    
    if (serviceablePins.includes(pincode)) {
      return true;
    }
  }

  return false;
}
