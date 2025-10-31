# ChorePulse v2 - Pricing Structure

**Last Updated:** 2025-10-22
**Status:** Final Design

---

## Overview

ChorePulse uses a **feature-flag-based** pricing system that allows Platform Admins to centrally manage features and tier limits without code changes. All pricing tiers are managed through the `plan_features` table, making it easy to:

- Add new features
- Adjust tier limits
- Create promotional tiers
- A/B test feature access
- Instantly apply changes across all users

---

## Pricing Tiers

### 1. Pulse Starter (Free with Ads)

**Price:** $0/month

**Features:**
- 30 active tasks maximum
- 15 active rewards maximum
- 0 AI prompts per month (logic-based suggestions only)
- Ads displayed (COPPA-compliant for minors)
- Basic task scheduling
- Points & leaderboard
- **Calendar 1-way import** (Google, Outlook, iCal)
- Photo proof for tasks
- Family hub display
- Unlimited family members
- Basic achievements

**Ad Details:**
- NO ads for kids under 13 (COPPA compliance)
- COPPA-compliant ads for teens 13-17
- Standard ads for adults 18+
- Moderate frequency (not intrusive)
- AdMob + AdSense hybrid

**Use Case:** Families trying out the platform or with simple needs

---

### 2. Pulse Premium

**Pricing:**
- **Monthly:** $4.99/month
- **Annual:** $39.99/year (33% discount - save $19.89)

**Features:**
- 100 active tasks maximum
- 50 active rewards maximum
- 50 AI prompts per month (~$0.10/user/month cost)
- No ads
- Advanced task scheduling
- Task rotation pools
- Extra credit tasks
- Points & leaderboard
- **Calendar 1-way import** (Google, Outlook, iCal)
- Photo proof for tasks
- Family hub display
- Unlimited family members
- Advanced achievements
- Family message board
- Streak tracking with grace period

**AI Prompt Details:**
- 5-minute conversation = 1 prompt
- Shared across organization (not per user)
- Resets monthly
- Overage: Falls back to logic-based suggestions

**Use Case:** Active families wanting AI assistance without ads

---

### 3. Unlimited Pulse

**Pricing:**
- **Monthly:** $9.99/month
- **Annual:** $69.99/year (42% discount - save $49.89)

**Features:**
- Unlimited active tasks
- Unlimited active rewards
- 200 AI prompts per month (~$0.40/user/month cost)
- No ads
- All Pulse Premium features, plus:
  - **Calendar 1-way import** (Google, Outlook, iCal)
  - Meal planning (Phase 2)
  - Recipe library (Phase 2)
  - Smart shopping lists (Phase 2)
  - Priority support
  - Early access to new features
  - Custom achievement badges

**AI Prompt Details:**
- 5-minute conversation = 1 prompt
- Shared across organization (not per user)
- Resets monthly
- Overage: Falls back to logic-based suggestions

**Use Case:** Power users with complex family coordination needs

---

## Annual Discount Strategy

- **Pulse Premium Annual:** 33% discount ($39.99 vs $59.88)
- **Unlimited Pulse Annual:** 42% discount ($69.99 vs $119.88)

Rationale:
- Encourages annual commitments (reduces churn)
- Provides significant value for committed users
- Aligns with competitor pricing (Cozi at $29.99/year)

---

## Free Trial

**Duration:** 14 days

**Trial Tier:** Full access to tier being trialed (Premium or Unlimited)

**Credit Card Requirement:** Yes - required upfront

**Trial Behavior:**
- Email notifications: Days 1, 3, 7, 10, 13, 15
- Cancel during trial = immediate feature loss (downgrade to Pulse Starter)
- Auto-conversion to paid at end of trial if not canceled

**Rationale:**
- Credit card upfront reduces fraud
- Increases conversion rate (higher friction to cancel)
- Allows immediate billing on day 15

---

## Feature Flag System

### Architecture

All features are managed through two database tables:

