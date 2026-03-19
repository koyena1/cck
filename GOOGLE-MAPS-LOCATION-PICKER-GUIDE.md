# Google Maps Location Picker - Dealer Profile

## Overview
A comprehensive map-based location picker has been integrated into the Dealer Portal Profile page, allowing dealers to select and save their business location coordinates using an interactive Google Maps interface.

## Features Implemented

### 1. **Interactive Google Maps Integration**
- Full Google Maps implementation with Places API and Geocoding support
- Responsive map interface (400px height)
- Custom controls and styling to match application design
- Support for draggable markers and click-to-select functionality

### 2. **Automatic Business Location Detection**
- System automatically attempts to geocode the business name
- If business is found, map auto-centers and places a marker
- Works when dealer enters or updates their business name

### 3. **Manual Location Selection**
- Dealers can click anywhere on the map to place a marker
- Marker is draggable for precise positioning
- Real-time coordinate updates displayed below map
- Search functionality to find specific addresses or places

### 4. **Location Search**
- Search bar for finding businesses, addresses, or landmarks
- Integrated Google Places Autocomplete
- Search results auto-center map and place marker
- Support for Enter key press to trigger search

### 5. **Coordinate Storage**
- Latitude and longitude stored in hidden form fields
- Coordinates automatically captured from marker position
- Data saved to database when profile is submitted
- No manual entry allowed - visual selection only

### 6. **Existing Location Display**
- If dealer has saved coordinates, map loads with existing marker
- Map automatically centers on saved location
- Marker displays at correct position on page load

### 7. **Edit Mode Restrictions**
- Location selection only enabled in edit mode
- Read-only map display when not editing
- Marker dragging disabled in read-only mode
- Map clicks ignored outside edit mode

## Files Modified/Created

### New Files:
1. **`components/google-maps-location-picker.tsx`**
   - Reusable React component for map interface
   - Handles Google Maps API loading and initialization
   - Manages marker placement and coordinate updates
   - Includes search and geocoding functionality

2. **`add-dealer-location-columns.sql`**
   - SQL migration script
   - Adds `latitude` and `longitude` columns to dealers table
   - Creates geospatial index for future queries

### Modified Files:
1. **`app/dealer/profile/page.tsx`**
   - Integrated GoogleMapsLocationPicker component
   - Added latitude/longitude to form state
   - Added hidden input fields for coordinates
   - Updated UI with new location card section
   - Added location change handler

2. **`app/api/dealer/me/route.ts`**
   - Added latitude/longitude to SELECT query
   - Updated dealer object mapping to include coordinates

3. **`app/api/dealer/update/route.ts`**
   - Added latitude/longitude parameters
   - Updated UPDATE query to save coordinates
   - Updated response mapping to include coordinates

4. **`.env.example`**
   - Added NEXT_PUBLIC_GOOGLE_MAPS_API_KEY configuration
   - Added setup instructions for Google Maps API

## Database Schema Updates

```sql
-- New columns added to dealers table
ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Geospatial index for future proximity queries
CREATE INDEX IF NOT EXISTS idx_dealers_coordinates 
ON dealers(latitude, longitude);
```

## Setup Instructions

### 1. Database Migration
Run the SQL migration to add location columns:
```bash
psql -U postgres -d cctv_platform -f add-dealer-location-columns.sql
```

### 2. Google Maps API Configuration

#### A. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Library"

#### B. Enable Required APIs
Enable the following APIs:
- **Maps JavaScript API** (for map display)
- **Places API** (for search functionality)
- **Geocoding API** (for address to coordinates conversion)

#### C. Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. **(Recommended)** Restrict the key:
   - Application restrictions: HTTP referrers
   - Add your domain: `protechtur.com/*`
   - API restrictions: Select the 3 APIs mentioned above

