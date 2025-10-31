const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read .env.local file
const envFile = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) envVars[key.trim()] = value.trim()
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkCompletions() {
  console.log('🔍 Checking task_completions table...\n')

  const { data, error, count } = await supabase
    .from('task_completions')
    .select('*', { count: 'exact' })
    .order('completed_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📊 Total completions in database: ${count}`)
  console.log(`\n✅ Last 10 completions:`)
  console.table(data)

  // Check users table for points
  const { data: users } = await supabase
    .from('users')
    .select('id, name, points')

  console.log(`\n👥 Users and their points:`)
  console.table(users)
}

checkCompletions()
