import { NextResponse } from 'next/server';

// Helper function to get region from Indian pincode
function getRegionFromPincode(pincode: string): string | null {
  const prefix = pincode.substring(0, 3);
  const prefixNum = parseInt(prefix);
  
  // Indian pincode regional mapping (first 3 digits indicate region)
  const regions: { [key: string]: string } = {
    '110': 'Delhi',
    '400': 'Mumbai, Maharashtra',
    '560': 'Bangalore, Karnataka',
    '600': 'Chennai, Tamil Nadu',
    '700': 'Kolkata, West Bengal',
    '721': 'Midnapore, West Bengal',
    '722': 'Bankura/Purulia, West Bengal',
    '500': 'Hyderabad, Telangana',
    '201': 'Ghaziabad, Uttar Pradesh',
    '411': 'Pune, Maharashtra',
    '380': 'Ahmedabad, Gujarat',
  };
  
  // Check for exact match first
  if (regions[prefix]) {
    return regions[prefix];
  }
  
  // Approximate region based on ranges
  if (prefixNum >= 110 && prefixNum <= 140) return 'Delhi/Haryana/Punjab region';
  if (prefixNum >= 140 && prefixNum <= 160) return 'Punjab/Himachal Pradesh region';
  if (prefixNum >= 160 && prefixNum <= 177) return 'Punjab/Chandigarh region';
  if (prefixNum >= 201 && prefixNum <= 285) return 'Uttar Pradesh region';
  if (prefixNum >= 300 && prefixNum <= 345) return 'Rajasthan region';
  if (prefixNum >= 360 && prefixNum <= 396) return 'Gujarat region';
  if (prefixNum >= 400 && prefixNum <= 445) return 'Maharashtra/Goa region';
  if (prefixNum >= 500 && prefixNum <= 509) return 'Telangana region';
  if (prefixNum >= 520 && prefixNum <= 535) return 'Andhra Pradesh region';
  if (prefixNum >= 560 && prefixNum <= 591) return 'Karnataka region';
  if (prefixNum >= 600 && prefixNum <= 643) return 'Tamil Nadu region';
  if (prefixNum >= 670 && prefixNum <= 695) return 'Kerala region';
  if (prefixNum >= 700 && prefixNum <= 743) return 'West Bengal region';
  if (prefixNum >= 744 && prefixNum <= 744) return 'Andaman & Nicobar region';
  if (prefixNum >= 751 && prefixNum <= 770) return 'Odisha region';
  if (prefixNum >= 781 && prefixNum <= 788) return 'Assam region';
  
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const type = searchParams.get('type'); // 'search' or 'reverse'

    console.log('Geocode API called:', { type, query, lat, lon });

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    let url: string;
    
    if (type === 'search') {
      if (!query) {
        return NextResponse.json(
          { error: 'Query parameter is required for search' },
          { status: 400 }
        );
      }
      
      // Enhance search query for Indian pincodes
      let enhancedQuery = query;
      let isIndianPincode = false;
      
      // Check if query is a 6-digit number (likely an Indian pincode)
      if (/^\d{6}$/.test(query.trim())) {
        console.log('Detected Indian pincode format, trying multiple strategies');
        isIndianPincode = true;
        const pincode = query.trim();
        
        // Strategy 1: Try with "postal code" prefix
        enhancedQuery = `postal code ${pincode}, India`;
        console.log('Trying Strategy 1:', enhancedQuery);
        
        let url1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enhancedQuery)}&limit=5&addressdetails=1&countrycodes=in`;
        const response1 = await fetch(url1, {
          headers: {
            'User-Agent': 'CCTV-Platform-Dealer-Portal/1.0 (contact@protechtur.com)',
            'Accept': 'application/json',
          },
        });
        
        if (response1.ok) {
          const data1 = await response1.json();
          if (data1 && data1.length > 0) {
            console.log('Strategy 1 succeeded with', data1.length, 'results');
            return NextResponse.json({ success: true, data: data1 });
          }
        }
        
        // Strategy 2: Try with just pincode and India
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        enhancedQuery = `${pincode} India`;
        console.log('Trying Strategy 2:', enhancedQuery);
        
        let url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enhancedQuery)}&limit=5&addressdetails=1&countrycodes=in`;
        const response2 = await fetch(url2, {
          headers: {
            'User-Agent': 'CCTV-Platform-Dealer-Portal/1.0 (contact@protechtur.com)',
            'Accept': 'application/json',
          },
        });
        
        if (response2.ok) {
          const data2 = await response2.json();
          if (data2 && data2.length > 0) {
            console.log('Strategy 2 succeeded with', data2.length, 'results');
            return NextResponse.json({ success: true, data: data2 });
          }
        }
        
        // If both strategies failed, return empty result with helpful message
        console.log('All pincode strategies failed');
        const region = getRegionFromPincode(pincode);
        const regionHint = region ? ` This pincode is from ${region}.` : '';
        
        return NextResponse.json({
          success: true,
          data: [],
          message: `Pincode not found in database.${regionHint} Please try entering city/district name or click on the map.`,
          suggestedRegion: region
        });
      }
      // Also handle cases like "721637 " or variations
      else if (/^\d{6}\s*$/.test(query)) {
        const pincode = query.trim();
        console.log('Detected Indian pincode with whitespace, enhancing query');
        enhancedQuery = `postal code ${pincode}, India`;
      }
      
      if (!isIndianPincode) {
        console.log('Regular search query:', query);
      }
      
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enhancedQuery)}&limit=5&addressdetails=1`;
    } else if (type === 'reverse') {
      if (!lat || !lon) {
        return NextResponse.json(
          { error: 'Latitude and longitude are required for reverse geocoding' },
          { status: 400 }
        );
      }
      url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    } else {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    console.log('Fetching from Nominatim:', url);

    // Make request to Nominatim with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'CCTV-Platform-Dealer-Portal/1.0 (contact@protechtur.com)',
        'Accept': 'application/json',
      },
    });

    console.log('Nominatim response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nominatim API error:', response.status, errorText);
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Nominatim data received:', data);
    
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Geocoding failed' 
      },
      { status: 500 }
    );
  }
}