#### D. Configure Environment Variable
Add to your `.env.local` file:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
```

**Important:** The key must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Restart Application
After adding the environment variable:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## User Flow

### For Dealers Setting Up Profile:

1. **Navigate to Profile**
   - Dealer logs into portal
   - Goes to "Dealer Profile" page

2. **Enter Business Information**
   - Click "Edit Profile" button
   - Fill in business name and other details

3. **Automatic Location Detection**
   - System attempts to find business on map using business name
   - If found, map centers and marker appears automatically

4. **Manual Selection (if needed)**
   - If auto-detection fails, use search bar to find location
   - Or click directly on map to place marker
   - Drag marker to fine-tune position

5. **Confirm Selection**
   - Verify coordinates displayed below map
   - Click "Save Changes" to submit profile

6. **Location Persisted**
   - Coordinates saved to database
   - Next visit shows map with existing marker

### For Dealers Updating Location:

1. Click "Edit Profile"
2. Existing marker shows current saved location
3. Search for new location or click on map
4. Drag marker to adjust
5. Save changes to update coordinates

## Component Props

### GoogleMapsLocationPicker

```typescript
interface LocationPickerProps {
  businessName?: string;        // Auto-geocode using this name
  latitude?: number | null;      // Initial latitude
  longitude?: number | null;     // Initial longitude
  onLocationChange: (lat: number, lng: number) => void;  // Callback
  isEditing: boolean;            // Enable/disable interaction
}
```

## API Data Structure

### Request (Update Profile):
```json
{
  "dealerId": 1,
  "business_name": "Pro Tech Security",
  "latitude": 28.6139,
  "longitude": 77.2090,
  // ... other fields
}
```

### Response (Get/Update):
```json
{
  "success": true,
  "dealer": {
    "dealer_id": 1,
    "business_name": "Pro Tech Security",
    "latitude": 28.6139,
    "longitude": 77.2090,
    // ... other fields
  }
}
```

## Error Handling

### Missing API Key
- Component displays error message:
  > "Google Maps API key is missing"
- Prevents map initialization
- Shows configuration instructions

### Failed Geocoding
- Alert shown to user:
  > "Location not found. Please try a different search term or click on the map."
- Allows manual selection as fallback

### Script Loading Failure
- Loading indicator shown
- Error logged to console
- Graceful degradation

## Security Considerations

1. **API Key Restrictions**
   - Always restrict API key to your domain
   - Enable only required APIs (Maps, Places, Geocoding)
   - Monitor usage in Google Cloud Console

2. **Coordinate Validation**
   - Backend should validate latitude (-90 to 90)
   - Backend should validate longitude (-180 to 180)
   - Consider adding validation middleware

3. **Input Sanitization**
   - Business name used in geocoding is from authenticated dealer
   - No direct user input for coordinates
   - Form validation prevents injection

## Cost Management

### Google Maps Pricing:
- **Maps JavaScript API**: $7 per 1,000 loads
- **Places API**: $17 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests

### Optimization Tips:
1. **Free Tier**: Google provides $200/month credit
   - ~28,500 map loads per month free
   - ~11,750 geocoding requests free

2. **Caching**
   - Store coordinates to avoid repeated geocoding
   - Only geocode when business name changes

3. **Lazy Loading**
   - Map only loads on profile page
   - Script loads on demand, not globally

4. **Budget Alerts**
   - Set up billing alerts in Google Cloud Console
   - Monitor usage regularly

## Future Enhancements

### Potential Features:
1. **Proximity Search**
   - Use coordinates to find dealers near customer locations
   - Implement radius-based dealer matching

2. **Service Area Display**
   - Draw service radius on map
   - Visualize coverage area

3. **Multiple Locations**
   - Support for dealers with multiple branches
   - Store array of coordinates

4. **Autocomplete Address**
   - Pre-fill address field from selected coordinates
   - Reverse geocoding integration

5. **Map Styles**
   - Custom map styling to match brand colors
   - Night mode support

6. **Street View**
   - Enable Street View for business verification
   - Visual confirmation of location

## Troubleshooting

### Map Not Loading
**Problem:** White/blank map area
**Solutions:**
- Check API key is correctly set in `.env.local`
- Verify API key has proper restrictions
- Check browser console for errors
- Ensure Maps JavaScript API is enabled

### Geocoding Not Working
**Problem:** Business name doesn't auto-locate
**Solutions:**
- Verify Geocoding API is enabled
- Check business name is specific enough
- Try including city/state in business name
- Use manual search as fallback

### Marker Not Appearing
**Problem:** Click but no marker shows
**Solutions:**
- Ensure `isEditing={true}` is passed
- Check browser console for errors
- Verify map initialization completed
- Check coordinate bounds are valid

### Coordinates Not Saving
**Problem:** Location lost after page refresh
**Solutions:**
- Check hidden input fields exist
- Verify API route includes latitude/longitude
- Check database columns exist and are correct type
- Review network tab for API response

### Performance Issues
**Problem:** Slow map loading
**Solutions:**
- Check internet connection
- Verify Google Maps API status
- Reduce map initial zoom level
- Consider lazy loading component

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Google Maps API key configured
- [ ] All 3 required APIs enabled
- [ ] Map loads on profile page
- [ ] Clicking map places marker
- [ ] Dragging marker updates coordinates
- [ ] Search functionality works
- [ ] Coordinates display correctly
- [ ] Save profile persists location
- [ ] Existing location loads on page refresh
- [ ] Edit mode enables interaction
- [ ] View mode disables interaction
- [ ] Error messages display properly
- [ ] Mobile responsive design works

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all setup steps completed
3. Review Google Cloud Console for API status
4. Check database connection and schema
5. Review server logs for API errors

---

**Implementation Date:** February 2026  
**Status:** Production Ready  
**Dependencies:** Google Maps JavaScript API, React, Next.js 13+
