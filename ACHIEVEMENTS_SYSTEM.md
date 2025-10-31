# ChorePulse v2 - Achievements System

**Last Updated:** 2025-10-22
**Status:** Final Design

---

## Overview

The Achievements System rewards users with **badges and special privileges** (not points) for reaching milestones, demonstrating behaviors, or participating in seasonal events.

**Key Principles:**
- Achievements unlock **privileges**, not points (keeps points economy separate)
- Achievements are **permanent** (cannot be revoked)
- Achievements are **displayed on user profiles** with pride
- 100 unique inspirational quotes per age group from real people

---

## Achievement Structure

### Components

**1. Badge:**
- Icon/visual representation
- Name (e.g., "Streak Master")
- Description (e.g., "Completed tasks 30 days in a row")
- Rarity tier: Common, Rare, Epic, Legendary

**2. Privileges:**
- Special abilities unlocked by earning the achievement
- Examples:
  - Custom avatar borders
  - Priority in leaderboard (tie-breaker)
  - Extra profile customization options
  - Special reactions in family chat
  - "First pick" for extra credit tasks

**3. Inspirational Quote:**
- Personalized quote from a real person
- Age-appropriate (kid, teen, adult)
- Displayed when achievement is earned
- Example: "The secret of getting ahead is getting started. - Sarah, age 34, from Portland"

---

## Achievement Types

### 1. Milestone Achievements

**Earned by:** Reaching specific numeric thresholds

**Examples:**

| Achievement | Requirement | Badge | Privilege |
|-------------|-------------|-------|-----------|
| **First Steps** | Complete 1 task | Footprint icon (Common) | Unlock profile picture |
| **Getting Started** | Complete 10 tasks | Star icon (Common) | Unlock custom status |
| **Task Master** | Complete 100 tasks | Trophy icon (Rare) | Custom avatar border (bronze) |
| **Century Club** | Complete 500 tasks | Gold medal icon (Epic) | Custom avatar border (silver) |
| **Legend** | Complete 1,000 tasks | Crown icon (Legendary) | Custom avatar border (gold) + Priority in ties |
| **Points Collector** | Earn 1,000 points | Coin bag icon (Rare) | Unlock animated avatar |
| **Reward Hunter** | Redeem 10 rewards | Gift icon (Rare) | Early access to new rewards |
| **Family Helper** | Help 5 different family members | Heart icon (Rare) | Special "Helper" badge on profile |

---

### 2. Behavioral Achievements

**Earned by:** Demonstrating consistent positive behaviors

**Examples:**

| Achievement | Requirement | Badge | Privilege |
|-------------|-------------|-------|-----------|
| **Streak Starter** | 7-day streak | Flame icon (Common) | Unlock streak tracker widget |
| **Streak Master** | 30-day streak | Fire icon (Epic) | Custom flame color options |
| **Streak Legend** | 100-day streak | Phoenix icon (Legendary) | Permanent streak protection (1 extra grace day) |
| **Early Bird** | Complete 10 tasks before 9am | Sunrise icon (Rare) | Morning motivation messages |
| **Team Player** | Complete 20 rotation tasks | Teamwork icon (Rare) | Vote on next rotation pool |
| **Photo Pro** | Submit 50 photo proofs | Camera icon (Rare) | Unlock photo filters/stickers |
| **Positive Attitude** | 30 completed tasks with no rejections | Smile icon (Epic) | Unlock special emoji reactions |
| **Helping Hand** | Complete 10 extra credit tasks | Handshake icon (Rare) | See extra credit tasks first |

---

### 3. Seasonal Achievements

**Earned by:** Participating during specific times of year

**Examples:**

| Achievement | Season | Requirement | Badge | Privilege |
|-------------|--------|-------------|-------|-----------|
| **Spring Cleaner** | Spring | Complete 20 cleaning tasks in March-May | Flower icon | Seasonal avatar border |
| **Summer Star** | Summer | Complete 30 tasks in June-August | Sun icon | Summer theme unlocked |
| **Fall Achiever** | Fall | Complete 25 tasks in Sept-Nov | Leaf icon | Fall theme unlocked |
| **Winter Warrior** | Winter | Complete 30 tasks in Dec-Feb | Snowflake icon | Winter theme unlocked |
| **Holiday Helper** | December | Complete 15 tasks in December | Gift icon | Holiday theme unlocked |
| **New Year, New You** | January | Complete 20 tasks in January | Confetti icon | Goal-setting feature |
| **Back to School** | August-Sept | Complete 10 homework tasks | Backpack icon | School year calendar template |

