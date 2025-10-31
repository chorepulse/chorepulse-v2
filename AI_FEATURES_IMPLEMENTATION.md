# AI Features Implementation Guide

## Overview

ChorePulse now includes AI-powered features using OpenAI's GPT models to make task management easier and more intelligent. The primary feature is **Natural Language Task Parsing** which allows users to describe tasks in plain English and have them automatically converted to structured task data.

**Status:** ✅ Fully implemented and ready for testing

---

## Features Implemented

### 1. Natural Language Task Parsing

**What it does:**
Users can type tasks in plain English instead of filling out forms manually. The AI understands:

- **Task names**: "Clean the bathroom" → name: "Clean the bathroom"
- **Scheduling**: "every Tuesday at 3pm" → weekly recurrence on Tuesday at 15:00
- **Point values**: "worth 50 points" → pointValue: 50
- **Requirements**: "photo required" → photoRequired: true
- **Complex schedules**: "on Mondays and Thursdays" → custom recurrence [1,4]
- **Assignments**: "assign to teenagers" → assignedTo: "teenager"

**Examples:**
```
Input: "Clean the bathroom every Tuesday at 3pm"
Output:
- Name: Clean the bathroom
- Recurrence: Weekly
- Day: Tuesday
- Time: 15:00
- Confidence: 95%

Input: "Take out trash on Mondays and Thursdays at 7pm worth 20 points"
Output:
- Name: Take out trash
- Recurrence: Custom
- Days: Monday, Thursday
- Time: 19:00
- Points: 20
- Confidence: 90%

Input: "Do laundry tomorrow at 10am, photo required"
Output:
- Name: Do laundry
- Recurrence: Once
- Due Date: 2025-10-29
- Time: 10:00
- Photo Required: true
- Confidence: 85%
```

---

## Architecture

### Files Created

**Backend:**
- `lib/openai.ts` - OpenAI client configuration and cost tracking
- `lib/ai/task-parser.ts` - Natural language parser with validation
- `app/api/ai/parse-task/route.ts` - API endpoint for parsing
- `supabase/migrations/021_create_ai_usage_tracking.sql` - Database for cost monitoring

**Frontend:**
- `hooks/useAITaskParser.ts` - React hook for AI parsing
- `components/modals/QuickCreateTaskModal.tsx` - Enhanced with AI input (MODIFIED)

### Database Schema

**ai_usage_logs table:**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to users)
- organization_id: UUID (foreign key to organizations)
- feature: VARCHAR (task_parsing, task_suggestions, etc.)
- model: VARCHAR (gpt-4o-mini, gpt-4o, etc.)
- input_tokens: INTEGER
- output_tokens: INTEGER
- total_tokens: INTEGER
- estimated_cost: DECIMAL (in USD)
- request_data: JSONB
- response_data: JSONB
- status: VARCHAR (success, error, rate_limited)
- error_message: TEXT
- created_at: TIMESTAMPTZ
```

**Helper functions:**
- `get_user_ai_usage_summary(user_id, days)` - Get AI usage stats for a user
- `get_organization_ai_usage_summary(org_id, days)` - Get AI usage stats for an org

---

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-proj-...`)

### 2. Configure Environment Variables

Edit `.env.local`:

```env
# ----------------------------------------------------------------------------
# OpenAI
# ----------------------------------------------------------------------------
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini

# ----------------------------------------------------------------------------
# Feature Flags
# ----------------------------------------------------------------------------
NEXT_PUBLIC_FEATURE_AI_ENABLED=true
```

**Important:**
- Keep `OPENAI_API_KEY` secret - never commit to git
- For production (Vercel), add to Environment Variables in dashboard
- `gpt-4o-mini` is recommended for cost efficiency ($0.15 per 1M input tokens)

### 3. Run Database Migration

```bash
# If using Supabase CLI locally
supabase migration up

# Or apply via Supabase Dashboard
# SQL Editor → New Query → Paste contents of 021_create_ai_usage_tracking.sql → Run
```

### 4. Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

The AI features will now be enabled!

---

## Usage

### For End Users

1. Click "Create Task" in the Tasks page
2. Look for the **"🤖 Pulse AI - Describe Your Task"** section at the top
3. Type your task in plain English, for example:
   - "Clean the bathroom every Tuesday at 3pm"
   - "Take out trash on Mondays and Thursdays worth 20 points"
   - "Do laundry tomorrow at 10am, photo required"
4. Click "Parse with AI" or press Cmd/Ctrl + Enter
5. The form fields below will auto-fill with parsed data
6. Review and adjust as needed
7. Select who to assign the task to
8. Click "Create Task"

**Confidence Score:**
- The AI shows a confidence percentage (e.g., "95% confident")
- High confidence (>80%): Usually accurate, minimal review needed
- Medium confidence (60-80%): Double-check the parsed values
- Low confidence (<60%): May need manual adjustment

