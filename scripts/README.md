# Migration Scripts

This directory contains one-time migration scripts for database updates.

## migrate-task-due-times.ts

**Purpose**: Sets `due_time` for all existing tasks that don't have one.

**When to run**: One-time migration after making `due_time` a required field.

**What it does**:
- Finds all tasks without a `due_time` set
- Sets their `due_time` to `23:59` (end of day) as a default
- This ensures all tasks have a deadline for tracking completion metrics

**Prerequisites**:
- Set up your `.env.local` file with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**How to run**:
```bash
npm run migrate:due-times
```

**Expected output**:
```
🔄 Starting migration: Setting due_time for tasks without one...
📋 Found X tasks without due_time
✅ Updated task "Task Name" (task-id) - due_time set to 23:59
...

📊 Migration Summary:
   ✅ Successfully updated: X
   ❌ Failed/Skipped: 0
   📝 Total tasks processed: X

✨ Migration complete!
```

**Note**: This is a one-time migration. All new tasks will require a `due_time` when created.
