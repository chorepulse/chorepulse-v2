# ChorePulse v2 - Final Setup Checklist

**Last Updated:** 2025-10-22
**Purpose:** Complete step-by-step setup guide for deploying ChorePulse v2

---

## Pre-Deployment Checklist

### 1. Supabase Setup

#### ✅ Create New Supabase Project
- [ ] Log in to https://supabase.com
- [ ] Click "New Project"
- [ ] Project name: "ChorePulse v2"
- [ ] Database password: (Generate strong password, save in password manager)
- [ ] Region: (Choose closest to your users)
- [ ] Pricing plan: Pro ($25/month for better performance)

#### ✅ Run Database Schema
- [ ] Navigate to SQL Editor in Supabase dashboard
- [ ] Create new query
- [ ] Copy entire contents of `DATABASE_SCHEMA_V2_UPDATED.sql`
- [ ] Execute (this will create all tables, RLS policies, functions)
- [ ] Verify tables created: Check "Table Editor" tab

#### ✅ Configure Supabase Auth
- [ ] Navigate to Authentication → Providers
- [ ] Enable Email provider
- [ ] **Email Templates:**
  - Confirm signup: Customize with ChorePulse branding
  - Reset password: Customize with ChorePulse branding
  - Magic link: Customize with ChorePulse branding
- [ ] **Email Settings:**
  - Site URL: `https://app.chorepulse.com`
  - Redirect URLs: Add `https://app.chorepulse.com/**`
- [ ] **Rate Limits:**
  - Email signups: 50/hour per IP
  - Email signins: 100/hour per IP

#### ✅ Supabase Storage Setup
- [ ] Navigate to Storage
- [ ] Create bucket: `avatars` (public)
- [ ] Create bucket: `task-photos` (private, auto-delete after 7 days)
- [ ] Set up RLS policies for task-photos bucket

#### ✅ Get Supabase Environment Variables
- [ ] Navigate to Project Settings → API
- [ ] Copy the following values:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
  SUPABASE_SERVICE_ROLE_KEY=eyJh... (NEVER expose to client!)
  ```

---

### 2. Stripe Setup

#### ✅ Create Stripe Account
- [ ] Log in to https://stripe.com (or create account)
- [ ] Complete business verification
- [ ] Enable test mode initially

#### ✅ Create Products in Stripe
- [ ] **Product 1: Pulse Premium**
  - Name: "Pulse Premium"
  - Description: "100 tasks, 50 AI prompts, no ads"
  - Pricing:
    - Monthly: $4.99/month (recurring)
    - Annual: $39.99/year (recurring)

- [ ] **Product 2: Unlimited Pulse**
  - Name: "Unlimited Pulse"
  - Description: "Unlimited tasks, 200 AI prompts, meal planning"
  - Pricing:
    - Monthly: $9.99/month (recurring)
    - Annual: $69.99/year (recurring)

#### ✅ Configure Stripe Settings
- [ ] Enable Customer Portal (for self-service billing)
- [ ] Set up tax collection (if applicable)
- [ ] Configure email receipts

#### ✅ Set Up Stripe Webhook
- [ ] Navigate to Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Endpoint URL: `https://app.chorepulse.com/api/webhooks/stripe`
- [ ] Select events to listen to:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Copy webhook signing secret

