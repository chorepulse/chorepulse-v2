# ChorePulse v2 - Hub Display Specification

**Last Updated:** 2025-10-22
**Status:** Final Design

---

## Overview

Hub Display Mode transforms any device into a shared family information center. It's designed for:
- Wall-mounted tablets
- Kitchen counter devices
- Family room displays
- Shared computers

---

## Activation

**Entry Point:** Any device → Settings → Family Hub → "Enable Hub Mode"

**Behavior:**
- URL changes to `/hub`
- Device localStorage stores `hubMode: true`
- Display optimized for large-screen, touch-friendly interaction
- Auto-logout after 5 minutes of inactivity (configurable)

---

## Display Modes

### Mode 1: Slideshow (Default)

**Behavior:** Auto-rotates through screens every 30 seconds

**Screens:**
1. **Today's Tasks** - Active tasks due today, sorted by family member
2. **Calendar View** - This week's events
3. **Leaderboard** - Weekly rankings
4. **Family Messages** - Recent messages/reactions
5. **Achievements** - Recently earned by family

**Controls:**
- Manual navigation arrows
- Pause slideshow button
- Quick PIN login button (bottom-right)

---

### Mode 2: Calendar View

**Display:**
- Weekly calendar grid
- Color-coded by family member
- Task due dates highlighted
- Touch event for details

---

### Mode 3: Control Center

**Layout:**
- Left sidebar: Task list with quick complete buttons
- Right sidebar: Leaderboard
- Center: Calendar or task details

**Quick Actions:**
- Mark task complete (requires PIN)
- View task details
- See point values

---

## PIN Login from Hub

**Flow:**
1. Click "Log In" button (always visible)
2. PIN entry screen (4-digit, touch-friendly)
3. User selection (avatar grid)
4. Logged in → Personalized view
5. Auto-logout after 5 minutes → Return to hub display

---

## Settings

**Configurable by Account Owner/Family Manager:**
- Slideshow interval (15s, 30s, 60s)
- Enabled display modes
- Auto-logout duration (3min, 5min, 10min, never)
- What info to show (tasks, calendar, leaderboard, messages)
- Theme (light/dark/auto)

---

## Implementation

```typescript
// app/hub/page.tsx
export default function HubPage() {
  const [mode, setMode] = useState<'slideshow' | 'calendar' | 'control'>('slideshow');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow rotation
  useEffect(() => {
    if (mode !== 'slideshow') return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 5);
    }, 30000);

    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="hub-container">
      {mode === 'slideshow' && <SlideshowView slide={currentSlide} />}
      {mode === 'calendar' && <CalendarView />}
      {mode === 'control' && <ControlCenterView />}

      <HubControls mode={mode} onModeChange={setMode} />
      <QuickLoginButton />
    </div>
  );
}
```

---

## Summary

Hub Display Mode provides:
✅ **Shared Device Support** - Any device becomes family hub
✅ **Multiple Modes** - Slideshow, calendar, control center
✅ **Quick Access** - PIN login for personalized views
✅ **Auto-Logout** - Returns to hub display after inactivity
✅ **Configurable** - Customizable by family managers
