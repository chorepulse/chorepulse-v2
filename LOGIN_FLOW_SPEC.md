# ChorePulse v2 - Login Flow Specification

**Last Updated:** 2025-10-22
**Status:** Final Design

---

## Overview

ChorePulse uses a **two-tier authentication system** to balance security with usability:

1. **PIN Login** - Quick access for completing tasks and viewing data (4-digit PIN, read-only)
2. **Email/Password Login** - Full access for managing family, tasks, and settings (Supabase Auth, full CRUD)

This design allows kids to quickly log in with a PIN on shared devices (hub mode, family tablet) while ensuring parents have secure, full-featured access via email/password.

---

## Authentication Types

### 1. PIN Authentication

**Purpose:** Quick, device-friendly access for all users

**Characteristics:**
- 4-digit numeric PIN
- Bcrypt hashed in database
- Read-only access (can view, complete tasks, redeem rewards)
- No email required
- Device-agnostic (works on any device with family code)
- Session expires after 30 minutes of inactivity

**Use Cases:**
- Kids completing tasks on family hub
- Quick check-ins on mobile devices
- Shared family devices (tablets, wall-mounted displays)

**Limitations:**
- Cannot create/edit/delete tasks, rewards, or users
- Cannot access settings or billing
- Cannot approve tasks or rewards (managers/parents only)

---

### 2. Email/Password Authentication

**Purpose:** Secure, full-featured access for managing family

**Characteristics:**
- Email + password (Supabase Auth)
- Full CRUD permissions (based on role)
- Can access settings, billing, integrations
- Persistent sessions (30-day remember me)
- Email verification required (7-day grace period)
- Password reset via email

**Use Cases:**
- Parents managing family organization
- Creating/editing tasks and rewards
- Accessing billing and settings
- Approving task completions and reward redemptions

**Required For:**
- Account Owner
- Family Managers
- Adults (optional, can use PIN for quick access)
- Teens (optional, can use PIN for quick access)

---

## User Types and Login Methods

| Role | Email/Password Required? | PIN Available? | Notes |
|------|--------------------------|----------------|-------|
| **Account Owner** | ✅ Yes | ✅ Yes (optional) | Must have email for billing |
| **Family Manager** | ✅ Yes | ✅ Yes (optional) | Must have email for invites |
| **Adult** | ✅ Yes | ✅ Yes (optional) | Must have email for full access |
| **Teen (13-17)** | ⚠️ Optional | ✅ Yes (primary) | Can have email if parent approves |
| **Kid (< 13)** | ❌ No | ✅ Yes (only option) | PIN only, COPPA compliance |

---

## Login Flows

### Flow 1: First-Time Account Creation (Account Owner)

**Context:** User creating a new ChorePulse organization

**Steps:**

1. **Landing Page:**
   - User clicks "Start Free Trial" or "Sign Up"
   - Redirected to `/signup`

2. **Email/Password Registration:**
   - Form fields:
     - Email (required)
     - Password (required, min 8 characters)
     - Confirm Password (required)
   - Submit → Supabase Auth creates account
   - Email verification sent (7-day grace period)

3. **Organization Setup Wizard:**
   - Step 1: Family name ("The Smith Family")
   - Step 2: Subscription tier selection (start with 14-day trial)
   - Step 3: Credit card collection (Stripe)
   - Submit → Creates organization with user as account owner

4. **Account Owner Profile Setup:**
   - Display name
   - Role (auto-set to "manager")
   - Birth month (optional for adults)
   - Set PIN (optional, for quick access)

5. **Add Family Members:**
   - Prompt: "Add your family members now or later"
   - Options:
     - "Add Second Parent" → Email invitation
     - "Add Kids" → Create profiles with PIN
     - "Skip for now" → Go to dashboard

6. **Dashboard:**
   - Welcome message
   - Getting started checklist
   - Family code displayed prominently

**Database Operations:**
```sql
-- 1. Create Supabase auth user
INSERT INTO auth.users (email, encrypted_password, ...) VALUES (...);

-- 2. Create organization
INSERT INTO organizations (name, subscription_tier, subscription_status, owner_user_id)
VALUES ('The Smith Family', 'pulse_premium', 'trialing', <auth_user_id>);

-- 3. Create user profile
INSERT INTO users (
  auth_user_id,
  organization_id,
  display_name,
  role,
  is_account_owner,
  pin_hash,
  email_verified
) VALUES (
  <auth_user_id>,
  <org_id>,
  'Josh Smith',
  'manager',
  true,
  <bcrypt_hash_of_pin>,
  false -- Verification sent, 7-day grace period
);
```