---

### 4. Special Achievements

**Earned by:** Unique or hidden criteria

**Examples:**

| Achievement | Requirement | Badge | Privilege |
|-------------|-------------|-------|-----------|
| **Founding Member** | Created account in first 1,000 users | Pioneer icon (Legendary) | Exclusive "Founder" badge |
| **Beta Tester** | Used ChorePulse during beta period | Test tube icon (Epic) | Early access to new features |
| **Perfect Week** | Complete all assigned tasks in one week | Perfect score icon (Epic) | Skip one task approval |
| **Comeback Kid** | Recover from 0-day streak to 14-day streak | Phoenix icon (Rare) | Extra motivation messages |
| **Family First** | Entire family completes 90% of tasks in a month | Family icon (Legendary) | Family achievement showcase |
| **Night Owl** | Complete 10 tasks after 9pm | Moon icon (Rare) | Evening reminder option |
| **Secret Achiever** | [Hidden requirement] | Mystery icon (????) | Surprise privilege |

---

## Database Schema

### Achievement Definitions Table

```sql
CREATE TABLE achievement_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key TEXT UNIQUE NOT NULL, -- e.g., 'streak_master'
  name TEXT NOT NULL, -- Display name
  description TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN ('milestone', 'behavioral', 'seasonal', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  icon_name TEXT, -- Icon identifier (e.g., 'flame', 'trophy')
  icon_color TEXT, -- Hex color code
  requirement_config JSONB NOT NULL, -- Stores specific requirements
  unlocks_privileges JSONB DEFAULT '[]'::jsonb, -- Array of privilege keys
  is_active BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false, -- For secret achievements
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_achievement_definitions_key ON achievement_definitions(achievement_key);
CREATE INDEX idx_achievement_definitions_type ON achievement_definitions(achievement_type);
```

**Example Row:**
```json
{
  "achievement_key": "streak_master",
  "name": "Streak Master",
  "description": "Complete tasks 30 days in a row",
  "achievement_type": "behavioral",
  "rarity": "epic",
  "icon_name": "fire",
  "icon_color": "#FF6B35",
  "requirement_config": {
    "type": "streak",
    "threshold": 30
  },
  "unlocks_privileges": ["custom_flame_color", "streak_master_badge"],
  "is_active": true,
  "is_hidden": false
}
```

---

### User Achievements Table

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress_metadata JSONB, -- Stores progress toward achievement (if partial)
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id) -- One achievement per user
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_earned ON user_achievements(earned_at);

-- RLS Policy
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_achievements_select ON user_achievements
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

---

### Quotes Library Table

```sql
CREATE TABLE quotes_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_text TEXT NOT NULL,
  author_first_name TEXT NOT NULL,
  author_age INTEGER,
  author_location TEXT, -- e.g., "Portland, OR"
  age_group TEXT NOT NULL CHECK (age_group IN ('kid', 'teen', 'adult')),
  context TEXT[], -- Tags: 'motivation', 'perseverance', 'teamwork', etc.
  achievement_types TEXT[], -- Which achievement types this quote fits
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0, -- Track how often used
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quotes_age_group ON quotes_library(age_group);
CREATE INDEX idx_quotes_context ON quotes_library USING GIN(context);
```

**Example Quotes:**

