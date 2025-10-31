# ChorePulse v2 - System Architecture

**Last Updated:** 2025-10-20
**Status:** Complete Rebuild - Multi-tenant from Day 1

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Core Principles](#core-principles)
3. [System Overview](#system-overview)
4. [Authentication & Authorization](#authentication--authorization)
5. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Application Structure](#application-structure)
8. [Data Model](#data-model)
9. [API Architecture](#api-architecture)
10. [Hub Display System](#hub-display-system)
11. [AI & Smart Features](#ai--smart-features)
12. [Billing & Subscriptions](#billing--subscriptions)
13. [Email System](#email-system)
14. [Platform Admin](#platform-admin)
15. [Security & RLS](#security--rls)
16. [MVP vs Post-Launch](#mvp-vs-post-launch)

---

## Executive Summary

ChorePulse v2 is a complete rebuild designed with multi-tenancy, scalability, and maintainability from day 1. The system helps families manage household tasks, track completion, and build positive habits through gamification.

**Key Design Decisions:**
- **One Organization = One Family** (simple for MVP, extensible for future)
- **Unified Authentication** (single `users` table, no dual auth systems)
- **Permission-Based Authorization** (future-proof for new roles)
- **Multi-Tenant by Default** (every table has `organization_id` + RLS)
- **Route-Based Architecture** (single domain with route groups)
- **Free Tier = Zero AI Costs** (AI features for paid tiers only)

---

## Core Principles

### 1. Multi-Tenant Everything
```sql
-- EVERY table must have:
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE

-- EVERY table must have RLS:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their organization's data"
ON table_name FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);
```

### 2. Permission-Based Authorization
```typescript
// ❌ BAD - Hard-coded role checks
if (user.role === 'manager') { ... }

// ✅ GOOD - Permission-based checks
if (hasPermission(user, 'tasks:delete')) { ... }

// Future-proof for new roles without code changes
```

### 3. Single Source of Truth
- **Users:** ONE record per person in `users` table
- **Auth:** Links to Supabase `auth.users` via `auth_user_id`
- **Platform Admins:** Same table, flagged with `is_platform_admin: true`

### 4. Security First
- All API routes require authentication
- All database queries protected by RLS
- Organization isolation enforced at DB level
- Input validation on all endpoints
- HTTPS everywhere

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                          │
│  (Next.js Frontend - Server Components + Client Components)  │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──── chorepulse.com/          → Marketing Site
             ├──── chorepulse.com/app       → Main Application
             ├──── chorepulse.com/hub       → Hub Display
             └──── chorepulse.com/platform  → Platform Admin
             │
┌────────────▼────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  - Authentication                                            │
│  - Task Management                                           │
│  - User Management                                           │
│  - Analytics                                                 │
│  - Payments (Stripe)                                         │
│  - Platform Admin                                            │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──────────────┬──────────────┬──────────────┐
             │              │              │              │
┌────────────▼───┐  ┌──────▼──────┐  ┌───▼──────┐  ┌────▼────┐
│   Supabase     │  │   Stripe    │  │  Resend  │  │ OpenAI  │
│  - PostgreSQL  │  │   (Payments)│  │  (Email) │  │  (Paid) │
│  - Auth        │  └─────────────┘  └──────────┘  └─────────┘
│  - Storage     │
│  - Realtime    │
└────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 (App Router) | Server + Client rendering |
| **UI** | React 18 + TypeScript | Type-safe components |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Backend** | Next.js API Routes | Serverless API |
| **Database** | PostgreSQL (Supabase) | Primary data store |
| **Auth** | Supabase Auth | User authentication |
| **Storage** | Supabase Storage | File uploads (avatars, etc) |
| **Realtime** | Supabase Realtime | Hub live updates |
| **Email** | Resend | Transactional emails |
| **Payments** | Stripe | Subscriptions & billing |
| **AI** | OpenAI GPT-4o | Premium features only |
| **Hosting** | Vercel | Edge deployment |

---

## Authentication & Authorization

### Authentication Flow

```typescript
// 1. User logs in via Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// 2. Supabase creates session in auth.users table
// 3. Session cookie stored in browser
// 4. On each request, middleware verifies session
// 5. API routes get user data via:

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// 6. Look up user profile:
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('auth_user_id', user.id)
  .single();
```

### User Record Structure

```typescript
interface User {
  // Identity
  id: string;                    // UUID primary key
  auth_user_id: string;          // Links to auth.users
  organization_id: string;       // Multi-tenant isolation

  // Profile
  name: string;
  email: string | null;          // Optional for kids
  username: string;              // Auto-generated, unique
  avatar: string;                // Emoji or image URL
  color: string;                 // Hex color for UI

  // Authorization
  role: 'manager' | 'adult' | 'teen' | 'kid';
  is_family_manager: boolean;    // Delegated manager permissions
  is_platform_admin: boolean;    // ChorePulse team access

  // Security
  pin_hash: string | null;       // For kid/teen quick login
  pin_required: boolean;

  // Metadata
  age: number | null;
  birth_month: number | null;    // 1-12 for age-appropriate features
  created_at: timestamp;
  updated_at: timestamp;
}
```

### Platform Admin vs Family Manager

```typescript
// Platform Admin (ChorePulse team)
{
  is_platform_admin: true,
  organization_id: '00000000-0000-0000-0000-000000000000', // Special platform org
  role: 'manager', // Still has a role for UI consistency
}

// Family Manager (Manager who belongs to family)
{
  is_platform_admin: false,
  organization_id: 'real-family-uuid',
  role: 'manager',
}

// Delegated Family Manager (Adult with extra permissions)
{
  is_platform_admin: false,
  organization_id: 'real-family-uuid',
  role: 'adult',
  is_family_manager: true, // Can do most manager tasks
}
```

### Permission Checking Pattern

```typescript
// Helper function (src/lib/permissions.ts)
export function hasPermission(
  user: User,
  permission: Permission
): boolean {
  // Platform admins can do everything
  if (user.is_platform_admin) return true;

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (rolePermissions.includes(permission)) return true;

  // Check if family manager has permission
  if (user.is_family_manager) {
    const managerPerms = FAMILY_MANAGER_PERMISSIONS;
    return managerPerms.includes(permission);
  }

  return false;
}

// Usage in API routes
if (!hasPermission(currentUser, 'users:delete')) {
  return NextResponse.json(
    { success: false, error: 'Forbidden' },
    { status: 403 }
  );
}
```

---

## Multi-Tenancy Architecture

### Organization Model

```typescript
interface Organization {
  id: string;                    // UUID primary key
  name: string;                  // Family name

  // Subscription
  subscription_tier: 'free' | 'premium' | 'family_plus';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: 'active' | 'canceled' | 'past_due' | null;
  trial_ends_at: timestamp | null;

  // Settings
  timezone: string;              // e.g., 'America/New_York'
  week_starts_on: number;        // 0=Sunday, 1=Monday
  points_enabled: boolean;
  currency: string;              // e.g., 'USD'

  // Feature Flags (usage tracking for free tier limits)
  features_used: {
    tasks_created: number;
    users_count: number;
    storage_used_mb: number;
  };

  // Metadata
  created_at: timestamp;
  updated_at: timestamp;
  setup_completed: boolean;      // Wizard completion flag
}
```

### Data Isolation Pattern

```sql
-- Every table follows this pattern:
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  -- ... other fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);

-- RLS Policy
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their organization's tasks"
ON tasks FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);
```

### Cross-Organization Access (Platform Admin)

```typescript
// API route for platform admin data access
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('is_platform_admin, organization_id')
    .eq('auth_user_id', user.id)
    .single();

  if (!profile?.is_platform_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Platform admin: use service role client to bypass RLS
  const { createClient: createServiceClient } = await import('@supabase/supabase-js');
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only!
  );

  // Can now query across all organizations
  const { data: allOrgs } = await serviceSupabase
    .from('organizations')
    .select('*');

  return NextResponse.json({ organizations: allOrgs });
}
```

---

## User Roles & Permissions

### Role Definitions

| Role | Description | Typical Users | Age Range |
|------|-------------|---------------|-----------|
| **Manager** | Full control over family settings | Parents, guardians | Adult |
| **Adult** | Can manage tasks and help family | Older teens, adult children, caregivers | 16+ |
| **Teen** | Limited task management | Teenagers | 13-17 |
| **Kid** | View and complete assigned tasks | Children | 5-12 |

### Permission Matrix

| Permission | Manager | Adult | Teen | Kid | Family Manager* |
|-----------|---------|-------|------|-----|----------------|
| **Users** |
| Create users | ✅ | ❌ | ❌ | ❌ | ✅ |
| Edit users | ✅ | ❌ | ❌ | ❌ | ✅ |
| Delete users | ✅ | ❌ | ❌ | ❌ | ❌ |
| View users | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tasks** |
| Create tasks | ✅ | ✅ | ❌ | ❌ | ✅ |
| Edit own tasks | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit all tasks | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delete tasks | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assign tasks | ✅ | ✅ | ❌ | ❌ | ✅ |
| Claim tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Complete tasks | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Rewards** |
| Create rewards | ✅ | ❌ | ❌ | ❌ | ✅ |
| Edit rewards | ✅ | ❌ | ❌ | ❌ | ✅ |
| Delete rewards | ✅ | ❌ | ❌ | ❌ | ✅ |
| Redeem rewards | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve redemptions | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Settings** |
| Org settings | ✅ | ❌ | ❌ | ❌ | ✅ |
| Billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Integrations | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Analytics** |
| View reports | ✅ | ✅ | Own only | Own only | ✅ |
| Export data | ✅ | ❌ | ❌ | ❌ | ✅ |

*Family Manager = Adult with `is_family_manager: true`

### Permission Implementation

```typescript
// src/lib/permissions.ts

export type Permission =
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:view'
  | 'tasks:create'
  | 'tasks:edit:own'
  | 'tasks:edit:all'
  | 'tasks:delete'
  | 'tasks:assign'
  | 'tasks:complete'
  | 'rewards:create'
  | 'rewards:edit'
  | 'rewards:delete'
  | 'rewards:redeem'
  | 'rewards:approve'
  | 'settings:org'
  | 'settings:billing'
  | 'settings:integrations'
  | 'analytics:view:all'
  | 'analytics:view:own'
  | 'analytics:export';

const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  manager: [
    'users:create', 'users:edit', 'users:delete', 'users:view',
    'tasks:create', 'tasks:edit:own', 'tasks:edit:all', 'tasks:delete', 'tasks:assign', 'tasks:complete',
    'rewards:create', 'rewards:edit', 'rewards:delete', 'rewards:redeem', 'rewards:approve',
    'settings:org', 'settings:billing', 'settings:integrations',
    'analytics:view:all', 'analytics:export',
  ],
  adult: [
    'users:view',
    'tasks:create', 'tasks:edit:own', 'tasks:edit:all', 'tasks:assign', 'tasks:complete',
    'rewards:redeem', 'rewards:approve',
    'analytics:view:all',
  ],
  teen: [
    'users:view',
    'tasks:edit:own', 'tasks:complete',
    'rewards:redeem',
    'analytics:view:own',
  ],
  kid: [
    'users:view',
    'tasks:complete',
    'rewards:redeem',
    'analytics:view:own',
  ],
};

const FAMILY_MANAGER_PERMISSIONS: Permission[] = [
  'users:create', 'users:edit', // NOT delete
  'tasks:create', 'tasks:edit:all', 'tasks:delete', 'tasks:assign',
  'rewards:create', 'rewards:edit', 'rewards:delete', 'rewards:approve',
  'settings:org', 'settings:integrations', // NOT billing
  'analytics:view:all', 'analytics:export',
];

export function hasPermission(user: User, permission: Permission): boolean {
  // Platform admins bypass all checks
  if (user.is_platform_admin) return true;

  // Check role permissions
  const rolePerms = ROLE_PERMISSIONS[user.role];
  if (rolePerms.includes(permission)) return true;

  // Check family manager permissions
  if (user.is_family_manager && FAMILY_MANAGER_PERMISSIONS.includes(permission)) {
    return true;
  }

  return false;
}

// Convenience functions
export function canCreateUsers(user: User): boolean {
  return hasPermission(user, 'users:create');
}

export function canDeleteTasks(user: User): boolean {
  return hasPermission(user, 'tasks:delete');
}

export function canManageBilling(user: User): boolean {
  return hasPermission(user, 'settings:billing');
}
```

---

## Application Structure

### Route Organization

```
src/app/
├── (marketing)/              # Route group - marketing site
│   ├── page.tsx              # Homepage
│   ├── about/
│   ├── pricing/
│   ├── features/
│   └── layout.tsx            # Marketing layout (header, footer)
│
├── (auth)/                   # Route group - authentication
│   ├── login/
│   ├── signup/
│   ├── reset-password/
│   └── layout.tsx            # Auth layout (centered form)
│
├── app/                      # Main application (authenticated)
│   ├── layout.tsx            # App layout (sidebar, nav)
│   ├── dashboard/            # Family dashboard
│   ├── tasks/                # Task management
│   ├── calendar/             # Calendar view
│   ├── rewards/              # Rewards & redemptions
│   ├── analytics/            # Reports & insights
│   ├── settings/             # User & org settings
│   └── setup/                # Onboarding wizard
│
├── hub/                      # Hub display (minimal UI)
│   ├── page.tsx              # Main hub view
│   └── layout.tsx            # Minimal layout
│
├── platform/                 # Platform admin (ChorePulse team)
│   ├── layout.tsx            # Admin layout
│   ├── dashboard/            # Platform metrics
│   ├── organizations/        # Manage orgs
│   ├── users/                # Manage users
│   ├── monitoring/           # Error tracking
│   └── features/             # Feature flags
│
└── api/                      # API routes
    ├── auth/                 # Authentication
    ├── users/                # User CRUD
    ├── tasks/                # Task operations
    ├── rewards/              # Rewards system
    ├── analytics/            # Reporting
    ├── payments/             # Stripe integration
    ├── calendar/             # Google Calendar sync
    ├── platform/             # Platform admin APIs
    └── cron/                 # Scheduled jobs
```

### Component Organization

```
src/components/
├── ui/                       # Reusable UI primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Badge.tsx
│   └── Card.tsx
│
├── tasks/                    # Task-specific components
│   ├── TaskCard.tsx
│   ├── TaskList.tsx
│   ├── CreateTaskModal.tsx
│   └── TaskFilters.tsx
│
├── users/                    # User-specific components
│   ├── UserAvatar.tsx
│   ├── UserSelector.tsx
│   └── CreateUserModal.tsx
│
├── layout/                   # Layout components
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── MobileNav.tsx
│
├── hub/                      # Hub display components
│   ├── HubTaskList.tsx
│   ├── HubLeaderboard.tsx
│   └── HubPhotoSlideshow.tsx
│
└── platform/                 # Platform admin components
    ├── OrgList.tsx
    ├── UserList.tsx
    └── MetricsChart.tsx
```

### Library Organization

```
src/lib/
├── supabase/
│   ├── client.ts             # Browser Supabase client
│   ├── server.ts             # Server Supabase client
│   └── service.ts            # Service role client (platform admin)
│
├── auth/
│   ├── middleware.ts         # Auth middleware
│   └── helpers.ts            # Auth helper functions
│
├── permissions.ts            # Permission system
├── api-wrapper.ts            # API error handling wrapper
├── logger.ts                 # Logging utility
├── email.ts                  # Email helpers (Resend)
├── stripe.ts                 # Stripe integration
├── openai.ts                 # OpenAI integration (paid tier)
│
├── constants/
│   ├── categories.ts         # Task categories
│   ├── avatars.ts            # Avatar options
│   └── colors.ts             # Color palette
│
└── utils/
    ├── date.ts               # Date formatting
    ├── points.ts             # Points calculation
    └── validation.ts         # Input validation
```

---

## Data Model

See `DATABASE_SCHEMA.sql` for complete SQL schema. High-level overview:

### Core Tables

1. **organizations** - Multi-tenant isolation
2. **users** - User profiles (linked to auth.users)
3. **tasks** - Task templates
4. **task_instances** - Scheduled task occurrences
5. **rewards** - Reward definitions
6. **reward_redemptions** - Redemption tracking
7. **user_activity_logs** - Audit trail
8. **achievements** - Gamification badges

### Integration Tables

9. **calendar_connections** - Google Calendar OAuth
10. **photo_album_connections** - Google Photos OAuth
11. **user_invitations** - Email invitation tracking

### Library Tables (Shared Data)

12. **task_library** - Pre-built task templates
13. **reward_library** - Pre-built reward ideas

### Platform Tables

14. **feature_flags** - A/B testing & rollouts
15. **api_error_logs** - Error monitoring
16. **security_event_logs** - Security audit trail

### Key Relationships

```
organizations (1) ─┬─ (many) users
                   ├─ (many) tasks
                   ├─ (many) task_instances
                   ├─ (many) rewards
                   ├─ (many) reward_redemptions
                   ├─ (many) achievements
                   └─ (many) user_activity_logs

users (1) ─┬─ (many) task_instances (assigned)
           ├─ (many) task_instances (completed_by)
           ├─ (many) reward_redemptions
           ├─ (many) achievements
           └─ (1) auth.users (auth_user_id)

tasks (1) ───── (many) task_instances
rewards (1) ─── (many) reward_redemptions
```

---

## API Architecture

### Standard API Route Pattern

```typescript
// src/app/api/resource/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user profile
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, organization_id, role, is_family_manager, is_platform_admin')
      .eq('auth_user_id', user.id)
      .single();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 3. Authorization
    if (!hasPermission(currentUser, 'resource:view')) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 4. Query data (RLS automatically filters by organization)
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: data || [],
    });

  } catch (error) {
    logger.error('Error fetching resources:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

### API Response Format

```typescript
// Success response
{
  success: true,
  data: { ... } | [ ... ],
  meta?: {
    total: number,
    page: number,
    limit: number,
  }
}

// Error response
{
  success: false,
  error: string,
  errorCode?: string,
  details?: any // Only in development
}
```

### Error Handling

```typescript
// src/lib/api-wrapper.ts
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  context: string
): Promise<NextResponse> {
  try {
    const result = await handler();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(`${context}:`, error);

    // Log to database for monitoring
    await logApiError({
      endpoint: context,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Usage
export async function GET(request: Request) {
  return withErrorHandling(async () => {
    // Your logic here
  }, 'GET /api/tasks');
}
```

---

## Hub Display System

### Overview

The Hub is a read-only display for a family TV/tablet showing:
- Today's tasks
- Completion status
- Points leaderboard
- Photo slideshow when idle
- Upcoming events

### Technical Approach

**MVP: Polling + Page Refresh**
- Auto-refresh every 30 seconds
- Manual refresh on user interaction (task completion via phone)
- Photo slideshow when no activity for 5 minutes

**Post-Launch: Supabase Realtime**
- WebSocket connection for live updates
- Instant UI updates when tasks completed
- No page refreshes needed

### Hub Route Structure

```typescript
// src/app/hub/page.tsx
export default async function HubPage() {
  // Server component - initial data
  const tasks = await getTodaysTasks();
  const leaderboard = await getLeaderboard();

  return <HubDisplay initialTasks={tasks} initialLeaderboard={leaderboard} />;
}

// src/components/hub/HubDisplay.tsx
'use client';

export function HubDisplay({ initialTasks, initialLeaderboard }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [showPhotos, setShowPhotos] = useState(false);

  // Polling for MVP
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await fetch('/api/hub/data').then(r => r.json());
      setTasks(updated.tasks);
      setLeaderboard(updated.leaderboard);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Idle detection
  useEffect(() => {
    const idleTimer = setTimeout(() => {
      setShowPhotos(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(idleTimer);
  }, [tasks]); // Reset on task update

  if (showPhotos) {
    return <PhotoSlideshow onInteraction={() => setShowPhotos(false)} />;
  }

  return (
    <div className="hub-container">
      <HubTaskList tasks={tasks} />
      <HubLeaderboard data={leaderboard} />
    </div>
  );
}
```

### Hub Authentication

**Option 1: Pin-Based (MVP)**
```typescript
// Hub stays logged in as "family view" - no sensitive data exposed
// Just shows public family information
```

**Option 2: Device Token (Post-Launch)**
```typescript
// Generate one-time device token from main app
// Hub uses token to maintain long-lived session
// Token revocable from settings
```

---

## AI & Smart Features

### Free Tier (No AI Costs)

**Smart Wizard Suggestions** - Keyword matching only
```typescript
export function getSmartSuggestions(familyProfile: FamilyProfile) {
  const suggestions = [];

  // Rule-based logic
  if (familyProfile.members.some(m => m.age < 5)) {
    suggestions.push({
      category: 'cleaning',
      tasks: ['Put toys away', 'Help make bed'],
    });
  }

  if (familyProfile.hasPets) {
    suggestions.push({
      category: 'pet_care',
      tasks: ['Feed dog', 'Walk dog', 'Clean litter box'],
    });
  }

  return suggestions;
}
```

**Task Library Recommendations** - Database queries
```typescript
export async function getPopularTasks(category: string) {
  const { data } = await supabase
    .from('task_library')
    .select('*')
    .eq('category', category)
    .order('usage_count', { ascending: false })
    .limit(10);

  return data;
}
```

### Paid Tier (OpenAI Integration)

**Natural Language Task Parsing**
```typescript
// User types: "Take out trash every Tuesday and Friday"
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{
    role: 'system',
    content: 'Extract task details from natural language...',
  }, {
    role: 'user',
    content: userInput,
  }],
});

// Returns structured data:
{
  title: "Take out trash",
  frequency: "weekly",
  days: [2, 5], // Tuesday, Friday
  category: "outdoor",
}
```

**AI Meal Planning**
```typescript
// Generate meal plan based on preferences, dietary restrictions
const mealPlan = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{
    role: 'system',
    content: 'Generate a weekly meal plan...',
  }, {
    role: 'user',
    content: JSON.stringify(familyPreferences),
  }],
});
```

**Smart Rotation Suggestions**
```typescript
// Analyze completion history and suggest optimal task assignments
const rotation = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{
    role: 'system',
    content: 'Analyze task completion data and suggest fair rotation...',
  }, {
    role: 'user',
    content: JSON.stringify(completionHistory),
  }],
});
```

### Cost Control

```typescript
// src/lib/openai.ts
export async function callOpenAI(
  messages: any[],
  user: User,
  feature: string
) {
  // 1. Check subscription tier
  if (user.subscription_tier === 'free') {
    throw new Error('AI features require premium subscription');
  }

  // 2. Check rate limits (prevent abuse)
  const usage = await checkUsage(user.organization_id, feature);
  if (usage.count > usage.limit) {
    throw new Error('AI usage limit reached for this month');
  }

  // 3. Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheaper model for most features
    messages,
    max_tokens: 500, // Limit response length
  });

  // 4. Track usage
  await trackUsage(user.organization_id, feature, response.usage);

  return response;
}
```

---

## Billing & Subscriptions

### Subscription Tiers

| Feature | Free | Premium ($9.99/mo) | Family Plus ($19.99/mo) |
|---------|------|-------------------|------------------------|
| Users | 5 | 10 | Unlimited |
| Tasks/month | 50 | Unlimited | Unlimited |
| Storage | 100MB | 1GB | 5GB |
| AI Features | ❌ | ✅ | ✅ |
| Calendar Sync | ❌ | ✅ | ✅ |
| Photo Slideshow | ❌ | ✅ | ✅ |
| Export Data | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

### Stripe Integration

```typescript
// src/app/api/payments/create-checkout/route.ts
export async function POST(request: Request) {
  const { tier } = await request.json();

  // 1. Verify user is manager
  const currentUser = await getCurrentUser();
  if (!hasPermission(currentUser, 'settings:billing')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Create or retrieve Stripe customer
  let customerId = currentUser.organization.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: currentUser.email,
      metadata: {
        organization_id: currentUser.organization_id,
      },
    });
    customerId = customer.id;

    // Update organization
    await supabase
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', currentUser.organization_id);
  }

  // 3. Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{
      price: PRICE_IDS[tier],
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?upgrade=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
```

### Webhook Handler

```typescript
// src/app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: any) {
  const organizationId = session.client_reference_id;
  const subscriptionId = session.subscription;

  await supabase
    .from('organizations')
    .update({
      subscription_tier: 'premium',
      stripe_subscription_id: subscriptionId,
      subscription_status: 'active',
    })
    .eq('id', organizationId);
}
```

---

## Email System

### Email Types

1. **Transactional**
   - User invitations
   - Password reset
   - Subscription confirmations

2. **Drip Campaign** (Optional for MVP)
   - Day 1: Welcome + Quick Start
   - Day 2: Tips for Success
   - Day 7: Feature Highlights
   - Day 14: Upgrade Prompt

3. **Notifications** (Optional for MVP)
   - Daily task summary
   - Weekly report
   - Reward redemption alerts

### Resend Integration

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail({
  to,
  userName,
  organizationName,
  invitationToken,
}: {
  to: string;
  userName: string;
  organizationName: string;
  invitationToken: string;
}) {
  await resend.emails.send({
    from: 'ChorePulse <noreply@chorepulse.com>',
    to,
    subject: `You've been invited to join ${organizationName} on ChorePulse`,
    html: `
      <h1>Welcome to ChorePulse!</h1>
      <p>Hi ${userName},</p>
      <p>You've been invited to join <strong>${organizationName}</strong>.</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${invitationToken}">
          Accept Invitation
        </a>
      </p>
    `,
  });
}
```

---

## Platform Admin

### Access Pattern

```typescript
// src/app/platform/layout.tsx
export default async function PlatformLayout({ children }) {
  const user = await getCurrentUser();

  if (!user?.is_platform_admin) {
    redirect('/app');
  }

  return (
    <div className="platform-layout">
      <PlatformSidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Platform Admin Features

**1. Organization Management**
- View all organizations
- Search/filter orgs
- View org details (users, tasks, usage)
- Manually adjust subscriptions
- Delete organizations

**2. User Management**
- Search users across all orgs
- View user activity
- Reset passwords
- Impersonate user (for support)

**3. Monitoring**
- API error logs
- Security events
- Performance metrics
- Usage analytics

**4. Feature Flags**
- Enable/disable features by org
- A/B testing
- Gradual rollouts

### Service Role Client

```typescript
// src/lib/supabase/service.ts
import { createClient } from '@supabase/supabase-js';

// WARNING: Only use in server-side code!
// This client bypasses ALL RLS policies
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Usage in platform admin API
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.is_platform_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data } = await supabase.from('organizations').select('*');

  return NextResponse.json({ organizations: data });
}
```

---

## Security & RLS

### RLS Best Practices

1. **Enable RLS on ALL tables**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

2. **Default deny** - No policy = no access
```sql
-- Don't create overly permissive policies
-- Be specific about what each role can do
```

3. **Test RLS policies**
```sql
-- Test as different users
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub = '<user-auth-id>';
SELECT * FROM tasks; -- Should only see user's org tasks
```

4. **Use helper functions**
```sql
-- Create reusable function
CREATE FUNCTION user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users
  WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- Use in policies
CREATE POLICY "Users see own org data"
ON tasks FOR SELECT
USING (organization_id = user_organization_id());
```

### Security Checklist

- [ ] All tables have RLS enabled
- [ ] All API routes check authentication
- [ ] All mutations check permissions
- [ ] Environment variables secured
- [ ] Service role key never exposed to client
- [ ] CORS configured properly
- [ ] Rate limiting enabled (Vercel Edge Config)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (React escapes by default)

---

## MVP vs Post-Launch

### MVP (Weeks 1-4)

**Core Features:**
- ✅ User authentication (email/password)
- ✅ Organization setup wizard
- ✅ User management (create, edit, delete)
- ✅ Task creation & assignment
- ✅ Task completion tracking
- ✅ Basic rewards system
- ✅ Points & leaderboard
- ✅ Hub display (polling)
- ✅ Task library integration
- ✅ Reward library integration
- ✅ Basic analytics (completion rates)
- ✅ Platform admin dashboard
- ✅ Stripe integration (code ready, UI hidden)

**NOT in MVP:**
- ❌ Google Calendar sync
- ❌ Google Photos integration
- ❌ AI features
- ❌ Email drip campaign
- ❌ Daily/weekly email summaries
- ❌ Advanced analytics
- ❌ Mobile app
- ❌ Offline mode
- ❌ Multi-organization support

### Post-Launch Enhancements

**Phase 2: Integrations (Weeks 5-8)**
- Google Calendar two-way sync
- Google Photos slideshow
- Export to PDF/CSV
- Import from other apps

**Phase 3: AI Features (Weeks 9-12)**
- Natural language task parsing
- AI meal planning
- Smart task rotation
- Predictive analytics

**Phase 4: Mobile (Weeks 13-16)**
- React Native app
- Push notifications
- Offline mode
- Camera integration

**Phase 5: Scale (Months 5-6)**
- Multi-organization support (schools, daycares)
- Team collaboration features
- API for third-party integrations
- White-label solution

---

## Next Steps

1. **Review this architecture** - Confirm all design decisions
2. **Read DATABASE_SCHEMA.sql** - Understand data model
3. **Read IMPLEMENTATION_ROADMAP.md** - See build plan
4. **Create new Supabase project** - Fresh start
5. **Export reference data** - Task & reward libraries
6. **Begin Phase 1** - Foundation setup

---

**Questions? See:**
- `API_SPEC.md` - Detailed API documentation
- `PERMISSIONS_SYSTEM.md` - Permission patterns
- `PLATFORM_ADMIN_GUIDE.md` - Admin features
- `IMPLEMENTATION_ROADMAP.md` - Build timeline
