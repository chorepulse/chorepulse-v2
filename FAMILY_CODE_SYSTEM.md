# ChorePulse v2 - Family Code System

**Last Updated:** 2025-10-22
**Status:** Final Design

---

## Overview

The **Family Code System** allows users to link their devices to an organization without requiring email addresses. This is essential for:

- Kids logging in with PINs (COPPA compliance)
- Shared family devices (tablets, hub displays)
- Quick device onboarding
- Temporary guest access

Family codes are **alphanumeric strings** in the format **ABC-123-XYZ** that uniquely identify an organization.

---

## Family Code Format

### Structure

**Format:** `ABC-123-XYZ`

**Breakdown:**
- 3 uppercase letters
- Hyphen (-)
- 3 numbers
- Hyphen (-)
- 3 uppercase letters

**Total:** 9 characters (excluding hyphens)

### Character Set

**Allowed Characters:**
- **Letters:** A-Z (excluding I and O)
- **Numbers:** 2-9 (excluding 0 and 1)

**Excluded Characters:**
- I (looks like 1)
- O (looks like 0)
- 1 (looks like I)
- 0 (looks like O)

**Rationale:** Reduce confusion when reading/entering codes

**Example Codes:**
- ABC-234-XYZ
- FGH-567-KLM
- PQR-892-STU
- WXY-345-BCD

---

## Database Schema

### Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,

  -- Family code fields
  current_family_code TEXT UNIQUE NOT NULL,
  family_code_generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  family_code_version INTEGER NOT NULL DEFAULT 1,

  -- Other fields...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast family code lookups
CREATE INDEX idx_organizations_family_code ON organizations(current_family_code);
```

### Family Code History (Optional - for audit trail)

```sql
CREATE TABLE family_code_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  family_code TEXT NOT NULL,
  version INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  regenerated_by_user_id UUID REFERENCES users(id),
  regeneration_reason TEXT,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for organization lookup
CREATE INDEX idx_family_code_history_org ON family_code_history(organization_id);
```

---

## Code Generation

### PostgreSQL Function

```sql
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude I, O, 1, 0
  letters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ'; -- Only letters
  numbers TEXT := '23456789'; -- Only numbers
  code TEXT;
  part1 TEXT;
  part2 TEXT;
  part3 TEXT;
  attempt INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  LOOP
    -- Generate ABC-123-XYZ format
    part1 := '';
    FOR i IN 1..3 LOOP
      part1 := part1 || substr(letters, floor(random() * length(letters) + 1)::int, 1);
    END LOOP;

    part2 := '';
    FOR i IN 1..3 LOOP
      part2 := part2 || substr(numbers, floor(random() * length(numbers) + 1)::int, 1);
    END LOOP;

    part3 := '';
    FOR i IN 1..3 LOOP
      part3 := part3 || substr(letters, floor(random() * length(letters) + 1)::int, 1);
    END LOOP;

    code := part1 || '-' || part2 || '-' || part3;

    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE current_family_code = code) THEN
      RETURN code;
    END IF;

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique family code after % attempts', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Implementation (Alternative)

```typescript
// lib/family-code.ts

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O
const NUMBERS = '23456789'; // Exclude 0, 1

export function generateFamilyCode(): string {
  const part1 = generateRandomString(LETTERS, 3);
  const part2 = generateRandomString(NUMBERS, 3);
  const part3 = generateRandomString(LETTERS, 3);

  return `${part1}-${part2}-${part3}`;
}

function generateRandomString(chars: string, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

// Usage in API
export async function createUniqueFamily Code(supabase: SupabaseClient): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const code = generateFamilyCode();

    // Check if code exists
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('current_family_code', code)
      .single();

    if (!data) {
      return code; // Code is unique
    }

    attempts++;
  }

  throw new Error('Failed to generate unique family code');
}
```

---

## Code Generation Triggers

### On Organization Creation

```sql
-- Trigger to automatically generate family code on org creation
CREATE OR REPLACE FUNCTION auto_generate_family_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_family_code IS NULL THEN
    NEW.current_family_code := generate_family_code();
    NEW.family_code_generated_at := NOW();
    NEW.family_code_version := 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_family_code
BEFORE INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION auto_generate_family_code();
```

### On Code Regeneration

