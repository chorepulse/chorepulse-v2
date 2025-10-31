# ChorePulse v2 - API Specification

**Version:** 2.0
**Last Updated:** 2025-10-20
**Base URL:** `https://chorepulse.com/api`

---

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Users](#users-endpoints)
   - [Tasks](#tasks-endpoints)
   - [Task Instances](#task-instances-endpoints)
   - [Rewards](#rewards-endpoints)
   - [Analytics](#analytics-endpoints)
   - [Hub](#hub-endpoints)
   - [Platform Admin](#platform-admin-endpoints)
   - [Payments](#payments-endpoints)
   - [Integrations](#integrations-endpoints)

---

## Overview

The ChorePulse API follows REST principles and uses JSON for request/response bodies. All endpoints require authentication unless otherwise specified.

### Base Principles

- **Stateless:** Each request contains all information needed
- **Idempotent:** Same request produces same result
- **Versioned:** API version in URL (currently v2 implicit)
- **Paginated:** Large datasets return with pagination
- **Filtered:** Support query parameters for filtering

---

## Authentication

All API requests (except `/api/auth/*`) require a valid Supabase session cookie.

### Session Management

```typescript
// Browser automatically includes session cookie
// Server-side:
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Headers

```
Cookie: sb-<project-ref>-auth-token=<session-token>
Content-Type: application/json
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Human-readable error message",
  "errorCode": "RESOURCE_NOT_FOUND",
  "details": { ... } // Optional, development only
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict (duplicate, etc.) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## Rate Limiting

**MVP:** No rate limiting (rely on Vercel limits)

**Post-MVP:**
- 100 requests per minute per user
- 1000 requests per hour per organization
- Platform admin: unlimited

---

## Endpoints

## Authentication Endpoints

### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

**Errors:**
- `400` - Email already exists
- `400` - Password too weak

---

### POST /api/auth/login

Log in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials

---

### POST /api/auth/logout

Log out current user.

**Request:** None

**Response:**
```json
{
  "success": true
}
```

---

### GET /api/auth/me

Get current authenticated user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "organization_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "john_abc123",
    "avatar": "smile",
    "color": "#3B82F6",
    "role": "manager",
    "is_family_manager": false,
    "is_platform_admin": false,
    "points_balance": 150,
    "streak_count": 7,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User profile not found

---

### POST /api/auth/verify-pin

Verify PIN for quick login (kids/teens).

**Request:**
```json
{
  "user_id": "uuid",
  "pin": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "session": { ... }
  }
}
```

**Errors:**
- `401` - Invalid PIN
- `404` - User not found

---

## Users Endpoints

### GET /api/users

Get all users in current user's organization.

**Query Parameters:**
- `role` - Filter by role (optional)
- `search` - Search by name (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "username": "john_abc123",
      "avatar": "smile",
      "color": "#3B82F6",
      "role": "manager",
      "is_family_manager": false,
      "points_balance": 150,
      "streak_count": 7,
      "age": 35,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Permissions:** All authenticated users

---

### POST /api/users

Create a new user.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com", // Optional
  "avatar": "star", // Optional
  "color": "#F59E0B", // Optional
  "role": "kid",
  "is_family_manager": false,
  "pin": "1234", // Required
  "pin_required": true,
  "age": 8, // Optional
  "birth_month": 3 // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "username": "jane_xyz789",
    "avatar": "star",
    "color": "#F59E0B",
    "role": "kid",
    "points_balance": 0,
    "streak_count": 0,
    "created_at": "2025-01-20T10:00:00Z"
  }
}
```

**Permissions:** Manager or family manager

**Errors:**
- `403` - Insufficient permissions
- `400` - Missing required fields
- `409` - Email already exists

---

### PUT /api/users

Update a user.

**Request:**
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "avatar": "rocket",
  "color": "#10B981",
  "role": "teen",
  "pin": "5678", // Optional
  "age": 13
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Smith",
    ...
  }
}
```

**Permissions:** Manager or family manager

**Errors:**
- `403` - Insufficient permissions
- `404` - User not found

---

### DELETE /api/users?id=uuid

Delete a user.

**Response:**
```json
{
  "success": true
}
```

**Permissions:** Manager only

**Errors:**
- `403` - Only managers can delete users
- `404` - User not found

---

### GET /api/users/[userId]/points

Get user's points history.

**Response:**
```json
{
  "success": true,
  "data": {
    "current_balance": 150,
    "total_earned": 500,
    "total_spent": 350,
    "history": [
      {
        "date": "2025-01-20",
        "earned": 50,
        "spent": 0,
        "balance": 150
      }
    ]
  }
}
```

**Permissions:** User viewing own points, or manager

---

## Tasks Endpoints

### GET /api/tasks

Get all tasks in current user's organization.

**Query Parameters:**
- `category` - Filter by category (optional)
- `assigned_to` - Filter by assigned user ID (optional)
- `is_active` - Filter by active status (optional, default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "title": "Take out trash",
      "description": "Put trash bins on curb",
      "category": "outdoor",
      "points": 15,
      "difficulty": "easy",
      "frequency": "weekly",
      "recurrence_pattern": {
        "days": [2, 5],
        "time": "18:00"
      },
      "assigned_to_user_id": "uuid",
      "is_active": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Permissions:** All authenticated users

---

### POST /api/tasks

Create a new task.

**Request:**
```json
{
  "title": "Wash dishes",
  "description": "Load dishwasher and hand-wash pots",
  "category": "cleaning",
  "points": 10,
  "difficulty": "easy",
  "frequency": "daily",
  "recurrence_pattern": {
    "time": "20:00"
  },
  "assigned_to_user_id": "uuid",
  "starts_at": "2025-01-20",
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Wash dishes",
    ...
  }
}
```

**Permissions:** Manager, adult, or family manager

**Errors:**
- `403` - Insufficient permissions
- `400` - Missing required fields

---

### PUT /api/tasks/[id]

Update a task.

**Request:**
```json
{
  "title": "Wash all dishes",
  "points": 15,
  "is_active": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Wash all dishes",
    ...
  }
}
```

**Permissions:** Manager, adult, or family manager

---

### DELETE /api/tasks/[id]

Delete a task.

**Response:**
```json
{
  "success": true
}
```

**Permissions:** Manager, adult, or family manager

---

### POST /api/tasks/bulk-assign

Assign multiple tasks to users.

**Request:**
```json
{
  "assignments": [
    { "task_id": "uuid1", "user_id": "uuid_a" },
    { "task_id": "uuid2", "user_id": "uuid_b" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 2
  }
}
```

**Permissions:** Manager, adult, or family manager

---

## Task Instances Endpoints

### GET /api/task-instances

Get task instances (scheduled occurrences).

**Query Parameters:**
- `date` - Filter by scheduled date (YYYY-MM-DD, default: today)
- `assigned_to` - Filter by assigned user ID (optional)
- `status` - Filter by status (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "title": "Take out trash",
      "description": "Put trash bins on curb",
      "category": "outdoor",
      "points": 15,
      "assigned_to_user_id": "uuid",
      "scheduled_for": "2025-01-20",
      "due_at": "2025-01-20T23:59:59Z",
      "status": "pending",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Permissions:** All authenticated users

---

### POST /api/tasks/complete

Complete a task instance.

**Request:**
```json
{
  "task_instance_id": "uuid",
  "completed_by_user_id": "uuid" // Optional, defaults to current user
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "task_instance": {
      "id": "uuid",
      "status": "completed",
      "completed_at": "2025-01-20T15:30:00Z",
      "completed_by_user_id": "uuid"
    },
    "user": {
      "id": "uuid",
      "points_balance": 165, // +15 points
      "streak_count": 8 // +1 streak
    },
    "points_awarded": 15
  }
}
```

**Permissions:** All authenticated users

---

### POST /api/tasks/claim

Claim an unassigned task.

**Request:**
```json
{
  "task_instance_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "claimed",
    "claimed_at": "2025-01-20T10:00:00Z",
    "assigned_to_user_id": "uuid"
  }
}
```

**Permissions:** All authenticated users

---

### POST /api/tasks/unclaim

Unclaim a previously claimed task.

**Request:**
```json
{
  "task_instance_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "claimed_at": null,
    "assigned_to_user_id": null
  }
}
```

**Permissions:** User who claimed it, or manager

---

## Rewards Endpoints

### GET /api/rewards

Get all rewards in organization.

**Query Parameters:**
- `is_active` - Filter by active status (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Extra screen time",
      "description": "30 minutes of screen time",
      "icon": "📱",
      "points_cost": 50,
      "is_active": true,
      "stock_quantity": null,
      "max_per_user_per_month": 2,
      "allowed_roles": ["kid", "teen"],
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Permissions:** All authenticated users

---

### POST /api/rewards

Create a new reward.

**Request:**
```json
{
  "title": "Movie night",
  "description": "Choose a movie for family movie night",
  "icon": "🎬",
  "points_cost": 100,
  "is_active": true,
  "stock_quantity": null,
  "max_per_user_per_month": 1,
  "allowed_roles": ["kid", "teen", "adult"],
  "min_age": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Movie night",
    ...
  }
}
```

**Permissions:** Manager or family manager

---

### PUT /api/rewards/[id]

Update a reward.

**Request:**
```json
{
  "points_cost": 75,
  "is_active": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "points_cost": 75,
    ...
  }
}
```

**Permissions:** Manager or family manager

---

### DELETE /api/rewards/[id]

Delete a reward.

**Response:**
```json
{
  "success": true
}
```

**Permissions:** Manager or family manager

---

### POST /api/rewards/redeem

Redeem a reward.

**Request:**
```json
{
  "reward_id": "uuid",
  "user_id": "uuid" // Optional, defaults to current user
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "redemption": {
      "id": "uuid",
      "reward_id": "uuid",
      "user_id": "uuid",
      "points_spent": 50,
      "status": "pending",
      "created_at": "2025-01-20T15:00:00Z"
    },
    "user": {
      "id": "uuid",
      "points_balance": 100 // -50 points
    }
  }
}
```

**Permissions:** All authenticated users

**Errors:**
- `400` - Insufficient points
- `400` - Monthly limit exceeded
- `404` - Reward not found

---

### GET /api/rewards/redemptions

Get reward redemptions.

**Query Parameters:**
- `user_id` - Filter by user (optional)
- `status` - Filter by status (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reward_id": "uuid",
      "reward_title": "Extra screen time",
      "user_id": "uuid",
      "user_name": "Jane Doe",
      "points_spent": 50,
      "status": "pending",
      "created_at": "2025-01-20T15:00:00Z"
    }
  ]
}
```

**Permissions:** All authenticated users (see own redemptions), managers (see all)

---

### PATCH /api/rewards/redemptions/[id]

Approve or deny a redemption.

**Request:**
```json
{
  "status": "approved", // or "denied"
  "denial_reason": "Not this week" // Optional, for denied
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "approved_by_user_id": "uuid",
    "approved_at": "2025-01-20T16:00:00Z"
  }
}
```

**Permissions:** Manager or adult

---

## Analytics Endpoints

### GET /api/analytics/leaderboard

Get points leaderboard.

**Query Parameters:**
- `period` - Time period (week, month, all-time, default: week)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "user_name": "Jane Doe",
      "avatar": "star",
      "color": "#F59E0B",
      "points": 150,
      "tasks_completed": 10,
      "rank": 1
    },
    {
      "user_id": "uuid",
      "user_name": "John Doe",
      "avatar": "smile",
      "color": "#3B82F6",
      "points": 120,
      "tasks_completed": 8,
      "rank": 2
    }
  ]
}
```

**Permissions:** All authenticated users

---

### GET /api/analytics/user-stats

Get statistics for a user.

**Query Parameters:**
- `user_id` - User ID (optional, defaults to current user)

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "points_balance": 150,
    "streak_count": 7,
    "tasks_completed_today": 3,
    "tasks_completed_this_week": 10,
    "tasks_completed_all_time": 85,
    "completion_rate": 0.92,
    "favorite_category": "cleaning",
    "achievements_unlocked": 5
  }
}
```

**Permissions:** User viewing own stats, or manager

---

### GET /api/analytics/task-analytics

Get task completion analytics.

**Query Parameters:**
- `start_date` - Start date (YYYY-MM-DD)
- `end_date` - End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tasks": 100,
    "completed_tasks": 85,
    "completion_rate": 0.85,
    "by_category": {
      "cleaning": { "total": 30, "completed": 28 },
      "outdoor": { "total": 20, "completed": 15 }
    },
    "by_user": {
      "uuid1": { "total": 40, "completed": 38 },
      "uuid2": { "total": 35, "completed": 30 }
    },
    "by_day": [
      { "date": "2025-01-15", "total": 10, "completed": 9 },
      { "date": "2025-01-16", "total": 10, "completed": 8 }
    ]
  }
}
```

**Permissions:** Manager or family manager

---

## Hub Endpoints

### GET /api/hub/data

Get all data needed for hub display.

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "uuid",
        "title": "Take out trash",
        "assigned_to": {
          "name": "Jane Doe",
          "avatar": "star",
          "color": "#F59E0B"
        },
        "points": 15,
        "status": "completed",
        "completed_at": "2025-01-20T15:30:00Z"
      }
    ],
    "leaderboard": [
      {
        "name": "Jane Doe",
        "avatar": "star",
        "color": "#F59E0B",
        "points": 150,
        "tasks_completed": 10
      }
    ],
    "timestamp": "2025-01-20T16:00:00Z"
  }
}
```

**Permissions:** All authenticated users

---

## Platform Admin Endpoints

### GET /api/platform/organizations

Get all organizations (platform admin only).

**Query Parameters:**
- `subscription_tier` - Filter by tier (optional)
- `search` - Search by name (optional)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Smith Family",
      "subscription_tier": "premium",
      "subscription_status": "active",
      "users_count": 5,
      "tasks_created_this_month": 45,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

**Permissions:** Platform admin only

---

### GET /api/platform/organizations/[id]

Get detailed organization info.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Smith Family",
    "subscription_tier": "premium",
    "users": [ ... ],
    "tasks": [ ... ],
    "usage_stats": {
      "tasks_created": 120,
      "users_count": 5,
      "storage_used_mb": 45
    }
  }
}
```

**Permissions:** Platform admin only

---

### GET /api/platform/monitoring/errors

Get API error logs.

**Query Parameters:**
- `organization_id` - Filter by org (optional)
- `endpoint` - Filter by endpoint (optional)
- `start_date` - Start date (optional)
- `end_date` - End date (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "endpoint": "/api/tasks",
      "method": "POST",
      "error_message": "Invalid category",
      "status_code": 400,
      "created_at": "2025-01-20T14:30:00Z"
    }
  ]
}
```

**Permissions:** Platform admin only

---

### GET /api/platform/monitoring/security-events

Get security event logs.

**Query Parameters:**
- `organization_id` - Filter by org (optional)
- `severity` - Filter by severity (optional)
- `event_type` - Filter by type (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_id": "uuid",
      "event_type": "login_failed",
      "severity": "medium",
      "description": "Failed login attempt",
      "ip_address": "192.168.1.1",
      "created_at": "2025-01-20T14:00:00Z"
    }
  ]
}
```

