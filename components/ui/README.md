# ChorePulse UI Component Library

A comprehensive, modern component library built with React, TypeScript, and Tailwind CSS.

## Design Principles

- **Mobile-First**: All components are designed to work great on mobile devices
- **Accessible**: WCAG AA compliant with proper ARIA labels and keyboard navigation
- **Consistent**: Uses unified design tokens (colors, spacing, typography)
- **Reusable**: Each component is self-contained and composable
- **Type-Safe**: Full TypeScript support with detailed prop types

## Components

### Button
Multi-variant button component with loading states.

**Variants**: primary, secondary, outline, ghost, danger
**Sizes**: sm, md, lg

```tsx
import { Button } from '@/components/ui'

<Button variant="primary" size="md">
  Click Me
</Button>

<Button variant="primary" isLoading>
  Loading...
</Button>
```

### Input
Text input with label, error states, and icon support.

```tsx
import { Input } from '@/components/ui'

<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  error="Invalid email address"
  required
/>
```

### Select
Dropdown select with custom styling.

```tsx
import { Select } from '@/components/ui'

<Select
  label="Role"
  options={[
    { label: 'Adult', value: 'adult' },
    { label: 'Teen', value: 'teen' },
    { label: 'Kid', value: 'kid' }
  ]}
  placeholder="Select a role"
/>
```

### Checkbox
Checkbox input with label and description support.

```tsx
import { Checkbox } from '@/components/ui'

<Checkbox
  label="Remember me"
  description="Keep me logged in for 30 days"
/>
```

### Textarea
Multi-line text input with character counter.

```tsx
import { Textarea } from '@/components/ui'

<Textarea
  label="Description"
  placeholder="Enter task description"
  maxLength={500}
  showCharCount
/>
```

### Card
Flexible card container with header, content, and footer sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui'

<Card variant="elevated">
  <CardHeader>
    <CardTitle>Task Name</CardTitle>
    <CardDescription>Due today at 5:00 PM</CardDescription>
  </CardHeader>
  <CardContent>
    Task details here...
  </CardContent>
  <CardFooter>
    <Button>Complete</Button>
  </CardFooter>
</Card>
```

### Badge
Small status indicator or label.

**Variants**: default, success, warning, danger, info
**Sizes**: sm, md, lg

```tsx
import { Badge } from '@/components/ui'

<Badge variant="success">Completed</Badge>
<Badge variant="warning" size="sm">Overdue</Badge>
```

### Alert
Notification or message banner with variants.

**Variants**: default, success, warning, danger, info

```tsx
import { Alert } from '@/components/ui'

<Alert variant="success" title="Success!">
  Your task has been completed.
</Alert>

<Alert variant="danger" onClose={() => console.log('closed')}>
  An error occurred.
</Alert>
```

### Modal
Overlay dialog with backdrop and animations.

**Sizes**: sm, md, lg, xl

```tsx
import { Modal, ModalFooter } from '@/components/ui'

<Modal
  isOpen={isOpen}
  onClose={closeModal}
  title="Confirm Action"
  description="Are you sure you want to continue?"
  size="md"
>
  <p>Modal content here...</p>

  <ModalFooter
    onCancel={closeModal}
    onConfirm={handleConfirm}
    confirmText="Yes, Continue"
  />
</Modal>
```

### Spinner
Loading spinner indicator.

**Variants**: primary, secondary
**Sizes**: sm, md, lg

```tsx
import { Spinner } from '@/components/ui'

<Spinner size="md" variant="primary" />
```

### Avatar
User profile picture or initials.

**Sizes**: sm, md, lg, xl

```tsx
import { Avatar } from '@/components/ui'

<Avatar
  src="/avatar.jpg"
  alt="John Doe"
  size="lg"
/>

// Without image - shows initials
<Avatar
  alt="Jane Smith"
  size="md"
/>
```

### Tabs
Tabbed navigation interface.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'

<Tabs defaultValue="tasks" onValueChange={handleTabChange}>
  <TabsList>
    <TabsTrigger value="tasks">Tasks</TabsTrigger>
    <TabsTrigger value="rewards">Rewards</TabsTrigger>
    <TabsTrigger value="achievements">Achievements</TabsTrigger>
  </TabsList>

  <TabsContent value="tasks">
    Tasks content...
  </TabsContent>

  <TabsContent value="rewards">
    Rewards content...
  </TabsContent>

  <TabsContent value="achievements">
    Achievements content...
  </TabsContent>
</Tabs>
```

## Utility Functions

The component library includes helpful utility functions in `/lib/utils.ts`:

- `cn()` - Merge Tailwind classes safely
- `formatDate()` - Format dates
- `formatDateTime()` - Format dates with time
- `getRelativeTime()` - Get relative time strings ("2 hours ago")
- `truncate()` - Truncate strings
- `capitalize()` - Capitalize first letter
- `formatNumber()` - Format numbers with commas

```tsx
import { cn, formatDate, truncate } from '@/lib/utils'

// Conditionally merge classes
<div className={cn('base-class', isActive && 'active-class')} />

// Format dates
{formatDate(new Date())} // "January 1, 2025"

// Truncate text
{truncate(longText, 50)} // "This is a long text that will be truncat..."
```

## Color System

The component library uses the following color palette:

- **Primary**: Blue (trust, calm) - Used for CTAs and primary actions
- **Success**: Green - Task completions, positive actions
- **Warning**: Yellow - Overdue tasks, warnings
- **Danger**: Red - Errors, destructive actions
- **Info**: Blue - Informational messages
- **Neutral**: Gray - Secondary actions, borders, backgrounds

## Accessibility Features

All components include:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus states and indicators
- Minimum 44x44px touch targets (mobile)
- WCAG AA compliant color contrast
- Screen reader support

## Usage Best Practices

1. **Always use the `cn()` utility** when adding custom classes to components
2. **Provide labels** for all form inputs (accessibility requirement)
3. **Use proper button variants** - primary for main actions, secondary for less important actions
4. **Add loading states** to async operations
5. **Include error messages** for form validation
6. **Use semantic HTML** - buttons for actions, links for navigation

## Future Components (Roadmap)

- Radio buttons
- Toggle switches
- Tooltips
- Dropdown menu
- Popover
- Date picker
- File upload
- Progress bar
- Skeleton loaders
- Toast notifications
- Breadcrumbs
- Pagination