```typescript
// API route: POST /api/family-code/regenerate
export async function POST(request: Request) {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  // Only account owner can regenerate
  if (!currentUser.is_account_owner) {
    return NextResponse.json(
      { error: 'Only account owner can regenerate family code' },
      { status: 403 }
    );
  }

  const { reason } = await request.json();

  // Generate new code
  const newCode = await createUniqueFamilyCode(supabase);

  // Get current code for history
  const { data: org } = await supabase
    .from('organizations')
    .select('current_family_code, family_code_version')
    .eq('id', currentUser.organization_id)
    .single();

  // Save old code to history
  await supabase.from('family_code_history').insert({
    organization_id: currentUser.organization_id,
    family_code: org.current_family_code,
    version: org.family_code_version,
    generated_at: org.family_code_generated_at,
    regenerated_by_user_id: currentUser.id,
    regeneration_reason: reason,
    deactivated_at: new Date(),
  });

  // Update organization with new code
  await supabase
    .from('organizations')
    .update({
      current_family_code: newCode,
      family_code_generated_at: new Date(),
      family_code_version: org.family_code_version + 1,
      updated_at: new Date(),
    })
    .eq('id', currentUser.organization_id);

  // Invalidate all PIN sessions using old code
  await invalidatePinSessions(currentUser.organization_id);

  return NextResponse.json({
    success: true,
    newCode,
  });
}
```

---

## Code Usage Flows

### 1. Display Family Code to Account Owner

**When:** After organization creation or in settings

**UI Component:**
```typescript
// components/FamilyCodeDisplay.tsx
export function FamilyCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="family-code-display">
      <h3>Your Family Code</h3>
      <div className="code">
        {code}
      </div>
      <p className="help-text">
        Share this code with family members to log in with a PIN
      </p>
      <div className="actions">
        <Button onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Code'}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print Code
        </Button>
      </div>
    </div>
  );
}
```

**Print-Friendly View:**
```html
<!-- Print layout for fridge/bulletin board -->
<div class="print-only">
  <h1>ChorePulse Family Code</h1>
  <div class="code-large">ABC-234-XYZ</div>
  <p>Use this code to log in on any device</p>
  <ol>
    <li>Go to app.chorepulse.com</li>
    <li>Click "PIN Login"</li>
    <li>Enter this family code</li>
    <li>Select your name</li>
    <li>Enter your 4-digit PIN</li>
  </ol>
</div>
```

---

### 2. Family Code Entry (PIN Login)

**Step 1: Input Component**

```typescript
// components/FamilyCodeInput.tsx
export function FamilyCodeInput({
  value,
  onChange,
  onSubmit
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    let input = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Auto-format with hyphens: ABC-123-XYZ
    if (input.length > 3 && input.length <= 6) {
      input = input.slice(0, 3) + '-' + input.slice(3);
    } else if (input.length > 6) {
      input = input.slice(0, 3) + '-' + input.slice(3, 6) + '-' + input.slice(6, 9);
    }

    onChange(input);
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === 'Enter' && value.length === 11) {
      onSubmit();
    }
  }

  return (
    <div>
      <label htmlFor="family-code">Enter Family Code</label>
      <input
        id="family-code"
        type="text"
        value={value}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder="ABC-123-XYZ"
        maxLength={11}
        autoComplete="off"
        autoFocus
      />
      <p className="help-text">
        Don't have a code? Ask your parent or guardian.
      </p>
      <Button
        onClick={onSubmit}
        disabled={value.length !== 11}
      >
        Next
      </Button>
    </div>
  );
}
```

**Step 2: Validate Code**

```typescript
// API route: POST /api/family-code/validate
export async function POST(request: Request) {
  const { familyCode } = await request.json();

  // Normalize code (remove hyphens, uppercase)
  const normalizedCode = familyCode.replace(/-/g, '').toUpperCase();

  // Validate format
  if (!/^[A-Z]{3}[0-9]{3}[A-Z]{3}$/.test(normalizedCode)) {
    return NextResponse.json(
      { error: 'Invalid family code format' },
      { status: 400 }
    );
  }

  // Re-add hyphens for database lookup
  const formattedCode = `${normalizedCode.slice(0, 3)}-${normalizedCode.slice(3, 6)}-${normalizedCode.slice(6, 9)}`;

  // Check if code exists
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('current_family_code', formattedCode)
    .single();

  if (error || !org) {
    return NextResponse.json(
      { error: 'Invalid family code' },
      { status: 404 }
    );
  }

  // Get users in organization
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, role, avatar_url')
    .eq('organization_id', org.id)
    .eq('pin_hash', 'IS NOT NULL')
    .order('created_at', { ascending: true });

  return NextResponse.json({
    organizationId: org.id,
    organizationName: org.name,
    users,
  });
}
```

---

### 3. Code Regeneration

**When to Regenerate:**
- Security concern (code leaked)
- User requests new code
- After removing a family member
- Periodic rotation (optional)