**1. `features` table:**
```sql
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  feature_type TEXT CHECK (feature_type IN ('limit', 'access', 'toggle')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. `plan_features` table:**
```sql
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('pulse_starter', 'pulse_premium', 'unlimited_pulse')),
  access_level TEXT NOT NULL DEFAULT 'none' CHECK (access_level IN ('none', 'preview', 'basic', 'full')),
  limit_value INTEGER,
  config_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_id, plan_tier)
);
```

### Feature Types

1. **Limit Features:** Numeric limits (e.g., max tasks, max rewards, AI prompts)
2. **Access Features:** Access levels (none, preview, basic, full)
3. **Toggle Features:** On/off features (e.g., ads, meal planning)

### Example Feature Configuration

```sql
-- Active tasks limit
INSERT INTO features (feature_key, display_name, feature_type)
VALUES ('active_tasks_limit', 'Active Tasks Limit', 'limit');

INSERT INTO plan_features (feature_id, plan_tier, limit_value)
VALUES
  ((SELECT id FROM features WHERE feature_key = 'active_tasks_limit'), 'pulse_starter', 30),
  ((SELECT id FROM features WHERE feature_key = 'active_tasks_limit'), 'pulse_premium', 100),
  ((SELECT id FROM features WHERE feature_key = 'active_tasks_limit'), 'unlimited_pulse', NULL); -- NULL = unlimited

-- AI prompts
INSERT INTO features (feature_key, display_name, feature_type)
VALUES ('ai_prompts_monthly', 'AI Prompts Per Month', 'limit');

INSERT INTO plan_features (feature_id, plan_tier, limit_value)
VALUES
  ((SELECT id FROM features WHERE feature_key = 'ai_prompts_monthly'), 'pulse_starter', 0),
  ((SELECT id FROM features WHERE feature_key = 'ai_prompts_monthly'), 'pulse_premium', 50),
  ((SELECT id FROM features WHERE feature_key = 'ai_prompts_monthly'), 'unlimited_pulse', 200);

-- Calendar import (AVAILABLE ON ALL TIERS)
INSERT INTO features (feature_key, display_name, feature_type)
VALUES ('calendar_import', 'Calendar Import (1-way)', 'access');

INSERT INTO plan_features (feature_id, plan_tier, access_level)
VALUES
  ((SELECT id FROM features WHERE feature_key = 'calendar_import'), 'pulse_starter', 'full'),
  ((SELECT id FROM features WHERE feature_key = 'calendar_import'), 'pulse_premium', 'full'),
  ((SELECT id FROM features WHERE feature_key = 'calendar_import'), 'unlimited_pulse', 'full');

-- Show ads
INSERT INTO features (feature_key, display_name, feature_type)
VALUES ('show_ads', 'Display Ads', 'toggle');

INSERT INTO plan_features (feature_id, plan_tier, access_level)
VALUES
  ((SELECT id FROM features WHERE feature_key = 'show_ads'), 'pulse_starter', 'full'), -- Yes, show ads
  ((SELECT id FROM features WHERE feature_key = 'show_ads'), 'pulse_premium', 'none'), -- No ads
  ((SELECT id FROM features WHERE feature_key = 'show_ads'), 'unlimited_pulse', 'none'); -- No ads
```

---

## Platform Admin Feature Management

### Platform Admin UI Features

The Platform Admin dashboard (`/platform-admin`) allows managing features without code changes:

1. **View All Features:**
   - List of all features with current tier mappings
   - Search and filter by feature type
   - See which tiers have access to each feature

2. **Edit Feature Limits:**
   - Adjust numeric limits (tasks, rewards, AI prompts)
   - Set to NULL for "unlimited"
   - Changes apply immediately to all users

3. **Toggle Feature Access:**
   - Enable/disable features per tier
   - Set access levels (none, preview, basic, full)
   - Preview mode: Show feature with "upgrade to unlock" message

4. **Create New Features:**
   - Add new features without schema changes
   - Assign to tiers immediately
   - Set default access levels

5. **A/B Testing:**
   - Create experimental tiers
   - Test feature combinations
   - Monitor adoption and engagement

### Example Platform Admin Workflow

**Scenario:** Increase AI prompts for Pulse Premium from 50 to 75

1. Navigate to Platform Admin > Feature Management
2. Search for "AI Prompts Per Month"
3. Click "Edit"
4. Update Pulse Premium limit: 50 → 75
5. Save changes
6. Changes apply immediately to all Premium users

**No code deployment required.**

---

## Tier Enforcement

### How Features Are Checked

Every API endpoint checks permissions using the permission system:

```typescript
// Example: Check if user can create a task
const canCreateTask = await checkPermission(userId, 'create', 'tasks');

