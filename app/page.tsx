'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual')

  const pricingTiers = [
    {
      name: 'Pulse Starter',
      price: { annual: 0, monthly: 0 },
      description: 'Perfect for getting started',
      features: [
        'Up to 30 active tasks',
        'Up to 15 active rewards',
        'Basic task library',
        '1-way calendar import',
        'Weekly calendar view',
        'Points & streaks',
        'Basic achievements',
        'Hub display mode',
        'Ad-supported'
      ],
      cta: 'Start Free',
      highlighted: false
    },
    {
      name: 'Pulse Premium',
      price: { annual: 39.99, monthly: 4.99 },
      description: 'Most popular for families',
      features: [
        'Up to 100 active tasks',
        'Up to 50 active rewards',
        'Full task & reward library',
        '1-way calendar import',
        'Monthly calendar view',
        'AI task suggestions (50/month)',
        'Priority support',
        'All achievements',
        'No ads'
      ],
      cta: 'Start Free Trial',
      highlighted: true
    },
    {
      name: 'Unlimited Pulse',
      price: { annual: 69.99, monthly: 9.99 },
      description: 'Everything you need',
      features: [
        'Unlimited tasks',
        'Unlimited rewards',
        'Full task & reward library',
        '1-way calendar import',
        'Monthly calendar view',
        'AI task suggestions (200/month)',
        'Meal planning (coming soon)',
        'Priority support',
        'All achievements',
        'No ads'
      ],
      cta: 'Start Free Trial',
      highlighted: false
    }
  ]

  const getDisplayPrice = (tier: typeof pricingTiers[0]) => {
    if (tier.price.annual === 0) return 'Free'

    if (billingCycle === 'annual') {
      const monthlyEquivalent = (tier.price.annual / 12).toFixed(2)
      return (
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold">${monthlyEquivalent}</span>
          <span className="text-sm text-gray-600">/month</span>
          <span className="text-xs text-gray-500 mt-1">
            ${tier.price.annual}/year paid upfront
          </span>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold">${tier.price.monthly}</span>
        <span className="text-sm text-gray-600">/month</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ChorePulse"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900">ChorePulse</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
          </nav>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-6">
          <span className="text-lg">🤖</span>
          Meet Pulse—Your Family's AI Assistant
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Family Chores Made
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Simple & Smart
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Let Pulse, your AI-powered assistant, help manage your family's tasks, schedules, and rewards.
          Smart suggestions that adapt to your family's unique rhythm.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Start Free Trial
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            See How It Works
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-6">14-day free trial • No credit card required</p>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Everything Your Family Needs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Task Management',
                description: 'Create, assign, and track tasks with flexible scheduling. One-time, daily, weekly, or custom patterns.',
                icon: '✓'
              },
              {
                title: 'Points & Rewards',
                description: 'Motivate kids with a points system. Set up rewards they can earn by completing tasks.',
                icon: '⭐'
              },
              {
                title: 'Family Calendar',
                description: 'See everyone\'s tasks and schedules in one place. Import from Google Calendar or Outlook.',
                icon: '📅'
              },
              {
                title: 'Achievements',
                description: 'Unlock badges and privileges as family members complete milestones and build streaks.',
                icon: '🏆'
              },
              {
                title: 'AI Assistant "Pulse"',
                description: 'Get smart task suggestions based on your family\'s profile and habits.',
                icon: '🤖'
              },
              {
                title: 'Hub Display Mode',
                description: 'Turn any device into a family command center with real-time updates.',
                icon: '📺'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your family account in minutes' },
              { step: '2', title: 'Add Family', description: 'Invite family members and set up profiles' },
              { step: '3', title: 'Create Tasks', description: 'Assign chores and responsibilities' },
              { step: '4', title: 'Track & Reward', description: 'Watch progress and celebrate achievements' }
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Start with our free plan, upgrade anytime
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-200 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                Annual <span className="text-green-600 text-sm ml-1">(Save 33%)</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl shadow-sm border-2 ${
                  tier.highlighted ? 'border-blue-600 relative ring-4 ring-blue-50' : 'border-gray-200'
                } p-8 transition-all hover:shadow-lg`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-1.5 rounded-full text-sm font-semibold shadow-md">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-6">{tier.description}</p>
                <div className="mb-6">
                  {getDisplayPrice(tier)}
                </div>
                <Link
                  href="/signup"
                  className={`block w-full py-3.5 px-6 rounded-xl font-semibold text-center transition-all ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Loved by Families Everywhere
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "ChorePulse transformed our mornings. The kids actually WANT to do their chores now!",
                author: "Sarah M.",
                role: "Mom of 3"
              },
              {
                quote: "The AI suggestions saved me so much time. Pulse knows exactly what my family needs.",
                author: "James T.",
                role: "Dad of 2"
              },
              {
                quote: "My teens are finally taking responsibility. The points system really works!",
                author: "Lisa K.",
                role: "Parent"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                <div className="font-semibold text-gray-900">{testimonial.author}</div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-gray-50 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Is ChorePulse really free?",
                a: "Yes! Our Pulse Starter plan is completely free with basic features. Upgrade anytime for more advanced features."
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel anytime with no questions asked. You'll keep access until the end of your billing period."
              },
              {
                q: "Is my family's data secure?",
                a: "Yes. We use bank-level encryption and never share your data with third parties. Your privacy is our priority."
              },
              {
                q: "How many family members can I add?",
                a: "Unlimited! Add as many family members as you need on any plan."
              },
              {
                q: "What if I'm not satisfied?",
                a: "We offer a 14-day free trial so you can test ChorePulse risk-free. No credit card required to start your trial."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Family?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="ChorePulse"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold text-white">ChorePulse</span>
              </div>
              <p className="text-sm">
                Making family chores simple, fun, and rewarding.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/legal/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/legal/terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © {new Date().getFullYear()} ChorePulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
