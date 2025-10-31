# Google AdSense Implementation Guide

## Overview

Google AdSense has been integrated into ChorePulse with full COPPA compliance for child users.

### Features:
✅ Role-based ad serving (kids get non-personalized ads only)
✅ COPPA compliant for users under 13
✅ Easy enable/disable via environment variables
✅ Test mode for development
✅ Optimized placements for maximum revenue

---

## Setup Instructions

### Step 1: Sign Up for Google AdSense

1. Go to https://www.google.com/adsense
2. Sign in with your Google account
3. Complete the application process
4. Wait for approval (usually 1-2 days)

### Step 2: Get Your Publisher ID

1. Once approved, log into AdSense dashboard
2. Go to **Account** → **Account Information**
3. Copy your **Publisher ID** (format: `ca-pub-XXXXXXXXXXXXXXXX`)

### Step 3: Create Ad Units

Create the following ad units in your AdSense dashboard:

1. **Banner Ad** (728x90 desktop, 320x50 mobile)
   - Ad type: Display ads
   - Name: "ChorePulse Banner"
   - Size: Responsive

2. **Rectangle Ad** (300x250)
   - Ad type: Display ads
   - Name: "ChorePulse Rectangle"
   - Size: Responsive

3. **Native Ad** (Blends with content)
   - Ad type: In-feed ads
   - Name: "ChorePulse Native"
   - Style: Match your site design

4. **Interstitial Ad** (Full-page overlay)
   - Ad type: Interstitial ads
   - Name: "ChorePulse Interstitial"

5. **Leaderboard Ad** (728x90)
   - Ad type: Display ads
   - Name: "ChorePulse Leaderboard"
   - Size: 728x90

For each ad unit, copy the **Ad Slot ID** (10-digit number).

### Step 4: Configure Environment Variables

Create or update your `.env.local` file:

