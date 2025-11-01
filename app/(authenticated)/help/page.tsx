'use client'

import { useState } from 'react'
import { Card, Input } from '@/components/ui'
import Link from 'next/link'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

interface FAQ {
  id: string
  question: string
  answer: React.ReactNode
  category: 'getting-started' | 'tasks' | 'rewards' | 'badges' | 'family' | 'account' | 'troubleshooting'
  keywords: string[]
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [userRole] = useState<'kid' | 'teen' | 'adult'>('adult')

  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  const faqs: FAQ[] = [
    // Getting Started
    {
      id: 'what-is-chorepulse',
      question: 'What is ChorePulse?',
      category: 'getting-started',
      keywords: ['intro', 'overview', 'about', 'what', 'purpose'],
      answer: (
        <div className="space-y-3">
          <p>ChorePulse is a family chore management app that makes household tasks fun and rewarding. It uses gamification to motivate family members to complete chores and helps parents manage household responsibilities.</p>
          <p className="font-semibold text-gray-900">Key Features:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>Create and assign tasks to family members</li>
            <li>Earn points for completing chores</li>
            <li>Redeem points for custom rewards</li>
            <li>Unlock badges for milestones</li>
            <li>Track family progress with the dashboard</li>
            <li>Smart AI assistant (Pulse) for help and suggestions</li>
          </ul>
        </div>
      )
    },
    {
      id: 'how-to-get-started',
      question: 'How do I get started with ChorePulse?',
      category: 'getting-started',
      keywords: ['start', 'begin', 'setup', 'first', 'new'],
      answer: (
        <div className="space-y-3">
          <p>Follow these steps to get your family set up:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li><strong>Add family members</strong> - Go to More → Family Management to invite family members via email or create child accounts</li>
            <li><strong>Create your first tasks</strong> - Visit the Tasks page and create chores from templates or scratch</li>
            <li><strong>Set up rewards</strong> - Add rewards that can be redeemed with points (screen time, treats, privileges, etc.)</li>
            <li><strong>Start completing tasks</strong> - Begin earning points by checking off chores</li>
            <li><strong>Track progress</strong> - Monitor activity on the Dashboard</li>
          </ol>
        </div>
      )
    },
    {
      id: 'add-family-members',
      question: 'How do I add family members?',
      category: 'family',
      keywords: ['invite', 'add', 'member', 'user', 'family', 'child'],
      answer: (
        <div className="space-y-3">
          <p>To add family members:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to <strong>More</strong> (bottom right)</li>
            <li>Tap <strong>Family Management</strong></li>
            <li>Click <strong>Add Member</strong></li>
            <li>Choose to invite via email or create a child account</li>
            <li>Set their role (Parent or Child) and permissions</li>
          </ol>
          <p className="mt-3 font-semibold text-gray-900">Member Roles:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li><strong>Owner:</strong> Full access to all settings and features</li>
            <li><strong>Parent:</strong> Can create tasks/rewards and approve requests</li>
            <li><strong>Child:</strong> Can complete tasks and request rewards (requires approval)</li>
          </ul>
        </div>
      )
    },

    // Tasks
    {
      id: 'create-task',
      question: 'How do I create a task?',
      category: 'tasks',
      keywords: ['create', 'new', 'task', 'chore', 'add'],
      answer: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to the <strong>Tasks</strong> page</li>
            <li>Click the <strong>+ Create Task</strong> button</li>
            <li>Choose a template or start from scratch</li>
            <li>Fill in the details:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li>Task name and description</li>
                <li>Point value (how many points it's worth)</li>
                <li>Recurrence (one-time, daily, weekly, etc.)</li>
                <li>Who can complete it</li>
                <li>Optional: Add a due date or time</li>
              </ul>
            </li>
            <li>Click <strong>Create Task</strong></li>
          </ol>
        </div>
      )
    },
    {
      id: 'earn-points',
      question: 'How do I earn points?',
      category: 'tasks',
      keywords: ['earn', 'points', 'get', 'make', 'how'],
      answer: (
        <div className="space-y-3">
          <p>You earn points by completing tasks. Here's how:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to the <strong>Tasks</strong> page</li>
            <li>Find a task you want to complete</li>
            <li>Complete the task in real life</li>
            <li>Tap the <strong>Complete</strong> button in the app</li>
            <li>Points are added to your balance automatically (or after parent approval if required)</li>
          </ol>
          <p className="mt-3 font-semibold text-gray-900">Point Values:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>Quick tasks (5-10 min): 5-10 points</li>
            <li>Standard tasks (15-30 min): 15-25 points</li>
            <li>Major tasks (30+ min): 30-50 points</li>
          </ul>
        </div>
      )
    },
    {
      id: 'recurring-tasks',
      question: 'How do recurring tasks work?',
      category: 'tasks',
      keywords: ['recurring', 'repeat', 'schedule', 'daily', 'weekly'],
      answer: (
        <div className="space-y-3">
          <p>Recurring tasks automatically reset based on their schedule:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li><strong>Daily:</strong> Resets every day at midnight</li>
            <li><strong>Weekly:</strong> Resets on the same day each week</li>
            <li><strong>Monthly:</strong> Resets on the same date each month</li>
          </ul>
          <p className="mt-3">Once you complete a recurring task, you can complete it again when it resets. The task will show as "Complete" until the reset time.</p>
        </div>
      )
    },
    {
      id: 'task-approval',
      question: 'Why do some tasks need approval?',
      category: 'tasks',
      keywords: ['approval', 'pending', 'waiting', 'verify'],
      answer: (
        <div className="space-y-3">
          <p>Parents can enable "Require Approval" for tasks to verify completion before awarding points. This is useful for:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>Tasks that need quality checking (cleaning rooms thoroughly)</li>
            <li>High-value tasks</li>
            <li>Tasks completed by younger children</li>
          </ul>
          <p className="mt-3">When a task requires approval, you'll see "Pending Approval" after completing it. A parent will review and approve it, then the points will be added to your balance.</p>
        </div>
      )
    },

    // Rewards
    {
      id: 'create-reward',
      question: 'How do I create a reward?',
      category: 'rewards',
      keywords: ['create', 'reward', 'prize', 'add', 'new'],
      answer: (
        <div className="space-y-3">
          <p>Parents can create custom rewards:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to the <strong>Rewards</strong> page</li>
            <li>Click <strong>+ Create Reward</strong></li>
            <li>Choose from the library or create custom</li>
            <li>Set the point cost</li>
            <li>Add restrictions (daily limits, age limits, etc.)</li>
            <li>Click <strong>Create Reward</strong></li>
          </ol>
          <p className="mt-3 font-semibold text-gray-900">Popular Reward Ideas:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>30 minutes extra screen time (20-30 points)</li>
            <li>Choose what's for dinner (25 points)</li>
            <li>Special treat or snack (15 points)</li>
            <li>Stay up 30 min late (25 points)</li>
            <li>Friend sleepover (100 points)</li>
            <li>$5 for savings/spending (50 points)</li>
          </ul>
        </div>
      )
    },
    {
      id: 'redeem-reward',
      question: 'How do I redeem a reward?',
      category: 'rewards',
      keywords: ['redeem', 'get', 'claim', 'reward', 'spend'],
      answer: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to the <strong>Rewards</strong> page</li>
            <li>Browse available rewards</li>
            <li>Make sure you have enough points</li>
            <li>Tap <strong>Redeem</strong> on your chosen reward</li>
            <li>Confirm the redemption</li>
            <li>If approval is required, wait for a parent to approve</li>
            <li>Once approved, enjoy your reward!</li>
          </ol>
          <p className="mt-3">You can track your reward requests in the <strong>My Requests</strong> tab to see pending, approved, and completed rewards.</p>
        </div>
      )
    },
    {
      id: 'not-enough-points',
      question: 'What if I don't have enough points for a reward?',
      category: 'rewards',
      keywords: ['not enough', 'insufficient', 'need more', 'points'],
      answer: (
        <div className="space-y-3">
          <p>If you don't have enough points:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>Complete more tasks to earn additional points</li>
            <li>Check for "Extra Credit" tasks that award bonus points</li>
            <li>Build up your daily streak to unlock streak bonuses</li>
            <li>Earn badges for milestone bonuses</li>
            <li>Save your points instead of spending them right away</li>
          </ul>
          <p className="mt-3">Your current point balance is always visible at the top of the app and on the Dashboard.</p>
        </div>
      )
    },