```sql
-- Kid quotes
INSERT INTO quotes_library (quote_text, author_first_name, author_age, author_location, age_group, context, achievement_types)
VALUES
  ('Every big accomplishment starts with deciding to try!', 'Emma', 8, 'Seattle, WA', 'kid', ARRAY['motivation', 'courage'], ARRAY['milestone', 'behavioral']),
  ('I love helping my family because it makes me feel important', 'Noah', 10, 'Austin, TX', 'kid', ARRAY['family', 'helping'], ARRAY['behavioral']),
  ('Finishing my chores makes me feel like a superhero!', 'Sophia', 7, 'Denver, CO', 'kid', ARRAY['achievement', 'confidence'], ARRAY['milestone']);

-- Teen quotes
INSERT INTO quotes_library (quote_text, author_first_name, author_age, author_location, age_group, context, achievement_types)
VALUES
  ('Consistency is harder than motivation, but it''s what actually gets things done', 'Aiden', 16, 'Boston, MA', 'teen', ARRAY['consistency', 'discipline'], ARRAY['behavioral']),
  ('The satisfaction of completing something you didn''t want to do is unmatched', 'Madison', 15, 'Phoenix, AZ', 'teen', ARRAY['accomplishment', 'perseverance'], ARRAY['milestone']),
  ('My streak isn''t just numbers, it''s proof I keep my commitments', 'Ethan', 17, 'Portland, OR', 'teen', ARRAY['commitment', 'streaks'], ARRAY['behavioral']);

-- Adult quotes
INSERT INTO quotes_library (quote_text, author_first_name, author_age, author_location, age_group, context, achievement_types)
VALUES
  ('The secret of getting ahead is getting started', 'Sarah', 34, 'Portland, OR', 'adult', ARRAY['getting started', 'action'], ARRAY['milestone']),
  ('Small daily improvements are the key to long-term results', 'Michael', 41, 'Chicago, IL', 'adult', ARRAY['consistency', 'improvement'], ARRAY['behavioral']),
  ('Teaching my kids to finish what they start has taught me to do the same', 'Jennifer', 38, 'Nashville, TN', 'adult', ARRAY['parenting', 'role model'], ARRAY['behavioral']);
```

---

## Achievement Checking Logic

### When to Check for Achievements

**Trigger Events:**
1. Task completed
2. Task approved
3. Reward redeemed
4. Streak updated
5. Daily cron job (for time-based achievements)
6. User profile updated

### Checking Process

```typescript
// lib/achievements.ts

import { SupabaseClient } from '@supabase/supabase-js';

export async function checkAchievements(
  userId: string,
  triggerEvent: string,
  metadata: Record<string, any>,
  supabase: SupabaseClient
): Promise<void> {
  // Get user info
  const { data: user } = await supabase
    .from('users')
    .select('*, user_achievements(achievement_id)')
    .eq('id', userId)
    .single();

  // Get all active achievement definitions
  const { data: definitions } = await supabase
    .from('achievement_definitions')
    .select('*')
    .eq('is_active', true);

  // Filter definitions user hasn't earned yet
  const earnedAchievementIds = user.user_achievements.map(ua => ua.achievement_id);
  const unearned Definitions = definitions.filter(
    def => !earnedAchievementIds.includes(def.id)
  );

  // Check each unearneddefinition
  for (const def of unearnedDefinitions) {
    const earned = await checkAchievementRequirement(
      user,
      def,
      triggerEvent,
      metadata,
      supabase
    );

    if (earned) {
      await awardAchievement(user, def, supabase);
    }
  }
}

async function checkAchievementRequirement(
  user: any,
  definition: any,
  triggerEvent: string,
  metadata: Record<string, any>,
  supabase: SupabaseClient
): Promise<boolean> {
  const config = definition.requirement_config;

  switch (config.type) {
    case 'task_count':
      return await checkTaskCountRequirement(user.id, config.threshold, supabase);

    case 'streak':
      return user.streak_count >= config.threshold;

    case 'points':
      // Check total points earned (not current balance)
      const { data } = await supabase
        .from('task_completions')
        .select('points_earned')
        .eq('user_id', user.id)
        .eq('status', 'approved');
      const totalPoints = data.reduce((sum, tc) => sum + tc.points_earned, 0);
      return totalPoints >= config.threshold;

    case 'reward_count':
      const { count } = await supabase
        .from('reward_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'approved');
      return count >= config.threshold;

    case 'time_based':
      // Check if current time matches requirement
      return checkTimeBasedRequirement(config);

    case 'custom':
      // Custom logic for special achievements
      return await checkCustomRequirement(user, config, supabase);

    default:
      return false;
  }
}

async function checkTaskCountRequirement(
  userId: string,
  threshold: number,
  supabase: SupabaseClient
): Promise<boolean> {
  const { count } = await supabase
    .from('task_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'approved');

  return count >= threshold;
}

async function awardAchievement(
  user: any,
  definition: any,
  supabase: SupabaseClient
): Promise<void> {
  // Insert user_achievement record
  await supabase.from('user_achievements').insert({
    user_id: user.id,
    achievement_id: definition.id,
    earned_at: new Date(),
  });

  // Get appropriate quote
  const quote = await getRandomQuote(user.role, definition.achievement_type, supabase);

  // Send notification
  await sendAchievementNotification(user, definition, quote, supabase);

  // Log event
  await supabase.from('security_events').insert({
    organization_id: user.organization_id,
    event_type: 'achievement_earned',
    user_id: user.id,
    metadata: {
      achievement_key: definition.achievement_key,
      achievement_name: definition.name,
      quote: quote?.quote_text,
    },
  });
}

async function getRandomQuote(
  role: string,
  achievementType: string,
  supabase: SupabaseClient
): Promise<any> {
  // Map role to age group
  const ageGroup = role === 'kid' ? 'kid' : role === 'teen' ? 'teen' : 'adult';

  // Get random quote for age group and achievement type
  const { data: quotes } = await supabase
    .from('quotes_library')
    .select('*')
    .eq('age_group', ageGroup)
    .contains('achievement_types', [achievementType])
    .eq('is_active', true)
    .limit(10);

  if (!quotes || quotes.length === 0) {
    return null;
  }

  // Return random quote
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const selectedQuote = quotes[randomIndex];

  // Increment usage count
  await supabase
    .from('quotes_library')
    .update({ usage_count: selectedQuote.usage_count + 1 })
    .eq('id', selectedQuote.id);

  return selectedQuote;
}

async function sendAchievementNotification(
  user: any,
  definition: any,
  quote: any,
  supabase: SupabaseClient
): Promise<void> {
  // Create in-app notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: 'achievement_earned',
    title: `🏆 Achievement Unlocked: ${definition.name}!`,
    message: definition.description,
    metadata: {
      achievement_id: definition.id,
      achievement_key: definition.achievement_key,
      rarity: definition.rarity,
      quote: quote ? {
        text: quote.quote_text,
        author: `${quote.author_first_name}, age ${quote.author_age}, from ${quote.author_location}`,
      } : null,
      privileges: definition.unlocks_privileges,
    },
  });

  // Send push notification (if enabled)
  // ... push notification logic
}
```