#### ✅ Get Stripe Environment Variables
- [ ] Navigate to Developers → API keys
- [ ] Copy the following values:
  ```
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

---

### 3. OpenAI Setup (for AI Features)

#### ✅ Create OpenAI Account
- [ ] Log in to https://platform.openai.com
- [ ] Add payment method
- [ ] Set up billing alerts ($50, $100 thresholds)

#### ✅ Create API Key
- [ ] Navigate to API keys
- [ ] Click "Create new secret key"
- [ ] Name: "ChorePulse v2 Production"
- [ ] Copy key immediately (won't be shown again)

#### ✅ Configure Usage Limits
- [ ] Set monthly budget cap: $500 (prevents runaway costs)
- [ ] Enable email alerts at 50%, 75%, 90% of budget

#### ✅ Get OpenAI Environment Variable
```
OPENAI_API_KEY=sk-proj-...
```

---

### 4. AdMob/AdSense Setup (for Free Tier)

#### ✅ Google AdMob (Mobile Apps)
- [ ] Create AdMob account
- [ ] Create app in AdMob
- [ ] Create ad units:
  - Banner ad (320x50)
  - Interstitial ad (full-screen)
- [ ] Copy AdMob app ID and ad unit IDs

#### ✅ Google AdSense (Web)
- [ ] Create AdSense account
- [ ] Add site: app.chorepulse.com
- [ ] Get AdSense publisher ID
- [ ] Add AdSense code to site

#### ✅ COPPA Compliance
- [ ] Configure child-directed treatment
- [ ] Set up ad filtering for minors
- [ ] Test that no ads show for users under 13

#### ✅ Get Ad Environment Variables
```
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-...
NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-.../...
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-...
```

---

### 5. Environment Variables Setup

#### ✅ Create `.env.local` File
Create `/v2/.env.local` with all environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_ID_PREMIUM_ANNUAL=price_...
STRIPE_PRICE_ID_UNLIMITED_MONTHLY=price_...
STRIPE_PRICE_ID_UNLIMITED_ANNUAL=price_...

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# AdMob/AdSense
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-...
NEXT_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-.../...
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-...

# App Configuration
NEXT_PUBLIC_APP_URL=https://app.chorepulse.com
NEXT_PUBLIC_API_URL=https://app.chorepulse.com/api
NODE_ENV=production

# Email (Resend or SendGrid)
RESEND_API_KEY=re_...
# OR
SENDGRID_API_KEY=SG...

# Optional: Redis (for session management)
REDIS_URL=redis://...

# Optional: Sentry (error tracking)
SENTRY_DSN=https://...@sentry.io/...

# Feature Flags
NEXT_PUBLIC_FEATURE_AI_ENABLED=true
NEXT_PUBLIC_FEATURE_MEAL_PLANNING_ENABLED=false
NEXT_PUBLIC_FEATURE_CALENDAR_IMPORT_ENABLED=true
```

#### ✅ Verify `.gitignore` Excludes `.env.local`
```bash
# .gitignore
.env*.local
.env.production
```

---

### 6. Vercel Deployment Setup

#### ✅ Create/Update Vercel Project
- [ ] Log in to https://vercel.com
- [ ] Option A: Create new project
  - [ ] Import Git repository
  - [ ] Select `chorepulse/v2` folder as root
  - [ ] Framework: Next.js (auto-detected)
- [ ] Option B: Update existing project
  - [ ] Navigate to existing ChorePulse project
  - [ ] Settings → Change root directory to `v2`

#### ✅ Configure Vercel Environment Variables
- [ ] Navigate to Project → Settings → Environment Variables
- [ ] Add ALL variables from `.env.local` (one by one)
- [ ] Select environments: Production, Preview, Development
- [ ] **IMPORTANT:** Never commit these to Git!

#### ✅ Configure Build Settings
- [ ] Framework Preset: Next.js
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm install`
- [ ] Root Directory: `v2`

#### ✅ Configure Custom Domain
- [ ] Navigate to Project → Settings → Domains
- [ ] Add domain: `app.chorepulse.com`
- [ ] Update DNS records (see DNS section below)

---

### 7. DNS Configuration

#### ✅ Update DNS Records
Your domain registrar (GoDaddy, Namecheap, etc.):

```
# Vercel (app subdomain)
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600

