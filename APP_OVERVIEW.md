# ChorePulse - Complete App Overview

**Last Updated:** 2025-10-22
**Purpose:** Comprehensive overview for marketing and development alignment

---

## 🎯 Core Vision

ChorePulse is a family task management platform powered by **Pulse**, an AI assistant that helps busy families coordinate chores, track progress, and reward achievements. Built mobile-first with a clean, modern interface, ChorePulse makes household management simple and engaging for all ages.

---

## 🤖 The Star: Pulse AI Assistant

**Pulse** is ChorePulse's AI-powered family assistant that:
- Generates smart task suggestions based on family profile (home type, pets, ages, preferences)
- Creates tasks from natural language ("Make a task for Emma to walk the dog every morning at 7am")
- Adapts recommendations as families use the platform (learns from usage patterns)
- Suggests age-appropriate rewards
- Helps parents who are stuck ("What tasks should I assign to my 8-year-old?")

**Intelligence Evolution:**
- **New families (0-2 weeks):** Uses global usage data filtered by family profile
- **Learning phase (2 weeks - 3 months):** Blends family usage (70%) + global data (30%)
- **Established (3+ months):** Prioritizes family patterns (90%), supplements with fresh ideas (10%)
- **Threshold:** Requires 50 completed tasks before fully personalizing to family data

---

## 👥 User Roles

### Adult
- Can be **Account Owner** (one per family, controls billing) or regular adult
- Can be granted **Family Manager** privileges (create/edit tasks, manage family members)
- Without manager privileges: Read-only access (view calendar, tasks)
- Examples: Parents, grandparents, caregivers, babysitters

### Teen (13-17 years)
- Can complete tasks, redeem rewards
- View calendar and leaderboard
- Optional email account (with parental approval)
- Required: 4-digit PIN for quick login

### Kid (Under 13)
- Can complete tasks, redeem rewards
- View assigned tasks and rewards
- **COPPA Compliant:** No email, PIN-only authentication
- Parental consent required for account creation

---

## 🔐 Authentication System

### Dual Login Methods

**1. Email/Password (Supabase Auth)**
- Full access based on role/permissions
- Required for Account Owner, Family Managers, Adults
- Optional for teens (with parental approval)
- NOT available for kids under 13 (COPPA compliance)
- Persistent sessions (30-day remember me)
- Email verification (7-day grace period before lockout)

**2. PIN Login (Quick Access)**
- 4-digit PIN, bcrypt hashed
- Available for all roles as secondary login
- Primary login method for kids
- Flow: Family Code (ABC-123-XYZ) → User Selection → PIN Entry
- Device trust: After first login, device remembers family code
- Security: Rate limiting (5 failed attempts = 15-minute lockout)

---

## 💳 Pricing Tiers

### Pulse Starter (FREE)
**Perfect for getting started**
- Up to 30 active tasks
- Up to 15 active rewards
- Basic task & reward library
- 1-way calendar import (Google Calendar, Outlook)
- **Weekly calendar view only**
- Points & streaks system
- Basic achievements
- Hub display mode
- Unlimited family members
- **Ad-supported**

### Pulse Premium ($39.99/year or $4.99/month)
**Most popular for families**
- Up to 100 active tasks
- Up to 50 active rewards
- Full task & reward library
- 1-way calendar import
- **Monthly calendar view**
- **AI task suggestions (50/month via Pulse)**
- Priority support
- All achievements & privileges
- Hub display mode
- Unlimited family members
- **No ads**

### Unlimited Pulse ($69.99/year or $9.99/month)
**Everything you need**
- **Unlimited tasks**
- **Unlimited rewards**
- Full task & reward library
- 1-way calendar import
- **Monthly calendar view**
- **AI task suggestions (200/month via Pulse)**
- Meal planning (coming soon)
- Priority support
- All achievements & privileges
- Hub display mode
- Unlimited family members
- **No ads**

**Trial:** 14-day free trial for paid tiers, no credit card required
**Billing:** Annual plans show monthly equivalent cost with "paid upfront" note
**No Refunds:** Free trial allows risk-free testing

---

## ✨ Core Features

