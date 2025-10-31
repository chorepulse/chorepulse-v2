import BottomNav from '@/components/BottomNav'
import TopNav from '@/components/TopNav'
import AchievementCelebration from '@/components/AchievementCelebration'
import DevRoleToggle from '@/components/DevRoleToggle'
import { GlobalKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {/* Skip to main content link for accessibility (WCAG 2.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-deep-purple focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deep-purple"
      >
        Skip to main content
      </a>

      <TopNav />
      <main id="main-content">{children}</main>
      <BottomNav />
      <AchievementCelebration />
      <DevRoleToggle />
      <GlobalKeyboardShortcuts />
      {/* Add padding at bottom on mobile to prevent content from being hidden behind nav */}
      <div className="h-16 md:hidden" />
    </div>
  )
}