    // Badges
    {
      id: 'what-are-badges',
      question: 'What are badges?',
      category: 'badges',
      keywords: ['badges', 'achievements', 'unlock', 'earn'],
      answer: (
        <div className="space-y-3">
          <p>Badges are achievements you earn by reaching milestones. Each badge awards bonus points!</p>
          <p className="font-semibold text-gray-900">Badge Types:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li><strong>Task Master:</strong> Complete a certain number of tasks</li>
            <li><strong>Point Collector:</strong> Earn total points</li>
            <li><strong>Streak Champion:</strong> Maintain daily completion streaks</li>
            <li><strong>Early Bird:</strong> Complete tasks before the due date</li>
            <li><strong>Team Player:</strong> Help other family members</li>
          </ul>
          <p className="mt-3 font-semibold text-gray-900">Badge Tiers & Bonuses:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>Bronze: +10 bonus points</li>
            <li>Silver: +25 bonus points</li>
            <li>Gold: +50 bonus points</li>
            <li>Platinum: +100 bonus points</li>
          </ul>
        </div>
      )
    },
    {
      id: 'view-badges',
      question: 'How do I see my badges?',
      category: 'badges',
      keywords: ['view', 'see', 'check', 'badges', 'progress'],
      answer: (
        <div className="space-y-3">
          <p>To view your badges:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to <strong>More</strong> (bottom right)</li>
            <li>Tap <strong>Badges</strong></li>
          </ol>
          <p className="mt-3">You'll see:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>Unlocked badges with dates earned</li>
            <li>In-progress badges with completion percentage</li>
            <li>Locked badges showing requirements</li>
          </ul>
        </div>
      )
    },