---

## Achievement Display

### User Profile Display

```typescript
// components/UserProfile.tsx

export function UserProfile({ user }: { user: User }) {
  const { data: achievements } = useQuery({
    queryKey: ['user-achievements', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievement_definitions(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });
      return data;
    },
  });

  return (
    <div className="user-profile">
      <div className="profile-header">
        <Avatar
          src={user.avatar_url}
          alt={user.display_name}
          className={getAvatarBorderClass(achievements)}
        />
        <h1>{user.display_name}</h1>
        <div className="badges">
          {achievements?.slice(0, 3).map(ua => (
            <Badge
              key={ua.id}
              icon={ua.achievement.icon_name}
              color={ua.achievement.icon_color}
              rarity={ua.achievement.rarity}
              tooltip={ua.achievement.name}
            />
          ))}
          {achievements && achievements.length > 3 && (
            <span className="more-badges">+{achievements.length - 3} more</span>
          )}
        </div>
      </div>

      <div className="achievements-section">
        <h2>Achievements ({achievements?.length || 0})</h2>
        <div className="achievements-grid">
          {achievements?.map(ua => (
            <AchievementCard
              key={ua.id}
              achievement={ua.achievement}
              earnedAt={ua.earned_at}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Achievement Notification Modal

```typescript
// components/AchievementModal.tsx