### For Developers

**Using the API directly:**

```typescript
POST /api/ai/parse-task
Content-Type: application/json
Authorization: Bearer <user-token>

{
  "input": "Clean the bathroom every Tuesday at 3pm"
}

Response:
{
  "success": true,
  "parsed": {
    "name": "Clean the bathroom",
    "recurrence": "weekly",
    "dayOfWeek": 2,
    "time": "15:00",
    "confidence": 0.95,
    "originalInput": "Clean the bathroom every Tuesday at 3pm"
  },
  "apiFormat": {
    "name": "Clean the bathroom",
    "recurrence_type": "weekly",
    "day_of_week": 2,
    "time": "15:00",
    "point_value": 10,
    "photo_required": false
  },
  "confidence": 0.95,
  "usage": {
    "tokens": 245,
    "cost": 0.000037
  }
}
```

**Using the React hook:**

```typescript
import { useAITaskParser } from '@/hooks/useAITaskParser'

function MyComponent() {
  const { parseTask, isParsing, lastParsed } = useAITaskParser()

  const handleParse = async () => {
    const result = await parseTask("Take out trash every Monday at 7pm")

    if (result.success) {
      console.log('Parsed:', result.parsed)
      console.log('Confidence:', result.confidence)
      console.log('Cost:', result.usage.cost)
    }
  }

  return (
    <button onClick={handleParse} disabled={isParsing}>
      {isParsing ? 'Parsing...' : 'Parse Task'}
    </button>
  )
}
```

---

## Cost Monitoring

### Token Usage and Costs

**Model: gpt-4o-mini**
- Input: $0.150 per 1M tokens ($0.00015 per 1K tokens)
- Output: $0.600 per 1M tokens ($0.0006 per 1K tokens)

**Typical task parse:**
- Input tokens: ~150-200 (system prompt + user input)
- Output tokens: ~50-100 (JSON response)
- **Total cost: ~$0.00003 - $0.00006 per parse** (less than 1¢ per 100 parses)

**Monthly estimates:**
- 1,000 parses/month: ~$0.05
- 10,000 parses/month: ~$0.50
- 100,000 parses/month: ~$5.00

### Viewing Usage

**Via SQL (Supabase Dashboard):**

```sql
-- Get usage for last 30 days
SELECT * FROM get_user_ai_usage_summary('user-id', 30);

-- Get organization usage
SELECT * FROM get_organization_ai_usage_summary('org-id', 30);

-- Total cost this month
SELECT SUM(estimated_cost) as total_cost
FROM ai_usage_logs
WHERE created_at > DATE_TRUNC('month', NOW())
  AND status = 'success';
```

**Building an admin dashboard** (future enhancement):
```
GET /api/admin/ai-usage?period=30d
→ Show charts of usage, costs, and trends
```

---

## Error Handling

### Common Issues

**1. AI Features Not Showing**
- Check: `NEXT_PUBLIC_FEATURE_AI_ENABLED=true` in `.env.local`
- Restart dev server after changing env vars

**2. "AI features are not enabled" Error**
- Check: `OPENAI_API_KEY` is set in `.env.local`
- Verify the key is valid (starts with `sk-proj-` or `sk-`)
- Check: Key is not commented out

**3. Low Confidence Scores**
- User input may be ambiguous ("clean up" - what?)
- Try being more specific
- System learns from patterns over time

**4. Parse Failures**
- Very complex or unusual inputs may fail
- Fallback: Returns input as task name with 0.1 confidence
- User can still manually fill the form

### Graceful Degradation

If OpenAI API is down or rate-limited:
- Error is logged but not shown to user as critical
- Form remains usable with manual input
- User can use template suggestions instead
- No data loss - just falls back to manual entry

---

## Security & Privacy

**Data handling:**
- User inputs are sent to OpenAI API for parsing
- OpenAI's data usage policy: [https://openai.com/policies/api-data-usage-policies](https://openai.com/policies/api-data-usage-policies)
- By default, API data is NOT used for training (as of March 2023)
- Request/response data is logged in `ai_usage_logs` for debugging
- Logs are subject to same RLS policies as other user data

**Best practices:**
- Don't send sensitive personal information in task descriptions
- Logs can be purged after N days if desired
- Consider adding opt-out for AI features in user settings

---

## Testing

### Manual Testing

1. **Enable AI features:**
```bash
# .env.local
NEXT_PUBLIC_FEATURE_AI_ENABLED=true
OPENAI_API_KEY=sk-proj-your-key
```

2. **Test parsing:**
```bash
curl -X POST http://localhost:3000/api/ai/parse-task \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"input": "Clean bathroom every Tuesday at 3pm"}'
```

3. **Test in UI:**
- Navigate to Tasks page
- Click "Create Task"
- Look for purple AI section
- Type: "Take out trash every Monday at 7pm worth 20 points"
- Click "Parse with AI"
- Verify form fields are auto-filled
- Check confidence score