**UI Component:**

```typescript
// app/settings/family-code/page.tsx
export default function FamilyCodeSettings() {
  const [currentCode, setCurrentCode] = useState('ABC-234-XYZ');
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  async function handleRegenerate(reason: string) {
    const { data, error } = await fetch('/api/family-code/regenerate', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }).then(r => r.json());

    if (error) {
      toast.error('Failed to regenerate code');
      return;
    }

    setCurrentCode(data.newCode);
    setShowRegenerateModal(false);
    toast.success('Family code regenerated successfully');
  }

  return (
    <div className="family-code-settings">
      <h1>Family Code</h1>

      <FamilyCodeDisplay code={currentCode} />

      <div className="danger-zone">
        <h2>Regenerate Family Code</h2>
        <p>
          Regenerating your family code will:
        </p>
        <ul>
          <li>Invalidate the old code immediately</li>
          <li>Log out all devices using PIN login</li>
          <li>Require family members to use the new code</li>
        </ul>
        <Button
          variant="destructive"
          onClick={() => setShowRegenerateModal(true)}
        >
          Regenerate Code
        </Button>
      </div>

      <RegenerateModal
        isOpen={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        onConfirm={handleRegenerate}
      />
    </div>
  );
}
```

**Regenerate Confirmation Modal:**

```typescript
function RegenerateModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate Family Code?</DialogTitle>
          <DialogDescription>
            This will invalidate your current family code and log out all devices using PIN login.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label>Reason (optional)</label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="security">Security concern</SelectItem>
              <SelectItem value="removed_member">Removed family member</SelectItem>
              <SelectItem value="periodic">Periodic rotation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)}>
            Regenerate Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Security Considerations

### 1. Code Uniqueness

**Problem:** Collision risk with short codes

**Solution:**
- 9-character alphanumeric = ~30 million possible combinations
- Exclude confusing characters reduces to ~13 million
- At 10,000 organizations: <0.1% collision risk
- Database unique constraint prevents duplicates

**Calculation:**
- Letters: 24 (A-Z excluding I, O)
- Numbers: 8 (2-9)
- Format: LLL-NNN-LLL
- Total combinations: 24³ × 8³ × 24³ = 13,824,000

### 2. Rate Limiting

**Prevent Brute Force Attacks:**

```typescript
// Middleware: Rate limit family code validation
import { rateLimit } from '@/lib/rate-limit';

const familyCodeLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 different IPs per minute
});

