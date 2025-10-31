# Google Calendar Events in Pulse Calendar

ChorePulse now displays your Google Calendar events directly in the Pulse Calendar view, giving you a complete picture of your day with both tasks and personal events in one place.

## Features

### Read-Only Display
- Google Calendar events appear in Pulse Calendar alongside tasks
- Events are displayed with a distinctive dashed border and gray color scheme
- Events are NOT converted to tasks - they remain read-only for visibility only
- Clicking an event shows its details (future enhancement: could open in Google Calendar)

### Smart Filtering
- Automatically filters out ChorePulse-synced tasks from Google Calendar to avoid duplicates
- Only shows events from your primary Google Calendar
- Respects user's privacy by only fetching events when explicitly enabled

### Event Information Displayed
- **Summary/Title** - Event name
- **Time** - Start time (or "All Day" badge)
- **Location** - If specified
- **Description** - Event details (truncated with line-clamp)
- **Google Calendar Badge** - Visual indicator that this is from Google

## How to Enable

1. **Connect Google Calendar** (if not already connected):
   - Go to Settings → Integrations
   - Click "Connect Google Calendar"
   - Authorize ChorePulse to access your Google Calendar

2. **Enable Event Display**:
   - Go to Settings → Integrations
   - Toggle ON "Show Google Calendar Events in Pulse"
   - Click "Save Settings"

3. **View Events**:
   - Open the Calendar page
   - Switch to Day view (recommended for best viewing experience)
   - Your Google Calendar events will appear alongside tasks

## Visual Design

### Google Calendar Events
- **Border**: Dashed gray (#6B7280)
- **Background**: Gradient from gray-50 to white
- **Icon**: 📅 calendar emoji
- **Badge**: "Google Calendar" tag
- **Chevron**: External link icon (vs. arrow for tasks)

### vs. ChorePulse Tasks
- **Border**: Solid color (matches assigned user)
- **Background**: Task color with 10% opacity
- **Icon**: Checkmark (completed) or empty circle
- **Badges**: Category, Points, Frequency
- **Chevron**: Right arrow

## Technical Details

### API Endpoint
**GET** `/api/integrations/google-calendar/events`

Query parameters:
- `startDate` (ISO string) - Start of date range (default: today)
- `endDate` (ISO string) - End of date range (default: +7 days)

Returns:
```json
{
  "events": [
    {
      "id": "string",
      "summary": "string",
      "description": "string",
      "start": "ISO date string",
      "end": "ISO date string",
      "isAllDay": boolean,
      "location": "string",
      "htmlLink": "string",
      "colorId": "string"
    }
  ],
  "count": number
}
```

### Files Modified
- `/lib/google-calendar.ts` - Added `fetchGoogleCalendarEvents()` function
- `/app/api/integrations/google-calendar/events/route.ts` - New API endpoint
- `/app/(authenticated)/calendar/page.tsx` - Updated UI to display Google events
- `/app/(authenticated)/settings/page.tsx` - Updated toggle description

### Database
Uses existing `calendar_integrations.sync_calendar_to_tasks` column (already exists in migration 017)

## Privacy & Security

- **User Control**: Events only fetched when user explicitly enables the feature
- **No Storage**: Events are fetched in real-time, not stored in ChorePulse database
- **Token Refresh**: Automatically refreshes OAuth tokens when expired
- **Filtered Data**: Only fetches events from primary calendar (not all calendars)
- **No Modification**: Events are read-only; ChorePulse cannot modify Google Calendar events

## Future Enhancements

Potential improvements for future versions:

1. **Click to Open**: Clicking a Google event opens it in Google Calendar (web or app)
2. **Conflict Detection**: Highlight when tasks and events overlap
3. **Multi-Calendar Support**: Fetch from multiple Google calendars
4. **Event Filtering**: Filter by calendar, event type, or attendees
5. **Week/Month Views**: Display Google events in week and month calendar views
6. **Event Colors**: Use Google Calendar's color coding
7. **Attendees**: Show who's attending each event
8. **RSVP Status**: Show accepted/tentative/declined status
9. **Quick Actions**: Add/edit/delete events directly from Pulse (requires write permissions)

## Troubleshooting

**Events not appearing?**
1. Verify "Show Google Calendar Events in Pulse" is enabled in Settings → Integrations
2. Check that Google Calendar integration is connected
3. Refresh the page or re-toggle the setting
4. Verify you have events in the date range being displayed

**Token expired errors?**
- Disconnect and reconnect your Google Calendar in Settings
- Token refresh should happen automatically but may occasionally fail

**Wrong events showing?**
- ChorePulse fetches events from your primary Google Calendar only
- Check which calendar is set as primary in your Google Calendar settings

## Cost

**Total Cost: $0**
- Uses existing Google Calendar API quota (free tier: 1M requests/day)
- Fetches events on-demand (no background jobs)
- Typical usage: ~10-20 API calls per user per day