---

### Flow 2: Returning User - Email/Password Login

**Context:** User logging in on their personal device

**Steps:**

1. **Login Page:**
   - User navigates to `/login`
   - Form fields:
     - Email
     - Password
     - "Remember me" checkbox (default checked)

2. **Supabase Auth:**
   - Submit → `supabase.auth.signInWithPassword({ email, password })`
   - On success: Redirect to `/app`
   - On failure: Show error ("Invalid credentials")

3. **Session Handling:**
   - If "Remember me" checked: 30-day session
   - If not checked: Session expires on browser close
   - Session stored in cookie (`sb-access-token`)

4. **Dashboard:**
   - User sees full dashboard with CRUD capabilities

**Email Verification Check:**
```typescript
// After login, check if email is verified
const { data: user } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('email_verified, email_verified_at, created_at')
  .eq('auth_user_id', user.id)
  .single();

// If not verified and > 7 days since signup, show warning banner
const daysSinceSignup = (Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24);

if (!profile.email_verified && daysSinceSignup > 7) {
  // Show banner: "Please verify your email. Resend verification"
}
```

---

### Flow 3: PIN Login (Quick Access)

**Context:** User logging in on family hub or shared device

**Steps:**

1. **Login Page:**
   - User navigates to `/login`
   - Tabs: "Email Login" | "PIN Login"
   - User clicks "PIN Login" tab

2. **Family Code Entry:**
   - Form fields:
     - Family Code (ABC-123-XYZ format)
     - Auto-format as user types (add hyphens)
   - Submit → Validates family code exists

3. **User Selection:**
   - Show list of users in that organization
   - Display:
     - Avatar (or initials)
     - Display name
     - Role (icon)
   - User clicks their profile

4. **PIN Entry:**
   - 4-digit PIN input
   - Large, touch-friendly buttons
   - Submit → Validates PIN against bcrypt hash

5. **Session Creation:**
   - Create temporary session (30-minute expiry)
   - Flag session as "PIN-authenticated" (read-only)
   - Redirect to `/app`

6. **Dashboard (Read-Only Mode):**
   - Banner: "Logged in with PIN. Upgrade to email login for full access."
   - Show dashboard with limited actions:
     - ✅ Can view tasks, rewards, calendar
     - ✅ Can complete tasks
     - ✅ Can redeem rewards
     - ❌ Cannot create/edit/delete
     - ❌ Cannot access settings

**API Implementation:**
```typescript
// POST /api/auth/pin-login
export async function POST(request: Request) {
  const { familyCode, userId, pin } = await request.json();

  // 1. Validate family code
  const { data: org } = await supabase
    .from('organizations')
    .select('id, current_family_code')
    .eq('current_family_code', familyCode)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Invalid family code' }, { status: 401 });
  }

  // 2. Get user
  const { data: user } = await supabase
    .from('users')
    .select('id, pin_hash, organization_id')
    .eq('id', userId)
    .eq('organization_id', org.id)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. Validate PIN
  const isValidPin = await bcrypt.compare(pin, user.pin_hash);
  if (!isValidPin) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
  }

  // 4. Create temporary session
  const sessionToken = await createPinSession(user.id, org.id);

  // 5. Return session
  return NextResponse.json({ sessionToken, userId: user.id });
}
```

**Session Storage:**
```typescript
// Store PIN session in Redis or database with 30-minute TTL
interface PinSession {
  userId: string;
  organizationId: string;
  authenticationType: 'pin';
  expiresAt: Date;
  createdAt: Date;
}
```

---

### Flow 4: Kid First-Time Login

**Context:** Parent sets up kid profile and kid logs in for first time

**Steps:**

**Parent Actions:**

1. **Dashboard → "Add Family Member":**
   - Click "Add Kid"
   - Form:
     - Display name
     - Role (kid or teen)
     - Birth month (for age tracking)
     - Set PIN (parent enters 4-digit PIN for kid)
   - Submit → Creates user profile

2. **Show Family Code:**
   - Modal: "Your family code is ABC-123-XYZ"
   - Instructions: "Share this code with your family to log in"
   - Option: "Print family code" (for fridge, bulletin board)

**Kid Actions:**

3. **Navigate to ChorePulse:**
   - On tablet/hub device, go to app.chorepulse.com
   - Click "PIN Login"

