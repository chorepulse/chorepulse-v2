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
      cta: 'Get My Family Organized →',
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
      cta: 'Start 14-Day Trial →',
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-transparent.png"
              alt="ChorePulse - The heartbeat of your home"
              width={300}
              height={300}
              className="h-16 w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          </nav>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section - Enhanced */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Social Proof Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-gray-700 text-sm font-medium mb-6 shadow-sm">
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">★★★★★</span>
          </span>
          <span className="text-gray-400">|</span>
          <span>Trusted by 10,000+ families</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
          Meet Pulse
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">
            Your Family AI Assistant
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Simplify family life and bring <span className="font-semibold text-gray-900">more peace and happiness</span> into your home.
          <span className="block mt-2">Pulse handles the planning, scheduling, and organizing—so you can focus on what matters most.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/signup"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Get My Family Organized
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            Watch Demo (2 min)
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            14-day free trial
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Free plan available
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            No credit card for free tier
          </div>
        </div>
      </section>

      {/* Problem/Solution Section - NEW */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Sound familiar?
              </h2>
              <div className="space-y-4">
                {[
                  'Tired of nagging kids to do their chores?',
                  'Struggling to keep track of who did what?',
                  'Kids asking "what do I get?" for every task?',
                  'Losing the battle to get help around the house?'
                ].map((problem, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                    <span className="text-red-500 text-xl flex-shrink-0">✗</span>
                    <p className="text-gray-700">{problem}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Here's how we fix it:
              </h2>
              <div className="space-y-4">
                {[
                  'Kids see their tasks and get excited to earn points',
                  'Everyone knows what needs to be done—automatically',
                  'Clear rewards system motivates without bribing',
                  'Families actually work together (and have fun!)'
                ].map((solution, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                    <span className="text-green-600 text-xl flex-shrink-0">✓</span>
                    <p className="text-gray-700 font-medium">{solution}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Reframed as Benefits */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Win at Parenting
            </h2>
            <p className="text-xl text-gray-600">
              Powerful tools that make managing your family actually enjoyable
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Kids Actually Want to Help',
                description: 'Watch your kids race to complete tasks when they can see their points add up and unlock rewards they chose themselves.',
                icon: '🎯',
                stat: '89% of kids stay motivated'
              },
              {
                title: 'Stop Repeating Yourself',
                description: 'Set it once, forget it. Tasks auto-assign, notifications remind, and everyone knows exactly what needs to be done.',
                icon: '🔄',
                stat: '3hrs saved per week'
              },
              {
                title: 'See Everything at a Glance',
                description: 'Your family calendar shows who\'s doing what, when. Sync with Google Calendar or use our beautiful Hub display mode.',
                icon: '📅',
                stat: 'All tasks in one view'
              },
              {
                title: 'Let AI Do the Planning',
                description: 'Pulse suggests age-appropriate tasks, optimal schedules, and rewards based on your family\'s unique needs.',
                icon: '🤖',
                stat: 'Smart suggestions daily'
              },
              {
                title: 'Build Lifelong Habits',
                description: 'Streaks, achievements, and progression systems teach responsibility and create lasting habits—not just compliance.',
                icon: '🏆',
                stat: '50+ achievement badges'
              },
              {
                title: 'Family Command Center',
                description: 'Turn any tablet or screen into a live family dashboard. Perfect for the kitchen counter or kids\' room.',
                icon: '📺',
                stat: 'Real-time updates'
              }
            ].map((feature, i) => (
              <div key={i} className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative">
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>
                  <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                    {feature.stat}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-center text-xl text-gray-600 mb-16">
            No complicated setup. No training required. Just results.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up Free',
                description: 'Create your account—no credit card needed for free tier',
                time: '30 seconds'
              },
              {
                step: '2',
                title: 'Add Your Family',
                description: 'Invite family members or create kid profiles with PINs',
                time: '2 minutes'
              },
              {
                step: '3',
                title: 'Let AI Suggest Tasks',
                description: 'Pulse recommends chores based on ages and preferences',
                time: '1 minute'
              },
              {
                step: '4',
                title: 'Watch Magic Happen',
                description: 'Kids complete tasks, earn points, unlock rewards',
                time: 'Ongoing'
              }
            ].map((step, i) => (
              <div key={i} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                  {step.step}
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-blue-300 to-purple-300"></div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-2">{step.description}</p>
                <p className="text-sm text-blue-600 font-medium">{step.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Plans That Grow With Your Family
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade anytime. No surprises.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 rounded-xl p-1 inline-flex shadow-inner">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600'
                }`}
              >
                Annual <span className="inline-flex ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Save 33%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl shadow-lg border-2 ${
                  tier.highlighted ? 'border-blue-600 relative ring-4 ring-blue-100 scale-105' : 'border-gray-200'
                } p-8 transition-all hover:shadow-2xl`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-2 rounded-full text-sm font-bold shadow-lg">
                    ⭐ MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-6">{tier.description}</p>
                <div className="mb-6">
                  {getDisplayPrice(tier)}
                </div>
                <Link
                  href="/signup"
                  className={`block w-full py-4 px-6 rounded-xl font-bold text-center transition-all transform hover:scale-105 ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </Link>
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-700">
                      <span className="text-green-600 mt-0.5 flex-shrink-0 text-lg">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Money-back guarantee */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border-2 border-green-200 rounded-full">
              <span className="text-2xl">✓</span>
              <span className="font-semibold text-green-900">14-Day Money-Back Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Enhanced */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Real Families, Real Results
          </h2>
          <p className="text-center text-xl text-gray-600 mb-16">
            See what happens when chores become fun
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "My mornings went from chaos to calm. The kids wake up and check their tasks without me saying a word. Game changer!",
                author: "Sarah M.",
                role: "Mom of 3 (ages 6, 9, 12)",
                rating: 5,
                highlight: "3 hours/week saved"
              },
              {
                quote: "The AI suggestions are spot-on. Pulse knows my kids better than I do sometimes! They're actually excited about earning points.",
                author: "James T.",
                role: "Dad of 2 (ages 7, 14)",
                rating: 5,
                highlight: "Kids 89% more motivated"
              },
              {
                quote: "Finally got my teens to take responsibility without the eye rolls. The streak feature is surprisingly addictive!",
                author: "Lisa K.",
                role: "Parent of teens",
                rating: 5,
                highlight: "No more arguments"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 relative">
                <div className="flex gap-1 mb-4 text-yellow-400">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <div className="mt-4 inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full">
                  {testimonial.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Questions? We've Got Answers
          </h2>
          <p className="text-center text-xl text-gray-600 mb-12">
            Everything you need to know before getting started
          </p>

          <div className="space-y-4">
            {[
              {
                q: "Is ChorePulse really free?",
                a: "Yes! Our Pulse Starter plan is completely free forever with all the basics you need. Upgrade anytime for advanced features like AI suggestions and unlimited tasks."
              },
              {
                q: "Will my kids actually use this?",
                a: "89% of kids stay engaged after the first month. The gamification, points system, and rewards they choose make chores feel more like a game than work."
              },
              {
                q: "What if I'm not tech-savvy?",
                a: "ChorePulse is designed for busy parents. Setup takes 5 minutes. If you can use a smartphone, you can use ChorePulse. Plus, we have live support ready to help."
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel with one click, no questions asked. You'll keep access until the end of your billing period. The free plan is always available."
              },
              {
                q: "How many family members can I add?",
                a: "Unlimited! Add as many family members as you need on any plan—even the free one."
              },
              {
                q: "What if I'm not satisfied?",
                a: "We offer a 14-day free trial so you can test Premium or Unlimited plans risk-free. You can also use our always-free Starter plan with no commitment."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Enhanced */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to End the Chore Wars?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
            Join 10,000+ families who transformed their daily routine.<br/>
            <span className="font-semibold">Start free. No credit card required.</span>
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-105"
          >
            Get Started Free
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-6 text-white/80 text-sm">
            ✓ Free forever plan  ✓ 14-day trial  ✓ Cancel anytime
          </p>
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
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © {new Date().getFullYear()} ChorePulse. All rights reserved.
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