if (!canCreateTask) {
  return { error: 'Upgrade to Premium to create more tasks' };
}
```

### Permission Checking Logic

The `check_user_permission()` function (in DATABASE_SCHEMA_V2_UPDATED.sql) handles:

1. Get user's organization tier
2. Get user's role permissions
3. Check feature limits for that tier
4. Return true/false based on:
   - Role has permission (from `role_permissions` table)
   - Tier has feature access (from `plan_features` table)
   - User hasn't exceeded limits (e.g., task count)

### Real-time Limit Checks

For numeric limits (tasks, rewards), the system checks current count against limit:

```sql
-- Example: Can user create another task?
SELECT
  (SELECT COUNT(*) FROM tasks WHERE organization_id = $org_id AND archived_at IS NULL) <
  (SELECT limit_value FROM plan_features pf
   JOIN features f ON f.id = pf.feature_id
   WHERE f.feature_key = 'active_tasks_limit'
   AND pf.plan_tier = $current_tier);
```

If user reaches limit:
- Show "upgrade to unlock" message
- Prevent creation of new items
- Allow archiving/deleting to free up slots

---

## Upgrade/Downgrade Behavior

### Upgrade (Starter → Premium or Premium → Unlimited)

**Immediate Effects:**
- New tier limits apply instantly
- Ads removed (if applicable)
- New features unlocked
- Billing starts immediately (prorated if mid-cycle)

**User Experience:**
- "Upgrade successful" notification
- Show newly unlocked features with tooltips
- Celebrate with confetti animation

---

### Downgrade (Unlimited → Premium or Premium → Starter)

**Immediate Effects:**
- New tier limits apply at end of billing cycle
- User keeps access until cycle ends
- Warning shown: "You have 87 tasks. Starter allows 30. Archive 57 tasks before downgrade."

**At End of Billing Cycle:**
- Excess items archived automatically (oldest first)
- User notified: "57 tasks archived due to downgrade. Upgrade to restore."
- Ads resume (if downgrading to Starter)
- AI prompts set to new tier limit

**Grace Period:**
- 7 days to upgrade and restore archived items
- After 7 days: Items remain archived but accessible in "Archived" view

---

### Cancellation (Any Tier → Starter)

**During Trial:**
- Immediate downgrade to Pulse Starter
- No charge
- Trial features lost immediately

**After Trial:**
- Access continues until end of billing cycle
- Then downgrade to Pulse Starter
- Auto-archive behavior (same as downgrade)

---

## AI Prompt Quota Management

### How Prompts Are Counted

**1 Prompt = 5-minute conversation session**

Example:
- User: "Help me plan meals for the week"
- AI: [Responds with meal suggestions]
- User: "Can you add chicken recipes?"
- AI: [Responds with chicken recipes]
- User: "What about vegetarian options?"
- AI: [Responds with vegetarian options]

**Total prompts used: 1** (if all within 5 minutes)

### Session Tracking

```sql
-- Track AI sessions
CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  prompts_in_session INTEGER DEFAULT 0,
  counted_as_prompts INTEGER DEFAULT 1, -- Always 1 per session
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Quota Enforcement

1. **Check quota before starting session:**
   - Get organization's current tier
   - Check `ai_prompts_used_this_month` vs tier limit
   - If under limit, allow session
   - If at limit, fall back to logic-based suggestions