# Root domain redirect (optional)
Type: A
Name: @
Value: 76.76.21.21 (Vercel's A record)
TTL: 3600

# WWW redirect (optional)
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### ✅ Verify DNS Propagation
- [ ] Wait 5-60 minutes for DNS propagation
- [ ] Test: `nslookup app.chorepulse.com`
- [ ] Test: Visit `https://app.chorepulse.com`

---

### 8. Email Service Setup

#### ✅ Choose Email Provider

**Option A: Resend (Recommended)**
- [ ] Create account at https://resend.com
- [ ] Verify domain (add DNS records)
- [ ] Create API key
- [ ] Add to env: `RESEND_API_KEY=re_...`

**Option B: SendGrid**
- [ ] Create account at https://sendgrid.com
- [ ] Verify domain
- [ ] Create API key
- [ ] Add to env: `SENDGRID_API_KEY=SG...`

#### ✅ Configure Email Templates
- [ ] Welcome email
- [ ] Email verification
- [ ] Password reset
- [ ] Trial reminder emails (Days 1, 3, 7, 10, 13, 15)
- [ ] Subscription emails (payment succeeded, payment failed)
- [ ] Family invitation email

---

### 9. Cron Jobs Setup

#### ✅ Vercel Cron Jobs
Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/hourly",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/monthly",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

#### ✅ Cron Job Endpoints
- [ ] `/api/cron/daily` - Check streaks, update ages, clean up expired sessions
- [ ] `/api/cron/hourly` - Clean up expired PIN sessions, check trial expirations
- [ ] `/api/cron/monthly` - Reset AI prompt quotas, archive old data

#### ✅ Secure Cron Jobs
Use Vercel's cron secret:
```typescript
// api/cron/daily/route.ts
if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

### 10. Platform Admin Setup

#### ✅ Create Platform Admin User
- [ ] Run SQL to create your admin account:
```sql
-- First, sign up normally via the app
-- Then, update your user to be platform admin
UPDATE users
SET is_platform_admin = true
WHERE email = 'your@email.com';
```

#### ✅ Test Platform Admin Access
- [ ] Log in with admin account
- [ ] Navigate to `/platform-admin`
- [ ] Verify access to:
  - User management
  - Organization management
  - Feature flags
  - Analytics dashboard

---

### 11. Security Checklist

#### ✅ Supabase Security
- [ ] RLS enabled on all tables
- [ ] Service role key NEVER exposed to client
- [ ] JWT secret rotated (if needed)

#### ✅ API Security
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Webhook signatures verified (Stripe)

#### ✅ Environment Security
- [ ] All secrets in environment variables (not code)
- [ ] `.env.local` in `.gitignore`
- [ ] Production keys different from development

---

### 12. Testing Checklist

#### ✅ Core Features
- [ ] User signup and email verification
- [ ] PIN login with family code
- [ ] Create task
- [ ] Complete task
- [ ] Approve task
- [ ] Redeem reward
- [ ] Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Subscription upgrade/downgrade
- [ ] Achievement unlocking

#### ✅ Cross-Browser Testing
- [ ] Chrome (desktop & mobile)
- [ ] Safari (desktop & mobile)
- [ ] Firefox
- [ ] Edge

#### ✅ Mobile Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Tablet (iPad/Android)

---

### 13. Monitoring & Analytics Setup

#### ✅ Sentry (Error Tracking)
- [ ] Create Sentry account
- [ ] Create project
- [ ] Install Sentry SDK: `npm install @sentry/nextjs`
- [ ] Configure `sentry.client.config.ts` and `sentry.server.config.ts`
- [ ] Add `SENTRY_DSN` to environment variables

#### ✅ Analytics (Choose One)

**Option A: Vercel Analytics (Simple)**
- [ ] Enable in Vercel dashboard (free for Pro plan)
- [ ] Install: `npm install @vercel/analytics`
- [ ] Add to `app/layout.tsx`

**Option B: Google Analytics 4**
- [ ] Create GA4 property
- [ ] Get measurement ID
- [ ] Install: `npm install next-ga4`
- [ ] Add to `app/layout.tsx`

---

### 14. Legal & Compliance

#### ✅ Terms of Service
- [ ] Draft Terms of Service (consult lawyer)
- [ ] Add to `/legal/terms`

#### ✅ Privacy Policy
- [ ] Draft Privacy Policy (GDPR & COPPA compliant)
- [ ] Add to `/legal/privacy`
- [ ] Include:
  - Data collection practices
  - Cookie usage
  - Children's privacy (COPPA)
  - Data deletion process

#### ✅ COPPA Compliance
- [ ] Parental consent flow implemented
- [ ] No ads for users under 13
- [ ] Age verification in signup
- [ ] Parental consent table populated

#### ✅ GDPR Compliance
- [ ] Data export feature
- [ ] Data deletion feature
- [ ] Cookie consent banner
- [ ] User data retention policy

---

### 15. Go-Live Checklist

#### ✅ Final Pre-Launch
- [ ] All environment variables set
- [ ] All third-party services configured
- [ ] DNS propagated
- [ ] SSL certificate active (auto via Vercel)
- [ ] Database seeded with initial data (feature flags, achievement definitions, quotes)

#### ✅ Launch Day
- [ ] Switch Stripe from test to live mode
- [ ] Update Stripe env variables with live keys
- [ ] Verify webhooks working in live mode
- [ ] Monitor error logs (Sentry)
- [ ] Monitor analytics (Vercel/GA4)

#### ✅ Post-Launch Monitoring (First Week)
- [ ] Check Sentry daily for errors
- [ ] Monitor Supabase database size
- [ ] Check Stripe subscription creations
- [ ] Monitor OpenAI API usage/costs
- [ ] Review user signup flow completion rates

---

## Quick Reference: Environment Variables Needed

| Service | Variables | Count |
|---------|-----------|-------|
| Supabase | URL, Anon Key, Service Key | 3 |
| Stripe | Publishable Key, Secret Key, Webhook Secret, 4x Price IDs | 7 |
| OpenAI | API Key, Model | 2 |
| AdMob/AdSense | App ID, Banner ID, Publisher ID | 3 |
| Email | API Key (Resend or SendGrid) | 1 |
| App Config | App URL, API URL, Node Env | 3 |
| Optional | Redis URL, Sentry DSN, Cron Secret | 3 |
| **Total** | | **22 required, 3 optional** |

---

## Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Stripe Docs:** https://stripe.com/docs
- **OpenAI Docs:** https://platform.openai.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

## Troubleshooting Common Issues

### Issue: "Supabase connection failed"
- **Check:** Environment variables are set correctly
- **Check:** Supabase project is not paused
- **Check:** RLS policies allow access

### Issue: "Stripe webhook not working"
- **Check:** Webhook URL is correct (https://app.chorepulse.com/api/webhooks/stripe)
- **Check:** Webhook signing secret matches
- **Check:** Selected events include subscription events

### Issue: "Email verification not sending"
- **Check:** Email service API key is valid
- **Check:** Domain is verified with email provider
- **Check:** Email templates are configured

### Issue: "PIN login not working"
- **Check:** Family code exists in database
- **Check:** PIN is bcrypt hashed correctly
- **Check:** Session management is configured

---

## Next Steps After Deployment

1. **Seed Initial Data:**
   - Run SQL to populate `achievement_definitions`
   - Run SQL to populate `quotes_library` (100 per age group)
   - Run SQL to populate `features` and `plan_features`

2. **Invite Beta Testers:**
   - Invite 10-20 families
   - Collect feedback
   - Fix bugs

3. **Monitor & Iterate:**
   - Watch error logs daily
   - Gather user feedback
   - Implement improvements

4. **Marketing Launch:**
   - Announce on social media
   - Submit to app directories
   - Reach out to parenting blogs

---

**You're ready to deploy ChorePulse v2! 🚀**
