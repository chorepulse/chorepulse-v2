# Automatic Google Calendar Sync

ChorePulse now automatically syncs tasks to Google Calendar using a hybrid approach that combines real-time syncing with daily backups.

## How It Works

### 1. **Real-time Sync (Instant)**
When you create or assign a task in ChorePulse, the calendar automatically syncs in the background:
- ✅ Create a new task → Syncs immediately
- ✅ Update task assignments → Syncs immediately
- ✅ Works while app is open
- ✅ Fire-and-forget (doesn't block UI)

### 2. **Daily Backup Sync (Midnight)**
Every day at midnight (UTC), a cron job automatically syncs all calendars:
- ✅ Catches any missed real-time syncs
- ✅ Syncs for all users with Google Calendar connected
- ✅ Runs even if users are offline
- ✅ FREE on Vercel (within Hobby plan limits)

### 3. **Manual "Sync Now" Button**
Users can still manually trigger a sync anytime from Settings → Integrations

## Frequency-Based Event Scheduling

Tasks now appear in Google Calendar based on their frequency:

- **Daily tasks** → Recurring event every day
- **Weekly tasks** → Recurring event every week
- **Every N days** → Recurring event with interval
- **Monthly tasks** → Recurring event monthly
- **One-time tasks** → Single event

Events use Google Calendar's native recurrence rules (RRULE), so they repeat automatically without creating duplicate events.

## User-Specific Syncing

Each user only sees their own assigned tasks:
- ✅ Only tasks assigned to you sync to your calendar
- ✅ Unclaimed extra credit tasks are excluded
- ✅ Each family member has their own calendar view

## Cost

**Total Cost: $0**

- Real-time sync: FREE (built into Next.js)
- Vercel Cron: FREE (1 daily job within Hobby plan)
- Supabase: FREE (using existing connection)

## Setup for Production

1. **Add CRON_SECRET to Vercel**:
   ```bash
   vercel env add CRON_SECRET
   ```
   Use a secure random string (e.g., from `openssl rand -hex 32`)

2. **Deploy to Vercel**:
   The `vercel.json` file automatically configures the cron job

3. **Verify Cron Job**:
   - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
   - You should see: `calendar-sync` running daily at 00:00 UTC

## Testing Locally

### Test Real-time Sync:
1. Create or assign a task in ChorePulse
2. Check your Google Calendar within a few seconds
3. The task should appear automatically

### Test Manual Sync:
1. Go to Settings → Integrations
2. Click "Sync Now"
3. Should see success message with count

### Test Cron Job (Local):
```bash
# Add auth header with CRON_SECRET
curl -H "Authorization: Bearer chorepulse_cron_secret_2024_change_in_production" \
  http://localhost:3000/api/cron/calendar-sync
```

## Troubleshooting

**Real-time sync not working?**
- Check browser console for errors
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Verify Google Calendar integration is connected

**Cron job not running?**
- Verify `CRON_SECRET` is set in Vercel environment variables
- Check Vercel Cron logs in dashboard
- Ensure you've deployed to Vercel (cron doesn't run locally automatically)

**Tasks not appearing in calendar?**
- Check if tasks are assigned to you
- Verify sync is enabled in Settings → Integrations
- Try manual "Sync Now" button

## Implementation Details

### Files Modified:
- `/lib/google-calendar.ts` - Added frequency-based event creation with RRULE
- `/lib/calendar-sync-service.ts` - Internal sync service that can be called directly (bypasses HTTP auth)
- `/app/api/integrations/google-calendar/sync/route.ts` - Refactored to use internal sync service
- `/app/api/tasks/route.ts` - Added real-time sync on task creation
- `/app/api/tasks/[id]/route.ts` - Added real-time sync on task update
- `/app/api/cron/calendar-sync/route.ts` - Daily cron job endpoint
- `vercel.json` - Cron job configuration

### Architecture:
- **Internal Sync Service** (`/lib/calendar-sync-service.ts`):
  - Shared sync logic that can be called from any server-side code
  - Bypasses HTTP authentication layer
  - Uses admin client for database access
  - Handles token refresh automatically
  - Gracefully handles users without calendar integration

- **Real-time Sync**:
  - Task routes call `syncUserCalendar(userId)` directly after creating/updating assignments
  - Fire-and-forget pattern (errors logged but don't block response)
  - Failures caught by daily cron job

- **API Route**:
  - Manual sync endpoint authenticates user first
  - Then calls internal sync service with user ID
  - Used by "Sync Now" button in Settings

- **Cron Job**:
  - Fetches all active integrations
  - Calls internal sync service for each user
  - Protected by CRON_SECRET

### Security:
- Cron endpoint protected with `CRON_SECRET`
- API endpoint requires user authentication
- Internal sync service uses admin client (bypasses RLS)
- Only syncs tasks assigned to each specific user
