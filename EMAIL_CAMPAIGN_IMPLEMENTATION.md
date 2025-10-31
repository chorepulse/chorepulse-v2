# Email Campaign System - Implementation Guide

## Overview

The ChorePulse email campaign system is a comprehensive solution for sending personalized, value-focused emails to users based on their role, subscription tier, and behavior.

**Status:** ✅ Fully implemented (manual triggering), ⏳ Automation pending

---

## Architecture

### Database Schema
**Migration:** `supabase/migrations/020_create_email_campaigns.sql`

**Tables:**
- `email_preferences` - User opt-in/opt-out settings
- `email_campaigns` - Campaign definitions (not yet populated)
- `email_send_history` - Tracking all sent emails
- `email_queue` - Queue for batch processing (future use)

### Code Files
- `lib/email-templates.ts` - All HTML email templates (10 templates)
- `lib/email-campaigns.ts` - Template rendering and sending utilities
- `lib/email.ts` - Base email service (Resend API)
- `app/api/campaigns/trigger/route.ts` - Trigger campaign emails
- `app/api/email-preferences/route.ts` - Manage user preferences

---

## Email Templates

### Owner Sequence (6 emails, 14 days)

#### 1. OWNER_WELCOME (Day 0)
**Subject:** "Welcome to ChorePulse! Here's what to do first 🎉"
**Trigger:** User creates organization
**Content:**
- Welcome message with research backing
- Quick start checklist (add family, update preferences, create task)
- What makes ChorePulse different
- Quote from Dr. Marty Rossmann

**How to send:**
```typescript
POST /api/campaigns/trigger
{
  "userId": "user-id",
  "campaignType": "owner_welcome",
  "customData": {
    "familyName": "The Smiths",
    "suggestionCount": 12
  }
}
```

#### 2. OWNER_TASK_TIPS (Day 2)
**Subject:** "3 pro tips to create tasks your family will actually complete ✨"
**Trigger:** 2 days after signup
**Content:**
- Use Pulse AI suggestions
- Set realistic point values
- Use photo proof
- Includes upgrade messaging for Free users

#### 3. OWNER_SCIENCE_UPGRADE (Day 5)
**Subject:** "Why organized families are happier families 💙"
**Trigger:** 5 days after signup
**Content:**
- Research from Dr. Rossmann, Journal of Family Psychology, Eleanor Roosevelt
- Real testimonials with outcomes
- For Free: Value proposition (no discounts)
- For Trial: Show progress made, emotional connection

#### 4. OWNER_FAMILY_REPORT (Day 8)
**Subject:** "📊 Your first family report: {Family Name}'s week in review"
**Trigger:** 8 days after signup OR first Monday after day 8
**Content:**
- Week's stats (tasks, completion rate, points)
- Top performer
- Pulse AI insight
- Individual progress
- For Free: Upgrade messaging showing advanced insights

#### 5. OWNER_MOMENTUM (Day 11)
**Subject:** "5 ways to keep your family motivated 💪"
**Trigger:** 11 days after signup
**Content:**
- 5 motivation strategies (celebrate wins, weekly meetings, kid input, themed tasks, meaningful rewards)
- Feedback request
- Referral prompt
- For Free: Value prop on why Pro families stay consistent longer

#### 6. OWNER_GRADUATION (Day 14)
**Subject:** "🎓 You're a ChorePulse Pro! Here's what's next"
**Trigger:** 14 days after signup
**Content:**
- Congratulations + stats
- Advanced features introduction
- Resources (help center, videos)
- Transition to weekly reports
- For Free: Final value-based upgrade prompt

### Non-Owner User Sequence (3 emails, 7 days)

#### 7. USER_WELCOME (Day 0)
**Subject:** "Welcome to {Family Name} on ChorePulse! 👋"
**Trigger:** User added to family
**Content:**
- Welcome from owner
- Role-specific instructions
- How ChorePulse works
- For Kids/Teens: Achievement focus
- For Managers: Admin powers explanation
- **NO upgrade messaging**

#### 8. USER_FIRST_TASK (Day 2)
**Subject:** "Ready to earn your first points? 🌟"
**Trigger:** 2 days after joining OR hasn't completed a task
**Content:**
- Your tasks this week
- For Kids/Teens: How to complete, achievement preview, leaderboard
- For Managers: Tips for success
- **NO upgrade messaging**

