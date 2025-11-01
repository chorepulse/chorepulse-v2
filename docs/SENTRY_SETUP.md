# Sentry Error Tracking Setup Guide

Sentry is configured for ChorePulse v2 to track errors in production. Follow these steps to complete the setup:

## Step 1: Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account
3. Verify your email

## Step 2: Create a New Project

1. Click "Create Project" in your Sentry dashboard
2. Select **Next.js** as the platform
3. Set alert frequency (recommended: "On every new issue")
4. Name your project: `chorepulse-v2`
5. Click "Create Project"

## Step 3: Get Your Configuration Values

After creating the project, you'll see a page with configuration instructions. You need to copy these values:

### DSN (Data Source Name)
- Look for a URL like: `https://abc123@o123456.ingest.sentry.io/7890123`
- Copy this entire URL

### Organization Slug
- Found in your Sentry URL: `https://sentry.io/organizations/YOUR-ORG-SLUG/`
- Example: If your URL is `https://sentry.io/organizations/chorepulse/`, your org slug is `chorepulse`

### Project Name
- This is what you named your project (e.g., `chorepulse-v2`)

### Auth Token (for source map uploads)
1. Go to Settings → Account → API → Auth Tokens
2. Click "Create New Token"
3. Name it: "ChorePulse Build Token"
4. Scopes needed:
   - `project:read`
   - `project:releases`
   - `org:read`
5. Click "Create Token"
6. Copy the token immediately (you won't see it again!)

## Step 4: Add Environment Variables

### Local Development (.env.local)
Add these values to your `.env.local` file:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_HERE
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=chorepulse-v2
SENTRY_AUTH_TOKEN=your_auth_token_here
```

### Vercel Production
Add the same variables to your Vercel project:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - `NEXT_PUBLIC_SENTRY_DSN` (exposed to browser)
   - `SENTRY_ORG` (server-only)
   - `SENTRY_PROJECT` (server-only)
   - `SENTRY_AUTH_TOKEN` (server-only)
4. Make sure to select the appropriate environments (Production, Preview, Development)

## Step 5: Test the Integration

### Test in Development
1. Add a test button to trigger an error:
```tsx
<button onClick={() => { throw new Error('Test Sentry') }}>
  Test Error
</button>
```

2. Click the button
3. Check your Sentry dashboard for the error

### Test in Production
After deploying to Vercel:
1. Visit your production site
2. Trigger the test error
3. Check Sentry dashboard
4. You should see the error with full stack trace

## Step 6: Remove Test Code

Once confirmed working, remove any test error buttons from your code.

## What Gets Tracked

Sentry will now automatically track:

- ✅ Unhandled exceptions in client code
- ✅ Unhandled exceptions in server code
- ✅ API route errors
- ✅ Component render errors
- ✅ Network errors
- ✅ User session replays (for errors)
- ✅ Performance metrics
- ✅ Source maps for readable stack traces

## Features Configured

- **Session Replay**: Captures 100% of sessions with errors
- **Performance Monitoring**: Tracks slow pages and API calls
- **Source Maps**: Uploaded automatically during build
- **Error Grouping**: Similar errors grouped together
- **User Context**: See which users are affected
- **Breadcrumbs**: See user actions leading to error
- **Release Tracking**: Errors tagged by deployment

## Viewing Errors

In your Sentry dashboard, you'll see:

1. **Issues**: List of all errors grouped
2. **Performance**: Slow transactions and API calls
3. **Replays**: Session recordings of errors
4. **Releases**: Errors per deployment
5. **Alerts**: Email notifications for new errors

## Best Practices

1. **Monitor Daily**: Check Sentry dashboard daily during testing
2. **Fix Critical Issues First**: Focus on high-volume errors
3. **Add User Context**: Errors automatically include user info
4. **Use Tags**: Errors are tagged with environment (prod/dev)
5. **Set Up Alerts**: Configure Slack/email notifications

## Troubleshooting

### Errors not showing up?
- Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Check browser console for Sentry init messages
- Ensure you deployed after adding env vars

### Source maps not readable?
- Verify `SENTRY_AUTH_TOKEN` is set in Vercel
- Check that `SENTRY_ORG` and `SENTRY_PROJECT` match exactly

### Too many errors?
- Adjust `ignoreErrors` in `sentry.client.config.ts`
- Lower `tracesSampleRate` to reduce performance tracking

## Support

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- ChorePulse Issues: Create an issue in the repository

---

**Status**: ✅ Configured (Pending environment variables)
**Last Updated**: 2025-10-31