4. **Family Code Entry:**
   - Enter ABC-123-XYZ (parent helps if needed)
   - Submit

5. **User Selection:**
   - See all family members
   - Kid clicks their profile (parent helps if needed)

6. **PIN Entry:**
   - Enter 4-digit PIN (parent whispers it or kid remembers)
   - Submit

7. **First-Time Welcome Wizard:**
   - Animated welcome: "Hi [Name]! Welcome to ChorePulse!"
   - Tutorial: "Here's how to complete a task"
   - Tutorial: "Here's how to earn points"
   - Tutorial: "Here's how to redeem rewards"
   - Button: "Let's go!"

8. **Dashboard:**
   - Kid-friendly dashboard with large buttons
   - Gamified elements (points, streak, leaderboard)

---

### Flow 5: Second Parent Invitation

**Context:** Account owner invites second parent to join

**Steps:**

**Account Owner Actions:**

1. **Dashboard → "Add Family Member":**
   - Click "Add Second Parent"
   - Form:
     - Email address
     - Role (manager or adult)
     - Make Family Manager? (checkbox)
   - Submit → Sends invitation email

2. **Database Entry:**
   ```sql
   INSERT INTO user_invitations (
     organization_id,
     email,
     role,
     is_family_manager,
     invited_by_user_id,
     invitation_token,
     expires_at
   ) VALUES (
     <org_id>,
     'partner@email.com',
     'manager',
     false,
     <account_owner_id>,
     <random_token>,
     NOW() + INTERVAL '7 days'
   );
   ```

**Second Parent Actions:**

3. **Invitation Email:**
   - Subject: "You've been invited to join [Family Name] on ChorePulse!"
   - Body:
     - "[Account Owner Name] has invited you to join their family on ChorePulse."
     - "ChorePulse helps families manage tasks, rewards, and calendars together."
     - Button: "Accept Invitation"
   - Link: `https://app.chorepulse.com/invite?token=<invitation_token>`

4. **Accept Invitation Page:**
   - Shows family name and who invited them
   - Form:
     - Display name
     - Password (if new account)
     - OR "Already have an account? Sign in"

5. **Account Creation:**
   - If new account: Create Supabase auth user
   - If existing: Link to existing auth user

6. **Join Organization:**
   ```sql
   INSERT INTO users (
     auth_user_id,
     organization_id,
     display_name,
     role,
     is_family_manager
   ) VALUES (
     <auth_user_id>,
     <org_id>,
     'Partner Name',
     'manager',
     false
   );
   ```

7. **Dashboard:**
   - Logged in, sees family dashboard
   - Welcome message: "You've joined [Family Name]!"

---

### Flow 6: Teen Gets Email/Password (Upgrade from PIN)

**Context:** Teen has been using PIN, now wants email/password for full access

**Steps:**

**Parent Actions:**

1. **Dashboard → Family Members → [Teen Profile]:**
   - Click "Edit"
   - Section: "Email Login"
   - Toggle: "Allow email/password login" (off by default)
   - Turn ON toggle
   - Form appears:
     - Email address for teen
     - Parent checkbox: "I consent to my teen having an email account"
   - Submit → Sends setup email to teen

**Teen Actions:**

2. **Setup Email:**
   - Teen receives email: "Set up your ChorePulse account"
   - Link: `https://app.chorepulse.com/setup-email?token=<token>`
   - Teen clicks link

3. **Password Setup:**
   - Form:
     - Email (pre-filled, read-only)
     - Create password
     - Confirm password
   - Submit → Links Supabase auth account to existing user profile

4. **Database Update:**
   ```sql
   UPDATE users
   SET
     auth_user_id = <new_auth_user_id>,
     email_verified = true,
     updated_at = NOW()
   WHERE id = <teen_user_id>;
   ```

5. **Login Options:**
   - Teen can now use either:
     - PIN login (quick access, read-only)
     - Email/password login (full access based on role)

---

## Session Management

### PIN Sessions

**Storage:** Redis or database table

**Structure:**
```typescript
interface PinSession {
  id: string;
  userId: string;
  organizationId: string;
  authenticationType: 'pin';
  createdAt: Date;
  expiresAt: Date; // 30 minutes from createdAt
  lastActivityAt: Date;
}
```