2. **During session:**
   - Allow unlimited questions within 5 minutes
   - Update `session_end` timestamp on each message
   - If 5 minutes pass, end session and start new session (new prompt)

3. **Monthly reset:**
   - Cron job runs on 1st of each month
   - Reset `ai_prompts_used_this_month` to 0
   - Reset `ai_prompts_reset_date` to current date

### Cost Calculation

**GPT-4o-mini pricing (as of 2024):**
- Input: $0.150 per 1M tokens (~$0.00015 per 1K tokens)
- Output: $0.600 per 1M tokens (~$0.0006 per 1K tokens)

**Average 5-minute conversation:**
- Input: ~2,000 tokens ($0.0003)
- Output: ~1,000 tokens ($0.0006)
- **Total: ~$0.0009 per session**

**Monthly cost per tier:**
- Pulse Premium (50 prompts): 50 × $0.0009 = $0.045/month (~$0.54/year)
- Unlimited Pulse (200 prompts): 200 × $0.0009 = $0.18/month (~$2.16/year)

**Buffer for cost increases:** 10x buffer built into pricing
- Premium: 50 prompts at $0.10/user/month = $0.002 per prompt budget
- Unlimited: 200 prompts at $0.40/user/month = $0.002 per prompt budget

This allows for:
- Token price increases
- Longer conversations
- More complex prompts
- Future model upgrades

---

## Logic-Based Suggestions (Fallback)

When AI quota is exhausted or user is on Pulse Starter, the system uses **logic-based suggestions**:

### Task Suggestions