### Task Management
- **Task Types:** One-time, daily, weekly, monthly, custom patterns
- **Assignment:** Individual, multiple, rotation, extra credit
- **Categories:** Cleaning, cooking, outdoor, pet care, homework, organization, maintenance, errands, personal care, general
- **Scheduling:** Flexible start/end dates, time of day, rotation patterns
- **Verification:** Optional photo proof, approval required for high-point tasks
- **Points:** Award points on completion, powers rewards system
- **Task Library:** Pre-made templates filtered by family profile
- **AI-Powered:** Pulse generates suggestions based on family data

### Rewards System
- **Points-Based:** Kids earn points by completing tasks
- **Redemption Flow:** Request reward → Parent approval → Fulfillment
- **Restrictions:** Age limits, role limits, stock quantity, max per month
- **Auto-Approve:** Optional for certain roles/low-cost rewards
- **Reward Library:** Pre-made reward ideas filtered by family profile
- **AI-Powered:** Pulse suggests age-appropriate rewards

### Achievements & Gamification
- **Badge System:** 4 types - Milestone, Behavioral, Seasonal, Special
- **Rarity Tiers:** Common, Uncommon, Rare, Legendary
- **Privileges:** Unlock special perks (not just points)
- **Quotes:** Age-appropriate motivational quotes (100 per age group)
- **Streaks:** Track consecutive days with 1-day grace period
- **Leaderboard:** Weekly, monthly, all-time views

### Family Calendar
- **View Tasks:** See all family tasks by member, color-coded
- **Import:** 1-way import from Google Calendar, Outlook, Apple Calendar
- **Click-to-Complete:** Complete tasks directly from calendar
- **Views:** Week view (all tiers), Month view (Premium+ only)
- **Filtering:** By family member, task status, date range

### Hub Display Mode
- **Purpose:** Turn any device into a shared family command center
- **Default View:** Calendar (configurable by owner/managers)
- **Other Modes:** Slideshow, Task List, Leaderboard
- **Access:** Small "Login" button in corner for PIN/email login
- **Auto-Logout:** Returns to hub after 5 minutes of inactivity
- **Settings:** Configurable refresh interval, what to display

### Analytics & Reports
- **Completion Rates:** By family member, over time
- **Points Earned:** Charts and graphs showing trends
- **Streak Tracking:** For each person
- **Task Distribution:** Who does what, balance analysis
- **Time Insights:** Peak completion times, busiest days
- **Export:** CSV/PDF for record-keeping
- **Access:** Account Owner and Family Managers only

---

## 📱 User Interface

### Navigation (Mobile-First, Bottom Nav Bar)
1. **Home** - Role-based dashboard
2. **Tasks** - View/manage tasks
3. **Rewards** - Browse and redeem rewards (includes Achievements)
4. **Calendar** - Family schedule
5. **More** - Family management, Analytics, Settings, Hub Mode, Profile

### Role-Based Dashboards

**Kids:**
- Top: Colorful leaderboard with big fonts/images
- Below: Their tasks for today (image-heavy)
- Sidebar: Points balance, recent achievements
- Style: Fun, colorful, engaging

**Teens:**
- Top: Today's tasks (cleaner design)
- Below: Week calendar view
- Sidebar: Leaderboard, points
- Style: Modern, less childish, minimal

**Adults:**
- Top: Family stats (completion %, overdue tasks)
- Below: All tasks organized by member
- Sidebar: Quick actions (create task, approve rewards)
- Navigation: Full menu access
- Style: Clean, data-focused, professional

---

## 🔧 Technical Architecture

### Stack
- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth + Custom PIN system
- **Storage:** Supabase Storage (task photos, avatars)
- **Email:** Resend
- **Payments:** Stripe
- **AI:** OpenAI (gpt-4o-mini)
- **Hosting:** Vercel

### Security
- **Multi-Tenant:** Every table has organization_id for isolation
- **RLS:** Row Level Security on all tables
- **Encryption:** Bank-level encryption for all data
- **COPPA Compliant:** No email collection for kids under 13
- **PIN Security:** Bcrypt hashing, rate limiting
- **Device Trust:** Remember devices after first successful login