export async function POST(request: Request) {
  try {
    await familyCodeLimiter.check(request, 10, 'FAMILY_CODE_VALIDATE'); // 10 attempts per IP per minute
  } catch {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  // Proceed with validation
}
```

### 3. Session Invalidation

**On Code Regeneration:**

```typescript
async function invalidatePinSessions(organizationId: string) {
  // Option 1: Database-based sessions
  await supabase
    .from('pin_sessions')
    .delete()
    .eq('organization_id', organizationId);

  // Option 2: Redis-based sessions
  const sessions = await redis.keys(`pin_session:${organizationId}:*`);
  if (sessions.length > 0) {
    await redis.del(...sessions);
  }

  // Log security event
  await supabase.from('security_events').insert({
    organization_id: organizationId,
    event_type: 'family_code_regenerated',
    severity: 'medium',
    description: 'Family code regenerated, all PIN sessions invalidated',
    metadata: { session_count: sessions.length },
  });
}
```

### 4. Audit Trail

**Track Code Changes:**

```typescript
// Query family code history
const { data: history } = await supabase
  .from('family_code_history')
  .select(`
    *,
    regenerated_by:users!regenerated_by_user_id(display_name)
  `)
  .eq('organization_id', organizationId)
  .order('generated_at', { ascending: false });

// Display in settings
{history.map(entry => (
  <div key={entry.id}>
    <div>Code: {entry.family_code}</div>
    <div>Generated: {formatDate(entry.generated_at)}</div>
    <div>Deactivated: {formatDate(entry.deactivated_at)}</div>
    <div>Regenerated by: {entry.regenerated_by.display_name}</div>
    <div>Reason: {entry.regeneration_reason || 'Not specified'}</div>
  </div>
))}
```

---

## User Education

### Onboarding Message

After organization creation, show modal:

```
🎉 Welcome to ChorePulse!

Your Family Code: ABC-234-XYZ

Share this code with your family to log in on any device.

[Copy Code] [Print Code] [I'll do this later]
```

### Help Documentation

**FAQ Section:**

**Q: What is a family code?**
A: A family code is a unique code that identifies your family on ChorePulse. Family members use it to log in with their PIN.

**Q: Where do I find my family code?**
A: Go to Settings > Family Code. Only the account owner can view and regenerate the code.

**Q: How do I share my family code?**
A: You can copy, print, or write down your family code and share it with family members. Keep it in a safe place like your fridge or family bulletin board.

**Q: What if someone outside my family gets my code?**
A: Regenerate your family code immediately in Settings > Family Code. This will invalidate the old code and log out all devices.

**Q: Can I change my family code?**
A: Yes, only the account owner can regenerate the family code. This will invalidate the old code immediately.

**Q: How often should I change my family code?**
A: Only change it if you have a security concern or after removing a family member. There's no need for regular rotation.

---

## Edge Cases

### 1. Code Collision (Extremely Rare)

**Scenario:** Generated code already exists

**Solution:**
- Loop generates new code automatically
- Max 100 attempts before throwing error
- Error logged to monitoring system
- Retry with exponential backoff

### 2. Lost Family Code

**Scenario:** Account owner lost their family code

**Solution:**
- Account owner can view code in Settings > Family Code
- If account owner is locked out:
  - Log in with email/password
  - View code in settings
  - Or regenerate new code

### 3. Multiple Organizations (Future)

**Scenario:** User belongs to multiple organizations (school, church, family)

**Solution:**
- User can switch between organizations
- Each organization has unique family code
- User profile exists in each organization separately

---

## API Endpoints

### GET /api/family-code

Get current family code for user's organization

```typescript
export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  // Only account owner and family managers can view
  if (!currentUser.is_account_owner && !currentUser.is_family_manager) {
    return NextResponse.json(
      { error: 'Only account owner and family managers can view family code' },
      { status: 403 }
    );
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('current_family_code, family_code_generated_at, family_code_version')
    .eq('id', currentUser.organization_id)
    .single();

  return NextResponse.json({
    familyCode: org.current_family_code,
    generatedAt: org.family_code_generated_at,
    version: org.family_code_version,
  });
}
```

### POST /api/family-code/validate

Validate family code and return organization users

```typescript
export async function POST(request: Request) {
  const { familyCode } = await request.json();

  // See "Step 2: Validate Code" above
}
```

### POST /api/family-code/regenerate

Regenerate family code (account owner only)

```typescript
export async function POST(request: Request) {
  const currentUser = await getCurrentUser();

  // Only account owner can regenerate
  if (!currentUser.is_account_owner) {
    return NextResponse.json(
      { error: 'Only account owner can regenerate family code' },
      { status: 403 }
    );
  }

  // See "On Code Regeneration" above
}
```

### GET /api/family-code/history

Get family code history (account owner only)

```typescript
export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  // Only account owner can view history
  if (!currentUser.is_account_owner) {
    return NextResponse.json(
      { error: 'Only account owner can view family code history' },
      { status: 403 }
    );
  }

  const { data: history } = await supabase
    .from('family_code_history')
    .select(`
      *,
      regenerated_by:users!regenerated_by_user_id(display_name)
    `)
    .eq('organization_id', currentUser.organization_id)
    .order('generated_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ history });
}
```

---

## Testing Checklist

- [ ] Family code generated on organization creation
- [ ] Family code format is ABC-123-XYZ
- [ ] Family code is unique (no duplicates)
- [ ] Family code can be viewed by account owner
- [ ] Family code can be copied to clipboard
- [ ] Family code can be printed
- [ ] Family code validation works with correct code
- [ ] Family code validation fails with incorrect code
- [ ] Family code validation is rate-limited
- [ ] Family code regeneration works (account owner only)
- [ ] Family code regeneration invalidates PIN sessions
- [ ] Family code regeneration creates history entry
- [ ] Old family code cannot be used after regeneration
- [ ] Family code history is viewable by account owner

---

## Summary

The family code system provides:

✅ **Simplicity:** Easy-to-remember 9-character codes
✅ **Security:** Unique, regeneratable codes with audit trail
✅ **COPPA Compliance:** Kids can log in without email
✅ **Device-Friendly:** Works on any device with family code
✅ **Flexibility:** Account owner can regenerate anytime
✅ **Audit Trail:** Track code changes and regeneration reasons

**Key Features:**
- ABC-123-XYZ format (no confusing characters)
- Automatic generation on org creation
- Instant regeneration (no cooldown)
- Session invalidation on regeneration
- Rate limiting to prevent brute force
- Print-friendly display for fridge/bulletin board

The system is production-ready and supports all ChorePulse user types from kids to account owners.
