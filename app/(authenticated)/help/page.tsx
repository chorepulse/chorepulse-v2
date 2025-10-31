'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Badge, Tabs, TabsList, TabsTrigger, TabsContent, ProductTour } from '@/components/ui'
import type { TourStep } from '@/components/ui'
import { useTour } from '@/hooks/useTour'
import Link from 'next/link'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

interface HelpArticle {
  id: string
  title: string
  category: 'getting-started' | 'tasks' | 'rewards' | 'badges' | 'family' | 'troubleshooting'
  content: React.ReactNode
  tags: string[]
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')

  const { isOpen: isTourOpen, completeTour, skipTour } = useTour('help-tour')
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="search-help"]',
      title: 'Welcome to the Help Center! 📚',
      content: (
        <div>
          <p className="mb-2">Search for any topic or question you have about ChorePulse.</p>
          <p>Type keywords like "points", "tasks", or "rewards" to find relevant articles.</p>
        </div>
      ),
      placement: 'bottom'
    },
    {
      target: '[data-tour="category-tabs"]',
      title: 'Browse by Category',
      content: (
        <div>
          <p className="mb-2">Articles are organized into categories for easy navigation.</p>
          <p>Click any category to see articles specific to that feature.</p>
        </div>
      ),
      placement: 'bottom'
    },
    {
      target: '[data-tour="quick-links"]',
      title: 'Quick Links',
      content: (
        <div>
          <p className="mb-2">Access the most common help topics instantly.</p>
          <p>These links jump you directly to the information you need most.</p>
        </div>
      ),
      placement: 'top'
    }
  ]

  const articles: HelpArticle[] = [
    // Getting Started
    {
      id: 'welcome',
      title: 'Welcome to ChorePulse',
      category: 'getting-started',
      tags: ['intro', 'overview', 'new user'],
      content: (
        <div className="space-y-3">
          <p>Welcome to ChorePulse! This guide will help you get started with managing family chores and rewards.</p>
          <h4 className="font-semibold text-gray-900 mt-4">What is ChorePulse?</h4>
          <p>ChorePulse is a family chore management system that gamifies household tasks. Family members earn points by completing tasks and can spend those points on rewards.</p>
          <h4 className="font-semibold text-gray-900 mt-4">Key Features:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Tasks:</strong> Create and manage household chores</li>
            <li><strong>Points System:</strong> Earn points for completing tasks</li>
            <li><strong>Rewards:</strong> Spend points on rewards you create</li>
            <li><strong>Badges:</strong> Unlock badges for milestones</li>
            <li><strong>Calendar:</strong> Schedule recurring tasks</li>
          </ul>
        </div>
      )
    },
    {
      id: 'first-steps',
      title: 'Your First Steps',
      category: 'getting-started',
      tags: ['setup', 'tutorial', 'new user'],
      content: (
        <div className="space-y-3">
          <p>Here's how to get started with ChorePulse:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li><strong>Add Family Members:</strong> Go to the Family Management page to invite family members</li>
            <li><strong>Create Tasks:</strong> Visit the Tasks page and create your first chore from templates or scratch</li>
            <li><strong>Set Up Rewards:</strong> Add rewards that family members can redeem with points</li>
            <li><strong>Complete Tasks:</strong> Start completing tasks to earn points</li>
            <li><strong>Track Progress:</strong> Check the Dashboard to see family activity</li>
          </ol>
        </div>
      )
    },
    {
      id: 'family-setup',
      title: 'Setting Up Your Family',
      category: 'getting-started',
      tags: ['family', 'members', 'invite', 'setup'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Adding Family Members</h4>
          <p>Go to <strong>More → Family Management</strong> to add family members. You can:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Send email invitations to family members</li>
            <li>Create child accounts with parental controls</li>
            <li>Set different permission levels for each member</li>
          </ul>
          <h4 className="font-semibold text-gray-900 mt-4">Member Roles</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Owner:</strong> Full access to all features and settings</li>
            <li><strong>Parent:</strong> Can create tasks/rewards and approve requests</li>
            <li><strong>Child:</strong> Can complete tasks and request rewards</li>
          </ul>
        </div>
      )
    },

    // Tasks
    {
      id: 'creating-tasks',
      title: 'Creating and Managing Tasks',
      category: 'tasks',
      tags: ['tasks', 'chores', 'create', 'manage'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Creating a Task</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to the <strong>Tasks</strong> page</li>
            <li>Click <strong>Create Task</strong></li>
            <li>Choose from a template or start from scratch</li>
            <li>Fill in the task details:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Name and description</li>
                <li>Point value (how much it's worth)</li>
                <li>Frequency (one-time, daily, weekly, etc.)</li>
                <li>Who can complete it</li>
              </ul>
            </li>
            <li>Click <strong>Create Task</strong></li>
          </ol>
          <h4 className="font-semibold text-gray-900 mt-4">Task Types</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>One-time:</strong> Complete once and it's done</li>
            <li><strong>Recurring:</strong> Repeats on a schedule</li>
            <li><strong>Extra Credit:</strong> Optional bonus tasks</li>
          </ul>
        </div>
      )
    },
    {
      id: 'task-points',
      title: 'Understanding Task Points',
      category: 'tasks',
      tags: ['points', 'tasks', 'earn'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">How Points Work</h4>
          <p>Each task has a point value that you earn when you complete it. Points accumulate in your balance and can be spent on rewards.</p>
          <h4 className="font-semibold text-gray-900 mt-4">Recommended Point Values</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Quick tasks (5-10 min):</strong> 5-10 points</li>
            <li><strong>Standard tasks (15-30 min):</strong> 15-25 points</li>
            <li><strong>Major tasks (30+ min):</strong> 30-50 points</li>
            <li><strong>Extra credit:</strong> 5-15 bonus points</li>
          </ul>
          <h4 className="font-semibold text-gray-900 mt-4">Tips</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Balance point values with task difficulty</li>
            <li>Adjust values based on your family's needs</li>
            <li>Use bonus points to encourage extra effort</li>
          </ul>
        </div>
      )
    },
    {
      id: 'completing-tasks',
      title: 'Completing Tasks',
      category: 'tasks',
      tags: ['tasks', 'complete', 'how-to'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">How to Complete a Task</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to the <strong>Tasks</strong> page</li>
            <li>Find the task you want to complete</li>
            <li>Click the <strong>Complete</strong> button</li>
            <li>Points are automatically added to your balance</li>
          </ol>
          <h4 className="font-semibold text-gray-900 mt-4">Task Verification</h4>
          <p>Some tasks may require parent approval before points are awarded. If so, you'll see a "Pending Approval" status.</p>
        </div>
      )
    },

    // Rewards
    {
      id: 'creating-rewards',
      title: 'Creating Rewards',
      category: 'rewards',
      tags: ['rewards', 'create', 'setup'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Setting Up Rewards</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to the <strong>Rewards</strong> page</li>
            <li>Click <strong>Create Reward</strong></li>
            <li>Choose from the library or create custom</li>
            <li>Set the point cost</li>
            <li>Add any restrictions or limits</li>
            <li>Click <strong>Create Reward</strong></li>
          </ol>
          <h4 className="font-semibold text-gray-900 mt-4">Reward Ideas</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Screen time (30 minutes = 20 points)</li>
            <li>Special treats or snacks</li>
            <li>Choosing dinner menu</li>
            <li>Staying up late on weekend</li>
            <li>Friend sleepover</li>
          </ul>
        </div>
      )
    },
    {
      id: 'redeeming-rewards',
      title: 'Redeeming Rewards',
      category: 'rewards',
      tags: ['rewards', 'redeem', 'spend'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">How to Redeem</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Go to the <strong>Rewards</strong> page</li>
            <li>Browse available rewards</li>
            <li>Check that you have enough points</li>
            <li>Click <strong>Redeem</strong> on your chosen reward</li>
            <li>Wait for parent approval (if required)</li>
          </ol>
          <h4 className="font-semibold text-gray-900 mt-4">Reward Requests</h4>
          <p>Track your reward requests in the <strong>My Requests</strong> tab. You'll see:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Pending requests awaiting approval</li>
            <li>Approved rewards ready to claim</li>
            <li>Completed reward history</li>
          </ul>
        </div>
      )
    },

    // Badges
    {
      id: 'earning-badges',
      title: 'Earning Badges',
      category: 'badges',
      tags: ['badges', 'earn', 'milestones'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">What are Badges?</h4>
          <p>Badges are special achievements you earn by reaching milestones. They award bonus points and show your progress!</p>
          <h4 className="font-semibold text-gray-900 mt-4">Badge Categories</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Task Master:</strong> Complete tasks consistently</li>
            <li><strong>Point Collector:</strong> Earn total points</li>
            <li><strong>Streak Champion:</strong> Maintain daily streaks</li>
            <li><strong>Early Bird:</strong> Complete tasks early</li>
            <li><strong>Team Player:</strong> Help family members</li>
          </ul>
          <h4 className="font-semibold text-gray-900 mt-4">Bonus Points</h4>
          <p>Each badge unlocks bonus points based on tier:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Bronze:</strong> +10 points</li>
            <li><strong>Silver:</strong> +25 points</li>
            <li><strong>Gold:</strong> +50 points</li>
            <li><strong>Platinum:</strong> +100 points</li>
          </ul>
        </div>
      )
    },
    {
      id: 'badge-progress',
      title: 'Tracking Badge Progress',
      category: 'badges',
      tags: ['badges', 'progress', 'tracking'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Viewing Progress</h4>
          <p>Go to <strong>More → Badges</strong> to see:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Unlocked badges and their dates</li>
            <li>In-progress badges with completion percentage</li>
            <li>Locked badges showing requirements</li>
            <li>Recent milestone history</li>
          </ul>
          <h4 className="font-semibold text-gray-900 mt-4">Tips for Earning More</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Complete tasks daily to build streaks</li>
            <li>Try different types of tasks</li>
            <li>Work on multiple badges at once</li>
            <li>Check locked badges for inspiration</li>
          </ul>
        </div>
      )
    },

    // Family
    {
      id: 'family-management',
      title: 'Managing Your Family',
      category: 'family',
      tags: ['family', 'members', 'manage', 'permissions'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Family Settings</h4>
          <p>As a parent or owner, you can:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Add or remove family members</li>
            <li>Change member roles and permissions</li>
            <li>Set point earning limits</li>
            <li>Approve or reject task completions</li>
            <li>Approve reward redemptions</li>
          </ul>
          <h4 className="font-semibold text-gray-900 mt-4">Parental Controls</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Require approval for task completion</li>
            <li>Set spending limits on rewards</li>
            <li>View detailed activity logs</li>
            <li>Pause or reset member progress</li>
          </ul>
        </div>
      )
    },

    // Troubleshooting
    {
      id: 'points-not-showing',
      title: 'Points Not Showing Up',
      category: 'troubleshooting',
      tags: ['troubleshooting', 'points', 'bug', 'issue'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Common Causes</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li><strong>Pending Approval:</strong> Task may need parent approval before points are awarded</li>
            <li><strong>Sync Delay:</strong> Try refreshing the page</li>
            <li><strong>Task Already Completed:</strong> Some tasks can only be done once per day/week</li>
          </ol>
          <h4 className="font-semibold text-gray-900 mt-4">Solutions</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Check the <strong>My Tasks</strong> tab for pending approvals</li>
            <li>Refresh your browser</li>
            <li>Ask a parent to check the approval queue</li>
            <li>Contact support if points are still missing</li>
          </ul>
        </div>
      )
    },
    {
      id: 'cant-redeem-reward',
      title: 'Can\'t Redeem a Reward',
      category: 'troubleshooting',
      tags: ['troubleshooting', 'rewards', 'redeem', 'issue'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Common Issues</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Insufficient Points:</strong> Check your current balance vs. reward cost</li>
            <li><strong>Reward Limit Reached:</strong> Some rewards have daily/weekly limits</li>
            <li><strong>Pending Request:</strong> You may have an existing request for this reward</li>
            <li><strong>Reward Disabled:</strong> Parents may have temporarily disabled the reward</li>
          </ul>
          <h4 className="font-semibold text-gray-900 mt-4">What to Do</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Verify your point balance</li>
            <li>Check <strong>My Requests</strong> for pending items</li>
            <li>Complete more tasks to earn points</li>
            <li>Ask a parent about reward availability</li>
          </ul>
        </div>
      )
    },
    {
      id: 'app-not-working',
      title: 'App Not Loading or Working',
      category: 'troubleshooting',
      tags: ['troubleshooting', 'bug', 'technical', 'loading'],
      content: (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Troubleshooting Steps</h4>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li><strong>Refresh the page</strong> (F5 or Cmd+R)</li>
            <li><strong>Clear your browser cache</strong></li>
            <li><strong>Try a different browser</strong> (Chrome, Safari, Firefox)</li>
            <li><strong>Check your internet connection</strong></li>
            <li><strong>Restart your device</strong></li>
          </ol>
          <h4 className="font-semibold text-gray-900 mt-4">Still Not Working?</h4>
          <p>If the app still won't work after trying these steps, please contact support with:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>What you were trying to do</li>
            <li>Any error messages you see</li>
            <li>Your device and browser type</li>
          </ul>
        </div>
      )
    }
  ]

  // Filter articles based on search and category
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: 'all', label: 'All Topics', icon: '📚', count: articles.length },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀', count: articles.filter(a => a.category === 'getting-started').length },
    { id: 'tasks', label: 'Tasks', icon: '✅', count: articles.filter(a => a.category === 'tasks').length },
    { id: 'rewards', label: 'Rewards', icon: '🎁', count: articles.filter(a => a.category === 'rewards').length },
    { id: 'badges', label: 'Badges', icon: '🏆', count: articles.filter(a => a.category === 'badges').length },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', count: articles.filter(a => a.category === 'family').length },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧', count: articles.filter(a => a.category === 'troubleshooting').length },
  ]

  const quickLinks = [
    { label: 'How do I earn points?', articleId: 'task-points' },
    { label: 'How do I create a task?', articleId: 'creating-tasks' },
    { label: 'How do I redeem rewards?', articleId: 'redeeming-rewards' },
    { label: 'What are badges?', articleId: 'earning-badges' },
    { label: 'Points not showing up', articleId: 'points-not-showing' },
  ]

  const scrollToArticle = (articleId: string) => {
    const element = document.getElementById(`article-${articleId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Highlight the article briefly
      element.classList.add('ring-2', 'ring-trust-blue')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-trust-blue')
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-trust-blue to-soft-blue text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Help Center</h1>
          <p className="text-blue-100">Find answers to your questions about ChorePulse</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Banner Ad - Top */}
        <div className="mb-6">
          <AdSlot adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>
        {/* Search Bar */}
        <Card data-tour="search-help" variant="elevated" padding="md" className="mb-6">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Quick Links */}
        <Card data-tour="quick-links" variant="default" padding="md" className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {quickLinks.map((link) => (
              <button
                key={link.articleId}
                onClick={() => {
                  const article = articles.find(a => a.id === link.articleId)
                  if (article) {
                    setSelectedCategory(article.category)
                    setSearchQuery('')
                    setTimeout(() => scrollToArticle(link.articleId), 100)
                  }
                }}
                className="text-sm px-3 py-1.5 bg-blue-50 text-trust-blue rounded-lg hover:bg-blue-100 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Important Links */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2 font-medium">Important Information</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/privacy"
                className="text-sm px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy Policy
              </Link>
            </div>
          </div>
        </Card>

        {/* Category Tabs */}
        <Tabs data-tour="category-tabs" value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="w-full grid grid-cols-4 md:grid-cols-7 gap-1">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                <span className="mr-1">{category.icon}</span>
                <span className="hidden md:inline">{category.label}</span>
                <span className="md:hidden">{category.label.split(' ')[0]}</span>
                <Badge variant="secondary" size="sm" className="ml-1.5 text-xs">
                  {category.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              {filteredArticles.length === 0 ? (
                <Card variant="default" padding="lg" className="text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600">Try a different search term or category</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map((article) => (
                    <Card
                      key={article.id}
                      id={`article-${article.id}`}
                      variant="default"
                      padding="lg"
                      className="transition-all duration-200"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-xl">{article.title}</CardTitle>
                          <Badge variant="secondary" size="sm">
                            {categories.find(c => c.id === article.category)?.icon}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {article.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent className="text-gray-700 prose prose-sm max-w-none">
                        {article.content}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Contact Support */}
        <Card variant="default" padding="lg" className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-600 mb-4">Can't find what you're looking for? We're here to help!</p>
            <Link
              href="/more"
              className="inline-flex items-center gap-2 px-4 py-2 bg-trust-blue text-white rounded-lg hover:bg-trust-blue/90 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </Link>
          </div>
        </Card>

        {/* Banner Ad - Bottom */}
        <div className="mt-6">
          <AdSlot adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>
      </div>

      {/* Tour */}
      <ProductTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onComplete={completeTour}
        onSkip={skipTour}
        tourId="help-tour"
      />
    </div>
  )
}
