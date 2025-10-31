# Automated Accessibility Testing Guide

## Overview

ChorePulse uses **three layers** of automated accessibility testing to ensure WCAG 2.1 AA compliance:

1. **Jest + axe-core** - Unit tests for React components
2. **Lighthouse CI** - Performance and accessibility scoring
3. **Pa11y CI** - Full-page WCAG compliance scanning

---

## Quick Start

### Run All Tests Locally

```bash
# Install dependencies
npm install

# Run Jest accessibility tests
npm test

# Run Lighthouse audit
npm run lighthouse

# Run Pa11y scan
npm run pa11y
```

---

## 1. Jest + axe-core (Unit Testing)

### What It Tests
- Individual React components
- ARIA attributes and roles
- Keyboard accessibility
- Color contrast
- Form labels and validation

### How to Run

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test accessibility.test.tsx

# Watch mode (re-run on file changes)
npm test -- --watch
```

### Example Test

```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('Button should have no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### What Gets Checked
✅ Missing alt text on images
✅ Missing ARIA labels
✅ Invalid ARIA attributes
✅ Color contrast ratios
✅ Keyboard focus order
✅ Form input labels
✅ Heading hierarchy
✅ Landmark regions

---

## 2. Lighthouse CI (Performance + Accessibility)

### What It Tests
- Full-page accessibility score (0-100)
- Performance metrics
- Best practices
- SEO optimization

### How to Run

```bash
# Run Lighthouse on local server
npm run lighthouse

# Run on specific pages
npx lighthouse http://localhost:3000/dashboard --view
```

### Minimum Scores
- **Accessibility**: 90/100 ✅
- **Performance**: 80/100 ⚠️
- **Best Practices**: 90/100 ⚠️
- **SEO**: 90/100 ⚠️

### What Gets Checked
✅ Color contrast
✅ Touch target sizes
✅ Image alt attributes
✅ ARIA validity
✅ HTML semantics
✅ Viewport meta tag
✅ Language attribute
✅ Document title

### Configuration

Located in `.lighthouserc.json`:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "color-contrast": "error",
        "label": "error",
        "button-name": "error"
      }
    }
  }
}
```

---

## 3. Pa11y CI (WCAG Compliance Scanner)

### What It Tests
- Full WCAG 2.1 AA compliance
- All pages in the application
- Uses Chromium browser for real rendering

### How to Run

```bash
# Run Pa11y on local server
npm run pa11y

# Run on specific page
npx pa11y http://localhost:3000/dashboard
```

### WCAG Standard
Tests against **WCAG 2.1 Level AA** (most common legal requirement)

### What Gets Checked
✅ All WCAG 2.1 AA Success Criteria
✅ Color contrast
✅ Keyboard operability
✅ Screen reader compatibility
✅ Time limits and motion
✅ Navigation consistency
✅ Input assistance

### Configuration

Located in `.pa11yci.json`:

```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 10000,
    "hideElements": ".cookie-banner"
  },
  "urls": [
    "http://localhost:3000/dashboard",
    "http://localhost:3000/tasks"
  ]
}
```

---

## Continuous Integration (CI/CD)

### GitHub Actions Workflow

Every push to `main` or `develop` automatically runs:

1. **Jest Tests** - Component-level accessibility tests
2. **Lighthouse CI** - Full-page scoring
3. **Pa11y** - WCAG compliance scanning

### Workflow File

Located at `.github/workflows/accessibility.yml`

### View Results

1. Go to GitHub Actions tab
2. Click on latest workflow run
3. View artifacts:
   - Test coverage report
   - Lighthouse HTML report
   - Pa11y JSON results

### Failed Tests = Blocked PR

If any accessibility test fails, the PR cannot be merged until fixed.

---

## Common Issues and Fixes

### Issue: Color Contrast Failure

```
❌ Elements must have sufficient color contrast
   <p style="color: #FF6B6B">Text</p>
```

**Fix**: Use text-safe color variants

```diff
- <p style="color: #FF6B6B">Text</p>
+ <p className="text-heartbeat-safe">Text</p>
```

### Issue: Missing ARIA Label

```
❌ Buttons must have discernible text
   <button><Icon /></button>
```

**Fix**: Add aria-label

```diff
- <button><Icon /></button>
+ <button aria-label="Close menu"><Icon /></button>
```

### Issue: Form Input Without Label

```
❌ Form elements must have labels
   <input type="email" />
```

**Fix**: Use FormField component

```diff
- <input type="email" />
+ <FormField label="Email" htmlFor="email">
+   <ValidatedInput id="email" type="email" />
+ </FormField>
```

### Issue: Insufficient Touch Target

```
❌ Touch targets must be at least 44x44 pixels
   <button className="w-8 h-8">X</button>
```

**Fix**: Increase size or add padding

```diff
- <button className="w-8 h-8">X</button>
+ <button className="w-11 h-11">X</button>
```

---

## Writing Your Own Tests

### Test a New Component

```typescript
// tests/MyComponent.test.tsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import MyComponent from '@/components/MyComponent'

it('should be accessible', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Add Page to Pa11y

Edit `.pa11yci.json`:

```json
{
  "urls": [
    "http://localhost:3000/my-new-page"
  ]
}
```

### Add Page to Lighthouse

Edit `.lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/my-new-page"
      ]
    }
  }
}
```

---

## Testing Tools Comparison

| Tool | What It Tests | When to Use | Coverage |
|------|---------------|-------------|----------|
| **Jest + axe** | Components in isolation | During development, before commit | ~57% of WCAG |
| **Lighthouse** | Full pages with scoring | Before deployment, in CI/CD | ~30% of WCAG |
| **Pa11y** | Full WCAG compliance | Before release, in CI/CD | ~70% of WCAG |
| **Manual Testing** | Real user experience | Final QA, user acceptance | 100% (with effort) |

**Note**: No automated tool catches 100% of accessibility issues. Manual testing with screen readers is still essential.

---

## Manual Testing Checklist

After automated tests pass, manually test:

- [ ] Tab through entire page with keyboard only
- [ ] Use VoiceOver (Mac) or NVDA (Windows) screen reader
- [ ] Test with 200% browser zoom
- [ ] Test in high contrast mode
- [ ] Test with animations disabled (prefers-reduced-motion)
- [ ] Verify all interactive elements have visible focus
- [ ] Check color contrast with real color blindness simulators

---

## Resources

- **axe DevTools**: Browser extension for manual testing
  - [Chrome](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)
  - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/)

- **WAVE**: Web accessibility evaluation tool
  - [WAVE Extension](https://wave.webaim.org/extension/)

- **WebAIM Contrast Checker**: Test color combinations
  - https://webaim.org/resources/contrastchecker/

- **WCAG Guidelines**: Reference documentation
  - https://www.w3.org/WAI/WCAG21/quickref/

---

## Support

If tests fail and you need help:

1. Check error message and line number
2. Review common issues above
3. Check COLOR_CONTRAST_AUDIT.md for color fixes
4. Ask in #accessibility Slack channel
5. Consult with QA team

---

**Remember**: Accessibility is not just compliance—it's about making ChorePulse usable by everyone, regardless of ability. Every test that passes makes the app better for real users! ♿️✨