Based on:
- Family profile (has_pets, dietary_restrictions, age_groups)
- Day of week (e.g., "Take out trash" on Sunday)
- Season (e.g., "Rake leaves" in fall)
- Past task patterns (what tasks they've created before)

### Reward Suggestions

Based on:
- Age groups (age-appropriate rewards)
- Parenting style (from family_profiles.reward_approval_style)
- Point ranges (suggest rewards matching typical task points)

### Meal Suggestions (Phase 2)

Based on:
- Dietary restrictions
- Meal preferences
- Day of week (e.g., "Taco Tuesday")
- Season (e.g., "Grilled chicken" in summer)

---

## Feature Preview Mode

For features users don't have access to, show **preview mode**:

### Preview Behavior

1. **Show Feature with Lock Icon:**
   - Feature is visible but disabled
   - Lock icon or "Upgrade" badge

2. **Preview Content:**
   - Show blurred or limited preview
   - Example: Meal planning shows 3 recipes, rest blurred

3. **Upgrade Prompt:**
   - "Unlock Meal Planning with Unlimited Pulse"
   - Show pricing and upgrade button
   - Highlight value proposition

4. **No Nagging:**
   - Show preview once per session
   - Don't interrupt workflows
   - Allow dismissing upgrade prompts

---

## Competitive Pricing Analysis

### Cozi (Main Competitor)

- **Free:** Basic features with ads
- **Cozi Gold:** $29.99/year (no ads, calendar features, premium support)

**ChorePulse Advantage:**
- **More features:** Gamification, AI, achievements, hub display
- **Better free tier:** 30 tasks + calendar import vs Cozi's limited free features
- **Competitive Premium:** $39.99/year vs $29.99/year (33% more for 10x features)
- **Unlimited tier:** $69.99/year for power users (no Cozi equivalent)

### OurHome (Secondary Competitor)

- **Free:** Basic features
- **Premium:** $4.99/month or $39.99/year

**ChorePulse Advantage:**
- **Same pricing** but more features
- **AI assistant** (not available in OurHome)
- **Hub display** for shared family view
- **Calendar import on all tiers** (better free tier value)

---

## Revenue Projections

### Conservative Estimates

**Assumptions:**
- 10,000 total users (2,500 organizations, 4 users avg)
- 70% Pulse Starter (free)
- 20% Pulse Premium ($39.99/year)
- 10% Unlimited Pulse ($69.99/year)

**Annual Revenue:**
- Premium: 500 orgs × $39.99 = $19,995
- Unlimited: 250 orgs × $69.99 = $17,497.50
- **Total: $37,492.50/year**

**Monthly Costs:**
- Supabase: ~$25/month (Pro plan)
- Vercel: ~$20/month (Pro plan)
- OpenAI: ~$300/month (750 orgs × $0.40/month avg)
- AdMob/AdSense revenue: ~$200/month (offset free tier costs)

**Net Monthly Revenue:** ~$3,125 - $345 costs = **$2,780/month profit**

---

## Stripe Integration

### Subscription Setup

**Products:**
1. Pulse Premium Monthly ($4.99/month)
2. Pulse Premium Annual ($39.99/year)
3. Unlimited Pulse Monthly ($9.99/month)
4. Unlimited Pulse Annual ($69.99/year)

**Stripe Configuration:**
- Recurring subscriptions
- Automatic billing
- Proration on upgrades/downgrades
- 14-day trial (requires payment method)
- Webhook handling for subscription events

### Webhook Events

Handle these Stripe events:

1. **`customer.subscription.created`:**
   - Update organization.subscription_tier
   - Update organizations.subscription_status = 'trialing' or 'active'

2. **`customer.subscription.updated`:**
   - Handle upgrades/downgrades
   - Update tier and status

3. **`customer.subscription.deleted`:**
   - Downgrade to pulse_starter
   - Archive excess items
   - Update subscription_status = 'canceled'

4. **`invoice.payment_succeeded`:**
   - Log payment in security_events
   - Send receipt email

5. **`invoice.payment_failed`:**
   - Update subscription_status = 'past_due'
   - Send payment failure notification
   - Grace period: 7 days before downgrade

---

## Email Notifications

### Trial Period Emails

**Day 1 (Welcome):**
- Subject: "Welcome to ChorePulse Premium Trial!"
- Content: Getting started guide, key features
- CTA: "Set up your first task"

**Day 3 (Feature Highlight):**
- Subject: "Did you know? ChorePulse can help with meal planning"
- Content: Highlight AI features, meal planning (Phase 2)
- CTA: "Try the AI assistant"

**Day 7 (Mid-trial Check-in):**
- Subject: "You're halfway through your trial"
- Content: Usage stats, features you haven't tried yet
- CTA: "Explore more features"

**Day 10 (Reminder):**
- Subject: "4 days left in your trial"
- Content: Remind of billing date, show value
- CTA: "Continue with Premium"

**Day 13 (Final Warning):**
- Subject: "Your trial ends in 2 days"
- Content: What happens at end of trial, downgrade warning
- CTA: "Keep Premium" or "Cancel trial"

**Day 15 (Conversion or Cancellation):**
- If converted: "Welcome to ChorePulse Premium!"
- If canceled: "We're sorry to see you go" (offer to resume)

### Ongoing Emails

**Bi-weekly Value Emails:**
- Feature spotlights
- Tips and tricks
- Success stories
- New feature announcements

**Unsubscribe Preferences:**
- Marketing emails (opt-out)
- Product updates (opt-out)
- Billing notifications (required)
- Security alerts (required)

---

## Downgrade Warnings

### 7 Days Before Downgrade

**Email:**
- Subject: "Action required: Downgrade in 7 days"
- Content:
  - Current usage: "You have 87 tasks, but Pulse Starter allows 30"
  - Required action: "Archive or delete 57 tasks before [date]"
  - Consequences: "Excess tasks will be auto-archived"
  - Alternative: "Upgrade to Pulse Premium to keep all tasks"

**In-App Notification:**
- Banner: "Your plan changes in 7 days. Archive 57 tasks or upgrade."
- Dismiss option
- Link to archive management

### Day of Downgrade

**Email:**
- Subject: "Your plan has changed to Pulse Starter"
- Content:
  - Summary: "57 tasks were archived"
  - Action: "View archived tasks or upgrade to restore"
  - Grace period: "You have 7 days to upgrade and restore"

**In-App Notification:**
- Modal: "Welcome to Pulse Starter! 57 tasks were archived."
- Show archived items
- Upgrade CTA

---

## Upgrade Prompts

### When to Show

1. **Hitting Limits:**
   - User tries to create 31st task on Pulse Starter
   - User tries to use AI on Pulse Starter
   - User runs out of AI prompts

2. **Feature Discovery:**
   - User clicks on locked feature (e.g., Meal Planning)
   - User sees preview of Premium feature

3. **Occasional Reminders:**
   - Once per week for active free users
   - After completing 5+ tasks (showing engagement)

### Upgrade Prompt Design

**Modal:**
- Headline: "Unlock [Feature] with Pulse Premium"
- Benefits: 3-5 bullet points of what they get
- Pricing: Show annual discount
- CTA: "Start 14-day free trial"
- Dismiss: "Maybe later" (not "No thanks")

**Examples:**

**Task Limit:**
```
🚀 You've reached your task limit!

Upgrade to Pulse Premium and get:
✓ 100 active tasks (vs 30)
✓ 50 AI prompts per month
✓ No ads
✓ Advanced scheduling

Start 14-day free trial → $39.99/year
```

**AI Feature:**
```
🤖 Meet Pulse, your AI assistant

Get help with:
✓ Meal planning
✓ Chore suggestions
✓ Calendar management
✓ Shopping lists

Try it free for 14 days → $39.99/year
```

---

## Platform Admin Analytics

### Metrics to Track

1. **Tier Distribution:**
   - % of orgs on each tier
   - Trend over time

2. **Trial Conversion:**
   - % of trials that convert to paid
   - Conversion by tier (Premium vs Unlimited)

3. **Churn Rate:**
   - % of paid users who downgrade/cancel
   - Churn by tier

4. **Feature Usage:**
   - Which features are used most
   - Which features drive upgrades
   - Which features are rarely used (candidates for removal)

5. **AI Usage:**
   - Average prompts per org
   - % of orgs hitting AI limits
   - Cost per org (AI spend)

6. **Revenue Metrics:**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - ARPU (Average Revenue Per User)
   - LTV (Lifetime Value)

### Dashboards

**Revenue Dashboard:**
- Total MRR/ARR
- New subscriptions this month
- Upgrades/downgrades
- Churn rate

**Feature Usage Dashboard:**
- Feature adoption rates
- Feature usage by tier
- Features driving upgrades

**AI Cost Dashboard:**
- Total AI spend this month
- Cost per org
- Average prompts per org
- Orgs hitting limits

---

## Future Considerations

### Potential New Tiers

**Family Plus (Future):**
- Price: $19.99/month or $149.99/year
- For organizations with 10+ users
- Unlimited everything
- Dedicated support
- Custom branding
- API access

**School/Church Edition (Future):**
- Price: Custom (based on # of families)
- Multi-organization management
- Bulk admin tools
- Reporting dashboards

### Feature Flag Experiments

**Possible A/B Tests:**
1. AI prompt limits (50 vs 75 vs 100 for Premium)
2. Task limits (30 vs 50 for Starter)
3. Pricing ($39.99 vs $49.99 for Premium)
4. Free trial duration (7 days vs 14 days)

---

## Summary

The feature-flag-based pricing system provides:

✅ **Flexibility:** Change limits without code changes
✅ **Scalability:** Add new features and tiers easily
✅ **Control:** Platform Admin can manage everything
✅ **Testing:** A/B test features and pricing
✅ **Revenue:** 3 tiers capture free users, families, and power users
✅ **Compliance:** Stripe handles PCI compliance
✅ **User Experience:** Clear upgrade paths and value propositions
✅ **Calendar Import:** Available on all tiers for maximum utility

The system is production-ready and can scale from 100 to 10,000+ organizations without architectural changes.
