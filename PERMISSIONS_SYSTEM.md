# ChorePulse v2 - Permissions System

**Last Updated:** 2025-10-22
**Purpose:** Future-proof authorization with permission-based checks

---

## Table of Contents
1. [Overview](#overview)
2. [Why Permission-Based?](#why-permission-based)
3. [Permission Definitions](#permission-definitions)
4. [Role Permissions Matrix](#role-permissions-matrix)
5. [Implementation](#implementation)
6. [Usage Examples](#usage-examples)
7. [Testing Permissions](#testing-permissions)
8. [Adding New Permissions](#adding-new-permissions)

---

## Overview

ChorePulse v2 uses a **permission-based authorization system** instead of hard-coded role checks. This makes the system more flexible and maintainable.

### Key Concepts

- **Permissions** - Specific actions (e.g., `tasks:create`, `users:delete`)
- **Roles** - Collections of permissions (manager, adult, teen, kid)
- **Account Owner** - One per organization, full billing control, can transfer ownership (special manager)
- **Family Manager** - Adult with elevated permissions (subset of manager, cannot manage billing)
- **Platform Admin** - ChorePulse team member (all permissions)

---

## Why Permission-Based?

### Problem with Hard-Coded Roles

```typescript
// ❌ BAD - Hard to maintain
if (user.role === 'manager') {
  // Can create tasks
}

// What if we add a new role "caregiver"?
// We'd have to update EVERY role check in the codebase!
if (user.role === 'manager' || user.role === 'caregiver') {
  // Can create tasks
}
```

### Solution: Permission-Based

```typescript
// ✅ GOOD - Future-proof
if (hasPermission(user, 'tasks:create')) {
  // Can create tasks
}

// Add new role by updating ROLE_PERMISSIONS config
// No code changes needed in API routes or components!
const ROLE_PERMISSIONS = {
  manager: ['tasks:create', 'tasks:delete', ...],
  caregiver: ['tasks:create', 'users:view', ...], // New role
  adult: ['tasks:create', ...],
};
```

### Benefits

1. **Single Source of Truth** - All permissions defined in one file
2. **Easy to Extend** - Add new roles without changing business logic
3. **Flexible** - Can assign individual permissions as needed
4. **Testable** - Easy to test permission logic in isolation
5. **Auditable** - Clear documentation of who can do what

---

## Permission Definitions

### Naming Convention

Format: `resource:action` or `resource:action:scope`

Examples:
- `tasks:create` - Can create tasks
- `tasks:edit:own` - Can edit own tasks
- `tasks:edit:all` - Can edit all tasks in organization
- `users:delete` - Can delete users

### Complete Permission List

```typescript
// src/lib/permissions.ts

export type Permission =
  // Users
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:view'

  // Tasks
  | 'tasks:create'
  | 'tasks:edit:own'
  | 'tasks:edit:all'
  | 'tasks:delete'
  | 'tasks:assign'
  | 'tasks:complete'
  | 'tasks:claim'

  // Rewards
  | 'rewards:create'
  | 'rewards:edit'
  | 'rewards:delete'
  | 'rewards:redeem'
  | 'rewards:approve'

  // Settings
  | 'settings:org'
  | 'settings:billing'
  | 'settings:integrations'
  | 'settings:transfer_ownership'

  // Analytics
  | 'analytics:view:all'
  | 'analytics:view:own'
  | 'analytics:export'

  // Platform (for future features)
  | 'calendar:connect'
  | 'photos:connect'
  | 'ai:use';
```

---

## Role Permissions Matrix

### Account Owner (Special Status)

**Description:** One per organization. Full control including billing and ownership transfer. Cannot be deleted until ownership is transferred.

**Key Characteristics:**
- `is_account_owner = true` in users table
- Only ONE per organization (enforced by database check constraint)
- Cannot be deleted until ownership transferred to another user
- Automatically set on organization creator
- Can transfer ownership to any manager or family_manager in the organization

**Unique Permissions:**
```typescript
const ACCOUNT_OWNER_PERMISSIONS: Permission[] = [
  'settings:transfer_ownership', // Only account owner can transfer
  'users:delete', // Can delete any user (except self until transfer)
  'settings:billing', // Full billing control
];
```

**Note:** Account owners get ALL Manager permissions PLUS these unique permissions.

---

### Manager

**Description:** Full control over family organization (except billing and ownership transfer if not account owner)

**Permissions:**
```typescript
const MANAGER_PERMISSIONS: Permission[] = [
  // Users - full access (except delete, which requires account owner)
  'users:create',
  'users:edit',
  'users:view',

  // Tasks - full access
  'tasks:create',
  'tasks:edit:own',
  'tasks:edit:all',
  'tasks:delete',
  'tasks:assign',
  'tasks:complete',
  'tasks:claim',

  // Rewards - full access
  'rewards:create',
  'rewards:edit',
  'rewards:delete',
  'rewards:redeem',
  'rewards:approve',

  // Settings - org and integrations only (NOT billing or ownership transfer)
  'settings:org',
  'settings:integrations',

  // Analytics - full access
  'analytics:view:all',
  'analytics:export',

  // Integrations
  'calendar:connect',
  'photos:connect',
  'ai:use',
];
```

---

### Adult

**Description:** Can manage tasks and help with family organization

**Permissions:**
```typescript
const ADULT_PERMISSIONS: Permission[] = [
  // Users - view only
  'users:view',

  // Tasks - can create and manage
  'tasks:create',
  'tasks:edit:own',
  'tasks:edit:all',
  'tasks:assign',
  'tasks:complete',
  'tasks:claim',

  // Rewards - can approve, not create
  'rewards:redeem',
  'rewards:approve',

  // Analytics - can view all
  'analytics:view:all',
];
```

---

### Teen

**Description:** Limited task management, can track own progress

**Permissions:**
```typescript
const TEEN_PERMISSIONS: Permission[] = [
  // Users - view only
  'users:view',

  // Tasks - can manage own tasks
  'tasks:edit:own',
  'tasks:complete',
  'tasks:claim',

  // Rewards - can redeem
  'rewards:redeem',

  // Analytics - own stats only
  'analytics:view:own',
];
```

---

### Kid

**Description:** Can complete tasks and redeem rewards

**Permissions:**
```typescript
const KID_PERMISSIONS: Permission[] = [
  // Users - view only
  'users:view',

  // Tasks - can complete only
  'tasks:complete',

  // Rewards - can redeem
  'rewards:redeem',

  // Analytics - own stats only
  'analytics:view:own',
];
```

---

### Family Manager (Modifier)

**Description:** Adult or Manager with elevated permissions (subset of Manager). Multiple allowed per organization.

**Key Characteristics:**
- `is_family_manager = true` in users table
- Multiple allowed per organization (unlike account owner)
- Can be any role (typically adult or manager)
- Cannot delete users (account owner only)
- Cannot manage billing (account owner only)
- Cannot transfer ownership (account owner only)

**Additional Permissions:**
```typescript
const FAMILY_MANAGER_PERMISSIONS: Permission[] = [
  // Users - can create/edit, NOT delete
  'users:create',
  'users:edit',

  // Tasks - full access
  'tasks:create',
  'tasks:delete',

  // Rewards - full access
  'rewards:create',
  'rewards:edit',
  'rewards:delete',

  // Settings - org and integrations, NOT billing or ownership
  'settings:org',
  'settings:integrations',

  // Analytics - full access
  'analytics:view:all',
  'analytics:export',

  // Integrations
  'calendar:connect',
  'photos:connect',
  'ai:use',
];
```

**Note:** Family managers get their role permissions PLUS these additional permissions.

---

## Implementation

### Core Permission System

```typescript
// src/lib/permissions.ts

import type { User } from '@/types';

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
  | 'tasks:claim'
  | 'rewards:create'
  | 'rewards:edit'
  | 'rewards:delete'
  | 'rewards:redeem'
  | 'rewards:approve'
  | 'settings:org'
  | 'settings:billing'
  | 'settings:integrations'
  | 'settings:transfer_ownership'
  | 'analytics:view:all'
  | 'analytics:view:own'
  | 'analytics:export'
  | 'calendar:connect'
  | 'photos:connect'
  | 'ai:use';

const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  manager: [
    'users:create', 'users:edit', 'users:view', // NOT delete (account owner only)
    'tasks:create', 'tasks:edit:own', 'tasks:edit:all', 'tasks:delete', 'tasks:assign', 'tasks:complete', 'tasks:claim',
    'rewards:create', 'rewards:edit', 'rewards:delete', 'rewards:redeem', 'rewards:approve',
    'settings:org', 'settings:integrations', // NOT billing or transfer (account owner only)
    'analytics:view:all', 'analytics:export',
    'calendar:connect', 'photos:connect', 'ai:use',
  ],
  adult: [
    'users:view',
    'tasks:create', 'tasks:edit:own', 'tasks:edit:all', 'tasks:assign', 'tasks:complete', 'tasks:claim',
    'rewards:redeem', 'rewards:approve',
    'analytics:view:all',
  ],
  teen: [
    'users:view',
    'tasks:edit:own', 'tasks:complete', 'tasks:claim',
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
  'users:create', 'users:edit', // NOT delete (account owner only)
  'tasks:create', 'tasks:delete',
  'rewards:create', 'rewards:edit', 'rewards:delete',
  'settings:org', 'settings:integrations', // NOT billing or transfer (account owner only)
  'analytics:view:all', 'analytics:export',
  'calendar:connect', 'photos:connect', 'ai:use',
];

const ACCOUNT_OWNER_PERMISSIONS: Permission[] = [
  'users:delete', // Can delete any user (except self until ownership transferred)
  'settings:billing', // Full billing control
  'settings:transfer_ownership', // Can transfer ownership
];

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  // Platform admins have all permissions
  if (user.is_platform_admin) return true;

  // Check account owner permissions
  if (user.is_account_owner && ACCOUNT_OWNER_PERMISSIONS.includes(permission)) {
    return true;
  }

  // Get base role permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (rolePermissions.includes(permission)) return true;

  // Check family manager permissions
  if (user.is_family_manager && FAMILY_MANAGER_PERMISSIONS.includes(permission)) {
    return true;
  }

  return false;
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User): Permission[] {
  if (user.is_platform_admin) {
    // Return all permissions
    return Object.values(ROLE_PERMISSIONS).flat();
  }

  const permissions = [...ROLE_PERMISSIONS[user.role]];

  if (user.is_account_owner) {
    permissions.push(...ACCOUNT_OWNER_PERMISSIONS);
  }

  if (user.is_family_manager) {
    permissions.push(...FAMILY_MANAGER_PERMISSIONS);
  }

  // Remove duplicates
  return [...new Set(permissions)];
}

// Convenience functions for common checks
export function canCreateUsers(user: User): boolean {
  return hasPermission(user, 'users:create');
}

export function canDeleteUsers(user: User): boolean {
  return hasPermission(user, 'users:delete');
}

export function canCreateTasks(user: User): boolean {
  return hasPermission(user, 'tasks:create');
}

export function canDeleteTasks(user: User): boolean {
  return hasPermission(user, 'tasks:delete');
}

export function canManageBilling(user: User): boolean {
  return hasPermission(user, 'settings:billing');
}

export function canTransferOwnership(user: User): boolean {
  return hasPermission(user, 'settings:transfer_ownership');
}

export function canViewAllAnalytics(user: User): boolean {
  return hasPermission(user, 'analytics:view:all');
}

export function canUseAI(user: User): boolean {
  return hasPermission(user, 'ai:use');
}

export function isAccountOwner(user: User): boolean {
  return user.is_account_owner === true;
}
```

---

## Usage Examples

### In API Routes

```typescript
// src/app/api/users/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: Request) {
  const supabase = await createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get user profile
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. Check permission
  if (!hasPermission(currentUser, 'users:create')) {
    return NextResponse.json(
      { error: 'Forbidden - you do not have permission to create users' },
      { status: 403 }
    );
  }

  // 4. Perform action
  const body = await request.json();
  // ... create user logic
}
```

### In Server Components

```typescript
// src/app/app/users/page.tsx
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import CreateUserButton from '@/components/users/CreateUserButton';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  const canCreate = hasPermission(currentUser, 'users:create');

  return (
    <div>
      <h1>Users</h1>
      {canCreate && <CreateUserButton />}
      {/* User list */}
    </div>
  );
}
```

### In Client Components

```typescript
// src/components/users/UserCard.tsx
'use client';

import { hasPermission } from '@/lib/permissions';
import type { User } from '@/types';

interface UserCardProps {
  user: User;
  currentUser: User;
}

export default function UserCard({ user, currentUser }: UserCardProps) {
  const canEdit = hasPermission(currentUser, 'users:edit');
  const canDelete = hasPermission(currentUser, 'users:delete');

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <div className="actions">
        {canEdit && <button onClick={handleEdit}>Edit</button>}
        {canDelete && <button onClick={handleDelete}>Delete</button>}
      </div>
    </div>
  );
}
```

### Resource Ownership Checks

```typescript
// Check if user owns the resource
export async function canEditTask(
  user: User,
  taskId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Can edit all tasks?
  if (hasPermission(user, 'tasks:edit:all')) {
    return true;
  }

  // Can edit own tasks?
  if (hasPermission(user, 'tasks:edit:own')) {
    const { data: task } = await supabase
      .from('tasks')
      .select('created_by_user_id')
      .eq('id', taskId)
      .single();

    return task?.created_by_user_id === user.id;
  }

  return false;
}

// Usage in API route
export async function PUT(request: Request) {
  const { taskId } = await request.json();
  const currentUser = await getCurrentUser();

  const canEdit = await canEditTask(currentUser, taskId, supabase);
  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update task...
}
```

---

## Testing Permissions

### Unit Tests

```typescript
// src/lib/__tests__/permissions.test.ts
import { hasPermission, getUserPermissions } from '../permissions';
import type { User } from '@/types';

describe('Permission System', () => {
  describe('Account Owner', () => {
    const accountOwner: User = {
      id: 'uuid',
      role: 'manager',
      is_account_owner: true,
      is_family_manager: false,
      is_platform_admin: false,
      // ... other fields
    };

    test('can create users', () => {
      expect(hasPermission(accountOwner, 'users:create')).toBe(true);
    });

    test('can delete users', () => {
      expect(hasPermission(accountOwner, 'users:delete')).toBe(true);
    });

    test('can manage billing', () => {
      expect(hasPermission(accountOwner, 'settings:billing')).toBe(true);
    });

    test('can transfer ownership', () => {
      expect(hasPermission(accountOwner, 'settings:transfer_ownership')).toBe(true);
    });
  });

  describe('Manager Role (not account owner)', () => {
    const manager: User = {
      id: 'uuid',
      role: 'manager',
      is_account_owner: false,
      is_family_manager: false,
      is_platform_admin: false,
      // ... other fields
    };

    test('can create users', () => {
      expect(hasPermission(manager, 'users:create')).toBe(true);
    });

    test('cannot delete users', () => {
      expect(hasPermission(manager, 'users:delete')).toBe(false);
    });

    test('cannot manage billing', () => {
      expect(hasPermission(manager, 'settings:billing')).toBe(false);
    });

    test('cannot transfer ownership', () => {
      expect(hasPermission(manager, 'settings:transfer_ownership')).toBe(false);
    });
  });

  describe('Adult Role', () => {
    const adult: User = {
      id: 'uuid',
      role: 'adult',
      is_family_manager: false,
      is_platform_admin: false,
    };

    test('can create tasks', () => {
      expect(hasPermission(adult, 'tasks:create')).toBe(true);
    });

    test('cannot delete users', () => {
      expect(hasPermission(adult, 'users:delete')).toBe(false);
    });

    test('cannot manage billing', () => {
      expect(hasPermission(adult, 'settings:billing')).toBe(false);
    });
  });

  describe('Family Manager (Adult)', () => {
    const familyManager: User = {
      id: 'uuid',
      role: 'adult',
      is_account_owner: false,
      is_family_manager: true,
      is_platform_admin: false,
    };

    test('can create users', () => {
      expect(hasPermission(familyManager, 'users:create')).toBe(true);
    });

    test('cannot delete users (account owner only)', () => {
      expect(hasPermission(familyManager, 'users:delete')).toBe(false);
    });

    test('cannot manage billing (account owner only)', () => {
      expect(hasPermission(familyManager, 'settings:billing')).toBe(false);
    });

    test('cannot transfer ownership (account owner only)', () => {
      expect(hasPermission(familyManager, 'settings:transfer_ownership')).toBe(false);
    });
  });

  describe('Platform Admin', () => {
    const platformAdmin: User = {
      id: 'uuid',
      role: 'manager',
      is_family_manager: false,
      is_platform_admin: true,
    };

    test('has all permissions', () => {
      expect(hasPermission(platformAdmin, 'users:create')).toBe(true);
      expect(hasPermission(platformAdmin, 'users:delete')).toBe(true);
      expect(hasPermission(platformAdmin, 'settings:billing')).toBe(true);
      expect(hasPermission(platformAdmin, 'ai:use')).toBe(true);
    });
  });
});
```

### Integration Tests

```typescript
// Test API route permissions
describe('POST /api/users', () => {
  test('manager can create users', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { Cookie: managerSessionCookie },
      body: JSON.stringify({ name: 'New User', role: 'kid' }),
    });

    expect(response.status).toBe(200);
  });

  test('kid cannot create users', async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { Cookie: kidSessionCookie },
      body: JSON.stringify({ name: 'New User', role: 'kid' }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('permission'),
    });
  });
});
```

---

## Adding New Permissions

### Step-by-Step Guide

**1. Define the Permission**

```typescript
// src/lib/permissions.ts

export type Permission =
  | 'users:create'
  | 'users:edit'
  // ... existing permissions
  | 'reports:generate' // NEW PERMISSION
  | 'reports:export'; // NEW PERMISSION
```

**2. Assign to Roles**

```typescript
const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  manager: [
    // ... existing permissions
    'reports:generate',
    'reports:export',
  ],
  adult: [
    // ... existing permissions
    'reports:generate', // Adults can generate but not export
  ],
  teen: [
    // ... existing permissions
    // Teens cannot generate reports
  ],
  kid: [
    // ... existing permissions
  ],
};
```

**3. Create Convenience Function** (optional)

```typescript
export function canGenerateReports(user: User): boolean {
  return hasPermission(user, 'reports:generate');
}
```

**4. Use in Code**

```typescript
// API route
export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  if (!hasPermission(currentUser, 'reports:generate')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Generate report...
}

// Component
{canGenerateReports(currentUser) && (
  <GenerateReportButton />
)}
```

**5. Write Tests**

```typescript
test('manager can generate reports', () => {
  expect(hasPermission(manager, 'reports:generate')).toBe(true);
});

test('kid cannot generate reports', () => {
  expect(hasPermission(kid, 'reports:generate')).toBe(false);
});
```

---

## Advanced Patterns

### Context-Aware Permissions

```typescript
// Check permission based on context
export function canCompleteTask(
  user: User,
  task: Task
): boolean {
  // Anyone with tasks:complete permission
  if (hasPermission(user, 'tasks:complete')) {
    // But only if task is assigned to them or unassigned
    if (!task.assigned_to_user_id || task.assigned_to_user_id === user.id) {
      return true;
    }
  }

  return false;
}
```

### Permission Middleware

```typescript
// src/lib/middleware/requirePermission.ts
import { NextResponse } from 'next/server';
import type { Permission } from '@/lib/permissions';
import { hasPermission } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/auth/helpers';

export function requirePermission(permission: Permission) {
  return async (request: Request) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(currentUser, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null; // Permission granted
  };
}

// Usage
export async function DELETE(request: Request) {
  const error = await requirePermission('users:delete')(request);
  if (error) return error;

  // Delete user...
}
```

### Dynamic Permissions (Future)

```typescript
// For future use - store permissions in database
interface UserPermission {
  user_id: string;
  permission: Permission;
  granted_at: Date;
  granted_by: string;
}

// This allows granting one-off permissions
// Example: Grant 'tasks:delete' to a specific teen for one day
```

---

## Permission Audit

### Log Permission Checks

```typescript
export function hasPermission(user: User, permission: Permission): boolean {
  const result = // ... permission check logic

  // Log for audit (in production, log to database)
  if (process.env.AUDIT_PERMISSIONS === 'true') {
    console.log({
      user_id: user.id,
      permission,
      granted: result,
      timestamp: new Date(),
    });
  }

  return result;
}
```

### Permission Report

```typescript
// Generate report of all user permissions
export function generatePermissionReport(users: User[]): Record<string, Permission[]> {
  const report: Record<string, Permission[]> = {};

  users.forEach(user => {
    report[user.id] = getUserPermissions(user);
  });

  return report;
}
```

---

## Best Practices

1. **Always use permission checks, never role checks directly**
   ```typescript
   // ❌ BAD
   if (user.role === 'manager') { ... }

   // ✅ GOOD
   if (hasPermission(user, 'users:create')) { ... }
   ```

2. **Check permissions as early as possible**
   - API routes: Check immediately after authentication
   - Components: Check before rendering action buttons

3. **Fail closed (deny by default)**
   - If permission check fails, deny access
   - Don't assume permissions

4. **Use convenience functions for common checks**
   ```typescript
   // Instead of:
   if (hasPermission(user, 'settings:billing')) { ... }

   // Use:
   if (canManageBilling(user)) { ... }
   ```

5. **Test permission changes thoroughly**
   - Unit tests for permission logic
   - Integration tests for API routes
   - Manual testing for UI

---

## Migration from Role-Based

If you have existing role-based checks:

```typescript
// Before
if (user.role === 'manager' || user.role === 'admin') {
  // Can create tasks
}

// After
if (hasPermission(user, 'tasks:create')) {
  // Can create tasks
}
```

**Migration Script:**

```bash
# Find all role checks
grep -r "user.role ===" src/

# Replace with permission checks
# Do this manually to ensure correctness
```

---

## Conclusion

The permission-based system provides:
- ✅ Future-proof authorization
- ✅ Easy to add new roles
- ✅ Flexible permission assignment
- ✅ Clear permission documentation
- ✅ Testable authorization logic

**Remember:** Always check permissions, not roles!

---

**Next:** See `PLATFORM_ADMIN_GUIDE.md` for platform admin features.
