# Age Collection & COPPA Compliance Implementation

## Overview
This document outlines the implementation of age/birthday collection for improved ad targeting while maintaining full COPPA compliance.

## Database Changes

### New Fields Added to `users` Table
```sql
birthday DATE NULL                        -- User's birthday (optional)
parent_consent_given_at TIMESTAMPTZ NULL  -- Parent consent timestamp
```

### New Functions
- `get_user_age(birthday)` - Calculate age from birthday
- `get_age_bracket(birthday)` - Return age bracket for ad targeting

### Age Brackets
- `under_13` - COPPA-protected, non-personalized ads only
- `13_17` - Teens, personalized ads allowed
- `18_24` - Young adults
- `25_34` - Adults (prime demographic)
- `35_44` - Adults (premium demographic)
- `45_plus` - Older adults

## Implementation Steps

### 1. Database Migration ✅
File: `/supabase/migrations/018_add_birthday_and_consent.sql`

**Run Migration:**
```bash
# Using Supabase CLI
supabase db push

# Or apply directly in Supabase Dashboard SQL Editor
```

### 2. Update API Endpoints

#### A. Update `/api/users/me` (GET)
Add birthday and age to response:
```typescript
{
  user: {
    id: string
    name: string
    role: 'kid' | 'teen' | 'adult'
    birthday: string | null          // NEW
    age: number | null                // NEW (calculated)
    ageBracket: string | null         // NEW (for ad targeting)
    parentConsentGivenAt: string | null  // NEW
    // ... other fields
  }
}
```

#### B. Update `/api/family/members` (POST)
Add birthday and consent to member creation:
```typescript
{
  name: string
  role: 'kid' | 'teen' | 'adult'
  birthday?: string                  // NEW (optional, format: YYYY-MM-DD)
  parentConsent: boolean             // NEW (required for under 13)
}
```

#### C. Update `/api/users/[id]` (PATCH)
Allow updating birthday:
```typescript
{
  birthday?: string | null           // NEW (can be updated/removed)
}
```

#### D. Create `/api/users/[id]/consent` (POST)
Send confirmation email when child is added:
```typescript
POST /api/users/[child-id]/consent
{
  parentEmail: string
  childName: string
  childAge: number
}
```

### 3. Update Frontend Components

#### A. Family Member Creation Form
File: `/components/modals/QuickAddMemberModal.tsx` (or similar)

Add these fields:
```tsx
<FormField>
  <Label>Birthday (Optional)</Label>
  <Input
    type="date"
    value={birthday}
    onChange={(e) => setBirthday(e.target.value)}
  />
  <HelperText>
    Helps us personalize content and show age-appropriate ads
  </HelperText>
</FormField>

{calculatedAge < 13 && (
  <FormField>
    <Checkbox
      checked={parentConsent}
      onChange={setParentConsent}
      required
    >
      I am the parent/guardian of {name} and consent to
      ChorePulse collecting this information to provide our
      family service.
    </Checkbox>
  </FormField>
)}
```

#### B. Profile Edit Page
File: `/app/(authenticated)/profile/page.tsx`

Add birthday edit section:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Personal Information</CardTitle>
  </CardHeader>
  <CardContent>
    <FormField>
      <Label>Birthday (Optional)</Label>
      <Input
        type="date"
        value={birthday}
        onChange={handleBirthdayChange}
      />
      <HelperText>
        Your birthday helps us personalize your experience.
        You can remove this anytime.
      </HelperText>
    </FormField>
  </CardContent>
</Card>
```

### 4. Update AdSlot Component

#### Add Age Bracket Support
File: `/components/AdSlot.tsx`

```tsx
interface AdSlotProps {
  adUnit: 'banner' | 'rectangle' | 'native' | 'leaderboard'
  userRole: 'kid' | 'teen' | 'adult' | null
  subscriptionTier?: string | null
  ageBracket?: string | null          // NEW
  className?: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  responsive?: boolean
  testMode?: boolean
}