**Validation:**
```typescript
// Middleware to check PIN session
export async function validatePinSession(sessionToken: string) {
  const session = await redis.get(`pin_session:${sessionToken}`);

  if (!session) {
    throw new Error('Session expired or invalid');
  }

  // Check if session expired
  if (new Date() > new Date(session.expiresAt)) {
    await redis.del(`pin_session:${sessionToken}`);
    throw new Error('Session expired');
  }

  // Extend session on activity (sliding window)
  session.lastActivityAt = new Date();
  session.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // +30 minutes
  await redis.set(`pin_session:${sessionToken}`, session, { ex: 1800 }); // 30 min TTL

  return session;
}
```

**Expiration:**
- 30 minutes of inactivity
- Automatically cleared on expiration
- No "Remember me" option for PIN sessions

---

### Email/Password Sessions

**Storage:** Supabase Auth (JWT tokens)

**Token Types:**
- **Access Token:** Short-lived (1 hour), used for API requests
- **Refresh Token:** Long-lived (30 days if "Remember me"), used to get new access tokens

**Validation:**
```typescript
// Supabase Auth handles session validation automatically
const { data: { session }, error } = await supabase.auth.getSession();

if (error || !session) {
  // Redirect to login
  redirect('/login');
}

// Access user info
const { user } = session;
```

**Expiration:**
- Access token: 1 hour (auto-refreshed by Supabase client)
- Refresh token: 30 days (if "Remember me" checked)
- Manual logout: Clears both tokens

---

## Permission Checks

### PIN Authentication Restrictions

```typescript
// Middleware to check authentication type
export async function checkAuthenticationType(request: Request) {
  const session = await getSession(request);

  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    userId: session.userId,
    organizationId: session.organizationId,
    authenticationType: session.type, // 'pin' or 'email'
    isReadOnly: session.type === 'pin',
  };
}

// Usage in API routes
export async function POST(request: Request) {
  const auth = await checkAuthenticationType(request);

  if (auth.isReadOnly) {
    return NextResponse.json(
      { error: 'PIN login is read-only. Please log in with email/password for full access.' },
      { status: 403 }
    );
  }

  // Proceed with create/update/delete operation
}
```

### Role-Based Permissions

After authentication type check, apply role-based permissions:

```typescript
import { hasPermission } from '@/lib/permissions';

export async function POST(request: Request) {
  const auth = await checkAuthenticationType(request);

  // Get user profile
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', auth.userId)
    .single();

  // Check permission (from PERMISSIONS_SYSTEM.md)
  if (!hasPermission(user, 'tasks:create')) {
    return NextResponse.json(
      { error: 'You do not have permission to create tasks' },
      { status: 403 }
    );
  }

  // Create task
}
```

---

## UI Components

### Login Page Component Structure

