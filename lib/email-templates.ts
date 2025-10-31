/**
 * Email Templates for ChorePulse Campaign System
 *
 * All templates use mustache-style variables: {{variableName}}
 * These will be replaced at send-time with actual data
 */

// ============================================
// SHARED TEMPLATE COMPONENTS
// ============================================

export const EMAIL_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  }
  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 32px;
    font-weight: bold;
  }
  .header p {
    margin: 10px 0 0 0;
    font-size: 16px;
    opacity: 0.9;
  }
  .content {
    padding: 40px 30px;
  }
  .content p {
    margin: 0 0 20px 0;
    font-size: 16px;
    line-height: 1.6;
  }
  .content h2 {
    color: #667eea;
    font-size: 24px;
    margin: 30px 0 15px 0;
  }
  .content h3 {
    color: #333;
    font-size: 20px;
    margin: 25px 0 15px 0;
  }
  .cta-button {
    display: inline-block;
    background: #667eea;
    color: white !important;
    padding: 16px 40px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
    font-size: 16px;
    margin: 20px 0;
    text-align: center;
  }
  .cta-button:hover {
    background: #5568d3;
  }
  .highlight-box {
    background: #f8f9fa;
    border-left: 4px solid #667eea;
    padding: 20px;
    margin: 25px 0;
    border-radius: 5px;
  }
  .quote-box {
    background: #fff3cd;
    border: 1px solid #ffc107;
    padding: 20px;
    border-radius: 8px;
    margin: 25px 0;
    font-style: italic;
  }
  .quote-box strong {
    font-style: normal;
    color: #856404;
  }
  .checklist {
    list-style: none;
    padding: 0;
    margin: 20px 0;
  }
  .checklist li {
    padding: 12px 0;
    padding-left: 35px;
    position: relative;
  }
  .checklist li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #667eea;
    font-weight: bold;
    font-size: 20px;
  }
  .stats-grid {
    display: table;
    width: 100%;
    margin: 20px 0;
  }
  .stat-item {
    display: table-cell;
    text-align: center;
    padding: 20px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }
  .stat-number {
    font-size: 32px;
    font-weight: bold;
    color: #667eea;
    display: block;
  }
  .stat-label {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
  }
  .testimonial {
    background: #f0f7ff;
    padding: 20px;
    border-radius: 8px;
    margin: 20px 0;
    border-left: 4px solid #667eea;
  }
  .testimonial-text {
    font-size: 15px;
    color: #333;
    margin-bottom: 10px;
  }
  .testimonial-author {
    font-size: 14px;
    color: #667eea;
    font-weight: bold;
  }
  .footer {
    background: #f8f9fa;
    padding: 30px;
    text-align: center;
    border-top: 1px solid #e0e0e0;
  }
  .footer p {
    margin: 10px 0;
    font-size: 13px;
    color: #666;
  }
  .footer a {
    color: #667eea;
    text-decoration: none;
  }
  .unsubscribe {
    margin-top: 20px;
    font-size: 12px;
    color: #999;
  }
`

export function wrapEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChorePulse</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `
}

// ============================================
// OWNER SEQUENCE - EMAIL 1: WELCOME
// ============================================

export const OWNER_WELCOME_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>🎉 Welcome to ChorePulse!</h1>
    <p>Let's build a happier, more organized family together</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>Welcome to ChorePulse! We're thrilled to have you and {{familyName}} join our community of families building better habits together.</p>

    <p>Research shows that families with structured routines experience <strong>less stress, better communication, and stronger relationships</strong>. You're taking an important step for your family's wellbeing.</p>

    <h2>🚀 Get Started in 3 Easy Steps</h2>

    <ul class="checklist">
      <li><strong>Add your family members</strong> - Include everyone who'll be using ChorePulse</li>
      <li><strong>Update household preferences</strong> - Tell Pulse AI about your home (pets, pool, etc.) for personalized task suggestions</li>
      <li><strong>Create your first task</strong> - Start with something simple like "Make your bed" or "Take out trash"</li>
    </ul>

    <div style="text-align: center;">
      <a href="{{appUrl}}/family" class="cta-button">Add Your Family Now</a>
    </div>

    <div class="highlight-box">
      <h3>💡 Pro Tip from Our Community</h3>
      <p>"Start small! We began with just 3 tasks per kid and gradually added more as they got into the routine." - Sarah M., mother of 3</p>
    </div>

    <h3>What Makes ChorePulse Different?</h3>
    <p>We're not just another chore app. We're a family wellbeing platform built on research and powered by AI:</p>

    <ul>
      <li><strong>Pulse AI Suggestions</strong> - Personalized task recommendations based on your household</li>
      <li><strong>Family Analytics</strong> - Insights to strengthen relationships and spot issues early</li>
      <li><strong>Achievement System</strong> - Keep everyone motivated with badges and milestones</li>
      <li><strong>Photo Proof & Approval</strong> - Build accountability with visual confirmation</li>
    </ul>

    <div class="quote-box">
      <strong>Research shows:</strong> "Children who do chores develop greater self-esteem, are more responsible, and are better able to deal with frustration and delay gratification." - Dr. Marty Rossmann, University of Minnesota
    </div>

    <p>We're here to support you every step of the way. If you have any questions, just reply to this email or visit our <a href="{{appUrl}}/help" style="color: #667eea;">Help Center</a>.</p>

    <p>Here's to building a thriving family! 💙</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/help">Help Center</a> •
      <a href="{{appUrl}}/settings">Settings</a>
    </p>
    <p class="unsubscribe">
      You're receiving this email because you created a ChorePulse account.<br>
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// OWNER SEQUENCE - EMAIL 2: TASK CREATION TIPS
// ============================================

