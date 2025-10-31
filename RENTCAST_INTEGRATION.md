# RentCast Property Data Integration

## Overview
Complete integration with RentCast API to automatically fetch property details (bedrooms, bathrooms, square footage, etc.) based on user's home address. This enables:
1. Personalized chore suggestions based on home size
2. Enhanced ad targeting with property demographics
3. Better user experience with automatic home profile

## Files Created/Modified

### 1. Environment Variables
**File:** `.env.local`
- Added `RENTCAST_API_KEY=e4d0a3b276e949afa240e8a479f42805`
- **IMPORTANT:** Also add this to Vercel production environment variables

### 2. Database Migration
**File:** `supabase/migrations/020_add_property_data_fields.sql`

**New columns added to `organizations` table:**
- `bedrooms` (INTEGER) - Number of bedrooms
- `bathrooms` (DECIMAL(3,1)) - Number of bathrooms (supports 2.5, 3.5, etc.)
- `square_feet` (INTEGER) - Living area in square feet
- `lot_size_sqft` (INTEGER) - Total lot size in square feet
- `property_type` (VARCHAR(50)) - Single Family, Condo, Townhouse, etc.
- `year_built` (INTEGER) - Year property was constructed
- `property_value` (DECIMAL(12,2)) - Estimated market value
- `last_sale_price` (DECIMAL(12,2)) - Last sale price
- `last_sale_date` (DATE) - Date of last sale
- `owner_occupied` (BOOLEAN) - Whether property is owner-occupied
- `property_data_fetched_at` (TIMESTAMP) - When data was last fetched (for cache refresh)
- `rentcast_property_id` (VARCHAR(100)) - RentCast's property ID for reference

**Indexes added:**
- `idx_organizations_property_type` - For filtering by property type
- `idx_organizations_bedrooms` - For filtering by bedroom count
- `idx_organizations_bathrooms` - For filtering by bathroom count

**STATUS:** Migration file created, needs to be run in Supabase SQL Editor

### 3. RentCast API Integration Endpoint
**File:** `app/api/property/lookup/route.ts`

**Endpoint:** `POST /api/property/lookup`

**Purpose:** Fetches property data from RentCast API and stores it in the organization record

**Request Body:**
```json
{
  "address": "Full address string",
  // OR
  "addressLine1": "123 Main St",
  "city": "Austin",
  "state": "TX",
  "zipCode": "78701"
}
```

**Response:**
```json
{
  "success": true,
  "property": {
    "bedrooms": 3,
    "bathrooms": 2.5,
    "squareFeet": 1800,
    "lotSizeSqft": 7200,
    "propertyType": "Single Family",
    "yearBuilt": 2010,
    "propertyValue": 450000,
    "lastSalePrice": 420000,
    "lastSaleDate": "2020-05-15",
    "ownerOccupied": true,
    "rentcastPropertyId": "abc123",
    "propertyDataFetchedAt": "2025-10-27T..."
  },
  "message": "Property data fetched and saved successfully"
}
```

**Error Handling:**
- 401: Unauthorized (not logged in)
- 403: Only account owners can fetch property data
- 404: Property not found (new construction or rural property)
- 500: Internal server error or RentCast API failure

**Security:**
- Only `account_owner` role can fetch property data
- Uses server-side API key (not exposed to client)
- Validates complete address before making API call

### 4. Organization API Updates
**File:** `app/api/organizations/current/route.ts`

**Changes:** Added property data fields to GET response:
```typescript
// Property data
bedrooms: organization.bedrooms,
bathrooms: organization.bathrooms,
squareFeet: organization.square_feet,
lotSizeSqft: organization.lot_size_sqft,
propertyType: organization.property_type,
yearBuilt: organization.year_built,
propertyValue: organization.property_value,
lastSalePrice: organization.last_sale_price,
lastSaleDate: organization.last_sale_date,
ownerOccupied: organization.owner_occupied,
propertyDataFetchedAt: organization.property_data_fetched_at
```

### 5. Settings Page UI
**File:** `app/(authenticated)/settings/page.tsx`

**Changes:**

1. **Added property data to state:**
```typescript
const [orgSettings, setOrgSettings] = useState({
  // ... existing fields
  bedrooms: null,
  bathrooms: null,
  squareFeet: null,
  lotSizeSqft: null,
  propertyType: '',
  yearBuilt: null,
  propertyValue: null,
  propertyDataFetchedAt: null
})

const [isFetchingProperty, setIsFetchingProperty] = useState(false)
```

2. **Added `handleFetchPropertyData` function:**
- Validates address is complete
- Calls `/api/property/lookup` endpoint
- Refreshes organization data after fetch
- Shows toast notifications for success/error

3. **Added Property Details UI section:**
- Shows "Fetch Property Data" button when address is complete but no property data exists
- Displays property data in a grid layout once fetched
- Shows last updated timestamp
- "Refresh Data" button to update existing data
- Conditional rendering based on whether data exists

**UI Features:**
- Visual feedback during API call (button shows "Fetching...")
- Yellow info box prompting user to fetch data (if not yet fetched)
- Grid of property stats with nice styling
- Last updated timestamp for transparency
- Free tier reminder (50 lookups/month)

## Usage Flow

1. **User enters address in Settings > Organization tab**
   - Street Address
   - City, State, ZIP

2. **User saves address**
   - Address is stored in organizations table
   - Geographic targeting activates for ads

3. **Property Details section appears**
   - Yellow info box prompts user to fetch property data
   - "Fetch Property Data" button is visible