#### 9. USER_TEAM_UPDATE (Day 7)
**Subject:** "See how {Family Name} is doing this week! 📈"
**Trigger:** 7 days after joining
**Content:**
- Your contribution stats
- Family progress
- Leaderboard with highlight
- For Managers: Admin tips
- **NO upgrade messaging**

### Recurring Emails

#### 10. WEEKLY_REPORT (Every Monday 9 AM)
**Subject:** "📊 {Family Name}'s Weekly Report: {Date Range}"
**Trigger:** Cron schedule: `0 9 * * MON`
**Audience:** Account owners + opted-in parents/managers
**Content:**
- Week at a glance
- Top performer + most improved
- Individual performance
- Pulse AI insights (streak alerts, fairness, behavior patterns)
- Upcoming week + AI suggestions
- For Free: Gentle value prop on advanced insights

---

## Campaign Strategy

### Value-Focused Messaging (NO Discounts)

**Core Principles:**
1. **Family Wellbeing** - "Happier, healthier, more organized families"
2. **Research-Backed** - Citations from doctors, journals, studies
3. **Real Outcomes** - "40% less conflict", "5 hours saved/week"
4. **Emotional Connection** - Progress they've made, habits they're building
5. **Social Proof** - Real testimonials with specific outcomes

**What We DON'T Do:**
- ❌ No "20% off" or discount promotions
- ❌ No artificial urgency tactics
- ❌ No feature-focused selling
- ❌ No aggressive upselling

**What We DO:**
- ✅ Show research on family routines and child development
- ✅ Share testimonials with outcomes
- ✅ Connect to their progress and momentum
- ✅ Frame as investment in family wellbeing
- ✅ Respectful: "Not ready yet? No problem!"

### Frequency Caps

- **Account Owners (Free/Trial):** Max 3 emails/week during onboarding, then 1-2/week
- **Account Owners (Paid):** Max 2 emails/week during onboarding, then 1/week
- **Non-owner users:** Max 1 email/week
- **Kids/Teens:** Max 2 emails during onboarding, then opt-in only

### Email Preferences

Users can opt out of:
- All marketing emails (transactional only)
- Weekly reports
- Tips & encouragement
- Achievement notifications
- Streak reminders
- Referral emails
- Surveys
- Product updates

**Manage at:** `/settings/email-preferences` (UI pending)

---

## API Usage

### Trigger a Campaign Email

**Endpoint:** `POST /api/campaigns/trigger`

**Authentication:** Required (user auth or service role)

**Request Body:**
```json
{
  "userId": "user-uuid",
  "campaignType": "owner_welcome",
  "customData": {
    "familyName": "The Smith Family",
    "suggestionCount": 12,
    "taskCount": 5,
    "subscriptionTier": "free"
  }
}
```

**Response:**
```json
{
  "success": true,
  "sent": true,
  "message": "Campaign owner_welcome sent to user@example.com"
}
```

**Campaign Types:**
- `owner_welcome`
- `owner_task_tips`
- `owner_science_upgrade`
- `owner_family_report`
- `owner_momentum`
- `owner_graduation`
- `user_welcome`
- `user_first_task`
- `user_team_update`
- `weekly_report`

### Get Email Preferences

**Endpoint:** `GET /api/email-preferences`