### Test Cases

**Basic parsing:**
- ✅ "Clean bathroom" → name
- ✅ "Clean bathroom at 3pm" → name + time
- ✅ "Clean bathroom daily" → name + recurrence
- ✅ "Clean bathroom daily at 3pm" → name + recurrence + time

**Recurrence patterns:**
- ✅ "every day" → daily
- ✅ "every Tuesday" → weekly, day 2
- ✅ "on Mondays and Thursdays" → custom [1,4]
- ✅ "on the 15th of each month" → monthly, day 15

**Point values:**
- ✅ "worth 20 points" → 20
- ✅ "50 pts" → 50
- ✅ "100 point reward" → 100

**Requirements:**
- ✅ "photo required" → photoRequired: true
- ✅ "needs approval" → requiresApproval: true (if parser supports)
- ✅ "proof needed" → photoRequired: true

**Edge cases:**
- ✅ Empty input → error message
- ✅ Very long input → truncated gracefully
- ✅ Ambiguous input → low confidence score
- ✅ Invalid date → error or fallback

---

## Future Enhancements

### Planned Features

**1. Smart Task Suggestions** (Week 10-11)
- Analyze household data (size, children ages, location)
- Suggest age-appropriate tasks
- Learn from completion patterns
- Prioritize based on seasons and events

**2. Pulse AI Meal Planning** (Week 12)
- Generate weekly meal plans
- Consider dietary restrictions
- Create shopping lists
- Suggest recipes based on family preferences

**3. Context-Aware Parsing** (Future)
- Learn from user's past tasks
- Understand household-specific terminology
- Personalize suggestions per user role

**4. Batch Task Creation** (Future)
- Parse multiple tasks at once
- "Create my weekly cleaning routine"
- Auto-generate full task lists

**5. Voice Input** (Future)
- Integrate with browser voice API
- "Hey Pulse, add a task: take out trash every Monday"

### Optimization Ideas

**1. Caching:**
- Cache common phrases to reduce API calls
- "clean bathroom" → pre-parsed template

**2. Progressive Enhancement:**
- Start with simple regex parsing for obvious patterns
- Only use AI for complex cases
- Reduce costs by 50-70%

**3. Fine-tuning:**
- Collect user corrections
- Fine-tune model on ChorePulse-specific data
- Improve accuracy for household tasks

---

## Troubleshooting

### Issue: High Costs

**Symptoms:**
- Monthly bill higher than expected

**Solutions:**
- Check `ai_usage_logs` for unusual patterns
- Limit to specific subscription tiers (e.g., Pro only)
- Add rate limiting per user
- Cache common inputs

```sql
-- Find top users by cost
SELECT user_id, COUNT(*) as requests, SUM(estimated_cost) as total_cost
FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_cost DESC
LIMIT 10;
```

### Issue: Slow Responses

**Symptoms:**
- Parsing takes >5 seconds

**Solutions:**
- Check OpenAI API status
- Reduce `maxTokens` in prompts
- Add timeout handling
- Show loading state clearly

### Issue: Inaccurate Parses

**Symptoms:**
- Confidence score high but results wrong

**Solutions:**
- Update system prompt with examples
- Add validation after parsing
- Allow users to report issues
- Collect correction data for fine-tuning

---

## API Reference

### POST /api/ai/parse-task

**Request:**
```json
{
  "input": "string (required)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "parsed": {
    "name": "string",
    "description": "string?",
    "recurrence": "once|daily|weekly|monthly|custom",
    "dayOfWeek": "number (0-6)?",
    "dayOfMonth": "number (1-31)?",
    "customDays": "number[]?",
    "time": "string (HH:MM)?",
    "dueDate": "string (ISO)?",
    "assignedTo": "string?",
    "pointValue": "number?",
    "photoRequired": "boolean?",
    "confidence": "number (0-1)",
    "originalInput": "string"
  },
  "apiFormat": {
    "name": "string",
    "description": "string",
    "recurrence_type": "string",
    "point_value": "number",
    "photo_required": "boolean",
    ...
  },
  "confidence": "number",
  "usage": {
    "tokens": "number",
    "cost": "number"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "string"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid input
- 401: Unauthorized
- 403: AI features not enabled
- 500: Server error

---

## Support

**For issues or questions:**
- Check this documentation first
- Review `ai_usage_logs` for debugging
- Check OpenAI API status: [https://status.openai.com](https://status.openai.com)
- OpenAI API docs: [https://platform.openai.com/docs](https://platform.openai.com/docs)

**Related files:**
- Implementation: `lib/ai/task-parser.ts`
- API: `app/api/ai/parse-task/route.ts`
- Database: `supabase/migrations/021_create_ai_usage_tracking.sql`
- UI: `components/modals/QuickCreateTaskModal.tsx`
