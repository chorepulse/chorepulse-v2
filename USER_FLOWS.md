# ChorePulse v2 - User Flows

**Last Updated:** 2025-10-22
**Status:** Final Design

---

## Overview

This document outlines all user journeys through ChorePulse v2, organized by role and feature. Each flow includes:
- Entry points
- Step-by-step actions
- Decision points
- Success/error states
- Database operations

---

## Table of Contents

1. [Account Owner Flows](#account-owner-flows)
2. [Family Manager Flows](#family-manager-flows)
3. [Adult Flows](#adult-flows)
4. [Teen Flows](#teen-flows)
5. [Kid Flows](#kid-flows)
6. [Cross-Role Flows](#cross-role-flows)

---

## Account Owner Flows

### Flow 1: First-Time Account Creation

**Entry Point:** Landing page → "Start Free Trial" button

**Steps:**

1. **Sign Up Page:**
   - Enter email
   - Create password (min 8 characters)
   - Confirm password
   - Submit → Supabase creates auth account
   - Email verification sent (7-day grace period)

2. **Organization Setup Wizard - Step 1: Family Info**
   - Field: Family name (e.g., "The Smith Family")
   - Field: How many people in your family? (dropdown: 2-10+)
   - Next

3. **Organization Setup Wizard - Step 2: Subscription Tier**
   - Display 3 tiers side-by-side:
     - Pulse Starter (Free with ads)
     - **Pulse Premium ($39.99/year)** ← Recommended
     - Unlimited Pulse ($69.99/year)
   - Select tier
   - Button: "Start 14-day free trial"

4. **Organization Setup Wizard - Step 3: Payment Info** (if Premium or Unlimited)
   - Stripe payment form
   - Credit card required upfront
   - Checkbox: "I agree to Terms of Service"
   - Submit → Stripe creates customer and subscription

5. **Organization Creation:**
   - Database creates organization record
   - Generates family code (ABC-123-XYZ)
   - Sets user as account owner
   - Subscription status: "trialing"

6. **Account Owner Profile Setup:**
   - Field: Display name (pre-filled with email username)
   - Field: Birth month (optional dropdown)
   - Field: Set PIN (optional, 4-digit)
   - Submit

7. **Add Family Members Prompt:**
   - Modal: "Add your family now?"
   - Option 1: "Add Second Parent" → Email invitation flow
   - Option 2: "Add Kids" → Create kid profiles flow
   - Option 3: "Skip for now" → Go to dashboard

8. **Dashboard - First Visit:**
   - Welcome message: "Welcome to ChorePulse, [Name]!"
   - Getting Started checklist:
     - ✅ Create account
     - ⬜ Add family members
     - ⬜ Create your first task
     - ⬜ Set up your first reward
   - Family code displayed prominently
   - Empty states for tasks, rewards, calendar

**Database Operations:**
```sql
-- 1. Auth user
INSERT INTO auth.users (...) VALUES (...);

-- 2. Organization
INSERT INTO organizations (name, subscription_tier, subscription_status, current_family_code, owner_user_id)
VALUES ('The Smith Family', 'pulse_premium', 'trialing', generate_family_code(), <user_id>);

-- 3. User profile
INSERT INTO users (auth_user_id, organization_id, display_name, role, is_account_owner, pin_hash)
VALUES (<auth_id>, <org_id>, 'Josh Smith', 'manager', true, <pin_hash>);

-- 4. Stripe webhook creates subscription record
-- 5. Security event logged
```

---

### Flow 2: Transfer Ownership

**Entry Point:** Settings → Account → Transfer Ownership

**Steps:**

1. **Transfer Ownership Page:**
   - Warning banner: "Transferring ownership will give billing control to another user"
   - Dropdown: Select user (only shows managers and family managers)
   - Button: "Transfer Ownership" (disabled if no selection)

2. **Confirmation Modal:**
   - "Are you sure you want to transfer ownership to [User Name]?"
   - Consequences listed:
     - [User Name] will have full billing control
     - [User Name] can delete users
     - [User Name] can transfer ownership again
     - You will become a Family Manager
   - Input: Type "TRANSFER" to confirm
   - Button: "Confirm Transfer"

3. **Transfer Process:**
   - Update old owner: `is_account_owner = false`, `is_family_manager = true`
   - Update new owner: `is_account_owner = true`
   - Update organization: `owner_user_id = <new_owner_id>`
   - Log security event

4. **Success:**
   - Toast: "Ownership transferred to [User Name]"
   - Email sent to both users
   - Redirect to dashboard

**Database Operations:**
```sql
-- Check only one account owner per org (enforced by constraint)
UPDATE users SET is_account_owner = false, is_family_manager = true WHERE id = <old_owner_id>;
UPDATE users SET is_account_owner = true WHERE id = <new_owner_id>;
UPDATE organizations SET owner_user_id = <new_owner_id> WHERE id = <org_id>;

INSERT INTO security_events (organization_id, event_type, user_id, metadata)
VALUES (<org_id>, 'ownership_transferred', <old_owner_id>, '{"new_owner_id": "<new_owner_id>"}');
```

---

### Flow 3: Manage Billing

**Entry Point:** Settings → Billing

**Steps:**

1. **Billing Dashboard:**
   - Current plan: Pulse Premium ($39.99/year)
   - Next billing date: January 15, 2026
   - Payment method: •••• 4242 (Edit)
   - Billing history table
   - Buttons:
     - "Upgrade to Unlimited"
     - "Downgrade to Starter"
     - "Cancel Subscription"
     - "Update Payment Method"

2. **Upgrade Flow:**
   - Click "Upgrade to Unlimited"
   - Modal shows comparison:
     - Current: 100 tasks, 50 AI prompts
     - Unlimited: Unlimited tasks, 200 AI prompts, Meal planning
   - Shows prorated charge
   - Button: "Confirm Upgrade"
   - Stripe processes payment
   - Success: "You're now on Unlimited Pulse!"

3. **Downgrade Flow:**
   - Click "Downgrade to Starter"
   - Warning modal:
     - "You have 87 active tasks. Starter allows 30."
     - "Archive or delete 57 tasks before downgrade"
     - "Downgrade takes effect on next billing date"
   - Button: "Schedule Downgrade"
   - Success: Banner shows "Downgrade scheduled for [date]"

4. **Cancel Subscription:**
   - Click "Cancel Subscription"
   - Survey: "Why are you canceling?" (optional)
   - Confirmation: "Cancel at end of billing period or now?"
   - If end of period: Access until [date], then downgrade to Starter
   - If now: Immediate downgrade to Starter

**Database Operations:**
```sql
-- Upgrade
UPDATE organizations SET subscription_tier = 'unlimited_pulse' WHERE id = <org_id>;

-- Downgrade (scheduled)
UPDATE organizations SET
  subscription_tier_scheduled = 'pulse_starter',
  subscription_tier_change_date = <next_billing_date>
WHERE id = <org_id>;

-- Cancel
UPDATE organizations SET subscription_status = 'canceled', subscription_end_date = <date> WHERE id = <org_id>;
```

---

### Flow 4: Delete User

**Entry Point:** Settings → Family Members → [User] → Delete

**Steps:**

1. **Delete Confirmation Modal:**
   - "Delete [User Name]?"
   - Warning: "This cannot be undone"
   - Checkbox: "Transfer assigned tasks to:" (dropdown of other users or "Unassign")
   - Input: Type user's name to confirm
   - Button: "Delete User"

2. **Validation:**
   - Cannot delete self (must transfer ownership first)
   - Cannot delete last user in organization

3. **Deletion Process:**
   - Transfer or unassign tasks
   - Set user record to deleted: `deleted_at = NOW()`
   - Invalidate all sessions
   - Log security event

4. **Success:**
   - Toast: "[User Name] has been removed"
   - Redirect to family members list

**Database Operations:**
```sql
-- Soft delete (keep for audit trail)
UPDATE users SET deleted_at = NOW() WHERE id = <user_id>;

-- Transfer tasks
UPDATE tasks SET assigned_to_user_id = <new_user_id> WHERE assigned_to_user_id = <deleted_user_id>;

-- Log event
INSERT INTO security_events (organization_id, event_type, user_id, metadata)
VALUES (<org_id>, 'user_deleted', <account_owner_id>, '{"deleted_user_id": "<user_id>"}');
```

---

## Family Manager Flows

### Flow 5: Create Task

**Entry Point:** Dashboard → "Create Task" button

**Steps:**

1. **Create Task Form:**
   - Field: Task name (required)
   - Field: Description (optional)
   - Field: Point value (required, default: 10)
   - Field: Category (dropdown: Chores, Homework, Personal Care, Extra Credit)
   - Field: Assign to:
     - Radio: Single person (dropdown)
     - Radio: Multiple people (multi-select)
     - Radio: Rotation pool (multi-select, shows rotation order)
     - Radio: Extra Credit (anyone can claim)
   - Field: Schedule:
     - Radio: One-time (date picker)
     - Radio: Recurring (frequency: daily, weekly, monthly, custom)
   - Field: Photo proof required? (checkbox)
   - Field: Requires approval? (checkbox, shows approval threshold)
   - Button: "Create Task"

2. **Validation:**
   - Check if user has permission (`tasks:create`)
   - Check if within tier limit (e.g., 100 tasks for Premium)

3. **Task Created:**
   - Task appears in dashboard
   - Toast: "Task created successfully"
   - If assigned to specific user: Notification sent

**Database Operations:**
```sql
INSERT INTO tasks (
  organization_id,
  title,
  description,
  point_value,
  category,
  assignment_type,
  assigned_to_user_ids,
  rotation_pool_user_ids,
  schedule_type,
  schedule_config,
  requires_photo_proof,
  requires_approval,
  created_by_user_id
) VALUES (...);

-- If recurring, create task_schedules record
INSERT INTO task_schedules (...) VALUES (...);
```

---

### Flow 6: Approve Task Completion

**Entry Point:** Dashboard → Pending Approvals badge → Task detail

**Steps:**

1. **Task Approval Page:**
   - Task name and description
   - Completed by: [User Name]
   - Completed at: [Timestamp]
   - Photo proof (if uploaded)
   - Point value: 10 points
   - Buttons:
     - "Approve" (green)
     - "Reject" (red)

2. **Approve:**
   - Click "Approve"
   - Task marked as approved
   - Points added to user's balance
   - Notification sent to user: "Great job! You earned 10 points for [Task]"
   - User's streak updated (if daily task)

3. **Reject:**
   - Click "Reject"
   - Modal: "Reason for rejection?" (optional text)
   - Task reverted to incomplete
   - Notification sent to user: "Task not approved. [Reason]"

**Database Operations:**
```sql
-- Approve
UPDATE task_completions SET
  approved_by_user_id = <manager_id>,
  approved_at = NOW(),
  status = 'approved'
WHERE id = <completion_id>;

UPDATE users SET points_balance = points_balance + <point_value> WHERE id = <user_id>;

-- Update streak
SELECT update_streak(<user_id>, CURRENT_DATE);

-- Reject
UPDATE task_completions SET
  status = 'rejected',
  rejection_reason = <reason>
WHERE id = <completion_id>;
```

---

## Adult Flows

### Flow 7: Complete Own Task

**Entry Point:** Dashboard → My Tasks → Click task

**Steps:**

1. **Task Detail Page:**
   - Task name and description
   - Point value
   - Due date
   - Photo proof required? (if yes, show camera button)
   - Button: "Mark Complete"

2. **Mark Complete:**
   - Click "Mark Complete"
   - If photo required:
     - Modal: "Take a photo or upload"
     - Camera interface or file upload
     - Submit photo
   - Task marked as complete
   - If auto-approve: Points awarded immediately
   - If requires approval: Task moves to "Pending Approval"

3. **Success:**
   - Toast: "Task completed! +10 points" (if auto-approved)
   - OR "Task submitted for approval" (if requires approval)
   - Task moves to "Completed" list
   - Points balance updated (if auto-approved)

**Database Operations:**
```sql
INSERT INTO task_completions (
  task_id,
  user_id,
  completed_at,
  photo_proof_url,
  status,
  approved_by_user_id,
  approved_at
) VALUES (
  <task_id>,
  <user_id>,
  NOW(),
  <photo_url>,
  CASE WHEN <auto_approve> THEN 'approved' ELSE 'pending' END,
  CASE WHEN <auto_approve> THEN <user_id> ELSE NULL END,
  CASE WHEN <auto_approve> THEN NOW() ELSE NULL END
);

-- If auto-approved
UPDATE users SET points_balance = points_balance + <point_value> WHERE id = <user_id>;
```

---

### Flow 8: Redeem Reward

**Entry Point:** Dashboard → Rewards → Click reward

**Steps:**

1. **Reward Detail Page:**
   - Reward name and description
   - Cost: 100 points
   - Your balance: 150 points
   - Requires approval? (if yes, show "Submit for approval")
   - Button: "Redeem" (disabled if insufficient points)

2. **Redeem:**
   - Click "Redeem"
   - Confirmation modal: "Redeem [Reward] for 100 points?"
   - Button: "Confirm"
   - Points deducted
   - If auto-approve: Reward marked as "Ready to deliver"
   - If requires approval: Reward moves to "Pending Approval"

3. **Success:**
   - Toast: "Reward redeemed! You have 50 points remaining"
   - If requires approval: "Reward submitted for approval"
   - Notification sent to manager (if requires approval)

**Database Operations:**
```sql
INSERT INTO reward_redemptions (
  reward_id,
  user_id,
  points_spent,
  redeemed_at,
  status,
  approved_by_user_id,
  approved_at
) VALUES (
  <reward_id>,
  <user_id>,
  <point_cost>,
  NOW(),
  CASE WHEN <auto_approve> THEN 'approved' ELSE 'pending' END,
  CASE WHEN <auto_approve> THEN <user_id> ELSE NULL END,
  CASE WHEN <auto_approve> THEN NOW() ELSE NULL END
);

-- Deduct points
UPDATE users SET points_balance = points_balance - <point_cost> WHERE id = <user_id>;
```

---

## Teen Flows

### Flow 9: First-Time Login (PIN)

**Entry Point:** app.chorepulse.com → PIN Login

**Steps:**

1. **Family Code Entry:**
   - Field: Family code (ABC-123-XYZ format)
   - Auto-formats with hyphens as user types
   - Submit

2. **User Selection:**
   - Shows all family members with PINs
   - Teen clicks their profile (avatar + name)

3. **PIN Entry:**
   - 4-digit PIN input
   - Large, touch-friendly number pad
   - Submit

4. **First-Time Welcome Wizard:**
   - Screen 1: "Hi [Name]! Welcome to ChorePulse! 🎉"
   - Screen 2: "Complete tasks to earn points 🌟"
   - Screen 3: "Redeem points for rewards 🎁"
   - Screen 4: "Track your progress and compete with family! 🏆"
   - Button: "Let's Go!"

5. **Dashboard:**
   - Teen-friendly interface
   - My Tasks (with point values)
   - My Points: [Balance]
   - My Streak: [Days]
   - Leaderboard
   - Available Rewards

**Database Operations:**
```sql
-- Validate family code
SELECT id, name FROM organizations WHERE current_family_code = <code>;

-- Get users in org
SELECT id, display_name, role, avatar_url FROM users
WHERE organization_id = <org_id> AND pin_hash IS NOT NULL;

-- Validate PIN
-- (bcrypt compare on server)

-- Create PIN session
INSERT INTO pin_sessions (user_id, organization_id, expires_at)
VALUES (<user_id>, <org_id>, NOW() + INTERVAL '30 minutes');

-- Update first login flag
UPDATE users SET first_login_completed = true WHERE id = <user_id>;
```

---

### Flow 10: Claim Extra Credit Task

**Entry Point:** Dashboard → Extra Credit tab → Click task

**Steps:**

1. **Extra Credit Task Detail:**
   - Task name: "Organize garage"
   - Description: "Sort and label storage bins"
   - Point value: 50 points (bonus!)
   - Claimed by: Nobody yet
   - Button: "Claim Task"

2. **Claim Task:**
   - Click "Claim Task"
   - Confirmation: "Claim this task for 50 points?"
   - Button: "Yes, Claim It"
   - Task assigned to teen
   - Toast: "Task claimed! Complete it to earn 50 points"

3. **Complete Task:**
   - Task now appears in "My Tasks"
   - Teen completes task (same flow as Flow 7)

**Database Operations:**
```sql
-- Claim task
UPDATE tasks SET
  assignment_type = 'individual',
  assigned_to_user_ids = ARRAY[<teen_id>],
  claimed_by_user_id = <teen_id>,
  claimed_at = NOW()
WHERE id = <task_id> AND assignment_type = 'extra_credit';

-- If already claimed, show error
```

---

## Kid Flows

### Flow 11: Complete Task with Photo Proof

**Entry Point:** Dashboard → My Tasks → Click task

**Steps:**

1. **Task Detail:**
   - Task name: "Clean room"
   - Point value: 10 points
   - Photo required: Yes
   - Button: "Take Photo"

2. **Take Photo:**
   - Click "Take Photo"
   - Camera opens (or file upload on desktop)
   - Kid takes photo of clean room
   - Preview photo
   - Button: "Submit"

3. **Photo Uploaded:**
   - Photo displayed in task detail
   - Button: "Mark Complete"

4. **Mark Complete:**
   - Click "Mark Complete"
   - Task submitted for approval
   - Toast: "Great job! Waiting for parent approval"

5. **Parent Approval:**
   - Parent sees task in pending approvals
   - Parent views photo
   - Parent approves
   - Kid receives notification: "Your task was approved! +10 points 🌟"

6. **Points Awarded:**
   - Kid's dashboard updates
   - Points balance increases
   - Celebration animation plays

**Database Operations:**
```sql
-- Upload photo to storage
-- Returns photo_proof_url

-- Mark complete
INSERT INTO task_completions (
  task_id,
  user_id,
  completed_at,
  photo_proof_url,
  status
) VALUES (
  <task_id>,
  <kid_id>,
  NOW(),
  <photo_url>,
  'pending'
);

-- Auto-delete photo after 7 days or approval
```

---

### Flow 12: View Leaderboard

**Entry Point:** Dashboard → Leaderboard tab

**Steps:**

1. **Leaderboard Page:**
   - Filter: Week | Month | All Time
   - Current filter: Week
   - List of family members:
     1. 🥇 Dad - 250 points
     2. 🥈 [Kid Name] - 180 points (YOU!)
     3. 🥉 Sister - 120 points
     4. Mom - 80 points
   - Kid's rank highlighted
   - Fun animations/confetti if #1

2. **Switch Filters:**
   - Click "Month" tab
   - Leaderboard updates
   - Kid sees different rankings

3. **View Profile:**
   - Click on family member
   - See their achievements, badges, streak
   - (Cannot see their tasks - privacy)

**Database Operations:**
```sql
-- Weekly leaderboard
SELECT
  u.id,
  u.display_name,
  u.avatar_url,
  SUM(tc.points_earned) as week_points
FROM users u
LEFT JOIN task_completions tc ON tc.user_id = u.id
  AND tc.completed_at >= date_trunc('week', NOW())
  AND tc.status = 'approved'
WHERE u.organization_id = <org_id> AND u.deleted_at IS NULL
GROUP BY u.id
ORDER BY week_points DESC;
```

---

## Cross-Role Flows

### Flow 13: Family Member Invitation (Second Parent)

**Entry Point:** Account Owner Dashboard → Add Family Member → Add Second Parent

**Account Owner Steps:**

1. **Invite Form:**
   - Field: Email address
   - Field: Role (Manager or Adult)
   - Checkbox: Make Family Manager?
   - Button: "Send Invitation"

2. **Invitation Sent:**
   - Toast: "Invitation sent to [email]"
   - Email sent to invitee
   - Invitation record created

**Invitee Steps:**

3. **Receive Email:**
   - Subject: "You've been invited to join [Family Name] on ChorePulse!"
   - Body: "[Account Owner] invited you to help manage family tasks and rewards"
   - Button: "Accept Invitation"

4. **Accept Invitation:**
   - Click button → Redirected to /invite?token=<token>
   - Page shows: "Join [Family Name]"
   - Option 1: "Create new account"
   - Option 2: "I already have an account" (sign in to link)

5. **Create Account:**
   - Field: Display name
   - Field: Password
   - Field: Confirm password
   - Submit → Creates Supabase auth user
   - User added to organization

6. **Success:**
   - Logged in
   - Dashboard shows family's tasks, rewards, calendar
   - Welcome message: "Welcome to [Family Name]!"

**Database Operations:**
```sql
-- Account owner creates invitation
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

-- Invitee accepts
INSERT INTO users (
  auth_user_id,
  organization_id,
  email,
  display_name,
  role,
  is_family_manager
) VALUES (
  <new_auth_id>,
  <org_id>,
  'partner@email.com',
  'Partner Name',
  'manager',
  false
);

-- Mark invitation as accepted
UPDATE user_invitations SET accepted_at = NOW() WHERE id = <invitation_id>;
```

---

### Flow 14: Family Hub Mode

**Entry Point:** Any device → Settings → Hub Mode → "Enable Hub"

**Steps:**

1. **Enable Hub Mode:**
   - Click "Enable Hub"
   - Device enters hub mode
   - URL changes to /hub
   - Display changes to hub view

2. **Hub Display Options:**
   - Tab 1: Slideshow Mode
     - Rotates through: Today's tasks, Calendar, Leaderboard, Messages
     - 30-second intervals
   - Tab 2: Calendar View
     - Shows upcoming events
     - Color-coded by family member
   - Tab 3: Control Center
     - All tasks listed
     - Quick mark complete buttons
     - Leaderboard sidebar

3. **Family Member Login:**
   - Any family member can log in from hub
   - Click "Log In" button
   - PIN entry screen
   - Select user → Enter PIN
   - Shows personalized view

4. **Logout:**
   - Automatic logout after 5 minutes inactivity
   - OR manual logout button
   - Returns to hub display

**Database Operations:**
```sql
-- No database changes for hub mode
-- Just session management and display preferences
```

---

### Flow 15: Streak Recovery (Grace Period)

**Entry Point:** Automatic when user completes task after missing a day

**Steps:**

1. **User Misses Day:**
   - Monday: Completed a task (streak = 5)
   - Tuesday: No task completed
   - Wednesday: User logs in, sees streak at risk

2. **Grace Period Banner:**
   - Banner: "Your 5-day streak is at risk! Complete a task today to keep it alive 🔥"
   - Button: "View My Tasks"

3. **Complete Task:**
   - User completes a task on Wednesday
   - Backend checks: Last completed = Monday, Today = Wednesday (1-day gap)
   - Grace period applied: Streak preserved (now 6 days)
   - Flag set: `streak_grace_used = true`

4. **Grace Period Used:**
   - Toast: "Streak saved with grace period! Don't miss another day 🔥"
   - User cannot use grace period again until streak resets

5. **Miss Another Day:**
   - If user misses Thursday (2-day gap)
   - Streak resets to 1
   - Grace period flag resets: `streak_grace_used = false`

**Database Operations:**
```sql
-- Automatic via update_streak() function
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID, p_completed_date DATE)
RETURNS VOID AS $$
DECLARE
  v_last_completed DATE;
  v_grace_used BOOLEAN;
  v_current_streak INTEGER;
BEGIN
  SELECT last_task_completed_date, streak_grace_used, streak_count
  INTO v_last_completed, v_grace_used, v_current_streak
  FROM users WHERE id = p_user_id;

  IF v_last_completed = p_completed_date THEN
    -- Same day, don't update streak
    RETURN;
  ELSIF v_last_completed = p_completed_date - INTERVAL '1 day' THEN
    -- Consecutive day
    UPDATE users SET
      streak_count = v_current_streak + 1,
      last_task_completed_date = p_completed_date
    WHERE id = p_user_id;
  ELSIF v_last_completed = p_completed_date - INTERVAL '2 days' AND NOT v_grace_used THEN
    -- 1-day gap, grace period applied
    UPDATE users SET
      streak_count = v_current_streak + 1,
      streak_grace_used = true,
      last_task_completed_date = p_completed_date
    WHERE id = p_user_id;
  ELSE
    -- Reset streak
    UPDATE users SET
      streak_count = 1,
      streak_grace_used = false,
      last_task_completed_date = p_completed_date
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

### Flow 16: Downgrade with Auto-Archive

**Entry Point:** Account Owner → Settings → Billing → Downgrade

**Steps:**

1. **Initiate Downgrade:**
   - Current plan: Pulse Premium (100 tasks)
   - Click "Downgrade to Starter"
   - Warning modal:
     - "You have 87 active tasks. Starter allows 30."
     - "57 tasks will be automatically archived on [next billing date]"
     - "You can restore them by upgrading again within 7 days"
   - Button: "Schedule Downgrade"

2. **Downgrade Scheduled:**
   - Banner appears: "Downgrade scheduled for [date]. You have 57 excess tasks."
   - Button: "View Excess Tasks"
   - Account owner can archive/delete manually before downgrade date

3. **Downgrade Date Arrives:**
   - Cron job runs at billing date
   - Auto-archives 57 oldest tasks
   - Subscription tier changed to pulse_starter
   - Email sent: "Your plan has changed to Pulse Starter. 57 tasks were archived."

4. **After Downgrade:**
   - Dashboard shows 30 active tasks
   - "Archived Tasks" tab shows 57 archived tasks (with 7-day restore window)
   - Banner: "You're on Pulse Starter. Upgrade to restore 57 archived tasks."

5. **Restore Window (7 Days):**
   - If account owner upgrades within 7 days:
     - Archived tasks automatically restored
     - Toast: "57 tasks restored!"
   - If 7 days pass:
     - Tasks remain archived (can be manually restored one by one up to limit)

**Database Operations:**
```sql
-- Schedule downgrade
UPDATE organizations SET
  subscription_tier_scheduled = 'pulse_starter',
  subscription_tier_change_date = <next_billing_date>
WHERE id = <org_id>;

-- On billing date (cron job)
-- 1. Archive excess tasks
UPDATE tasks SET
  archived_at = NOW(),
  archived_reason = 'tier_downgrade'
WHERE organization_id = <org_id>
  AND archived_at IS NULL
  AND id NOT IN (
    SELECT id FROM tasks
    WHERE organization_id = <org_id> AND archived_at IS NULL
    ORDER BY created_at DESC
    LIMIT 30
  );

-- 2. Apply downgrade
UPDATE organizations SET
  subscription_tier = 'pulse_starter',
  subscription_tier_scheduled = NULL,
  subscription_tier_change_date = NULL
WHERE id = <org_id>;

-- 3. Log event
INSERT INTO security_events (organization_id, event_type, metadata)
VALUES (<org_id>, 'tier_downgraded', '{"tasks_archived": 57}');
```

---

## Summary Table

| Flow # | Flow Name | Primary Role | Entry Point |
|--------|-----------|--------------|-------------|
| 1 | First-Time Account Creation | Account Owner | Landing → Sign Up |
| 2 | Transfer Ownership | Account Owner | Settings → Transfer Ownership |
| 3 | Manage Billing | Account Owner | Settings → Billing |
| 4 | Delete User | Account Owner | Settings → Family → Delete |
| 5 | Create Task | Family Manager | Dashboard → Create Task |
| 6 | Approve Task Completion | Family Manager | Dashboard → Approvals |
| 7 | Complete Own Task | Adult | Dashboard → My Tasks |
| 8 | Redeem Reward | Adult | Dashboard → Rewards |
| 9 | First-Time Login (PIN) | Teen | app.chorepulse.com → PIN Login |
| 10 | Claim Extra Credit Task | Teen | Dashboard → Extra Credit |
| 11 | Complete Task with Photo | Kid | Dashboard → My Tasks |
| 12 | View Leaderboard | Kid | Dashboard → Leaderboard |
| 13 | Family Member Invitation | All | Dashboard → Add Family |
| 14 | Family Hub Mode | All | Settings → Hub Mode |
| 15 | Streak Recovery | All | Automatic |
| 16 | Downgrade with Auto-Archive | Account Owner | Settings → Billing |

---

## Error States

### Common Error Scenarios

**1. Insufficient Permissions:**
- User tries to perform action they don't have permission for
- Error message: "You don't have permission to [action]. Contact your family manager."
- Suggested action: Show "Learn about roles" link

**2. Tier Limit Reached:**
- User tries to create 31st task on Pulse Starter
- Error modal: "You've reached your task limit (30). Upgrade to Pulse Premium for 100 tasks."
- Suggested action: Show upgrade options

**3. Insufficient Points:**
- User tries to redeem reward with insufficient points
- Error message: "You need 50 more points to redeem this reward"
- Suggested action: Show task suggestions to earn points

**4. Session Expired:**
- PIN session expires after 30 minutes
- Redirect to login with message: "Your session has expired. Please log in again."

**5. Network Error:**
- API request fails
- Error message: "Something went wrong. Please try again."
- Suggested action: Retry button

---

## Testing Checklist

### Flow Testing

- [ ] Account creation flow completes successfully
- [ ] Email verification sent and works
- [ ] Family code generated automatically
- [ ] Ownership transfer updates permissions correctly
- [ ] Billing upgrade/downgrade works
- [ ] Task creation within tier limits
- [ ] Task approval awards points correctly
- [ ] Photo proof uploads and displays
- [ ] Reward redemption deducts points
- [ ] PIN login works with family code
- [ ] Extra credit tasks can be claimed
- [ ] Leaderboard calculates correctly
- [ ] Family invitations sent and accepted
- [ ] Hub mode displays properly
- [ ] Streak grace period works once
- [ ] Auto-archive on downgrade works
- [ ] Restore window (7 days) honored

---

## Conclusion

This document covers all major user flows in ChorePulse v2, ensuring:

✅ **Complete Coverage:** All roles and features documented
✅ **Database Operations:** Clear SQL examples for each flow
✅ **Error Handling:** Common error scenarios addressed
✅ **Testing:** Checklist for QA validation
✅ **Success States:** Clear outcomes for each flow

Each flow is designed to be intuitive, mobile-friendly, and aligned with the overall ChorePulse vision of family task management and gamification.