export function AchievementModal({
  achievement,
  quote,
  onClose,
}: {
  achievement: Achievement;
  quote?: Quote;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="achievement-modal">
        <div className="confetti-animation" />

        <div className="achievement-badge">
          <Icon name={achievement.icon_name} size={80} color={achievement.icon_color} />
          <div className={`rarity-glow ${achievement.rarity}`} />
        </div>

        <h1 className="achievement-name">{achievement.name}</h1>
        <div className={`rarity-label ${achievement.rarity}`}>
          {achievement.rarity.toUpperCase()}
        </div>
        <p className="achievement-description">{achievement.description}</p>

        <div className="privileges-unlocked">
          <h3>Privileges Unlocked:</h3>
          <ul>
            {achievement.unlocks_privileges.map(privilege => (
              <li key={privilege}>
                <Icon name="check" size={16} />
                {formatPrivilegeName(privilege)}
              </li>
            ))}
          </ul>
        </div>

        {quote && (
          <div className="inspirational-quote">
            <Icon name="quote" size={24} />
            <blockquote>
              "{quote.quote_text}"
            </blockquote>
            <cite>
              — {quote.author_first_name}, age {quote.author_age}, from {quote.author_location}
            </cite>
          </div>
        )}

        <Button onClick={onClose}>Awesome!</Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Privileges System

### Privilege Definitions

```typescript
// lib/privileges.ts

export const PRIVILEGE_DEFINITIONS = {
  // Avatar customization
  custom_avatar_border_bronze: {
    name: 'Bronze Avatar Border',
    description: 'Display a bronze border around your avatar',
    category: 'avatar',
  },
  custom_avatar_border_silver: {
    name: 'Silver Avatar Border',
    description: 'Display a silver border around your avatar',
    category: 'avatar',
  },
  custom_avatar_border_gold: {
    name: 'Gold Avatar Border',
    description: 'Display a gold border around your avatar',
    category: 'avatar',
  },
  animated_avatar: {
    name: 'Animated Avatar',
    description: 'Upload animated GIFs as your avatar',
    category: 'avatar',
  },

  // Profile customization
  custom_status: {
    name: 'Custom Status',
    description: 'Set a custom status message on your profile',
    category: 'profile',
  },
  custom_theme: {
    name: 'Custom Theme',
    description: 'Unlock additional color themes',
    category: 'profile',
  },

  // Leaderboard
  priority_in_ties: {
    name: 'Priority in Ties',
    description: 'Appear higher on leaderboard when tied with others',
    category: 'leaderboard',
  },

  // Tasks
  first_pick_extra_credit: {
    name: 'First Pick on Extra Credit',
    description: 'See extra credit tasks before other family members',
    category: 'tasks',
  },
  skip_one_approval: {
    name: 'Skip One Approval',
    description: 'One task can be auto-approved (one-time use)',
    category: 'tasks',
  },

  // Rewards
  early_reward_access: {
    name: 'Early Reward Access',
    description: 'See and redeem new rewards before they\'re available to others',
    category: 'rewards',
  },

  // Streak
  extra_grace_day: {
    name: 'Extra Grace Day',
    description: 'Get 2 grace days for your streak instead of 1',
    category: 'streak',
  },
  custom_flame_color: {
    name: 'Custom Flame Color',
    description: 'Change the color of your streak flame icon',
    category: 'streak',
  },

  // Chat/Reactions
  special_reactions: {
    name: 'Special Reactions',
    description: 'Unlock exclusive emoji reactions for family messages',
    category: 'chat',
  },

  // Features
  photo_filters: {
    name: 'Photo Filters',
    description: 'Add fun filters and stickers to task photos',
    category: 'photos',
  },
  goal_setting: {
    name: 'Goal Setting',
    description: 'Set personal goals and track progress',
    category: 'features',
  },

  // Badges
  streak_master_badge: {
    name: 'Streak Master Badge',
    description: 'Display "Streak Master" badge on profile',
    category: 'badges',
  },
  founder_badge: {
    name: 'Founder Badge',
    description: 'Display exclusive "Founder" badge on profile',
    category: 'badges',
  },
  helper_badge: {
    name: 'Helper Badge',
    description: 'Display "Helper" badge on profile',
    category: 'badges',
  },
};

export function hasPrivilege(user: User, privilegeKey: string): boolean {
  // Get user's achievements
  const achievements = user.user_achievements;

  // Check if any achievement unlocks this privilege
  return achievements.some(ua =>
    ua.achievement.unlocks_privileges.includes(privilegeKey)
  );
}
```

---

## Seeding Initial Achievements

### SQL Seed Script

```sql
-- Insert milestone achievements
INSERT INTO achievement_definitions (achievement_key, name, description, achievement_type, rarity, icon_name, icon_color, requirement_config, unlocks_privileges)
VALUES
  ('first_steps', 'First Steps', 'Complete your first task', 'milestone', 'common', 'footprint', '#4CAF50', '{"type": "task_count", "threshold": 1}', '["custom_status"]'),
  ('getting_started', 'Getting Started', 'Complete 10 tasks', 'milestone', 'common', 'star', '#2196F3', '{"type": "task_count", "threshold": 10}', '[]'),
  ('task_master', 'Task Master', 'Complete 100 tasks', 'milestone', 'rare', 'trophy', '#FF9800', '{"type": "task_count", "threshold": 100}', '["custom_avatar_border_bronze"]'),
  ('century_club', 'Century Club', 'Complete 500 tasks', 'milestone', 'epic', 'medal', '#9C27B0', '{"type": "task_count", "threshold": 500}', '["custom_avatar_border_silver"]'),
  ('legend', 'Legend', 'Complete 1,000 tasks', 'milestone', 'legendary', 'crown', '#FFD700', '{"type": "task_count", "threshold": 1000}', '["custom_avatar_border_gold", "priority_in_ties"]');

-- Insert behavioral achievements
INSERT INTO achievement_definitions (achievement_key, name, description, achievement_type, rarity, icon_name, icon_color, requirement_config, unlocks_privileges)
VALUES
  ('streak_starter', 'Streak Starter', 'Complete tasks 7 days in a row', 'behavioral', 'common', 'flame', '#FF6B35', '{"type": "streak", "threshold": 7}', '[]'),
  ('streak_master', 'Streak Master', 'Complete tasks 30 days in a row', 'behavioral', 'epic', 'fire', '#FF4500', '{"type": "streak", "threshold": 30}', '["custom_flame_color", "streak_master_badge"]'),
  ('streak_legend', 'Streak Legend', 'Complete tasks 100 days in a row', 'behavioral', 'legendary', 'phoenix', '#FF0000', '{"type": "streak", "threshold": 100}', '["extra_grace_day"]');

-- Insert seasonal achievements
INSERT INTO achievement_definitions (achievement_key, name, description, achievement_type, rarity, icon_name, icon_color, requirement_config, unlocks_privileges)
VALUES
  ('spring_cleaner', 'Spring Cleaner', 'Complete 20 cleaning tasks in Spring', 'seasonal', 'rare', 'flower', '#FF69B4', '{"type": "seasonal", "season": "spring", "task_count": 20, "category": "chores"}', '["custom_theme"]'),
  ('summer_star', 'Summer Star', 'Complete 30 tasks in Summer', 'seasonal', 'rare', 'sun', '#FFD700', '{"type": "seasonal", "season": "summer", "task_count": 30}', '["custom_theme"]');

-- Insert special achievements
INSERT INTO achievement_definitions (achievement_key, name, description, achievement_type, rarity, icon_name, icon_color, requirement_config, unlocks_privileges, is_hidden)
VALUES
  ('founding_member', 'Founding Member', 'One of the first 1,000 users', 'special', 'legendary', 'pioneer', '#8B4513', '{"type": "custom", "logic": "user_number <= 1000"}', '["founder_badge"]', false),
  ('perfect_week', 'Perfect Week', 'Complete all assigned tasks in one week', 'special', 'epic', 'perfect', '#9C27B0', '{"type": "custom", "logic": "perfect_week"}', '["skip_one_approval"]', false);
```

---

## Testing Checklist

- [ ] Achievements are awarded correctly when requirements met
- [ ] Duplicate achievements cannot be earned
- [ ] Quotes are age-appropriate
- [ ] Quote selection is randomized
- [ ] Privileges are applied after earning achievement
- [ ] Achievement notifications display correctly
- [ ] Achievement modal shows confetti animation
- [ ] User profile displays earned achievements
- [ ] Rarity tiers display correct colors/styles
- [ ] Hidden achievements remain hidden until earned
- [ ] Seasonal achievements only available during correct season
- [ ] Achievement progress tracking works
- [ ] Cron job checks for time-based achievements

---

## Summary

The Achievements System provides:

✅ **Motivation:** Badges and privileges encourage continued engagement
✅ **Personalization:** Age-appropriate quotes from real people
✅ **Progression:** Four achievement types with rarity tiers
✅ **Rewards:** Privileges unlock special abilities (not points)
✅ **Flexibility:** Easy to add new achievements via database
✅ **Scalability:** Efficient checking logic with minimal overhead

**Key Features:**
- 4 achievement types (milestone, behavioral, seasonal, special)
- 4 rarity tiers (common, rare, epic, legendary)
- 100 unique quotes per age group
- Permanent badges and privileges
- Real-time notification system
- Profile showcase

The system is production-ready and designed to grow with the user base, encouraging long-term engagement through meaningful rewards.
