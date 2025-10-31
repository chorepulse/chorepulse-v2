# Address Collection & Geographic Targeting Implementation

## Overview

Implement address collection during onboarding to enable:
1. **Geographic ad targeting** → +30-50% CPM increase
2. **Auto-populated weather widget** → Better UX
3. **Location-based chore recommendations** → Personalized experience
4. **Future: Property data integration** → Automated home details

**Combined Revenue Impact:** With age + geographic targeting, expect **60-100% total CPM increase**

---

## Phase 1: Free Address Collection (Current Implementation)

### Technology Stack
- **Google Places Autocomplete API** - Address validation and autocomplete
- **Free Tier:** $200/month credit covers ~40,000+ sessions
- **What we get:** Full address, lat/long, formatted address, place ID

### Database Changes

**Migration:** `019_add_address_fields.sql`

**Fields Added to `organizations` table:**
```sql
address_line1      VARCHAR(255)    -- Street address
address_line2      VARCHAR(255)    -- Apt/Suite (optional)
city               VARCHAR(100)    -- City name
state              VARCHAR(50)     -- State/Province
zip_code           VARCHAR(10)     -- ZIP/Postal code
country            VARCHAR(50)     -- Default: 'United States'
latitude           DECIMAL(10, 8)  -- For weather API
longitude          DECIMAL(11, 8)  -- For weather API
google_place_id    VARCHAR(255)    -- Google Places reference
address_formatted  TEXT            -- Full formatted address
```

### Implementation Steps

#### 1. Database Migration ✅
- [x] Created migration 019
- [ ] Run migration in Supabase dashboard
- [ ] Verify columns exist

#### 2. Google Places API Setup
- [ ] Create/enable Google Cloud project
- [ ] Enable Places API (new)
- [ ] Get API key
- [ ] Add to `.env.local`:
  ```bash
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
  ```
- [ ] Restrict API key to:
  - Places API
  - Your domain (chorepulse.com)
  - Localhost for development

#### 3. Frontend Components

**Create:** `/components/AddressAutocomplete.tsx`
- Google Places Autocomplete input
- Returns structured address data
- Handles errors gracefully
- Mobile-friendly

**Update:** `/app/(authenticated)/profile/page.tsx`
- Add address section
- Use AddressAutocomplete component
- Save to organization (not user)

#### 4. API Endpoints

**Update:** `/app/api/organizations/route.ts` or create `/app/api/organizations/[id]/route.ts`
- GET: Return organization with address
- PATCH: Update organization address
- Permission: Only account owners can update

#### 5. Weather Widget Integration

**Update:** `/app/(authenticated)/hub/display/page.tsx`
- Use organization's lat/long instead of ZIP
- Fallback to ZIP if lat/long not available
- Remove manual ZIP entry requirement

#### 6. Ad Targeting

**Update:** `/components/AdSlot.tsx`
- Add `location` prop with city/state
- Pass to ad data attributes
- Ad networks will use for targeting

**Update all pages:**
- Fetch organization data
- Pass location to AdSlot components

---

## Phase 2: Property Data Integration (Future)

### Recommended API: Homesage.ai

**Why Homesage.ai:**
- ✅ 500 free API credits for testing
- ✅ Includes: beds, baths, sqft, property type, year built
- ✅ AI-powered data validation
- ✅ Simple REST API
- ✅ Easy to upgrade if we need more

**Alternative:** ATTOM Data API (30-day free trial, more comprehensive but expensive)

### Property Fields to Add (Phase 2)

Add to `organizations` table:
```sql
bedrooms           INTEGER         -- Number of bedrooms
bathrooms          DECIMAL(3,1)    -- Number of bathrooms (e.g., 2.5)
square_feet        INTEGER         -- Total square footage
property_type      VARCHAR(50)     -- Single family, condo, townhouse, etc.
year_built         INTEGER         -- Year property was built
lot_size_sqft      INTEGER         -- Lot size in square feet
property_value     INTEGER         -- Estimated value (optional)
```

### Use Cases for Property Data

1. **Chore Recommendations**
   - More bedrooms → More bedroom cleaning tasks
   - More bathrooms → More bathroom cleaning tasks
   - Larger home → Suggest vacuuming, mopping
   - Older home → Maintenance tasks

2. **Ad Targeting**
   - Larger homes → Home improvement ads (higher CPM)
   - Property type → Relevant product ads
   - Year built → Renovation/upgrade ads

3. **User Experience**
   - Pre-populate home details
   - Skip manual entry
   - Faster onboarding

---

## Implementation Timeline

### Week 1: Database & API Setup
- [ ] Day 1: Run migration 019
- [ ] Day 1: Set up Google Places API
- [ ] Day 2: Create API endpoints for organization updates
- [ ] Day 3: Test API endpoints

### Week 2: Frontend Components
- [ ] Day 4-5: Build AddressAutocomplete component
- [ ] Day 6: Add address to Profile page
- [ ] Day 7: Test address collection flow