---

## 🚀 Key User Flows

### New Family Onboarding
1. Land on marketing page → Click "Start Free Trial"
2. Sign up with email/password (Supabase Auth sends verification)
3. Onboarding wizard:
   - Enter organization name (required)
   - Set personal PIN (4 digits)
   - Family profile setup (skippable): home type, pets, ages, preferences
   - Add family members (skippable): Create profiles with PINs, send invitations
   - Set up first tasks (skippable): Use library or ask Pulse
4. Redirect to dashboard with welcome message
5. Email verification reminder (7-day grace period)

### Kid Using ChorePulse
1. Device already trusted OR parent enters family code (ABC-123-XYZ)
2. Kid sees all family members with avatars
3. Kid selects their profile
4. Kid enters 4-digit PIN
5. Logged in → Sees colorful dashboard with their tasks
6. Completes task (optional photo) → Earns points
7. Points appear in balance → Can redeem for rewards
8. Parent approves reward → Kid gets reward fulfilled

### Parent Managing Family
1. Login with email/password (or PIN if set up)
2. Dashboard shows family stats, overdue tasks, completion rates
3. Create task: Manual entry OR "Ask Pulse" for suggestions
4. Pulse asks clarifying questions → Generates smart tasks
5. Assign tasks to family members
6. Review task completions → Approve/deny (award points)
7. Review reward requests → Approve/deny/fulfill
8. Check analytics → See who's completing most, trends

---

## 📊 Metrics & Success Criteria

### User Engagement
- Task completion rate (target: 70%+)
- Daily active users per family (target: 60%+)
- Streak maintenance (target: 40% with 7+ day streaks)
- Pulse AI usage (target: 30% of tasks created via AI)

### Business Metrics
- Free → Paid conversion (target: 20%)
- Annual vs monthly (target: 70% annual)
- Churn rate (target: <10% annually)
- Average revenue per organization (target: $35/year)

### Feature Usage
- Calendar import usage (target: 50% of Premium+ users)
- Hub display mode (target: 30% of families)
- Achievements unlocked per user (target: 5+ per month)
- Reward redemptions (target: 2+ per week per kid)

---

## 🎨 Design Principles

### Visual Design
- **Modern & Clean:** Rounded corners, subtle shadows, ample whitespace
- **Color Palette:** Blue primary (trust, calm), gradient accents for CTAs
- **Typography:** Clear hierarchy, readable fonts, appropriate sizes per role
- **Imagery:** Emojis for quick recognition, photos for proof, avatars for identity

### User Experience
- **Mobile-First:** Bottom navigation, touch-friendly buttons
- **Role-Appropriate:** Kids see fun/colorful, adults see data/professional
- **Progressive Disclosure:** Show basics first, advanced features in "More"
- **Error Prevention:** Confirmations for deletions, clear warnings
- **Feedback:** Loading states, success messages, error explanations

### Accessibility
- **Touch Targets:** Minimum 44x44px for all interactive elements
- **Contrast:** WCAG AA compliant text/background ratios
- **Font Sizes:** Minimum 16px for body text, larger for kids
- **Clear Labels:** Every icon has accompanying text or aria-label

---

## 🛣️ Roadmap

### MVP (Weeks 1-4) ✅
- Landing page with pricing
- Signup/onboarding wizard
- Login (email/password + PIN)
- Role-based dashboards
- Task management with AI (Pulse)
- Rewards system
- Calendar view with imports
- Achievements
- Family management
- Settings
- Hub display mode
- Analytics

### Phase 2 (Post-MVP)
- 2-way calendar sync
- Google Photos integration for task proof
- Meal planning (tables already in database)
- Advanced AI features (routine detection, smart scheduling)
- Email drip campaigns beyond trial
- Mobile native app (PWA covers MVP)

### Phase 3 (Future)
- Multi-organization support (schools, daycares)
- Shared family network (connect with other families)
- Marketplace (premium task/reward packs)
- Advanced analytics (predictive insights)
- Integrations (Amazon Alexa, Google Home)

---

## 🎯 Target Audience

