# Google Calendar Integration Setup

This guide walks you through setting up Google Calendar integration for ChorePulse.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- ChorePulse v2 running locally or deployed

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "ChorePulse Calendar Integration"
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In Google Cloud Console, ensure your new project is selected
2. Navigate to "APIs & Services" → "Library"
3. Search for "Google Calendar API"
4. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for workspace)
   - App name: ChorePulse
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
     - `https://www.googleapis.com/auth/userinfo.email`
   - Add test users (for External apps in testing mode)

4. Create OAuth Client ID:
   - Application type: Web application
   - Name: ChorePulse Web Client
   - Authorized redirect URIs (⚠️ **IMPORTANT**: No trailing slash!):
     - For local development: `http://localhost:3000/api/integrations/google-calendar/callback`
     - For production: `https://yourdomain.com/api/integrations/google-calendar/callback`
   - Click "Create"

   **Common Mistakes to Avoid**:
   - ❌ `http://localhost:3000/api/integrations/google-calendar/callback/` (trailing slash)
   - ❌ `http://localhost:3000/` (just the homepage)
   - ✅ `http://localhost:3000/api/integrations/google-calendar/callback` (correct)

5. Copy the Client ID and Client Secret

## Step 4: Add Environment Variables

Add these to your `.env.local` file:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Step 5: Run Database Migration

Run the calendar integrations migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the migration file:
# supabase/migrations/017_create_calendar_integrations.sql
```

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in to ChorePulse

3. Navigate to Settings → Integrations tab

4. Click "Connect Google Calendar"

5. You'll be redirected to Google's OAuth consent screen

6. Grant the required permissions

7. You should be redirected back with a success message

## Features

### What Gets Synced

- **Tasks to Calendar**: ChorePulse tasks appear as events in your Google Calendar
- **Calendar to Tasks** (optional): Google Calendar events can create tasks in ChorePulse

### Sync Options

Configure in Settings → Integrations:
- **Sync Tasks to Google Calendar**: On/Off
- **Sync Google Calendar to Tasks**: On/Off
- **Calendar Name**: Name of the calendar created in Google

## Security Notes

⚠️ **Important for Production**:

1. **Token Encryption**: The current implementation stores OAuth tokens in plaintext. For production, you should:
   - Encrypt tokens before storing in the database
   - Use a proper encryption library (e.g., `crypto` with AES-256-GCM)
   - Store encryption keys in secure environment variables

2. **OAuth Consent Screen**:
   - For production, submit your app for Google verification
   - Complete the OAuth consent screen with privacy policy and terms of service

3. **HTTPS Required**:
   - Google OAuth requires HTTPS for production redirect URIs
   - Use a proper SSL certificate for your domain

## Troubleshooting

### "Redirect URI Mismatch" Error

- Ensure the redirect URI in Google Cloud Console exactly matches your app URL
- Check for http vs https
- Verify trailing slashes match

### "Access Denied" Error

- Ensure you've added test users in OAuth consent screen (for External apps)
- Check that all required scopes are enabled

### Tokens Expired

- The system will automatically attempt to refresh tokens
- If refresh fails, disconnect and reconnect the calendar

### Calendar Not Syncing

- Check the "Last Sync" timestamp in Settings
- Click "Sync Now" to manually trigger a sync
- Check browser console for errors

## API Endpoints

- `GET /api/integrations/google-calendar` - Check connection status
- `GET /api/integrations/google-calendar/connect` - Initiate OAuth flow
- `GET /api/integrations/google-calendar/callback` - OAuth callback handler
- `PATCH /api/integrations/google-calendar` - Update sync settings
- `DELETE /api/integrations/google-calendar` - Disconnect integration

## Database Schema

The `calendar_integrations` table stores:
- OAuth access and refresh tokens
- User's Google Calendar email
- Sync preferences
- Last sync status and timestamp

See `supabase/migrations/017_create_calendar_integrations.sql` for the full schema.

## Future Enhancements

- [ ] Automatic calendar sync via cron job
- [ ] Token encryption for production
- [ ] Webhook support for real-time sync
- [ ] Support for multiple calendars
- [ ] Sync conflict resolution
- [ ] Selective task syncing (by category/assignee)
