/**
 * Automated Accessibility Testing with jest-axe
 *
 * Tests components for WCAG 2.1 AA compliance using axe-core.
 * Run with: npm test
 */

import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}))

describe('Accessibility Tests', () => {
  describe('Navigation Components', () => {
    it('BottomNav should have no accessibility violations', async () => {
      const { container } = render(
        await import('@/components/BottomNav').then(m => <m.default />)
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('TopNav should have no accessibility violations', async () => {
      const { container } = render(
        await import('@/components/TopNav').then(m => <m.default />)
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Form Components', () => {
    it('FormField should have no accessibility violations', async () => {
      const { FormField, ValidatedInput } = await import('@/components/ui/FormField')
      const { container } = render(
        <FormField
          label="Test Input"
          htmlFor="test"
          error="Test error"
          hint="Test hint"
          required
        >
          <ValidatedInput id="test" name="test" />
        </FormField>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Modal Components', () => {
    it('QuickAddMemberModal should have no accessibility violations', async () => {
      const { QuickAddMemberModal } = await import('@/components/modals/QuickAddMemberModal')
      const { container } = render(
        <QuickAddMemberModal
          isOpen={true}
          onClose={() => {}}
          onSuccess={() => {}}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Cookie Consent', () => {
    it('CookieConsent should have no accessibility violations', async () => {
      const CookieConsent = (await import('@/components/CookieConsent')).default
      const { container } = render(<CookieConsent />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('UI Components', () => {
    it('Button component should have no accessibility violations', async () => {
      const Button = (await import('@/components/ui/Button')).default
      const { container } = render(
        <Button onClick={() => {}}>Click me</Button>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('Card component should have no accessibility violations', async () => {
      const { default: Card, CardHeader, CardTitle, CardContent } =
        await import('@/components/ui/Card')
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Test content</p>
          </CardContent>
        </Card>
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

/**
 * Color Contrast Tests
 *
 * Note: Color contrast tests require canvas support which is not available in jsdom.
 * These tests are disabled here and should be run in Lighthouse CI and Pa11y which use real browsers.
 * See COLOR_CONTRAST_AUDIT.md for detailed color contrast documentation.
 */
describe('Color Contrast', () => {
  it.skip('should detect insufficient contrast in text', async () => {
    const { container } = render(
      <div style={{ color: '#FF6B6B', backgroundColor: '#FFFFFF' }}>
        This text fails WCAG AA (3.03:1)
      </div>
    )

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })

    // This should find violations
    expect(results.violations.length).toBeGreaterThan(0)
  })

  it.skip('should pass with accessible contrast', async () => {
    const { container } = render(
      <div style={{ color: '#D92626', backgroundColor: '#FFFFFF' }}>
        This text passes WCAG AA (4.52:1)
      </div>
    )

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })

    // This should have no violations
    expect(results).toHaveNoViolations()
  })
})