```typescript
// app/login/page.tsx
export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'email' | 'pin'>('email');

  return (
    <div className="login-page">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="email">Email Login</TabsTrigger>
          <TabsTrigger value="pin">PIN Login</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <EmailLoginForm />
        </TabsContent>

        <TabsContent value="pin">
          <PinLoginForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Email Login Form

```typescript
function EmailLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('Invalid email or password');
      return;
    }

    // Redirect to dashboard
    router.push('/app');
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Checkbox
        checked={rememberMe}
        onCheckedChange={setRememberMe}
        label="Remember me"
      />
      <Button type="submit">Log In</Button>
      <Link href="/forgot-password">Forgot password?</Link>
    </form>
  );
}
```

### PIN Login Form

```typescript
function PinLoginForm() {
  const [step, setStep] = useState<'family_code' | 'user_select' | 'pin'>('family_code');
  const [familyCode, setFamilyCode] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');

  // Step 1: Family code entry
  async function handleFamilyCodeSubmit() {
    const { data, error } = await fetch('/api/auth/validate-family-code', {
      method: 'POST',
      body: JSON.stringify({ familyCode }),
    }).then(r => r.json());

    if (error) {
      toast.error('Invalid family code');
      return;
    }

    setUsers(data.users);
    setStep('user_select');
  }

  // Step 2: User selection
  function handleUserSelect(user) {
    setSelectedUser(user);
    setStep('pin');
  }

  // Step 3: PIN entry
  async function handlePinSubmit() {
    const { data, error } = await fetch('/api/auth/pin-login', {
      method: 'POST',
      body: JSON.stringify({
        familyCode,
        userId: selectedUser.id,
        pin,
      }),
    }).then(r => r.json());

    if (error) {
      toast.error('Invalid PIN');
      return;
    }

    // Store session token
    localStorage.setItem('pin_session_token', data.sessionToken);

    // Redirect to dashboard
    router.push('/app');
  }

  return (
    <div>
      {step === 'family_code' && (
        <FamilyCodeInput value={familyCode} onChange={setFamilyCode} onSubmit={handleFamilyCodeSubmit} />
      )}

      {step === 'user_select' && (
        <UserSelector users={users} onSelect={handleUserSelect} />
      )}

      {step === 'pin' && (
        <PinInput value={pin} onChange={setPin} onSubmit={handlePinSubmit} user={selectedUser} />
      )}
    </div>
  );
}
```

---

## Security Considerations

### PIN Security

1. **Bcrypt Hashing:**
   - PINs are hashed with bcrypt (cost factor 10)
   - Never store PINs in plain text
   - Hash comparison on server side only

2. **Rate Limiting:**
   - Max 5 PIN attempts per user per hour
   - After 5 failures: Lock for 1 hour
   - Show CAPTCHA after 3 failed attempts

3. **Session Security:**
   - PIN sessions expire after 30 minutes
   - No refresh mechanism (must re-enter PIN)
   - Sessions tied to IP address (prevent hijacking)

### Email/Password Security

1. **Supabase Auth Security:**
   - HTTPS only
   - JWT tokens signed with secret
   - Automatic token rotation
   - Password requirements: min 8 characters

2. **Email Verification:**
   - 7-day grace period before restriction
   - Resend verification link available
   - Verified status stored in database

3. **Password Reset:**
   - Magic link sent to email
   - Link expires after 1 hour
   - One-time use only

### Family Code Security

1. **Format:**
   - 9 characters: ABC-123-XYZ
   - Excludes confusing characters (I, 1, O, 0)
   - Alphanumeric with hyphens for readability

2. **Generation:**
   - Cryptographically random
   - Unique per organization
   - Can be regenerated by account owner

3. **Rotation:**
   - Regenerate on demand (no cooldown)
   - Old code immediately invalid
   - All PIN sessions using old code invalidated

---

## Error Handling

### Login Errors

| Error | Message | Action |
|-------|---------|--------|
| Invalid email/password | "Invalid email or password" | Prompt to retry or reset password |
| Email not verified | "Please verify your email. Resend verification?" | Show banner with resend link |
| Account locked | "Your account has been locked. Contact support." | Show support email |
| Invalid family code | "Invalid family code. Please check and try again." | Prompt to re-enter |
| Invalid PIN | "Invalid PIN. Please try again. (X attempts remaining)" | Prompt to retry, lock after 5 |
| Session expired | "Your session has expired. Please log in again." | Redirect to login |

### Database Errors

```typescript
try {
  // Login operation
} catch (error) {
  console.error('Login error:', error);

  // Log to monitoring (Sentry, etc.)
  captureException(error);

  // User-friendly error
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}
```

---

## Testing Checklist

### Email/Password Login Tests

- [ ] Successful login with valid credentials
- [ ] Failed login with invalid email
- [ ] Failed login with invalid password
- [ ] "Remember me" persists session for 30 days
- [ ] Email verification reminder after 7 days
- [ ] Password reset flow works
- [ ] Session expires after 1 hour (access token)
- [ ] Refresh token auto-refreshes access token

### PIN Login Tests

- [ ] Successful PIN login with valid family code and PIN
- [ ] Failed login with invalid family code
- [ ] Failed login with invalid PIN
- [ ] User selection shows all org users
- [ ] PIN session expires after 30 minutes
- [ ] Read-only restrictions enforced
- [ ] Rate limiting works (5 attempts per hour)
- [ ] Family code regeneration invalidates old code

### First-Time Flows

- [ ] Account owner can complete signup wizard
- [ ] Kid first login shows welcome wizard
- [ ] Second parent invitation email sent and accepted
- [ ] Teen email/password upgrade works

---

## Summary

The two-tier authentication system provides:

✅ **Security:** Email/password for sensitive operations
✅ **Usability:** PIN for quick, device-friendly access
✅ **COPPA Compliance:** Kids don't need email accounts
✅ **Flexibility:** Users can choose authentication method
✅ **Family-Friendly:** Shared devices supported with family code
✅ **Scalability:** Session management handles high traffic

**Key Features:**
- Bcrypt-hashed PINs
- 30-minute PIN sessions
- Read-only PIN access
- Full email/password access
- Family code for device linking
- First-time welcome wizards
- Second parent invitations

The system is production-ready and supports all user types from kids to account owners.