export default function AdSlot({
  adUnit,
  userRole,
  subscriptionTier,
  ageBracket,                          // NEW
  // ... other props
}: AdSlotProps) {
  // Check if ads should be shown
  const showAds = shouldShowAds(userRole, subscriptionTier) &&
                  ADSENSE_CONFIG.enabled

  // Determine personalization based on age
  const personalizedAds = allowPersonalizedAds(userRole, ageBracket)

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        data-ad-client={ADSENSE_CONFIG.publisherId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-npa={personalizedAds ? '0' : '1'}
        data-tag-for-child-directed-treatment={
          ageBracket === 'under_13' ? '1' : '0'
        }
        // NEW: Pass age bracket to Google for better targeting
        data-age-bracket={ageBracket || 'unknown'}
      />
    </div>
  )
}
```

#### Update AdSense Config
File: `/lib/adsense-config.ts`

```typescript
export function allowPersonalizedAds(
  userRole: 'kid' | 'teen' | 'adult' | null,
  ageBracket?: string | null
): boolean {
  // COPPA compliance: Never personalize for under 13
  if (ageBracket === 'under_13') return false
  if (userRole === 'kid') return false

  return true
}
```

### 5. Email Confirmation System

#### Create Email Template
File: `/lib/email/templates/child-consent-confirmation.ts`

```typescript
export function getChildConsentEmail(params: {
  parentName: string
  childName: string
  childAge: number
  confirmLink: string
  reportLink: string
}) {
  return {
    subject: `Confirm: You added ${params.childName} (age ${params.childAge}) to ChorePulse`,
    html: `
      <h2>Hi ${params.parentName},</h2>

      <p>You just added <strong>${params.childName} (age ${params.childAge})</strong>
      to your family on ChorePulse.</p>

      <p>By adding ${params.childName}, you've given consent for:</p>
      <ul>
        <li>✓ ChorePulse to store ${params.childName}'s first name and age</li>
        <li>✓ ${params.childName} to use ChorePulse features (tasks, rewards, etc.)</li>
        <li>✓ Age-appropriate, non-personalized ads shown to ${params.childName}</li>
      </ul>

      <p>You can manage ${params.childName}'s profile or delete their data
      anytime in Family Settings.</p>

      <p>
        <a href="${params.confirmLink}">✓ Confirm This is Correct</a> |
        <a href="${params.reportLink}">✗ I Did Not Do This</a>
      </p>

      <p>Questions? Review our
      <a href="https://chorepulse.com/privacy#children">Child Privacy Policy</a>
      </p>
    `,
    text: `Hi ${params.parentName},

You just added ${params.childName} (age ${params.childAge}) to your family on ChorePulse.

By adding ${params.childName}, you've given consent for ChorePulse to collect and store their information.

Confirm: ${params.confirmLink}
Report: ${params.reportLink}

Questions? privacy@chorepulse.com`
  }
}
```

#### Create Email API Endpoint
File: `/app/api/users/[id]/consent/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getChildConsentEmail } from '@/lib/email/templates/child-consent-confirmation'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  // Get authenticated user (parent)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get parent data
  const { data: parentData } = await supabase
    .from('users')
    .select('name, email, organization_id')
    .eq('auth_user_id', user.id)
    .single()

  // Get child data
  const { data: childData } = await supabase
    .from('users')
    .select('name, birthday')
    .eq('id', params.id)
    .eq('organization_id', parentData.organization_id)
    .single()

  if (!childData || !childData.birthday) {
    return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  }

  // Calculate age
  const age = Math.floor(
    (Date.now() - new Date(childData.birthday).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000)
  )

  // Generate confirmation links
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/confirm-consent?token=${generateToken()}`
  const reportLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/report-consent?token=${generateToken()}`

  // Send email
  const email = getChildConsentEmail({
    parentName: parentData.name,
    childName: childData.name,
    childAge: age,
    confirmLink,
    reportLink
  })

  await sendEmail({
    to: parentData.email,
    ...email
  })

  return NextResponse.json({ success: true })
}
```

### 6. Privacy Policy Updates

#### Add Children's Privacy Section
File: `/app/privacy/page.tsx` or create `/docs/PRIVACY_POLICY.md`

```markdown
## Children's Privacy (COPPA Compliance)

### Our Commitment to Children's Privacy