4. **User clicks "Fetch Property Data"**
   - API calls RentCast with address
   - Property details are fetched and saved
   - UI updates to show property stats

5. **Property data is displayed**
   - Bedrooms, bathrooms, square feet, property type
   - Year built, lot size (if available)
   - Last updated timestamp
   - "Refresh Data" button to update

## RentCast API Details

**API Endpoint:** `https://api.rentcast.io/v1/properties`
**Authentication:** X-Api-Key header
**Free Tier:** 50 calls/month
**Documentation:** https://developers.rentcast.io/reference/properties

**Example Request:**
```bash
curl "https://api.rentcast.io/v1/properties?address=123%20Main%20St%2C%20Austin%2C%20TX%2078701" \
  -H "X-Api-Key: YOUR_API_KEY"
```

**Example Response:**
```json
{
  "id": "property123",
  "bedrooms": 3,
  "bathrooms": 2.5,
  "squareFootage": 1800,
  "lotSize": 7200,
  "propertyType": "Single Family",
  "yearBuilt": 2010,
  "value": 450000,
  "lastSalePrice": 420000,
  "lastSaleDate": "2020-05-15",
  "ownerOccupied": true
}
```

## Caching Strategy

**Current Implementation:**
- Property data is stored in database permanently
- `property_data_fetched_at` timestamp tracks when data was last updated
- Users can manually refresh data using "Refresh Data" button

**Future Enhancement:**
- Could auto-refresh data every 90-180 days
- Could implement background job to refresh stale data
- Cache reduces API calls and costs

## Expected Impact

### 1. Personalized Chore Suggestions
- Can suggest more/fewer chores based on home size
- Tailor chore difficulty to property type (apartment vs. house)
- Age-appropriate chores based on property complexity

### 2. Enhanced Ad Targeting
With property data, ad targeting becomes more precise:

**Current (with geographic only):**
- Location: Austin, TX
- Age: 35-44
- CPM: ~$22

**Enhanced (with property data):**
- Location: Austin, TX
- Age: 35-44
- Property: Single Family, 3BR, $450K
- CPM: **~$28-35** (+27-59%)

**Why it matters:**
- Ad networks value homeowner demographics
- Property value indicates purchasing power
- More relevant ads = higher engagement = higher CPM

### 3. Revenue Projection

**Before (Age + Location only):**
- CPM: $16-22
- Monthly: $800-1,200

**After (Age + Location + Property):**
- CPM: $22-35
- Monthly: **$1,200-1,800** (+50%)

**Conservative increase:** +$400-600/month

## Testing Checklist

Before marking complete, test:

1. **Database Migration**
   - [ ] Run migration 020 in Supabase SQL Editor
   - [ ] Verify columns added to organizations table
   - [ ] Check indexes created successfully

2. **API Integration**
   - [ ] Test `/api/property/lookup` with valid address
   - [ ] Verify property data saved to database
   - [ ] Test error handling (invalid address, API failure)
   - [ ] Confirm only account owners can fetch data

3. **Settings UI**
   - [ ] Enter address and save
   - [ ] Verify Property Details section appears
   - [ ] Click "Fetch Property Data" button
   - [ ] Verify property data displays correctly
   - [ ] Test "Refresh Data" button
   - [ ] Check loading states and error handling

4. **Organization API**
   - [ ] Verify `/api/organizations/current` returns property data
   - [ ] Check data format matches TypeScript types

## Next Steps (Future Enhancements)

### Phase 2: Chore Personalization
1. Update task suggestion algorithm to consider:
   - Home size (sqft) → more/fewer tasks
   - Property type → different task categories
   - Yard size (lot) → outdoor chore suggestions

2. Create property-based task templates:
   - "Apartment" bundle (no yard work)
   - "Large home" bundle (extra cleaning tasks)
   - "New construction" bundle (different maintenance)

### Phase 3: Advanced Ad Targeting
1. Pass property data to AdSlot component:
   ```tsx
   <AdSlot
     location="Austin, TX"
     ageBracket="25-34"
     propertyValue={450000}
     propertyType="Single Family"
   />
   ```

2. Add data attributes for ad networks:
   ```html
   <div
     data-location="Austin, TX"
     data-property-value="450000"
     data-property-type="single-family"
   >
   ```

### Phase 4: API Upgrade (if needed)
- Monitor free tier usage (50 calls/month)
- Upgrade to paid tier if exceeding limit (~$25-50/month)
- Consider alternative APIs if cost becomes issue

## Documentation Links

- RentCast API Docs: https://developers.rentcast.io/
- Property Data Comparison: `/docs/Home-info-databases-comparison.md`
- Geographic Targeting Progress: `/GEOGRAPHIC_TARGETING_PROGRESS.md`

## Support

If issues arise:
1. Check RentCast API key is set in environment variables
2. Verify migration 020 has been run
3. Check Supabase logs for database errors
4. Review browser console for API errors
5. Test with known valid addresses first

## Summary

✅ **Completed:**
- RentCast API key stored
- Database migration created
- Property lookup API endpoint created
- Organization API updated
- Settings page UI enhanced

⏳ **Remaining:**
- Run migration 020 in Supabase
- Test complete integration
- Add to production environment variables

🎯 **Expected Result:**
- Users can fetch property details with one click
- Property data stored permanently in database
- Enhanced ad targeting capabilities unlocked
- Foundation for personalized chore suggestions
- Potential +$400-600/month revenue increase