**Permissions:** Platform admin only

---

## Payments Endpoints

### POST /api/payments/create-checkout

Create a Stripe checkout session.

**Request:**
```json
{
  "tier": "premium" // or "family_plus"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/..."
  }
}
```

**Permissions:** Manager only

---

### POST /api/payments/portal

Create a Stripe customer portal session.

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

**Permissions:** Manager only

---

### POST /api/webhooks/stripe

Handle Stripe webhooks (called by Stripe).

**Headers:**
```
stripe-signature: <signature>
```

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

**Response:**
```json
{
  "received": true
}
```

---

## Integrations Endpoints

### POST /api/calendar/auth

Initiate Google Calendar OAuth flow.

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://accounts.google.com/o/oauth2/..."
  }
}
```

**Permissions:** Manager or family manager

---

### GET /api/calendar/auth/callback

Handle OAuth callback (called by Google).

**Query Parameters:**
- `code` - Authorization code from Google

**Response:**
Redirects to `/app/settings?calendar=connected`

---

### GET /api/calendar/list

List user's Google Calendars.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "primary",
      "name": "Personal",
      "selected": true
    }
  ]
}
```

**Permissions:** User with connected calendar

---

### POST /api/calendar/sync

Manually trigger calendar sync.

**Response:**
```json
{
  "success": true,
  "data": {
    "synced": 10,
    "created": 5,
    "updated": 3,
    "deleted": 2
  }
}
```