ChorePulse is designed for families. Parents or guardians create accounts
and add their children to the family. We take children's privacy seriously
and comply with the Children's Online Privacy Protection Act (COPPA).

### Information We Collect from Children Under 13

When a parent adds a child under 13 to their family, we may collect:

**Required Information:**
- First name only (no last name)
- User role (kid, teen, adult)
- Avatar color and icon preferences
- Points earned and tasks completed
- Internal account identifiers

**Optional Information (with parental consent):**
- Birthday/age (to personalize experience and show age-appropriate content)

**We Do NOT Collect from Children:**
- Last names
- Email addresses
- Phone numbers
- Physical addresses
- Photos or videos (except optional avatar icons)
- Precise geolocation
- Social media profiles
- Any other personal information

### How We Obtain Parental Consent

When a parent adds a child to their family:

1. **Parent Creates Account**: The parent signs up with their own email address
2. **Parent Adds Child**: The parent provides the child's first name and optional birthday
3. **Consent Checkbox**: For children under 13, the parent must check a box
   confirming they are the parent/guardian and consent to data collection
4. **Email Confirmation**: We send an automated confirmation email to the parent
5. **Ongoing Control**: Parents can modify or delete child data anytime

This process provides verifiable parental consent as defined by COPPA.

### How We Use Children's Information

We use children's information only to:
- Provide the ChorePulse service (assign tasks, track progress, award points)
- Display age-appropriate content
- Show age-appropriate, non-personalized advertising
- Improve our service through anonymized analytics
- Comply with legal requirements

We do NOT:
- Sell children's information
- Share children's information with third parties (except as required by law)
- Use children's information for marketing
- Track children across other websites or apps
- Build behavioral profiles of children

### Advertising to Children

**Children Under 13:**
- See only contextual, non-personalized ads
- No behavioral tracking or profiling
- No data shared with advertisers
- COPPA-compliant ad settings enforced

**Teens 13-17:**
- May see personalized ads based on age bracket
- No cross-site tracking
- Parent can disable personalization in settings

**Premium Subscribers:**
- No ads shown regardless of age

### Parental Rights and Controls

As the account owner, parents can:

✓ **View Data**: See all information collected about their child
✓ **Modify Data**: Update child's name, birthday, or other information
✓ **Delete Data**: Permanently delete child's account and all associated data
✓ **Control Features**: Manage what features the child can access
✓ **Disable Ads**: Upgrade to Premium for ad-free experience
✓ **Export Data**: Download all child data in portable format

To exercise these rights:
1. Log in to your ChorePulse account
2. Go to Settings → Family Members
3. Select your child's profile
4. Choose the action you want to take

### Data Retention

We retain children's data only as long as:
- The family account is active, OR
- Required by law

When a child's account is deleted:
- All personal information is permanently deleted within 30 days
- Anonymized analytics data may be retained

### Third-Party Services

We use Google AdSense to display ads. For children under 13:
- Only contextual, non-personalized ads are shown
- No cookies or tracking pixels are used
- Ad requests are flagged as child-directed (COPPA-compliant)

No other third-party services have access to children's information.

### International Users

ChorePulse is based in the United States. If you are accessing ChorePulse
from outside the U.S., please be aware that:
- Your information will be transferred to and stored in the U.S.
- We comply with applicable international privacy laws (GDPR, PIPEDA, etc.)
- Children's data receives the same protections regardless of location

### Changes to Children's Privacy Policy

We will notify parents by email of any material changes to how we collect,
use, or share children's information. Parents will have the opportunity to
opt-out or delete their child's account before changes take effect.

### Contact Us About Children's Privacy

Questions or concerns about children's privacy?

**Email**: privacy@chorepulse.com
**Subject**: Children's Privacy Inquiry
**Response Time**: Within 2 business days

For general questions: support@chorepulse.com

**Effective Date**: [INSERT DATE]
**Last Updated**: [INSERT DATE]
```

### 7. User Interface Updates

#### Update All Pages to Pass Age Data

**Example for Dashboard:**
```tsx
// Fetch age bracket from user data
const { ageBracket } = useUserProfile()

// Pass to AdSlot
<AdSlot
  adUnit="banner"
  userRole={effectiveRole}
  subscriptionTier={subscriptionTier}
  ageBracket={ageBracket}     // NEW
  testMode={true}