    // Family
    {
      id: 'family-roles',
      question: 'What are the different family roles?',
      category: 'family',
      keywords: ['roles', 'permissions', 'owner', 'parent', 'child'],
      answer: (
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Owner:</p>
          <ul className="list-disc list-inside ml-2 text-gray-700">
            <li>Full access to all features</li>
            <li>Can manage family members and their roles</li>
            <li>Can modify subscription and billing</li>
            <li>Can delete the family account</li>
          </ul>
          <p className="mt-3 font-semibold text-gray-900">Parent:</p>
          <ul className="list-disc list-inside ml-2 text-gray-700">
            <li>Can create and edit tasks and rewards</li>
            <li>Can approve task completions and reward requests</li>
            <li>Can view all family activity</li>
            <li>Cannot change subscription or delete the account</li>
          </ul>
          <p className="mt-3 font-semibold text-gray-900">Child:</p>
          <ul className="list-disc list-inside ml-2 text-gray-700">
            <li>Can view and complete assigned tasks</li>
            <li>Can request rewards with available points</li>
            <li>Can view their own progress and badges</li>
            <li>Cannot create tasks or rewards</li>
          </ul>
        </div>
      )
    },
    {
      id: 'remove-family-member',
      question: 'How do I remove a family member?',
      category: 'family',
      keywords: ['remove', 'delete', 'kick out', 'family'],
      answer: (
        <div className="space-y-3">
          <p>Owners and parents can remove family members:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to <strong>More → Family Management</strong></li>
            <li>Find the member you want to remove</li>
            <li>Tap the <strong>⋮</strong> (three dots) next to their name</li>
            <li>Select <strong>Remove Member</strong></li>
            <li>Confirm the removal</li>
          </ol>
          <p className="mt-3 text-amber-700 bg-amber-50 p-3 rounded-lg"><strong>Note:</strong> Removing a member will delete their task history and point balance. This cannot be undone.</p>
        </div>
      )
    },

