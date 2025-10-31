'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <Card variant="elevated" className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900">Privacy Policy</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Effective Date: October 26, 2025 | Last Updated: October 26, 2025
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">

              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                <p className="text-gray-700 mb-4">
                  Welcome to ChorePulse ("we," "our," or "us"). We are committed to protecting your privacy and the privacy of your family members. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our family task management application.
                </p>
                <p className="text-gray-700">
                  By using ChorePulse, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our service.
                </p>
              </section>

              {/* Information We Collect */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Personal Information You Provide</h3>
                <p className="text-gray-700 mb-3">When you create an account or use our service, we collect:</p>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Account Owner Information:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Email address</li>
                    <li>Name</li>
                    <li>Password (encrypted)</li>
                    <li>Organization/family name</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                  <p className="font-semibold text-gray-900 mb-2">Family Member Information:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Names</li>
                    <li>Email addresses (optional for teens, not collected for children under 13)</li>
                    <li>Roles (account owner, adult, teen, kid)</li>
                    <li>Avatar selection and color preference</li>
                    <li>Birthday (optional)</li>
                    <li>4-digit PIN (encrypted, for kids and teens)</li>
                  </ul>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2. Information Collected Automatically</h3>
                <p className="text-gray-700 mb-3">We automatically collect certain information when you use our service, including device information, usage data, and cookies.</p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3. Third-Party Analytics and Advertising</h3>
                <p className="text-gray-700 mb-2">We use Google AdSense to display advertisements. Google may collect cookie data, device information, and ad interaction data.</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <p className="font-semibold text-gray-900">⚠️ Important:</p>
                  <p className="text-gray-700">For users under 13, we serve only non-personalized, COPPA-compliant advertisements.</p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy (COPPA Compliance)</h2>
                <p className="text-gray-700 mb-4">
                  We are committed to protecting the privacy of children under 13 in compliance with the Children's Online Privacy Protection Act (COPPA).
                </p>

                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Parental Consent</h3>
                  <p className="text-gray-700 mb-3"><strong>How We Obtain Consent:</strong></p>
                  <ol className="list-decimal list-inside text-gray-700 space-y-2">
                    <li>Parent/guardian creates the family account</li>
                    <li>Parent/guardian adds child members to the family</li>
                    <li>When adding a child under 13 with a birthday, parent must check the consent checkbox</li>
                    <li>Parent receives a confirmation email documenting consent</li>
                    <li>Consent timestamp is recorded in our system</li>
                  </ol>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Parental Rights</h3>
                <p className="text-gray-700 mb-2">Parents have the right to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                  <li>Review the personal information collected from their child</li>
                  <li>Request deletion of their child's personal information</li>
                  <li>Refuse to allow further collection of their child's information</li>
                  <li>Revoke consent at any time</li>
                </ul>
                <p className="text-gray-700 font-medium">
                  To exercise these rights, contact us at: <a href="mailto:privacy@chorepulse.com" className="text-blue-600 hover:underline">privacy@chorepulse.com</a>
                </p>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                  <p className="font-semibold text-gray-900 mb-2">We DO NOT collect from children:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Email addresses</li>
                    <li>Phone numbers</li>
                    <li>Precise geolocation</li>
                    <li>Photos or videos</li>
                    <li>Social security numbers</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Service Delivery</h4>
                    <p className="text-sm text-gray-700">Manage accounts, tasks, rewards, and synchronize data</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
                    <p className="text-sm text-gray-700">Send account emails, support responses, and parental consents</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Improvement</h4>
                    <p className="text-sm text-gray-700">Analyze usage, fix bugs, develop features</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Advertising</h4>
                    <p className="text-sm text-gray-700">Display age-appropriate ads (non-personalized for under 13)</p>
                  </div>
                </div>
              </section>

              {/* How We Share Your Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Share Your Information</h2>
                <p className="text-gray-700 mb-4 font-medium">
                  We do not sell, trade, or rent your personal information.
                </p>
                <p className="text-gray-700 mb-3">We work with these service providers:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">•</span>
                    <span className="text-gray-700"><strong>Supabase:</strong> Database and authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">•</span>
                    <span className="text-gray-700"><strong>Google AdSense:</strong> Advertisement display</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">•</span>
                    <span className="text-gray-700"><strong>Vercel:</strong> Web hosting</span>
                  </li>
                </ul>
              </section>

              {/* Data Security */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect your information:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Technical Measures</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Encryption in transit (HTTPS)</li>
                      <li>Database encryption</li>
                      <li>Password hashing (bcrypt)</li>
                      <li>Secure authentication</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Organizational Measures</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                      <li>Limited employee access</li>
                      <li>Security training</li>
                      <li>Incident response procedures</li>
                      <li>Regular security audits</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Your Rights */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Access and Correction</h4>
                    <p className="text-sm text-gray-700">View and update your information in the Profile section</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Deletion</h4>
                    <p className="text-sm text-gray-700">Delete your account from Settings (data deleted within 30 days)</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Advertising</h4>
                    <p className="text-sm text-gray-700">Premium subscribers can remove all ads; under-13 users always see non-personalized ads</p>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                <div className="bg-gray-100 p-6 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Privacy Email:</strong> <a href="mailto:privacy@chorepulse.com" className="text-blue-600 hover:underline">privacy@chorepulse.com</a>
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Support Email:</strong> <a href="mailto:support@chorepulse.com" className="text-blue-600 hover:underline">support@chorepulse.com</a>
                  </p>
                  <p className="text-gray-700 text-sm mt-4">
                    Response Time: We will respond to privacy inquiries within 30 days.
                  </p>
                </div>
              </section>

              {/* Summary */}
              <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary of Key Points</h2>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li><strong>What we collect:</strong> Name, email, birthday (optional), usage data</li>
                  <li><strong>How we use it:</strong> Provide service, show ads, improve features</li>
                  <li><strong>Who we share with:</strong> Service providers only (Supabase, Google AdSense, Vercel)</li>
                  <li><strong>Children under 13:</strong> Parental consent required, non-personalized ads only, no email collection</li>
                  <li><strong>Your rights:</strong> Access, correct, delete your data at any time</li>
                  <li><strong>Security:</strong> Encryption, secure authentication, regular audits</li>
                  <li><strong>Contact:</strong> privacy@chorepulse.com for questions or requests</li>
                </ul>
              </section>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