### Primary
- **Busy parents** (ages 30-45) with 2-4 kids
- Tech-comfortable but not tech-savvy
- Value organization, want kids to be responsible
- Willing to pay for tools that save time

### Secondary
- **Blended families** needing coordination between households
- **Multi-generational homes** with grandparents helping
- **Single parents** needing structure and automation
- **Families with ADHD kids** who benefit from clear structure

### Pain Points We Solve
- "My kids never remember their chores"
- "I spend too much time nagging"
- "Hard to coordinate between parents"
- "Kids don't understand the value of work"
- "Can't keep track of who did what"
- "Reward systems are too complicated"

---

## 💡 Unique Selling Points

1. **Pulse AI Assistant:** Only family chore app with integrated AI that learns your family
2. **PIN Login for Kids:** COPPA-compliant, secure, no email needed
3. **Hub Display Mode:** Turn any device into a family command center
4. **Generous Free Tier:** 30 tasks + calendar import (competitors limit to 5-10)
5. **Adaptive Learning:** Task library that gets smarter as you use it
6. **Mobile-First Design:** Built for phones, works on everything
7. **Achievements System:** Beyond points—badges unlock privileges
8. **Fair Pricing:** $39.99/year vs competitors at $29.99 but with 10x features

---

## 📣 Marketing Messages

### Primary Tagline
"Family Chores Made Simple & Smart"

### Supporting Messages
- "Meet Pulse—Your Family's AI Assistant"
- "Turn chores into achievements"
- "Finally, a system kids actually want to use"
- "Stop nagging, start rewarding"
- "Smart suggestions that adapt to your family"

### Value Propositions
- **For Parents:** Save time, reduce conflict, build responsibility
- **For Kids:** Earn rewards, unlock achievements, see progress
- **For Families:** Better coordination, clear expectations, quality time back

---

## 🔒 Compliance & Privacy

### COPPA Compliance
- No email collection for kids under 13
- Parental consent required for kid accounts
- No behavioral advertising to children
- Ad-free experience for Premium+ (COPPA-compliant ads on Free tier)

### GDPR Compliance
- Data export feature
- Data deletion feature
- Cookie consent banner
- Clear privacy policy with data retention schedule

### Security Measures
- Bank-level encryption (AES-256)
- Regular security audits
- Vulnerability scanning
- Secure credential storage (bcrypt for PINs, Supabase for passwords)
- Rate limiting on all endpoints
- No data sharing with third parties

---

## 📈 Go-to-Market Strategy

### Launch Plan
1. **Beta Phase:** 10-20 families, gather feedback, fix bugs
2. **Soft Launch:** Free tier only, build user base
3. **Full Launch:** Enable paid tiers, marketing push
4. **Growth Phase:** Referral program, content marketing, ads

### Marketing Channels
- **Content Marketing:** Blog posts on family organization, parenting tips
- **Social Media:** Instagram (visual), Facebook (parent groups), Pinterest (organization)
- **Paid Ads:** Facebook/Instagram targeting busy parents
- **SEO:** Target "family chore app", "task management for kids", "chore chart app"
- **Partnerships:** Parenting bloggers, family influencers
- **App Stores:** PWA listed in relevant app directories

### Pricing Strategy
- Lead with free tier (low barrier to entry)
- 14-day trial for paid tiers (experience full value)
- Annual pricing default (reduce churn, improve LTV)
- No hidden fees or surprises (trust-building)
- Transparent feature comparison (help users self-select)

---

## 🎬 Conclusion

ChorePulse is positioned to revolutionize how families manage household responsibilities by combining intelligent AI assistance (Pulse), role-based experiences, and gamification into a mobile-first platform. With a generous free tier and powerful paid features, we serve families at every stage—from just getting started to power users managing complex schedules.

Our focus on **COPPA compliance**, **mobile-first design**, and **adaptive AI** differentiates us from legacy competitors while our **fair pricing** and **14-day trial** reduce friction for new families to get started.

**Next Steps:** Use this overview to create marketing materials, refine messaging, and ensure all development aligns with the core vision of making family chores simple and smart with Pulse AI at the center.

---

**Questions or Feedback?** This is a living document—update as the product evolves and customer feedback shapes priorities.
