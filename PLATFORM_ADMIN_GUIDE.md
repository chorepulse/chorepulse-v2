# ChorePulse v2 - Platform Admin Guide

**Last Updated:** 2025-10-20
**Audience:** ChorePulse team members with platform admin access

---

## Table of Contents
1. [Overview](#overview)
2. [Getting Platform Admin Access](#getting-platform-admin-access)
3. [Platform Admin Dashboard](#platform-admin-dashboard)
4. [Managing Organizations](#managing-organizations)
5. [Managing Users](#managing-users)
6. [Monitoring & Logs](#monitoring--logs)
7. [Feature Flags](#feature-flags)
8. [Subscription Management](#subscription-management)
9. [Support Tasks](#support-tasks)
10. [Security Best Practices](#security-best-practices)

---

## Overview

Platform admins are ChorePulse team members who can:
- View all organizations and their data
- Monitor system health and errors
- Manage feature flags
- Provide customer support
- Override subscriptions for testing

**Important:** Platform admin access bypasses multi-tenant isolation. Use responsibly!

---

## Getting Platform Admin Access

### Creating a Platform Admin Account

**Option 1: Via SQL (Initial Setup)**

```sql
-- 1. Create organization for platform admins
-- (Already created by schema: 00000000-0000-0000-0000-000000000000)

-- 2. Sign up normally at /signup
-- 3. Update user record to grant platform admin
UPDATE users
SET is_platform_admin = true,
    organization_id = '00000000-0000-0000-0000-000000000000'
WHERE email = 'admin@chorepulse.com';
```

**Option 2: Via Existing Platform Admin**

Once you have one platform admin, they can create others:

1. Create user normally via signup
2. Platform admin updates user:
   ```sql
   UPDATE users
   SET is_platform_admin = true,
       organization_id = '00000000-0000-0000-0000-000000000000'
   WHERE email = 'new.admin@chorepulse.com';
   ```

### Verifying Platform Admin Access

1. Log in to ChorePulse
2. Navigate to `/platform`
3. You should see the platform dashboard

If you see "Forbidden" error, you don't have platform admin access.

---

## Platform Admin Dashboard

### Accessing the Dashboard

**URL:** `https://chorepulse.com/platform`

**What You'll See:**

```
┌─────────────────────────────────────────┐
│  ChorePulse Platform Admin              │
├─────────────────────────────────────────┤
│  📊 Overview                             │
│  • Total Organizations: 150              │
│  • Total Users: 847                      │
│  • Active Subscriptions: 23              │
│  • MRR: $229.77                          │
│                                          │
│  🔧 Quick Actions                        │
│  • View Organizations                    │
│  • View Users                            │
│  • Monitor Errors                        │
│  • Manage Feature Flags                  │
│                                          │
│  🚨 Recent Alerts                        │
│  • 3 API errors in last hour             │
│  • 1 failed payment                      │
└─────────────────────────────────────────┘
```

---

## Managing Organizations

### Viewing All Organizations

**Route:** `/platform/organizations`

**What You Can Do:**
- View all organizations
- Search by name
- Filter by subscription tier
- Sort by creation date, user count, etc.

**API Endpoint:**
```typescript
GET /api/platform/organizations?page=1&limit=20&tier=premium&search=Smith
```

### Viewing Organization Details

**Route:** `/platform/organizations/[id]`

**Information Shown:**
- Organization name and settings
- All users in organization
- Task count and completion rate
- Subscription status
- Usage statistics
- Activity logs

**Example:**

```
┌─────────────────────────────────────────┐
│  Organization: Smith Family              │
├─────────────────────────────────────────┤
│  ID: abc-123-def                         │
│  Created: 2025-01-15                     │
│  Subscription: Premium (Active)          │
│  Stripe Customer: cus_abc123             │
│                                          │
│  📊 Usage Stats                          │
│  • Users: 5 / 10 (limit)                │
│  • Tasks created this month: 45 / 100   │
│  • Storage: 23 MB / 1 GB                │
│                                          │
│  👥 Users                                │
│  • John Doe (Manager)                    │
│  • Jane Doe (Kid) - 150 points          │
│  • ...                                   │
│                                          │
│  🎯 Tasks                                │
│  • 45 active tasks                       │
│  • 87% completion rate                   │
│                                          │
│  🔧 Actions                              │
│  [View Activity Logs]                    │
│  [Adjust Subscription]                   │
│  [Impersonate User]                      │
│  [Delete Organization]                   │
└─────────────────────────────────────────┘
```

### Organization Actions

**View Activity Logs**
```typescript
GET /api/platform/organizations/[id]/activity
```

See all actions taken by users in the organization.

**Adjust Subscription**
```typescript
POST /api/platform/organizations/[id]/subscription
{
  "tier": "family_plus",
  "status": "active",
  "trial_ends_at": "2025-02-15T00:00:00Z"
}
```

Manually override subscription (useful for testing or customer support).

**Impersonate User** (Support Feature)
```typescript
POST /api/platform/impersonate
{
  "user_id": "uuid"
}
```

Log in as the user to debug issues. **Use sparingly and with permission!**

**Delete Organization**
```typescript
DELETE /api/platform/organizations/[id]
```

Permanently delete organization and all associated data. **Cannot be undone!**

Requires confirmation dialog with typed confirmation.

---

## Managing Users

### Viewing All Users

**Route:** `/platform/users`

**What You Can Do:**
- Search users across all organizations
- Filter by role, organization, status
- View user details
- Reset passwords
- Delete accounts

**API Endpoint:**
```typescript
GET /api/platform/users?search=john@example.com&role=manager
```

### User Details

**Route:** `/platform/users/[id]`

**Information Shown:**
- User profile
- Organization
- Activity history
- Login history
- Points and streak
- Tasks completed

### User Actions

**Reset Password**
```typescript
POST /api/platform/users/[id]/reset-password
```

Send password reset email to user.

**Delete User**
```typescript
DELETE /api/platform/users/[id]
```

Delete user from their organization. Use for GDPR requests or abusive users.

**View User Activity**
```typescript
GET /api/platform/users/[id]/activity
```

See all actions taken by this user.

---

## Monitoring & Logs

### Error Monitoring

**Route:** `/platform/monitoring/errors`

**What You'll See:**

| Time | Org | Endpoint | Error | Status |
|------|-----|----------|-------|--------|
| 10:32 AM | Smith Family | POST /api/tasks | Invalid category | 400 |
| 10:15 AM | Jones Family | GET /api/rewards | Timeout | 500 |

**Filters:**
- Organization
- Endpoint
- Date range
- Status code
- Error message

**API Endpoint:**
```typescript
GET /api/platform/monitoring/errors?org_id=uuid&endpoint=/api/tasks&start_date=2025-01-15
```

### Security Events

**Route:** `/platform/monitoring/security-events`

**Event Types:**
- `login_success` - Successful login
- `login_failed` - Failed login attempt
- `password_reset` - Password reset requested
- `unauthorized_access` - Attempted access without auth
- `permission_denied` - Attempted action without permission
- `suspicious_activity` - Rate limiting triggered, etc.
- `account_locked` - Account locked due to failed attempts

**What You'll See:**

| Time | Org | User | Event | Severity | IP Address |
|------|-----|------|-------|----------|------------|
| 10:32 AM | Smith | john@example.com | login_failed | medium | 192.168.1.1 |
| 10:15 AM | Jones | - | unauthorized_access | high | 10.0.0.5 |

**Filters:**
- Organization
- User
- Event type
- Severity (low, medium, high, critical)
- Date range

**API Endpoint:**
```typescript
GET /api/platform/monitoring/security-events?severity=high&event_type=login_failed
```

### Performance Metrics

**Route:** `/platform/monitoring/performance`

**Metrics:**
- Average response time by endpoint
- Slowest endpoints
- Database query performance
- API usage by organization

---

## Feature Flags

**Route:** `/platform/features`

Feature flags allow you to:
- Enable/disable features for testing
- Gradual rollouts (e.g., 10% of orgs)
- A/B testing
- Block features for specific orgs

### Creating a Feature Flag

```typescript
POST /api/platform/features
{
  "name": "calendar_sync",
  "description": "Google Calendar two-way sync",
  "is_enabled": false,
  "rollout_percentage": 0,
  "allowed_organization_ids": [],
  "blocked_organization_ids": []
}
```

### Enabling a Feature

**Option 1: Enable for Everyone**
```typescript
PATCH /api/platform/features/calendar_sync
{
  "is_enabled": true,
  "rollout_percentage": 100
}
```

**Option 2: Gradual Rollout**
```typescript
PATCH /api/platform/features/calendar_sync
{
  "is_enabled": true,
  "rollout_percentage": 10 // 10% of orgs
}
```

**Option 3: Specific Organizations**
```typescript
PATCH /api/platform/features/calendar_sync
{
  "is_enabled": true,
  "rollout_percentage": 0,
  "allowed_organization_ids": ["org-1", "org-2", "org-3"]
}
```

### Checking Feature Flags in Code

```typescript
// src/lib/features.ts
export async function isFeatureEnabled(
  organizationId: string,
  featureName: string
): Promise<boolean> {
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('name', featureName)
    .single();

  if (!flag || !flag.is_enabled) return false;

  // Check if org is explicitly blocked
  if (flag.blocked_organization_ids.includes(organizationId)) {
    return false;
  }

  // Check if org is explicitly allowed
  if (flag.allowed_organization_ids.includes(organizationId)) {
    return true;
  }

  // Check rollout percentage
  // Use deterministic hash to ensure consistent results
  const hash = hashOrganizationId(organizationId);
  const bucket = hash % 100;
  return bucket < flag.rollout_percentage;
}

// Usage
if (await isFeatureEnabled(orgId, 'calendar_sync')) {
  // Show calendar sync UI
}
```

---

## Subscription Management

### Viewing Subscriptions

**Route:** `/platform/subscriptions`

**What You'll See:**

| Org | Tier | Status | MRR | Stripe ID | Actions |
|-----|------|--------|-----|-----------|---------|
| Smith Family | Premium | Active | $9.99 | sub_abc | [View] [Cancel] |
| Jones Family | Free | - | $0 | - | [Upgrade] |

### Manually Adjusting Subscriptions

**Use Cases:**
- Grant free trial extension
- Comp premium for beta testers
- Fix billing issues
- Test subscription features

**Example: Grant 30-Day Premium Trial**

```typescript
POST /api/platform/organizations/[id]/subscription
{
  "subscription_tier": "premium",
  "subscription_status": "trialing",
  "trial_ends_at": "2025-02-20T00:00:00Z"
}
```

**Example: Downgrade to Free**

```typescript
POST /api/platform/organizations/[id]/subscription
{
  "subscription_tier": "free",
  "subscription_status": null,
  "stripe_subscription_id": null
}
```

### Handling Failed Payments

**Route:** `/platform/subscriptions?status=past_due`

**Actions:**
1. Contact customer via email
2. Work with Stripe to resolve
3. If unresolved after 7 days, downgrade to free tier

```typescript
POST /api/platform/organizations/[id]/subscription
{
  "subscription_tier": "free",
  "subscription_status": "canceled"
}
```

---

## Support Tasks

### Common Support Scenarios

#### 1. User Locked Out

**Symptom:** User can't log in, forgot password

**Solution:**
1. Find user in `/platform/users`
2. Click "Send Password Reset"
3. Verify email was sent (check logs)

```typescript
POST /api/platform/users/[id]/reset-password
```

#### 2. User Sees Wrong Organization Data

**Symptom:** User seeing other family's tasks

**Diagnosis:**
1. Check user's `organization_id` in database
2. Verify RLS policies are enabled
3. Check for duplicate users

**Solution:**
```sql
-- Verify organization_id is correct
SELECT id, name, email, organization_id, auth_user_id
FROM users
WHERE email = 'user@example.com';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

If RLS is disabled, this is a CRITICAL security issue!

#### 3. Stripe Webhook Not Working

**Symptom:** Subscription not updating after payment

**Diagnosis:**
1. Check Stripe Dashboard > Webhooks
2. Look for failed deliveries
3. Check `/api/webhooks/stripe` logs

**Solution:**
1. Resend webhook from Stripe Dashboard
2. Or manually update subscription:

```typescript
POST /api/platform/organizations/[id]/subscription
{
  "subscription_tier": "premium",
  "subscription_status": "active",
  "stripe_subscription_id": "sub_abc123"
}
```

#### 4. Data Export Request (GDPR)

**Request:** User wants all their data

**Solution:**
1. Find organization in `/platform/organizations`
2. Click "Export Data"
3. Download JSON file
4. Email to user

```typescript
GET /api/platform/organizations/[id]/export
```

**Data Includes:**
- Organization details
- All users
- All tasks
- All task instances
- All rewards
- All redemptions
- All activity logs

#### 5. Data Deletion Request (GDPR)

**Request:** User wants account deleted

**Solution:**
1. Confirm identity
2. Export data first (send to user)
3. Delete organization (CASCADE deletes all data)

```typescript
DELETE /api/platform/organizations/[id]
```

**Confirmation Dialog:**
```
Are you sure you want to delete "Smith Family"?

This will permanently delete:
• 5 users
• 23 tasks
• 87 task instances
• 10 rewards
• 15 redemptions
• All activity logs

This action CANNOT be undone!

Type the organization name to confirm: [          ]

[Cancel] [Delete Forever]
```

---

## Security Best Practices

### 1. Use Service Role Client Carefully

```typescript
// ❌ NEVER expose service client to browser
// ❌ NEVER use service client in client components
// ✅ ONLY use in server-side platform admin APIs

// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  // This bypasses ALL RLS policies!
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only!
  );
}
```

### 2. Always Verify Platform Admin

```typescript
// src/app/api/platform/[...]/route.ts
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // CRITICAL: Verify platform admin status
  const { data: profile } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile?.is_platform_admin) {
    // Log suspicious access attempt
    await logSecurityEvent({
      event_type: 'unauthorized_access',
      severity: 'high',
      description: `Non-admin user attempted to access /platform endpoint`,
      user_id: user.id,
    });

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with platform admin logic...
}
```

### 3. Log All Platform Admin Actions

```typescript
// After any platform admin action
await logActivity({
  action: 'platform.organization.deleted',
  user_id: adminUser.id,
  resource_type: 'organization',
  resource_id: organizationId,
  metadata: {
    organization_name: 'Smith Family',
    reason: 'GDPR request',
  },
});
```

### 4. Impersonation Safety

```typescript
// When impersonating a user for support
export async function POST(request: Request) {
  const { user_id } = await request.json();
  const adminUser = await getCurrentUser();

  // Verify admin
  if (!adminUser.is_platform_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Log impersonation
  await logSecurityEvent({
    event_type: 'impersonation_started',
    severity: 'high',
    description: `Admin ${adminUser.email} impersonating user ${user_id}`,
    metadata: { admin_id: adminUser.id, target_user_id: user_id },
  });

  // Create impersonation session (expires in 1 hour)
  const session = await createImpersonationSession(user_id, adminUser.id);

  return NextResponse.json({ session });
}
```

### 5. Rate Limiting for Platform Routes

```typescript
// Prevent brute force attacks on platform endpoints
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function GET(request: Request) {
  try {
    await limiter.check(request, 10); // 10 requests per minute
  } catch {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // Continue with handler...
}
```

---

## Troubleshooting

### Platform Dashboard Not Loading

**Possible Causes:**
1. Not logged in
2. Not a platform admin
3. RLS blocking queries

**Debug Steps:**
```sql
-- Check if you're platform admin
SELECT id, email, is_platform_admin, organization_id
FROM users
WHERE email = 'your.email@chorepulse.com';

-- Should return:
-- is_platform_admin: true
-- organization_id: 00000000-0000-0000-0000-000000000000
```

### Can't See All Organizations

**Problem:** Service role client not used

**Solution:**
```typescript
// Make sure you're using service client in platform APIs
const supabase = createServiceClient(); // NOT createClient()
```

### Impersonation Not Working

**Problem:** Session cookies conflicting

**Solution:**
- Use incognito window for impersonation
- Or clear cookies before impersonating

---

## API Reference

### Platform Admin Endpoints

```typescript
// Organizations
GET    /api/platform/organizations
GET    /api/platform/organizations/[id]
POST   /api/platform/organizations/[id]/subscription
DELETE /api/platform/organizations/[id]
GET    /api/platform/organizations/[id]/export

// Users
GET    /api/platform/users
GET    /api/platform/users/[id]
POST   /api/platform/users/[id]/reset-password
DELETE /api/platform/users/[id]

// Monitoring
GET    /api/platform/monitoring/errors
GET    /api/platform/monitoring/security-events
GET    /api/platform/monitoring/performance

// Feature Flags
GET    /api/platform/features
POST   /api/platform/features
PATCH  /api/platform/features/[name]
DELETE /api/platform/features/[name]

// Support
POST   /api/platform/impersonate
GET    /api/platform/activity-logs
```

---

## Conclusion

Platform admin access is powerful. Use it responsibly:

- ✅ Help customers with legitimate issues
- ✅ Monitor system health
- ✅ Test new features
- ✅ Investigate security incidents

- ❌ Don't snoop on user data without reason
- ❌ Don't make changes without logging
- ❌ Don't share platform admin credentials
- ❌ Don't use service role key in browser

**Remember:** With great power comes great responsibility!

---

**Questions?** Contact: engineering@chorepulse.com