**Response:**
```json
{
  "preferences": {
    "id": "pref-uuid",
    "user_id": "user-uuid",
    "email": "user@example.com",
    "welcome_emails": true,
    "weekly_reports": true,
    "tips_and_encouragement": true,
    "achievements_notifications": true,
    "streak_reminders": true,
    "referral_emails": true,
    "product_updates": false,
    "surveys": false,
    "unsubscribed_all": false,
    "unsubscribe_token": "abc123...",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

### Update Email Preferences

**Endpoint:** `PATCH /api/email-preferences`

**Request Body:**
```json
{
  "weekly_reports": false,
  "streak_reminders": true
}
```

**Response:**
```json
{
  "success": true,
  "preferences": { ... }
}
```

---

## Automation Setup (Future)

### Option 1: Supabase Edge Functions (Recommended)

Create Edge Functions to trigger campaigns based on user events:

**`supabase/functions/trigger-onboarding-emails/index.ts`**
```typescript
// Trigger on user creation
// Schedule follow-up emails using pg_cron or external scheduler
```

**Triggers:**
- User creates organization → Send OWNER_WELCOME immediately
- +2 days → OWNER_TASK_TIPS
- +5 days → OWNER_SCIENCE_UPGRADE
- +8 days → OWNER_FAMILY_REPORT
- +11 days → OWNER_MOMENTUM
- +14 days → OWNER_GRADUATION

**For weekly reports:**
- Use pg_cron: `SELECT cron.schedule('weekly-reports', '0 9 * * 1', 'SELECT trigger_weekly_reports()');`

### Option 2: External Scheduler (Vercel Cron, etc.)

**`app/api/cron/send-emails/route.ts`**
```typescript
// Protected by CRON_SECRET
// Runs daily, checks email_queue and schedules
```

### Option 3: Background Job Processor

Use a service like Inngest, Trigger.dev, or BullMQ to process email queue.

---

## Testing

### Manual Testing

1. **Test Welcome Email:**
```bash
curl -X POST http://localhost:3000/api/campaigns/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "test-user-id",
    "campaignType": "owner_welcome",
    "customData": {
      "familyName": "Test Family"
    }
  }'
```

2. **Check Development Logs:**
Since `process.env.NODE_ENV === 'development'`, emails are logged to console instead of sent.

3. **Test Template Rendering:**
```typescript
import { renderTemplate } from '@/lib/email-campaigns'
import { EMAIL_TEMPLATES } from '@/lib/email-templates'

const html = renderTemplate(EMAIL_TEMPLATES.OWNER_WELCOME, {
  parentName: 'John',
  familyName: 'Smith Family',
  appUrl: 'http://localhost:3000'
})
console.log(html)
```

### Production Testing

1. Set `RESEND_API_KEY` in environment
2. Set `EMAIL_FROM` (e.g., `noreply@chorepulse.com`)
3. Send test campaign to your own email
4. Check Resend dashboard for delivery status

---

## Environment Variables

Required in `.env.local` and production:

```env
# Resend API for sending emails
RESEND_API_KEY=re_xxxxx

# From address for emails
EMAIL_FROM="ChorePulse <noreply@chorepulse.com>"

# App URL for links in emails
NEXT_PUBLIC_APP_URL=https://chorepulse.com
```

---

## Monitoring & Analytics

### Track These Metrics:

**Email Performance:**
- Open rates by campaign type
- Click-through rates
- Conversion rates (free → paid)
- Unsubscribe rates
- Bounce rates

**User Behavior:**
- Task completion rates (email recipients vs. non-recipients)
- Retention rates by email engagement
- Time to first task completion
- Time to upgrade

**Revenue Attribution:**
- Revenue from users who opened upgrade emails
- Conversion rate by email sequence completion

### Queries:

**Email send history:**
```sql
SELECT
  campaign_type,
  COUNT(*) as sent,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
  SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked
FROM email_send_history
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY campaign_type
ORDER BY sent DESC;
```

**Unsubscribe rate:**
```sql
SELECT
  COUNT(*) FILTER (WHERE unsubscribed_all = true) * 100.0 / COUNT(*) as unsubscribe_rate
FROM email_preferences;
```

---

## Next Steps

### Immediate (Manual Operation):
1. ✅ Database schema created
2. ✅ Templates built
3. ✅ API routes implemented
4. ⏳ Manually trigger welcome emails for new users
5. ⏳ Build settings UI for email preferences
6. ⏳ Test with real users

### Short-term (Automation):
1. Create Supabase Edge Function or cron job for onboarding sequence
2. Implement weekly report scheduler
3. Add event-based triggers (streak alerts, achievements)
4. Build admin dashboard for viewing email analytics

### Long-term (Enhancement):
1. A/B testing for subject lines and content
2. Personalized send time optimization
3. Re-engagement campaigns for inactive users
4. In-app notification system (complement to emails)
5. SMS opt-in for critical alerts

---

## Support

For questions or issues:
- **Documentation:** This file
- **API Spec:** Check `API_SPEC.md`
- **Database Schema:** `supabase/migrations/020_create_email_campaigns.sql`
- **Strategy:** `EMAIL_CAMPAIGN_STRATEGY.md`