export const OWNER_TASK_TIPS_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>✨ 3 Pro Tips for Tasks</h1>
    <p>Create tasks your family will actually complete</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>You've taken the first step with ChorePulse! Now let's make sure your tasks are set up for success.</p>

    <p>After working with thousands of families, we've learned what works (and what doesn't). Here are the top 3 strategies:</p>

    <h2>1. 🤖 Use Pulse AI Suggestions</h2>
    <p>Our AI analyzes your household data (pets, pool, garden, etc.) to suggest relevant tasks. These suggestions are <strong>3x more likely to be completed</strong> than generic tasks.</p>

    <div class="highlight-box">
      <p><strong>Try it now:</strong> When creating a task, look for the "💡 Suggested Tasks" panel. We've already generated {{suggestionCount}} personalized suggestions for your household!</p>
    </div>

    <h2>2. ⚖️ Set Realistic Point Values & Due Times</h2>
    <p>Points should reflect effort, not just completion. Our data shows optimal ranges:</p>
    <ul>
      <li><strong>5-10 points:</strong> Quick tasks (5-10 mins) - Make bed, feed pet</li>
      <li><strong>15-25 points:</strong> Medium tasks (15-30 mins) - Clean room, do dishes</li>
      <li><strong>30-50 points:</strong> Major tasks (30+ mins) - Mow lawn, deep clean</li>
    </ul>

    <p><strong>Due times matter!</strong> Tasks due in the evening have 40% higher completion rates than morning tasks.</p>

    <h2>3. 📸 Use Photos and Approval for Accountability</h2>
    <p>Tasks with photo proof see <strong>85% completion rates</strong> vs. 60% without. It adds accountability while reducing conflicts about "did you really do it?"</p>

    <div class="testimonial">
      <p class="testimonial-text">"Photo proof was a game-changer! No more arguing about whether tasks were done. Plus, I love seeing my kids' creative proof photos."</p>
      <p class="testimonial-author">- James T., father of 2 teens</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/tasks/create" class="cta-button">Create Your Next Task</a>
    </div>

    {{#isFreeUser}}
    <div class="highlight-box">
      <h3>🚀 Level Up with Pro</h3>
      <p>Pro families get <strong>unlimited AI-powered task suggestions</strong> that adapt to your family's changing needs. Plus advanced analytics to optimize task completion rates.</p>
      <p>Join families reporting <strong>40% less conflict</strong> and <strong>5 hours saved per week</strong>.</p>
      <a href="{{appUrl}}/upgrade" style="color: #667eea; font-weight: bold;">See What Pro Families Get →</a>
    </div>
    {{/isFreeUser}}

    <p>Want more tips? Check out our <a href="{{appUrl}}/help/task-best-practices" style="color: #667eea;">Task Best Practices Guide</a>.</p>

    <p>You're doing great!</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/help">Help Center</a> •
      <a href="{{appUrl}}/settings">Settings</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// OWNER SEQUENCE - EMAIL 3: THE SCIENCE / UPGRADE FOCUS
// ============================================

export const OWNER_SCIENCE_UPGRADE_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>💙 The Science of Family Harmony</h1>
    <p>Why organized families are happier families</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>You've created {{taskCount}} tasks on ChorePulse - that's amazing! But here's what most families don't realize:</p>

    <p><strong>The benefits go far beyond clean rooms and completed chores.</strong></p>

    <h2>📚 What Research Shows</h2>

    <div class="quote-box">
      "Children who do chores show higher self-esteem and are more responsible."
      <br><strong>- Dr. Marty Rossmann, University of Minnesota</strong>
    </div>

    <div class="quote-box">
      "Family routines are associated with better health outcomes and stronger relationships."
      <br><strong>- Journal of Family Psychology</strong>
    </div>

    <div class="quote-box">
      "The family that works together, stays together."
      <br><strong>- Eleanor Roosevelt</strong>
    </div>

    <h2>🌟 Real Impact from ChorePulse Families</h2>

    <div class="testimonial">
      <p class="testimonial-text">"Our home went from chaos to calm in just 2 weeks. My kids actually ask what tasks they can do!"</p>
      <p class="testimonial-author">- Sarah M., mother of 3</p>
    </div>

    <div class="testimonial">
      <p class="testimonial-text">"My teens are finally helping without being asked. It's like having a different family."</p>
      <p class="testimonial-author">- James T., father of 2</p>
    </div>

    <div class="testimonial">
      <p class="testimonial-text">"I got 8 hours back per week. No more nagging, no more arguments. Just results."</p>
      <p class="testimonial-author">- Maria G., working mom</p>
    </div>

    {{#isFreeUser}}
    <h2>🚀 What Pro Families Experience</h2>

    <p>While the free plan is great for getting started, Pro families report even stronger outcomes:</p>

    <div style="text-align: center; margin: 30px 0;">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">40%</span>
          <span class="stat-label">Less family conflict</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">5hrs</span>
          <span class="stat-label">Saved per week</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">85%</span>
          <span class="stat-label">Task completion rate</span>
        </div>
      </div>
    </div>

    <h3>Pro Benefits:</h3>
    <ul class="checklist">
      <li><strong>Unlimited tasks</strong> to build complete family routines</li>
      <li><strong>Advanced analytics</strong> to spot issues before they become conflicts</li>
      <li><strong>Priority support</strong> when you need guidance</li>
      <li><strong>Ad-free experience</strong> for focused family time</li>
      <li><strong>Calendar integration</strong> for seamless planning</li>
      <li><strong>Unlimited AI suggestions</strong> that adapt to your family</li>
    </ul>

    <div class="highlight-box">
      <h3>The Investment in Your Family</h3>
      <p>For less than a family dinner out each month, you can give your family the tools for lasting harmony and better habits.</p>
      <p><strong>Pro:</strong> {{proPricing}}/month • <strong>Premium:</strong> {{premiumPricing}}/month</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/upgrade" class="cta-button">Build a Thriving Family</a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center;">
      Not ready yet? That's okay! Stay on the free plan as long as you like.
    </p>
    {{/isFreeUser}}

    {{#isTrialUser}}
    <h2>⏰ Your Trial Ends in {{daysUntilTrialEnds}} Days</h2>

    <p>Let's look at what your family has built together:</p>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{tasksCompleted}}</span>
        <span class="stat-label">Tasks completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{completionRate}}%</span>
        <span class="stat-label">Completion rate</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{longestStreak}}</span>
        <span class="stat-label">Longest streak</span>
      </div>
    </div>

    <p><strong>That's real progress!</strong> And here's what research tells us: consistency is key to habit formation. Breaking the routine now could undo the momentum you've built.</p>

    <div class="quote-box">
      <strong>Child psychologist insight:</strong> "Structured family routines reduce stress and improve child development. Consistency is essential for lasting change."
    </div>

    <h3>Your Family Deserves:</h3>
    <ul class="checklist">
      <li>Everything you have now, forever</li>
      <li>Continued growth and progress</li>
      <li>The tools to build lasting habits</li>
      <li>A happier, more connected family life</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/subscribe" class="cta-button">Continue Your Family's Progress</a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center;">
      If now's not the right time, we understand. Your data will be here when you're ready.
    </p>
    {{/isTrialUser}}

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/help">Help Center</a> •
      <a href="{{appUrl}}/settings">Settings</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// OWNER SEQUENCE - EMAIL 4: FAMILY REPORT
// ============================================

export const OWNER_FAMILY_REPORT_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>📊 Your First Family Report</h1>
    <p>{{familyName}}'s week in review</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>Congratulations! You've been using ChorePulse for a week. Here's how {{familyName}} is doing:</p>

    <h2>📈 This Week's Highlights</h2>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{tasksCompleted}}</span>
        <span class="stat-label">Tasks completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{completionRate}}%</span>
        <span class="stat-label">Completion rate</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{totalPoints}}</span>
        <span class="stat-label">Points earned</span>
      </div>
    </div>

    {{#topPerformer}}
    <div class="highlight-box">
      <h3>🌟 Top Performer of the Week</h3>
      <p><strong>{{topPerformerName}}</strong> completed {{topPerformerTasks}} tasks and earned {{topPerformerPoints}} points! Way to go!</p>
    </div>
    {{/topPerformer}}

    {{#pulseInsight}}
    <h2>💡 Pulse AI Insight</h2>
    <div class="quote-box">
      <strong>{{insightTitle}}</strong><br>
      {{insightMessage}}
    </div>
    {{/pulseInsight}}

    <h3>Your Family Progress</h3>
    {{#familyMembers}}
    <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <strong>{{memberName}}</strong>: {{memberTasks}} tasks • {{memberPoints}} points • {{memberCompletionRate}}% completion
    </div>
    {{/familyMembers}}

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/analytics" class="cta-button">View Full Analytics Dashboard</a>
    </div>

    {{#isFreeUser}}
    <div class="highlight-box">
      <h3>🚀 Get Deeper Insights with Pro</h3>
      <p>This is just a taste of your full weekly reports! Pro families get:</p>
      <ul>
        <li><strong>Streak risk alerts</strong> - Never lose momentum</li>
        <li><strong>Task distribution fairness</strong> - Ensure everyone contributes equally</li>
        <li><strong>Behavior pattern insights</strong> - Know the best times for tasks</li>
        <li><strong>Automated weekly reports</strong> - Delivered every Monday</li>
      </ul>
      <div class="testimonial">
        <p class="testimonial-text">"The weekly insights helped us catch problems before they became conflicts. We adjusted our approach and saw immediate improvement."</p>
        <p class="testimonial-author">- Parent of 3</p>
      </div>
      <a href="{{appUrl}}/upgrade" style="color: #667eea; font-weight: bold;">See What Pro Families See →</a>
    </div>
    {{/isFreeUser}}

    <p>Keep up the great work! Small consistent steps lead to big changes.</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/analytics">Analytics</a> •
      <a href="{{appUrl}}/settings">Settings</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// OWNER SEQUENCE - EMAIL 5: MOMENTUM
// ============================================

export const OWNER_MOMENTUM_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>💪 Keep the Momentum Going</h1>
    <p>5 ways to keep your family motivated</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>You're almost 2 weeks in - this is where habits start to stick! Here are 5 proven strategies to keep the momentum going:</p>

    <h2>1. 🎉 Celebrate Wins Together</h2>
    <p>Use ChorePulse's achievement system to recognize milestones. When someone unlocks a badge, celebrate as a family! Research shows recognition is more powerful than rewards.</p>

    <div class="highlight-box">
      <p><strong>Try this:</strong> Have a weekly "achievement ceremony" at dinner where everyone shares their wins.</p>
    </div>

    <h2>2. 👥 Hold Weekly Family Meetings</h2>
    <p>Spend 15 minutes reviewing your family dashboard together. Let everyone see the progress and discuss what's working.</p>

    <div class="quote-box">
      <strong>Parent tip:</strong> "Our Sunday night check-ins transformed how we communicate. Everyone has a voice and we solve problems together." - Family of 4
    </div>

    <h2>3. 🤝 Let Kids Help Set Point Values</h2>
    <p>When kids have input on point values, they're more invested. They often value tasks more fairly than we expect!</p>

    <h2>4. 🎨 Create Seasonal or Themed Tasks</h2>
    <p>Keep things fresh! Create special tasks for holidays, seasons, or family events. "Help decorate for Halloween" is more exciting than "clean living room."</p>

    <h2>5. 🎁 Use the Rewards System Meaningfully</h2>
    <p>Connect points to experiences, not just things. "Movie night with family" or "pick dinner this week" often motivate better than toys.</p>

    <div class="testimonial">
      <p class="testimonial-text">"We tied points to family experiences like choosing a game night activity or picking a weekend outing. Engagement skyrocketed!"</p>
      <p class="testimonial-author">- Maria G., working mom of 2</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/tasks" class="cta-button">Create a Themed Task</a>
    </div>

    <h2>💬 We Want to Hear From You!</h2>
    <p>What's your biggest challenge with ChorePulse? (Just reply to this email - we read every response!)</p>

    {{#isFreeUser}}
    <div class="highlight-box">
      <h3>🌟 Pro Families Stay Motivated Longer</h3>
      <p>After upgrading to Pro, families report staying consistent 3x longer. Here's why:</p>
      <ul>
        <li>Advanced analytics reveal what's working (and what's not)</li>
        <li>Streak alerts prevent momentum loss</li>
        <li>Unlimited tasks = complete family routines</li>
        <li>Priority support when you need help</li>
      </ul>
      <div class="testimonial">
        <p class="testimonial-text">"After going Pro, our family's stress levels dropped and our connection grew. The insights alone are worth it."</p>
        <p class="testimonial-author">- Sarah M., mother of 3</p>
      </div>
      <a href="{{appUrl}}/upgrade" style="color: #667eea; font-weight: bold;">Build an Even Stronger Family →</a>
    </div>
    {{/isFreeUser}}

    <h2>🎁 Love ChorePulse? Share the Love!</h2>
    <p>Know a family who could benefit? When you refer friends to ChorePulse, you help build a community of thriving families.</p>

    <div style="text-align: center; margin: 20px 0;">
      <a href="{{appUrl}}/referral" style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Share ChorePulse</a>
    </div>

    <p>You're building something special. Keep going!</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/help">Help Center</a> •
      <a href="{{appUrl}}/settings">Settings</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// OWNER SEQUENCE - EMAIL 6: GRADUATION
// ============================================

export const OWNER_GRADUATION_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>🎓 You're a ChorePulse Pro!</h1>
    <p>Here's what's next for {{familyName}}</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>🎉 Congratulations! You've been using ChorePulse for 2 weeks - that's huge!</p>

    <h2>📊 Your Family's Journey So Far</h2>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{totalTasks}}</span>
        <span class="stat-label">Tasks created</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{tasksCompleted}}</span>
        <span class="stat-label">Tasks completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{completionRate}}%</span>
        <span class="stat-label">Completion rate</span>
      </div>
    </div>

    <div class="highlight-box">
      <h3>🌟 This is Real Progress!</h3>
      <p>Most families who stick with it for 2 weeks continue for 6+ months. You're building lasting habits together.</p>
    </div>

    <h2>🚀 Ready for Advanced Features?</h2>

    <p>You've mastered the basics. Now take it to the next level:</p>

    <h3>⏰ Recurring Tasks & Custom Frequencies</h3>
    <p>Set up weekly, monthly, or custom schedules. Perfect for "Clean bathroom every Saturday" or "Water plants every 3 days."</p>

    <h3>📅 Calendar Sync</h3>
    <p>Connect your Google Calendar to see tasks alongside family events. Never miss a due date again.</p>

    <h3>📸 Photo Proof & Approval Workflows</h3>
    <p>Add accountability with photo verification. Great for teens who need that extra nudge!</p>

    <h3>🏷️ Custom Categories</h3>
    <p>Beyond our standard categories, create your own like "School Prep" or "Pet Care" to match your family's unique needs.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/help/advanced-features" class="cta-button">Explore Advanced Features</a>
    </div>

    <h2>📚 Resources for You</h2>

    <ul class="checklist">
      <li><strong><a href="{{appUrl}}/help" style="color: #667eea;">Help Center</a></strong> - Detailed guides and tutorials</li>
      <li><strong><a href="{{appUrl}}/help/videos" style="color: #667eea;">Video Tutorials</a></strong> - Watch how to use advanced features</li>
      <li><strong>Email Support</strong> - Reply to any email for help</li>
    </ul>

    <h2>📬 What's Next?</h2>

    <p>You'll now receive <strong>weekly family reports every Monday</strong> with insights, analytics, and tips to keep improving.</p>

    <p>You can also opt into:</p>
    <ul>
      <li>Streak risk alerts (when someone might lose their streak)</li>
      <li>Achievement celebrations (when badges are unlocked)</li>
      <li>Monthly tips and seasonal task ideas</li>
    </ul>

    <p><a href="{{appUrl}}/settings/email-preferences" style="color: #667eea; font-weight: bold;">Manage your email preferences →</a></p>

    {{#isFreeUser}}
    <div class="highlight-box">
      <h3>💙 Ready to Take Your Family to the Next Level?</h3>
      <p>You've built amazing momentum. Pro families take it even further:</p>

      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-number">40%</span>
          <span class="stat-label">Less family conflict</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">5hrs</span>
          <span class="stat-label">Saved per week</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">85%</span>
          <span class="stat-label">Task completion</span>
        </div>
      </div>

      <div class="quote-box">
        <strong>Child psychologist:</strong> "Structured family routines reduce stress and improve child development. Tools like ChorePulse make consistency achievable for busy families."
      </div>

      <p><strong>Pro Benefits:</strong></p>
      <ul class="checklist">
        <li>Unlimited tasks and family members</li>
        <li>Advanced analytics and insights</li>
        <li>Priority support</li>
        <li>Ad-free experience</li>
        <li>Calendar integrations</li>
        <li>Unlimited AI suggestions</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{appUrl}}/upgrade" class="cta-button">Build a Thriving Family</a>
      </div>

      <p style="text-align: center; font-size: 14px; color: #666;">Not ready yet? No problem! Keep using the free plan as long as you like.</p>
    </div>
    {{/isFreeUser}}

    <p>Thank you for being part of the ChorePulse community. Here's to your family's continued success! 💙</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/help">Help Center</a> •
      <a href="{{appUrl}}/settings">Settings</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// NON-OWNER USER SEQUENCE - EMAIL 1: WELCOME TO FAMILY
// ============================================

export const USER_WELCOME_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>👋 Welcome to {{familyName}}!</h1>
    <p>You're now part of the team on ChorePulse</p>
  </div>

  <div class="content">
    <p>Hi {{userName}},</p>

    <p>Great news! <strong>{{ownerName}}</strong> has added you to <strong>{{familyName}}</strong> on ChorePulse.</p>

    <div class="highlight-box">
      <h3>👤 Your Role: {{userRole}}</h3>
      <p>{{roleDescription}}</p>
    </div>

    <h2>🎯 How ChorePulse Works</h2>

    <ul class="checklist">
      <li><strong>Check your tasks daily</strong> - See what needs to be done</li>
      <li><strong>Complete tasks to earn points</strong> - Build your streak!</li>
      <li><strong>Track your progress</strong> - Watch your points and achievements grow</li>
      {{#isManagerOrParent}}
      <li><strong>Help manage the family</strong> - You have special permissions</li>
      {{/isManagerOrParent}}
    </ul>

    {{#isKidOrTeen}}
    <div class="highlight-box">
      <h3>🏆 Unlock Achievements!</h3>
      <p>Complete tasks to unlock badges and climb the leaderboard. Your family can see your progress!</p>
    </div>
    {{/isKidOrTeen}}

    {{#isManagerOrParent}}
    <h2>⚡ Your Admin Powers</h2>
    <p>As a {{userRole}}, you can:</p>
    <ul>
      <li>Approve completed tasks</li>
      <li>Create and edit tasks</li>
      <li>View family analytics</li>
      <li>Help keep everyone on track</li>
    </ul>
    {{/isManagerOrParent}}

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/tasks" class="cta-button">View Your Tasks</a>
    </div>

    <p>Let's build great habits together! 💙</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/help">Help Center</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// NON-OWNER USER SEQUENCE - EMAIL 2: FIRST TASK
// ============================================

export const USER_FIRST_TASK_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>🌟 Ready to Earn Points?</h1>
    <p>Complete your first task!</p>
  </div>

  <div class="content">
    <p>Hi {{userName}},</p>

    {{#hasIncompleteTasks}}
    <p>You have <strong>{{incompleteTaskCount}} task{{#plural}}s{{/plural}}</strong> waiting for you!</p>

    <h2>📋 Your Tasks This Week:</h2>
    {{#tasks}}
    <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea;">
      <strong>{{taskName}}</strong><br>
      <span style="color: #666; font-size: 14px;">
        {{taskCategory}} • {{taskPoints}} points • Due: {{dueTime}}
        {{#requiresPhoto}}📸 Photo required{{/requiresPhoto}}
      </span>
    </div>
    {{/tasks}}
    {{/hasIncompleteTasks}}

    {{#isKidOrTeen}}
    <div class="highlight-box">
      <h3>🎮 How to Complete a Task</h3>
      <ol style="margin: 10px 0; padding-left: 20px;">
        <li>Do the task</li>
        <li>{{#requiresPhoto}}Take a photo for proof{{/requiresPhoto}}{{^requiresPhoto}}Mark it complete{{/requiresPhoto}}</li>
        <li>Earn your points!</li>
        {{#requiresApproval}}<li>Wait for approval from a parent</li>{{/requiresApproval}}
      </ol>
    </div>

    <h2>🏆 Achievement Preview</h2>
    <p>Complete <strong>5 tasks</strong> to unlock your first badge! Can you do it this week?</p>

    {{#leaderboard}}
    <h3>📊 Current Leaderboard</h3>
    {{#members}}
    <div style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
      {{rank}}. <strong>{{name}}</strong> - {{points}} points
    </div>
    {{/members}}
    {{/leaderboard}}
    {{/isKidOrTeen}}

    {{#isManagerOrParent}}
    <h2>💡 Tips for Success</h2>
    <ul>
      <li>Set aside specific times for task completion</li>
      <li>Lead by example - complete your own tasks</li>
      <li>Check in with family members who need encouragement</li>
    </ul>
    {{/isManagerOrParent}}

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/tasks" class="cta-button">Complete a Task Now</a>
    </div>

    <p>You've got this!</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/tasks">Your Tasks</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// NON-OWNER USER SEQUENCE - EMAIL 3: PART OF THE TEAM
// ============================================

export const USER_TEAM_UPDATE_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>📈 See How {{familyName}} Is Doing!</h1>
    <p>Your contribution this week</p>
  </div>

  <div class="content">
    <p>Hi {{userName}},</p>

    <p>You've been part of {{familyName}} for a week now. Here's how the team is doing!</p>

    <h2>🌟 Your Contribution</h2>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{userTasksCompleted}}</span>
        <span class="stat-label">Tasks completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{userPoints}}</span>
        <span class="stat-label">Points earned</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{userStreak}}</span>
        <span class="stat-label">Day streak</span>
      </div>
    </div>

    {{#userAchievements}}
    <div class="highlight-box">
      <h3>🏆 Achievement Unlocked!</h3>
      <p>You earned: <strong>{{achievementName}}</strong></p>
    </div>
    {{/userAchievements}}

    <h2>👨‍👩‍👧‍👦 Family Progress</h2>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{familyTasksCompleted}}</span>
        <span class="stat-label">Family tasks done</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{familyCompletionRate}}%</span>
        <span class="stat-label">Completion rate</span>
      </div>
    </div>

    {{#leaderboard}}
    <h3>🏅 Family Leaderboard</h3>
    {{#members}}
    <div style="padding: 12px; margin: 8px 0; background: {{#isCurrentUser}}#e7f3ff{{/isCurrentUser}}{{^isCurrentUser}}#f8f9fa{{/isCurrentUser}}; border-radius: 8px; {{#isCurrentUser}}border: 2px solid #667eea;{{/isCurrentUser}}">
      {{rank}}. <strong>{{name}}</strong> - {{points}} points
      {{#isCurrentUser}}<span style="color: #667eea; font-weight: bold;"> ← That's you!</span>{{/isCurrentUser}}
    </div>
    {{/members}}
    {{/leaderboard}}

    <div class="highlight-box">
      <h3>💪 Keep It Going!</h3>
      <p>Together, {{familyName}} is building great habits. Every task you complete helps the whole family succeed!</p>
    </div>

    {{#upcomingTasks}}
    <h2>📅 Upcoming Tasks</h2>
    <p>You have <strong>{{upcomingCount}} task{{#plural}}s{{/plural}}</strong> due this week.</p>
    {{/upcomingTasks}}

    {{#isManagerOrParent}}
    <h2>⚡ Manager Tips</h2>
    <ul>
      <li><strong>Approve tasks promptly</strong> - It keeps motivation high</li>
      <li><strong>Check the analytics</strong> - Spot patterns and help strugglers</li>
      <li><strong>Celebrate wins</strong> - Recognition matters more than rewards</li>
    </ul>
    {{/isManagerOrParent}}

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/tasks" class="cta-button">Keep the Streak Going</a>
    </div>

    <p>You're doing great! Keep it up! 💙</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/tasks">Your Tasks</a> •
      <a href="{{appUrl}}/profile">Your Profile</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// RECURRING - WEEKLY FAMILY REPORT
// ============================================

export const WEEKLY_REPORT_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>📊 {{familyName}}'s Weekly Report</h1>
    <p>{{dateRange}}</p>
  </div>

  <div class="content">
    <p>Hi {{recipientName}},</p>

    <p>Here's how {{familyName}} did this week!</p>

    <h2>📈 Week at a Glance</h2>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{totalCompletions}}</span>
        <span class="stat-label">Tasks completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{completionRate}}%</span>
        <span class="stat-label">Completion rate</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{totalPoints}}</span>
        <span class="stat-label">Points earned</span>
      </div>
    </div>

    {{#improvements}}
    <div class="highlight-box">
      <h3>📈 Improvement Alert!</h3>
      <p>Your completion rate is up <strong>{{improvementPercent}}%</strong> from last week. Great progress!</p>
    </div>
    {{/improvements}}

    <h2>🌟 Individual Performance</h2>

    {{#topPerformer}}
    <div style="background: linear-gradient(135deg, #fff9e6 0%, #ffe6b3 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ffd700;">
      <h3 style="margin-top: 0;">🏆 Top Performer of the Week</h3>
      <p style="font-size: 18px; margin: 0;"><strong>{{name}}</strong> - {{tasks}} tasks • {{points}} points</p>
    </div>
    {{/topPerformer}}

    {{#mostImproved}}
    <div class="testimonial">
      <p class="testimonial-text">🚀 Most Improved: <strong>{{name}}</strong> increased completion rate by {{improvement}}%!</p>
    </div>
    {{/mostImproved}}

    {{#familyMembers}}
    <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <strong>{{name}}</strong><br>
      <span style="color: #666; font-size: 14px;">
        {{tasks}} tasks • {{points}} points • {{completionRate}}% completion • {{streak}}-day streak
      </span>
    </div>
    {{/familyMembers}}

    {{#pulseInsights}}
    <h2>💡 Pulse AI Insights</h2>

    {{#streakAlerts}}
    <div class="quote-box">
      <strong>⚠️ Streak Risk Alert</strong><br>
      {{alertMessage}}
    </div>
    {{/streakAlerts}}

    {{#fairnessInsight}}
    <div class="highlight-box">
      <h3>⚖️ Task Distribution</h3>
      <p>{{fairnessMessage}}</p>
      {{#suggestions}}
      <p style="font-size: 14px; color: #666;">💡 Suggestion: {{suggestion}}</p>
      {{/suggestions}}
    </div>
    {{/fairnessInsight}}

    {{#behaviorPattern}}
    <div class="highlight-box">
      <h3>⏰ Best Completion Times</h3>
      <p>{{patternMessage}}</p>
    </div>
    {{/behaviorPattern}}
    {{/pulseInsights}}

    <h2>📅 Upcoming Week</h2>
    <p>You have <strong>{{upcomingTasks}} tasks</strong> scheduled for this week.</p>

    {{#suggestedTasks}}
    <h3>💡 Pulse AI Suggestions</h3>
    <p>Based on your household, we suggest adding:</p>
    {{#tasks}}
    <div style="padding: 10px; margin: 8px 0; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #667eea;">
      <strong>{{name}}</strong> - {{description}}
    </div>
    {{/tasks}}
    {{/suggestedTasks}}

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/analytics" class="cta-button">View Full Analytics</a>
    </div>

    <p>Keep up the amazing work, {{familyName}}! 💙</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/analytics">Analytics</a> •
      <a href="{{appUrl}}/tasks">Tasks</a>
    </p>
    <p class="unsubscribe">
      These reports are sent every Monday at 9 AM.<br>
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// ============================================
// BILLING / TRANSACTIONAL EMAILS
// ============================================

export const TRIAL_RENEWAL_REMINDER_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>⏰ Your Trial Ends Tomorrow</h1>
    <p>Important billing information</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>This is a friendly reminder that your <strong>{{planName}} trial</strong> ends tomorrow, and your subscription will automatically renew.</p>

    <div class="highlight-box">
      <h3>📅 Billing Details</h3>
      <p><strong>Renewal Date:</strong> {{renewalDate}}<br>
      <strong>Plan:</strong> {{planName}}<br>
      <strong>Amount:</strong> {{amount}}<br>
      <strong>Payment Method:</strong> {{paymentMethod}}</p>
    </div>

    <h2>🎉 What You've Accomplished</h2>

    <p>During your trial, {{familyName}} has:</p>

    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{tasksCompleted}}</span>
        <span class="stat-label">Tasks completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{completionRate}}%</span>
        <span class="stat-label">Completion rate</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{longestStreak}}</span>
        <span class="stat-label">Longest streak</span>
      </div>
    </div>

    <p>That's real progress! Continuing your subscription means continuing this momentum.</p>

    <div class="quote-box">
      <strong>Research shows:</strong> Consistency is essential for lasting habit change. Families who maintain their routines see exponential growth in cooperation and reduced conflict over time.
    </div>

    <h2>💳 Need to Make Changes?</h2>

    <p>If you need to update your payment method or cancel your subscription, you can do so in your account settings.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/settings/billing" class="cta-button">Manage Subscription</a>
    </div>

    <p style="font-size: 14px; color: #666; text-align: center;">
      Questions? Reply to this email - we're here to help!
    </p>

    <p>Thank you for being part of the ChorePulse family!</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/settings/billing">Billing Settings</a> •
      <a href="mailto:support@chorepulse.com">Support</a>
    </p>
    <p class="unsubscribe">
      This is a transactional email about your billing.<br>
      You cannot unsubscribe from billing notifications.
    </p>
  </div>
`)

export const PAYMENT_CONFIRMATION_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>✅ Payment Confirmed</h1>
    <p>Thank you for your subscription!</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>Your payment has been processed successfully. Thank you for choosing ChorePulse {{planName}}!</p>

    <div class="highlight-box">
      <h3>💳 Payment Receipt</h3>
      <p><strong>Date:</strong> {{paymentDate}}<br>
      <strong>Plan:</strong> {{planName}}<br>
      <strong>Amount:</strong> {{amount}}<br>
      <strong>Payment Method:</strong> {{paymentMethod}}<br>
      <strong>Receipt Number:</strong> {{receiptNumber}}</p>
      <p style="margin-top: 15px;"><a href="{{receiptUrl}}" style="color: #667eea; font-weight: bold;">Download Full Receipt →</a></p>
    </div>

    <h2>🎉 Your Subscription is Active</h2>

    <p>You now have full access to all {{planName}} features:</p>

    <ul class="checklist">
      <li>Unlimited tasks and family members</li>
      <li>Advanced analytics and Pulse AI insights</li>
      <li>Priority support</li>
      <li>Ad-free experience</li>
      <li>Calendar integrations</li>
      <li>Unlimited AI-powered suggestions</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/dashboard" class="cta-button">Go to Dashboard</a>
    </div>

    <h2>📅 Next Billing Date</h2>
    <p>Your next payment of <strong>{{amount}}</strong> will be charged on <strong>{{nextBillingDate}}</strong>. You'll receive a reminder 24 hours before.</p>

    <p style="font-size: 14px; color: #666;">
      Need to update your payment method or cancel? Visit <a href="{{appUrl}}/settings/billing" style="color: #667eea;">Billing Settings</a>
    </p>

    <p>Thank you for investing in your family's wellbeing!</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/settings/billing">Billing Settings</a> •
      <a href="mailto:support@chorepulse.com">Support</a>
    </p>
    <p class="unsubscribe">
      This is a transactional email about your billing.<br>
      You cannot unsubscribe from billing notifications.
    </p>
  </div>
`)

export const POST_PAYMENT_ENCOURAGEMENT_TEMPLATE = wrapEmailTemplate(`
  <div class="header">
    <h1>🚀 You're All Set!</h1>
    <p>Let's make the most of your {{planName}} subscription</p>
  </div>

  <div class="content">
    <p>Hi {{parentName}},</p>

    <p>Welcome to {{planName}}! We're excited to support {{familyName}} on this journey to better habits and stronger relationships.</p>

    <div class="testimonial">
      <p class="testimonial-text">"Going Pro was the best decision for our family. The insights alone have saved us from countless arguments!"</p>
      <p class="testimonial-author">- Sarah M., {{planName}} member for 6 months</p>
    </div>

    <h2>🎯 Make the Most of Your Subscription</h2>

    <p>Here are 3 features that {{planName}} families love most:</p>

    <h3>1. 📊 Advanced Analytics</h3>
    <p>Check your <a href="{{appUrl}}/analytics" style="color: #667eea;">Analytics Dashboard</a> to see:</p>
    <ul>
      <li>Streak risk alerts (prevent lost momentum)</li>
      <li>Task distribution fairness (ensure balance)</li>
      <li>Behavior pattern insights (optimize timing)</li>
    </ul>

    <h3>2. 🤖 Unlimited Pulse AI Suggestions</h3>
    <p>Get personalized task recommendations based on your household every time you create a task. No more guessing what chores make sense for your family!</p>

    <h3>3. 📅 Calendar Integration</h3>
    <p>Sync with Google Calendar to see tasks alongside family events. <a href="{{appUrl}}/settings/integrations" style="color: #667eea;">Set it up now →</a></p>

    <div class="highlight-box">
      <h3>💡 Pro Tip</h3>
      <p>Check your weekly reports every Monday for actionable insights. Many {{planName}} families report this as their "secret weapon" for maintaining consistency.</p>
    </div>

    <h2>🎓 Resources for You</h2>

    <ul class="checklist">
      <li><a href="{{appUrl}}/help" style="color: #667eea;">Help Center</a> - Detailed guides for all features</li>
      <li><a href="{{appUrl}}/help/videos" style="color: #667eea;">Video Tutorials</a> - Watch and learn</li>
      <li><strong>Priority Support</strong> - Reply to any email for fast help</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{appUrl}}/analytics" class="cta-button">Explore Your Analytics</a>
    </div>

    <p>Here's to building a thriving family together! 💙</p>

    <p>Best regards,<br>
    <strong>The ChorePulse Team</strong></p>
  </div>

  <div class="footer">
    <p><strong>ChorePulse</strong> - Building Happier Families Through Better Habits</p>
    <p>
      <a href="{{appUrl}}">Dashboard</a> •
      <a href="{{appUrl}}/analytics">Analytics</a> •
      <a href="{{appUrl}}/help">Help Center</a>
    </p>
    <p class="unsubscribe">
      <a href="{{unsubscribeUrl}}">Update email preferences</a>
    </p>
  </div>
`)

// Export all templates
export const EMAIL_TEMPLATES = {
  // Owner sequence
  OWNER_WELCOME: OWNER_WELCOME_TEMPLATE,
  OWNER_TASK_TIPS: OWNER_TASK_TIPS_TEMPLATE,
  OWNER_SCIENCE_UPGRADE: OWNER_SCIENCE_UPGRADE_TEMPLATE,
  OWNER_FAMILY_REPORT: OWNER_FAMILY_REPORT_TEMPLATE,
  OWNER_MOMENTUM: OWNER_MOMENTUM_TEMPLATE,
  OWNER_GRADUATION: OWNER_GRADUATION_TEMPLATE,

  // Non-owner user sequence
  USER_WELCOME: USER_WELCOME_TEMPLATE,
  USER_FIRST_TASK: USER_FIRST_TASK_TEMPLATE,
  USER_TEAM_UPDATE: USER_TEAM_UPDATE_TEMPLATE,

  // Recurring emails
  WEEKLY_REPORT: WEEKLY_REPORT_TEMPLATE,

  // Billing / Transactional
  TRIAL_RENEWAL_REMINDER: TRIAL_RENEWAL_REMINDER_TEMPLATE,
  PAYMENT_CONFIRMATION: PAYMENT_CONFIRMATION_TEMPLATE,
  POST_PAYMENT_ENCOURAGEMENT: POST_PAYMENT_ENCOURAGEMENT_TEMPLATE,
}