### Week 3: Integration
- [ ] Day 8: Update weather widget
- [ ] Day 9: Add geographic targeting to ads
- [ ] Day 10: Update all pages with location data

### Week 4: Testing & Deployment
- [ ] Day 11-12: End-to-end testing
- [ ] Day 13: Deploy to production
- [ ] Day 14: Monitor CPM improvements

---

## Privacy & Compliance

### COPPA Compliance
- ✅ Address is tied to organization, not individual children
- ✅ Only account owners can update (adults)
- ✅ Already covered by existing privacy policy

### Privacy Policy Updates
Add to `/PRIVACY_POLICY.md` and `/app/(authenticated)/privacy/page.tsx`:

**Information We Collect:**
- Home address (optional, for weather and personalized recommendations)
- Geographic coordinates (latitude/longitude for location-based features)
- In the future: Property details (bedrooms, bathrooms, home type) to suggest relevant chores

**How We Use It:**
- Display weather information
- Provide location-appropriate chore recommendations
- Deliver more relevant advertisements (geographic targeting)
- Improve user experience with personalized features

**Third-Party Services:**
- Google Places API (for address validation)
- Weather API (using coordinates)
- Ad networks (city/state level only, not full address)

---

## Testing Checklist

### Database
- [ ] Migration 019 runs successfully
- [ ] All columns exist with correct types
- [ ] Indexes created properly

### API
- [ ] Can fetch organization with address
- [ ] Account owner can update address
- [ ] Non-account-owner cannot update address
- [ ] Address validation works

### Frontend
- [ ] Address autocomplete loads
- [ ] Can select address from dropdown
- [ ] Address saves successfully
- [ ] Address displays on profile
- [ ] Mobile-friendly input

### Weather Integration
- [ ] Weather widget uses stored address
- [ ] Falls back to ZIP if no lat/long
- [ ] Displays correct location

### Ad Targeting
- [ ] Location data passed to AdSlot
- [ ] Data attributes set correctly
- [ ] Ads display properly

---

## Expected Results

### CPM Improvements

**Current (Age Only):**
- Age 25-34: $12-20 CPM
- Age 35-44: $15-25 CPM

**After Geographic Targeting:**
- Age 25-34 + Major Metro: $16-30 CPM (+33%)
- Age 35-44 + Suburban: $20-37 CPM (+33%)

**Combined Impact:**
- Baseline CPM: $8 (no targeting)
- Age targeting: +50-150% → $12-20
- + Geographic: +30-50% → $16-30
- **Total increase: +100-275%**

### Revenue Projection

**Before:**
- Monthly ad revenue: $500-800

**After (Conservative):**
- Monthly ad revenue: $1,000-1,500
- **Increase: +60-100%**

**After (Optimistic):**
- Monthly ad revenue: $1,500-2,200
- **Increase: +150-200%**

---

## API Costs

### Google Places Autocomplete
- **Free tier:** $200/month credit
- **Cost per session:** ~$0.017
- **Monthly allowance:** ~11,700 sessions
- **Expected usage:**
  - 100 new accounts/month = 100 sessions
  - 50 address updates/month = 50 sessions
  - **Total:** ~150 sessions/month
  - **Cost:** $2.55/month → **Covered by free tier**

### Weather API (OpenWeatherMap)
- **Current:** Using ZIP code
- **After:** Using lat/long
- **Cost:** Same (no change)

### Phase 2: Property Data API

**Homesage.ai:**
- Free: 500 credits (one-time)
- Paid: Contact for pricing
- **Expected usage:** 100 accounts/month
- **Strategy:** Use free tier for testing, evaluate ROI before paying

**ATTOM Data API:**
- 30-day free trial
- Pay-per-use after trial
- **Strategy:** Trial if Homesage doesn't work out

---

## Monitoring Metrics

### Track These KPIs:

1. **Address Collection Rate**
   - % of accounts with address
   - Target: 60%+ after 3 months

2. **CPM by Geographic Segment**
   - Major metros vs suburbs vs rural
   - Compare to baseline

3. **Weather Widget Usage**
   - Before: Manual ZIP entry required
   - After: Auto-populated
   - Target: 80%+ accuracy

4. **Ad Revenue**
   - Weekly CPM averages
   - Total monthly revenue
   - Target: +60% within 2 months

5. **API Costs**
   - Google Places usage
   - Stay under free tier

---

## Next Steps

1. **Run Migration 019** in Supabase dashboard
2. **Set up Google Places API** (get API key)
3. **Build AddressAutocomplete component**
4. **Update Profile page** with address section
5. **Test end-to-end flow**
6. **Deploy and monitor CPM improvements**

After Phase 1 is deployed and showing results, evaluate Phase 2 (property data) ROI.

---

## Questions?

- Technical issues: Check this doc's troubleshooting section
- API questions: See Google Places API docs
- Privacy concerns: Update privacy policy as noted above
- Revenue tracking: Set up analytics dashboard to monitor CPMs

**Let's start with running Migration 019 and setting up the Google Places API!**
