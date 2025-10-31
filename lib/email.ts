/**
 * Email Service for ChorePulse
 *
 * This service handles sending transactional emails including:
 * - Parental consent confirmations (COPPA compliance)
 * - Account notifications
 * - Password resets
 *
 * Using Resend API: https://resend.com
 * Alternative: You can swap this with SendGrid, Mailgun, or any other email service
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface ParentalConsentEmailData {
  parentEmail: string
  parentName: string
  childName: string
  childAge: number
  consentDate: Date
  organizationName?: string
}

/**
 * Send a generic email
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email would be sent:')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('HTML:', html)
      return true
    }

    // In production, use Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'ChorePulse <noreply@chorepulse.com>',
        to: [to],
        subject,
        html,
        text: text || undefined
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Email sending failed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email service error:', error)
    return false
  }
}

/**
 * Send parental consent confirmation email (COPPA compliance)
 */
export async function sendParentalConsentConfirmation(data: ParentalConsentEmailData): Promise<boolean> {
  const {
    parentEmail,
    parentName,
    childName,
    childAge,
    consentDate,
    organizationName = 'your family'
  } = data

  const formattedDate = consentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  const subject = `Parental Consent Confirmation for ${childName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Parental Consent Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">ChorePulse</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Parental Consent Confirmation</p>
  </div>

  <!-- Content -->
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">

    <p style="font-size: 16px; margin-bottom: 20px;">
      Dear ${parentName},
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      This email confirms that you have given parental consent to collect and store information for <strong>${childName}</strong> (age ${childAge}) as part of ${organizationName} on ChorePulse.
    </p>

    <!-- Consent Details -->
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 5px;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #667eea;">Consent Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Child's Name:</td>
          <td style="padding: 8px 0;">${childName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Age:</td>
          <td style="padding: 8px 0;">${childAge} years old</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Organization:</td>
          <td style="padding: 8px 0;">${organizationName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Consent Date:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <!-- What This Means -->
    <div style="margin: 25px 0;">
      <h3 style="font-size: 18px; color: #333; margin-bottom: 15px;">What Information We Collect</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">Child's name and username</li>
        <li style="margin-bottom: 8px;">Task completion data and points earned</li>
        <li style="margin-bottom: 8px;">Birthday (for age-appropriate content)</li>
        <li style="margin-bottom: 8px;">Avatar and color preferences</li>
      </ul>
    </div>

    <div style="margin: 25px 0;">
      <h3 style="font-size: 18px; color: #333; margin-bottom: 15px;">How We Protect Your Child</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;"><strong>No email collection</strong> for children under 13</li>
        <li style="margin-bottom: 8px;"><strong>Non-personalized ads only</strong> (COPPA-compliant)</li>
        <li style="margin-bottom: 8px;"><strong>No data sharing</strong> with third parties for marketing</li>
        <li style="margin-bottom: 8px;"><strong>Encrypted passwords and PINs</strong></li>
      </ul>
    </div>

    <!-- COPPA Compliance Notice -->
    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 25px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>🔒 COPPA Compliance:</strong> This consent is required under the Children's Online Privacy Protection Act (COPPA). We are committed to protecting your child's privacy and only collect information necessary to provide our service.
      </p>
    </div>

    <!-- Your Rights -->
    <div style="margin: 25px 0;">
      <h3 style="font-size: 18px; color: #333; margin-bottom: 15px;">Your Rights as a Parent</h3>
      <p style="margin-bottom: 10px; color: #555;">As a parent or guardian, you have the right to:</p>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">Review your child's personal information</li>
        <li style="margin-bottom: 8px;">Request deletion of your child's data</li>
        <li style="margin-bottom: 8px;">Refuse further collection of information</li>
        <li style="margin-bottom: 8px;">Revoke consent at any time</li>
      </ul>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://chorepulse.com'}/privacy"
         style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px 10px 0;">
        View Privacy Policy
      </a>
      <a href="mailto:privacy@chorepulse.com"
         style="display: inline-block; background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px 10px 0;">
        Contact Us
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

    <!-- Footer -->
    <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
      If you did not give consent or believe this email was sent in error, please contact us immediately at <a href="mailto:privacy@chorepulse.com" style="color: #667eea;">privacy@chorepulse.com</a>.
    </p>

    <p style="font-size: 14px; color: #666;">
      To revoke consent or delete your child's account, please email <a href="mailto:privacy@chorepulse.com" style="color: #667eea;">privacy@chorepulse.com</a> or contact us through the app settings.
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Thank you for trusting ChorePulse with your family's task management!
    </p>

    <p style="font-size: 14px; color: #666; margin-top: 20px;">
      Best regards,<br>
      <strong>The ChorePulse Team</strong>
    </p>
  </div>

  <!-- Footer Banner -->
  <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border: 1px solid #e0e0e0; border-top: none;">
    <p style="margin: 0; font-size: 12px; color: #666;">
      This is an automated message from ChorePulse. Please do not reply to this email.<br>
      For support, contact us at <a href="mailto:support@chorepulse.com" style="color: #667eea;">support@chorepulse.com</a>
    </p>
    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
      © ${new Date().getFullYear()} ChorePulse. All rights reserved.
    </p>
  </div>

</body>
</html>
  `

  const text = `
Parental Consent Confirmation - ChorePulse

Dear ${parentName},

This email confirms that you have given parental consent to collect and store information for ${childName} (age ${childAge}) as part of ${organizationName} on ChorePulse.

CONSENT DETAILS:
- Child's Name: ${childName}
- Age: ${childAge} years old
- Organization: ${organizationName}
- Consent Date: ${formattedDate}

WHAT INFORMATION WE COLLECT:
- Child's name and username
- Task completion data and points earned
- Birthday (for age-appropriate content)
- Avatar and color preferences

HOW WE PROTECT YOUR CHILD:
- No email collection for children under 13
- Non-personalized ads only (COPPA-compliant)
- No data sharing with third parties for marketing
- Encrypted passwords and PINs

YOUR RIGHTS AS A PARENT:
- Review your child's personal information
- Request deletion of your child's data
- Refuse further collection of information
- Revoke consent at any time

To exercise your rights or for any questions, contact us at privacy@chorepulse.com

View our full Privacy Policy: ${process.env.NEXT_PUBLIC_APP_URL || 'https://chorepulse.com'}/privacy

Thank you for trusting ChorePulse!

The ChorePulse Team
  `

  return await sendEmail({
    to: parentEmail,
    subject,
    html,
    text
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://chorepulse.com'}/reset-password?token=${resetToken}`

  const subject = 'Reset Your ChorePulse Password'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">Reset Your Password</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0;">
    <p>You requested to reset your password for your ChorePulse account.</p>
    <p>Click the button below to reset your password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
    <p style="font-size: 14px; color: #667eea; word-break: break-all;">${resetUrl}</p>

    <p style="margin-top: 30px; font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
    <p style="font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>
  `

  return await sendEmail({ to: email, subject, html })
}