    // Account
    {
      id: 'change-password',
      question: 'How do I change my password?',
      category: 'account',
      keywords: ['password', 'change', 'reset', 'security'],
      answer: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to <strong>More</strong></li>
            <li>Tap <strong>Settings</strong></li>
            <li>Tap <strong>Account</strong></li>
            <li>Tap <strong>Change Password</strong></li>
            <li>Enter your current password</li>
            <li>Enter and confirm your new password</li>
            <li>Tap <strong>Update Password</strong></li>
          </ol>
        </div>
      )
    },
    {
      id: 'forgot-password',
      question: 'I forgot my password. What do I do?',
      category: 'account',
      keywords: ['forgot', 'password', 'reset', 'login'],
      answer: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to the login page</li>
            <li>Tap <strong>Forgot Password?</strong></li>
            <li>Enter your email address</li>
            <li>Check your email for a password reset link</li>
            <li>Click the link and follow the instructions to set a new password</li>
          </ol>
          <p className="mt-3">If you don't receive the email within a few minutes, check your spam folder.</p>
        </div>
      )
    },
    {
      id: 'notifications',
      question: 'How do I manage notifications?',
      category: 'account',
      keywords: ['notifications', 'alerts', 'email', 'push'],
      answer: (
        <div className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Go to <strong>More → Settings</strong></li>
            <li>Tap <strong>Notifications</strong></li>
            <li>Toggle specific notification types on/off:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li>Task reminders</li>
                <li>Reward requests (parents)</li>
                <li>Badge unlocks</li>
                <li>Daily summaries</li>
              </ul>
            </li>
          </ol>
        </div>
      )
    },

    // Troubleshooting
    {
      id: 'points-not-showing',
      question: 'My points aren't showing up. Why?',
      category: 'troubleshooting',
      keywords: ['points', 'not showing', 'missing', 'bug'],
      answer: (
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Common reasons:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li><strong>Pending Approval:</strong> The task may require parent approval before points are awarded. Check the "Pending" section in My Tasks.</li>
            <li><strong>Sync Delay:</strong> Try pulling down to refresh the page or logging out and back in.</li>
            <li><strong>Already Completed:</strong> The task may have already been completed today (for daily tasks).</li>
            <li><strong>Network Issue:</strong> Check your internet connection.</li>
          </ol>
          <p className="mt-3">If points are still missing after checking these, contact support with details about the task.</p>
        </div>
      )
    },
    {
      id: 'cant-redeem',
      question: 'I can't redeem a reward. What's wrong?',
      category: 'troubleshooting',
      keywords: ['cant redeem', 'reward', 'blocked', 'disabled'],
      answer: (
        <div className="space-y-3">
          <p className="font-semibold text-gray-900">Possible reasons:</p>
          <ul className="list-disc list-inside space-y-2 ml-2 text-gray-700">
            <li><strong>Insufficient Points:</strong> Check your balance. You need at least as many points as the reward costs.</li>
            <li><strong>Daily/Weekly Limit:</strong> Some rewards have limits (e.g., "30 min screen time - max 2 per day").</li>
            <li><strong>Pending Request:</strong> You may already have an active request for this reward.</li>
            <li><strong>Reward Disabled:</strong> A parent may have temporarily disabled the reward.</li>
          </ul>
          <p className="mt-3">Check your current requests in the "My Requests" tab, or ask a parent about reward availability.</p>
        </div>
      )
    },
    {
      id: 'app-slow',
      question: 'The app is slow or not loading. What should I do?',
      category: 'troubleshooting',
      keywords: ['slow', 'loading', 'not working', 'frozen', 'crash'],
      answer: (
        <div className="space-y-3">
          <p>Try these steps in order:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li><strong>Refresh the page:</strong> Pull down on mobile or press F5/Cmd+R on desktop</li>
            <li><strong>Clear your cache:</strong> Go to browser settings and clear cached data</li>
            <li><strong>Check your internet:</strong> Make sure you have a stable connection</li>
            <li><strong>Try a different browser:</strong> Chrome, Safari, Firefox, or Edge</li>
            <li><strong>Restart your device:</strong> Close all apps and restart</li>
            <li><strong>Update your browser:</strong> Make sure you're using the latest version</li>
          </ol>
          <p className="mt-3">If the problem persists, contact support with details about your device and browser.</p>
        </div>
      )
    },
    {
      id: 'data-lost',
      question: 'I lost my progress/data. Can it be recovered?',
      category: 'troubleshooting',
      keywords: ['lost', 'data', 'progress', 'deleted', 'recover'],
      answer: (
        <div className="space-y-3">
          <p>First, try these steps:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
            <li>Make sure you're logged into the correct account</li>
            <li>Pull down to refresh the page</li>
            <li>Log out and log back in</li>
            <li>Check if you're using the same device/browser</li>
          </ol>
          <p className="mt-3">If your data is still missing:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
            <li>Contact support immediately with your account email</li>
            <li>We maintain backups and may be able to restore recent data</li>
            <li>Include when you last saw your data and what's missing</li>
          </ul>
          <p className="mt-3 text-blue-700 bg-blue-50 p-3 rounded-lg"><strong>Tip:</strong> We automatically back up all data daily, so recent progress can often be recovered.</p>
        </div>
      )
    }
  ]

  // Filter FAQs based on search query
  const filteredFAQs = faqs.filter(faq => {
    if (selectedCategory !== 'all' && faq.category !== selectedCategory) return false

    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
      (typeof faq.answer === 'string' && faq.answer.toLowerCase().includes(query))
    )
  })

  // Get search suggestions
  const searchSuggestions = searchQuery.length >= 2
    ? faqs
        .filter(faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : []

  const categories = [
    { id: 'all', label: 'All', icon: '📚', count: faqs.length },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀', count: faqs.filter(f => f.category === 'getting-started').length },
    { id: 'tasks', label: 'Tasks', icon: '✅', count: faqs.filter(f => f.category === 'tasks').length },
    { id: 'rewards', label: 'Rewards', icon: '🎁', count: faqs.filter(f => f.category === 'rewards').length },
    { id: 'badges', label: 'Badges', icon: '🏆', count: faqs.filter(f => f.category === 'badges').length },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', count: faqs.filter(f => f.category === 'family').length },
    { id: 'account', label: 'Account', icon: '⚙️', count: faqs.filter(f => f.category === 'account').length },
    { id: 'troubleshooting', label: 'Help', icon: '🔧', count: faqs.filter(f => f.category === 'troubleshooting').length },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Help Center</h1>
          <p className="text-white text-lg">Find answers to your questions about ChorePulse</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        {/* Search Bar with Suggestions */}
        <Card variant="elevated" padding="md" className="mb-6 relative">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search for help... (e.g., 'how to earn points')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 mx-4">
              <div className="p-2">
                <p className="text-xs text-gray-500 px-3 py-1">Suggestions</p>
                {searchSuggestions.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => {
                      setExpandedId(faq.id)
                      setSelectedCategory(faq.category)
                      setSearchQuery('')
                      setTimeout(() => {
                        document.getElementById(`faq-${faq.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }, 100)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <span className="text-sm text-gray-900">{faq.question}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {categories.find(c => c.id === faq.category)?.icon}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Top Ad */}
        <div className="mb-6">
          <AdSlot
            adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
            ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="mr-1.5">{category.icon}</span>
              <span className="font-medium">{category.label}</span>
              <span className={`ml-1.5 text-xs ${selectedCategory === category.id ? 'text-blue-100' : 'text-gray-500'}`}>
                ({category.count})
              </span>
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        {filteredFAQs.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try a different search term or browse all topics</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Show All FAQs
            </button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredFAQs.map((faq, index) => (
              <div
                key={faq.id}
                id={`faq-${faq.id}`}
                className={`bg-white rounded-lg border-2 transition-all ${
                  expandedId === faq.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                  aria-expanded={expandedId === faq.id}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-xl mt-0.5">
                      {categories.find(c => c.id === faq.category)?.icon}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {faq.question}
                    </h3>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedId === faq.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {expandedId === faq.id && (
                  <div className="px-6 pb-6 pt-2 text-gray-700 border-t border-gray-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        <Card variant="default" padding="lg" className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-700 mb-4">Can't find what you're looking for? Our support team is here to help!</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/more"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Support
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold border-2 border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy Policy
              </Link>
            </div>
          </div>
        </Card>

        {/* Bottom Ad */}
        <div className="mt-6">
          <AdSlot
            adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
            ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>
      </div>
    </div>
  )
}