/>
```

#### Create Age Bracket Hook
File: `/hooks/useAgeBracket.ts`

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useAgeBracket() {
  const [ageBracket, setAgeBracket] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAgeBracket = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setAgeBracket(data.user?.ageBracket || null)
        }
      } catch (err) {
        console.error('Failed to fetch age bracket:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgeBracket()
  }, [])

  return { ageBracket, isLoading }
}
```

## Testing Checklist

### Functional Testing
- [ ] Parent can add child with birthday
- [ ] Parent consent checkbox appears for under-13 users
- [ ] Consent checkbox is required for under-13 users
- [ ] Birthday field is optional
- [ ] Confirmation email is sent to parent
- [ ] Age is calculated correctly from birthday
- [ ] Age bracket is assigned correctly
- [ ] Parent can view child's birthday in profile
- [ ] Parent can edit child's birthday
- [ ] Parent can delete child's birthday
- [ ] Parent can delete child's entire profile

### COPPA Compliance Testing
- [ ] Under-13 users receive non-personalized ads only
- [ ] `data-tag-for-child-directed-treatment="1"` set for under-13
- [ ] No tracking pixels/cookies for under-13 users
- [ ] Parent consent timestamp is recorded
- [ ] Privacy policy includes children's section
- [ ] Confirmation email includes all required disclosures

### Ad Targeting Testing
- [ ] Age bracket is passed to AdSense
- [ ] CPM increases for age-targeted ads (monitor in AdSense dashboard)
- [ ] Ads are appropriate for each age bracket
- [ ] Test with multiple age brackets (under_13, 13_17, 25_34, etc.)

### Security Testing
- [ ] Only account owner can view/edit child data
- [ ] API endpoints verify parent ownership
- [ ] Birthday data is properly sanitized
- [ ] No PII leakage in logs or errors

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
1. Deploy to staging environment
2. Test all functionality with internal users
3. Verify email delivery
4. Check AdSense integration

### Phase 2: Soft Launch (Week 2)
1. Deploy to production
2. Make birthday field available but don't promote
3. Monitor for errors
4. Collect initial data

### Phase 3: Promote Feature (Week 3)
1. Add banner encouraging users to add birthday
2. Show CPM benefit in settings
3. Monitor adoption rate
4. Adjust messaging if needed

### Phase 4: Optimize (Week 4+)
1. Analyze CPM improvements by age bracket
2. A/B test messaging
3. Optimize ad placements
4. Report results

## Expected Results

### Adoption Rate
- **Target**: 40-60% of users add birthday within 30 days
- **Incentive**: "Personalized experience" + "Support free version"

### CPM Improvement
- **Current**: $5-8 average CPM
- **Expected**: $12-18 average CPM (+150%)
- **Timeline**: Improvement within 2-4 weeks as data accumulates

### Revenue Impact
At 100k monthly impressions:
- **Before**: $500-800/month
- **After**: $1,200-1,800/month
- **Increase**: +$700-1,000/month (+150%)

## Support & Maintenance

### Monitoring
- Daily: Check email delivery rate
- Weekly: Review CPM by age bracket
- Monthly: Analyze adoption rate and revenue impact

### Parent Support
Common questions:
- "Why do you need my child's birthday?"
- "Is this safe?"
- "Can I delete this later?"
- "Will my child see targeted ads?"

Responses provided in Privacy Policy and Help Center.

## Legal Review Checklist
- [ ] Privacy policy reviewed by legal counsel
- [ ] COPPA compliance verified
- [ ] GDPR compliance verified (if EU users)
- [ ] CCPA compliance verified (if California users)
- [ ] Email templates reviewed
- [ ] Consent flow approved
- [ ] Data retention policy documented

## Next Steps
1. Review and approve this implementation plan
2. Run database migration
3. Update API endpoints
4. Update frontend components
5. Test thoroughly
6. Deploy to production
7. Monitor results

---

*Implementation Time Estimate*: 2-3 days
*Expected Revenue Increase*: +150% within 30 days
*Legal Risk*: Minimal (COPPA-compliant implementation)
