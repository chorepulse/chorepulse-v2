import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read env file
const envFile = readFileSync('.env.local', 'utf-8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=')
  if (key && values.length) {
    envVars[key] = values.join('=').replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('Connecting to Supabase...')
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addColorColumn() {
  try {
    console.log('Checking if color column exists...')

    // Try to select color column
    const { data, error } = await supabase
      .from('users')
      .select('color')
      .limit(1)

    if (error && error.message.includes('column "color" does not exist')) {
      console.log('\nColumn does not exist. Please run this SQL in your Supabase dashboard:')
      console.log('\n---')
      console.log("ALTER TABLE public.users ADD COLUMN color TEXT DEFAULT '#FFA07A';")
      console.log('---\n')
      console.log('Go to: https://supabase.com/dashboard → Your Project → SQL Editor')
      process.exit(1)
    } else if (error) {
      console.error('Error checking column:', error)
      process.exit(1)
    } else {
      console.log('✅ Color column already exists!')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

addColorColumn()