**Permissions:** Manager or family manager

---

## Cron Endpoints

These are called by Vercel Cron or external schedulers.

### POST /api/cron/generate-instances

Generate task instances for upcoming days.

**Headers:**
```
Authorization: Bearer <cron-secret>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instances_created": 45
  }
}
```

---

### POST /api/cron/mark-missed

Mark overdue tasks as missed.

**Response:**
```json
{
  "success": true,
  "data": {
    "instances_marked_missed": 3
  }
}
```

---

### POST /api/cron/sync-calendar

Sync all calendar connections.

**Response:**
```json
{
  "success": true,
  "data": {
    "connections_synced": 12
  }
}
```

---

## Library Endpoints

### GET /api/task-library

Get task library (pre-built templates).

**Query Parameters:**
- `category` - Filter by category (optional)
- `min_age` - Filter by minimum age (optional)
- `max_age` - Filter by maximum age (optional)
- `role` - Filter by suitable role (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Make bed",
      "description": "Straighten sheets and arrange pillows",
      "category": "personal_care",
      "suggested_points": 5,
      "suggested_difficulty": "easy",
      "min_age": 5,
      "suitable_roles": ["kid", "teen"],
      "usage_count": 1250
    }
  ]
}
```

**Permissions:** All authenticated users

---

### POST /api/task-library/track-usage

Track when a library task is used.

**Request:**
```json
{
  "task_library_id": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

**Permissions:** All authenticated users

---

### GET /api/reward-library

Get reward library (pre-built reward ideas).

**Query Parameters:**
- `category` - Filter by category (optional)
- `min_age` - Filter by minimum age (optional)
- `max_age` - Filter by maximum age (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Choose dinner",
      "description": "Pick what the family eats for dinner",
      "icon": "🍕",
      "category": "privilege",
      "suggested_points_cost": 75,
      "suitable_roles": ["kid", "teen"],
      "usage_count": 890
    }
  ]
}
```

**Permissions:** All authenticated users

---

## Appendix

### Common Query Patterns

**Filter by date range:**
```
GET /api/task-instances?start_date=2025-01-15&end_date=2025-01-22
```

**Pagination:**
```
GET /api/users?page=2&limit=10
```

**Multiple filters:**
```
GET /api/tasks?category=cleaning&assigned_to=uuid&is_active=true
```

### Standard Error Responses

**Unauthorized:**
```json
{
  "success": false,
  "error": "Unauthorized - please log in",
  "errorCode": "UNAUTHORIZED"
}
```

**Forbidden:**
```json
{
  "success": false,
  "error": "Forbidden - only managers can perform this action",
  "errorCode": "FORBIDDEN"
}
```

**Not Found:**
```json
{
  "success": false,
  "error": "Resource not found",
  "errorCode": "NOT_FOUND"
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "title": "Title is required",
    "points": "Points must be a positive integer"
  }
}
```

---

## Change Log

### v2.0 (2025-01-20)
- Initial v2 API specification
- Unified authentication system
- Multi-tenant from day 1
- Permission-based authorization

---

**Next:** See `PERMISSIONS_SYSTEM.md` for detailed permission patterns.
