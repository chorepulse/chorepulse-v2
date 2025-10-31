# Site-Wide V2 Redesign Plan

## 🎯 Design System

### Core Principles
1. **Mobile-first** - Design for thumb, scale up
2. **Compact headers** - Points/stats in 10% of screen
3. **Action-focused** - Primary content gets 70%+ space
4. **Swipe gestures** - Complete tasks with swipes
5. **Collapsible sections** - Progressive disclosure
6. **Glass effects** - Modern, premium feel
7. **Smooth animations** - Page transitions, stagger lists

### Visual Language
- **Headers**: Sticky glass with minimal info
- **Cards**: Glass-strong or glass-subtle
- **Primary actions**: Gradient buttons with lift
- **Lists**: Swipeable with stagger animations
- **Stats**: Compact badges and progress rings
- **FAB**: Floating action button (bottom right)

---

## 📄 Pages to Redesign

### ✅ Dashboard (DONE)
- Compact points header
- Progress ring
- Streak tracker
- Smart suggestions
- Swipeable task cards
- Family activity feed
- Affordable rewards

### 🎯 Tasks Page (Priority 1)
**Old Issues:**
- Complex filters take too much space
- Tabs are confusing (My Tasks, All Tasks, Templates)
- Creating tasks requires many clicks

**V2 Approach:**
- **Header**: Total points + "Add Task" button
- **Quick filters**: Chips (Today, This Week, All)
- **Task list**: Swipeable cards with complete/claim actions
- **Categories**: Horizontal scroll chips
- **Create task**: Modal with smart defaults
- **Templates**: Bottom sheet overlay

### 🎁 Rewards Page (Priority 2)
**Old Issues:**
- Too many tabs (Available, Requests, Approvals, Library)
- Large reward cards waste space
- No clear "what can I afford" section

**V2 Approach:**
- **Header**: Points balance prominent
- **Affordable first**: Show what user can claim
- **Compact grid**: 2 columns on mobile
- **Categories**: Horizontal chips
- **Quick claim**: Swipe right to claim
- **My requests**: Collapsible section

### 🏆 Badges Page (Priority 3)
**Old Issues:**
- Static grid layout
- No progress indicators
- Not motivating

**V2 Approach:**
- **Progress rings**: Show completion %
- **Unlocked vs Locked**: Clear visual distinction
- **Next unlock**: Highlight closest badge
- **Celebration**: Confetti on new unlock
- **Compact grid**: 3 columns mobile

### 📅 Calendar Page (Priority 4)
**Old Issues:**
- Desktop-focused calendar view
- Doesn't work well on mobile

**V2 Approach:**
- **Week view**: Horizontal scroll
- **Day detail**: Tap to expand
- **Task dots**: Color-coded by category
- **Quick complete**: Tap task to mark done
- **Add task**: FAB with date pre-filled

### ⚙️ Settings Page (Priority 5)
**Old Issues:**
- Too many tabs
- Complex nested options
- Overwhelming

**V2 Approach:**
- **Profile card**: Avatar, name, role at top
- **Quick settings**: Toggle switches inline
- **Sections**: Collapsible accordions
- **Danger zone**: Collapsed by default
- **Theme toggle**: Prominent position

---

## 🎨 Component Updates

### Navigation

#### TopNav (Desktop)
- Logo left
- Theme toggle
- Points badge (compact)
- Profile menu

#### BottomNav (Mobile)
- Icons only (no labels on some)
- Active state: gradient underline
- Floating slightly above bottom
- Blur background

### Modals
- Scale fade entrance
- Glass background
- Slide up on mobile
- Quick close gestures

### Forms
- Minimal labels
- Smart defaults
- Inline validation
- Glass input fields

---

## 🚀 Implementation Order

### Phase 1: Core Pages (Week 1)
1. ✅ Dashboard - DONE
2. Tasks page
3. Rewards page

### Phase 2: Secondary Pages (Week 2)
4. Badges page
5. Settings page
6. Calendar page

### Phase 3: Navigation & Polish (Week 3)
7. Update TopNav
8. Update BottomNav
9. Add page transitions
10. Test all swipe gestures

### Phase 4: Testing & Refinement
11. Mobile testing
12. Accessibility audit
13. Performance optimization
14. User feedback

---

## 📱 Responsive Strategy

### Mobile (< 768px)
- Single column
- Full-width cards
- Bottom sheet modals
- Swipe gestures enabled
- Compact everything

### Tablet (768px - 1024px)
- 2 column grids
- Larger cards
- Side panel modals
- Mouse + touch support

### Desktop (> 1024px)
- Max width containers
- 3-4 column grids
- Centered modals
- Keyboard shortcuts

---

## 🎭 Animation Guidelines

### Page Transitions
```tsx
<PageTransition>
  {/* Page content */}
</PageTransition>
```

### Lists
```tsx
<StaggerContainer>
  {items.map(item => (
    <StaggerItem key={item.id}>
      {/* Item content */}
    </StaggerItem>
  ))}
</StaggerContainer>
```

### Interactions
- Hover: Lift 4px
- Tap: Scale 0.98
- Complete: Confetti
- Error: Shake
- Success: Checkmark animation

---

## 📊 Success Metrics

### Performance
- Load time < 2s
- Time to interactive < 3s
- Lighthouse score > 90

### UX
- Task completion time < 2s
- Navigation clarity > 90%
- Mobile usability score > 85%

### Engagement
- Daily active users +30%
- Task completion rate +25%
- Session duration +20%

---

## 🎯 Key Differences V1 → V2

| Aspect | V1 | V2 |
|--------|----|----|
| **Header height** | 25-30% | 10% |
| **Task completion** | 5 clicks | 1 swipe |
| **Visual weight** | Stats-heavy | Action-heavy |
| **Navigation** | Tabs everywhere | Progressive disclosure |
| **Filters** | Dropdown menus | Chip buttons |
| **Modals** | Full forms | Smart defaults |
| **Spacing** | Tight | Generous |
| **Animations** | Minimal | Delightful |

---

## ✅ Checklist Template (Per Page)

- [ ] Remove old tab navigation
- [ ] Add compact sticky header
- [ ] Implement swipe gestures
- [ ] Add stagger animations
- [ ] Use glass components
- [ ] Add page transition
- [ ] Collapse secondary content
- [ ] Add FAB for create action
- [ ] Test on mobile
- [ ] Add confetti celebrations
- [ ] Optimize performance
- [ ] Accessibility check

---

## 🎨 Quick Reference

### Colors
```css
--deep-purple: #6C63FF      /* Primary actions */
--success-green: #2ECC71    /* Completions */
--warning-yellow: #F39C12   /* Streaks */
--heartbeat-red: #FF6B6B    /* Rewards */
--soft-blue: #4ECDC4        /* Info */
```

### Gradients
```css
gradient-ai: purple → blue
gradient-cta: red → orange
gradient-mesh-purple: radial brand colors
```

### Shadows
```css
shadow-glass: Glassmorphism
shadow-elevated: Lifted elements
shadow-floating: FAB buttons
shadow-premium: Special highlights
```

---

This plan will transform ChorePulse into a modern, mobile-first app with consistent V2 design throughout!