\`\`\`bash
# Google AdSense Configuration
NEXT_PUBLIC_ADSENSE_ENABLED=true
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX

# Ad Unit IDs (replace with your actual slot IDs)
NEXT_PUBLIC_ADSENSE_BANNER_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_RECTANGLE_SLOT=1234567891
NEXT_PUBLIC_ADSENSE_NATIVE_SLOT=1234567892
NEXT_PUBLIC_ADSENSE_INTERSTITIAL_SLOT=1234567893
NEXT_PUBLIC_ADSENSE_LEADERBOARD_SLOT=1234567894
\`\`\`

### Step 5: Test in Development

To test ads in development mode without showing real ads:

\`\`\`tsx
<AdSlot
  adUnit="banner"
  userRole={userRole}
  testMode={true}  // Shows placeholder instead of real ad
/>
\`\`\`

### Step 6: Deploy and Verify

1. Deploy your app to production
2. Wait 24-48 hours for AdSense to start serving ads
3. Check AdSense dashboard for impressions and earnings

---

## Ad Placements

### Recommended Placements (in priority order):

#### 1. **Rewards Page** (HIGHEST PRIORITY)
Why: Users are in "browsing/shopping" mode

**Implementation:**
\`\`\`tsx
import AdSlot from '@/components/AdSlot'

// At the top of the rewards grid
<AdSlot
  adUnit="banner"
  userRole={userRole}
  className="mb-6"
/>

// Native ads mixed into reward grid (every 6 items)
{rewards.map((reward, index) => (
  <React.Fragment key={reward.id}>
    <RewardCard reward={reward} />

    {/* Show ad every 6 items */}
    {(index + 1) % 6 === 0 && index < rewards.length - 1 && (
      <AdSlot
        adUnit="native"
        userRole={userRole}
        className="col-span-full my-4"
      />
    )}
  </React.Fragment>
))}
\`\`\`

#### 2. **Leaderboard Page** (Teens/Adults only)
Why: High view frequency

**Implementation:**
\`\`\`tsx
// At the bottom of the leaderboard
{userRole !== 'kid' && (
  <AdSlot
    adUnit="banner"
    userRole={userRole}
    className="mt-6"
  />
)}
\`\`\`

#### 3. **Badges/Achievements Page**
Why: Celebratory content, good engagement

**Implementation:**
\`\`\`tsx
// Between achievement sections
<AdSlot
  adUnit="banner"
  userRole={userRole}
  className="my-6"
/>
\`\`\`

#### 4. **Dashboard - Interstitial** (Use sparingly!)
Why: High engagement, but don't annoy users

**Implementation:**
\`\`\`tsx
// Show after 5 task completions
const [completionCount, setCompletionCount] = useState(0)
const [showInterstitial, setShowInterstitial] = useState(false)

// In task completion handler:
if (completionCount >= 5) {
  setShowInterstitial(true)
  setCompletionCount(0)
}

// Render interstitial modal
{showInterstitial && (
  <Modal isOpen={true} onClose={() => setShowInterstitial(false)}>
    <AdSlot
      adUnit="interstitial"
      userRole={userRole}
    />
  </Modal>
)}
\`\`\`

---

## COPPA Compliance

### Automatic Compliance by Role:

- **Kids (under 13):**
  - ✅ Non-personalized ads only
  - ✅ `data-npa="1"` (non-personalized ads)
  - ✅ `data-tag-for-child-directed-treatment="1"`
  - ✅ No behavioral targeting
  - ✅ Contextual ads based on page content only

- **Teens/Adults (13+):**
  - ✅ Personalized ads allowed
  - ✅ Standard AdSense targeting
  - ✅ Better CPMs and revenue

### How It Works:

The `AdSlot` component automatically applies COPPA-compliant settings based on `userRole`:

\`\`\`tsx
<AdSlot
  adUnit="banner"
  userRole="kid"  // Automatically applies COPPA settings
/>
\`\`\`

---

## Revenue Expectations

### With 50,000 Monthly Pageviews:

**Kids Section (Contextual Ads):**
- CPM: $2-5
- Monthly Revenue: $50-125

**Teens/Adults Section (Personalized Ads):**
- CPM: $5-12
- Monthly Revenue: $125-300

**Rewards Page (Shopping Intent):**
- CPM: $8-15
- Monthly Revenue: $200-375

**Total Estimated Revenue: $375-800/month**

### With 100,000 Monthly Pageviews:

**Total Estimated Revenue: $750-1,600/month**

### After Adding Recipes (Future):

Recipe pages typically earn $15-30 CPM, significantly boosting revenue.

---

## Testing Checklist

Before launching ads:

- [ ] AdSense account approved
- [ ] Publisher ID added to `.env.local`
- [ ] All ad slot IDs configured
- [ ] Test mode works (shows placeholders)
- [ ] Kid accounts show non-personalized ads
- [ ] Teen/Adult accounts show personalized ads
- [ ] Ads don't break responsive layout
- [ ] Ads load without console errors
- [ ] AdSense verification complete (24-48 hours after deploy)

---

## Troubleshooting

### Ads Not Showing?

1. **Check environment variables** - Make sure `NEXT_PUBLIC_ADSENSE_ENABLED=true`
2. **Wait 24-48 hours** - AdSense needs time to verify your site
3. **Check browser console** - Look for AdSense errors
4. **Verify ad blockers** - Disable ad blockers for testing
5. **Check slot IDs** - Make sure they match your AdSense dashboard

### Blank Spaces Where Ads Should Be?

- This is normal during development
- AdSense may not have ads to serve yet
- Try testing with `testMode={true}` to see placeholders

### COPPA Compliance Concerns?

- Kid accounts automatically get `data-npa="1"` and `data-tag-for-child-directed-treatment="1"`
- Check the AdSlot component implementation to verify
- Use your browser's dev tools to inspect the `<ins>` tag and verify these attributes

---

## Next Steps

1. Complete AdSense application
2. Get publisher ID and ad slot IDs
3. Update `.env.local` with your IDs
4. Add AdSlot components to recommended pages
5. Deploy and wait for ads to start showing
6. Monitor AdSense dashboard for revenue

---

## Files Reference

- **Configuration**: `/lib/adsense-config.ts`
- **Ad Component**: `/components/AdSlot.tsx`
- **Layout (AdSense script)**: `/app/layout.tsx`
- **This Guide**: `/ADSENSE_SETUP.md`

For questions, consult the [AdSense Help Center](https://support.google.com/adsense).
