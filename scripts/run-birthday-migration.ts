/**
 * Migration Script: Add Birthday and Parental Consent Fields
 * Run this script to apply the birthday migration to the database
 *
 * Run with: npx tsx scripts/run-birthday-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load environment variables from .env.local
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const envFile = readFileSync(envPath, 'utf-8')

  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+?)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (error) {
  console.warn('Could not load .env.local file')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Starting birthday migration...\n')

  try {
    // Read the migration file
    const migrationPath = resolve(process.cwd(), 'supabase', 'migrations', '018_add_birthday_and_consent.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded successfully')
    console.log('\n📝 This migration will:')
    console.log('  • Add birthday field to users table')
    console.log('  • Add parent_consent_given_at field to users table')
    console.log('  • Create get_user_age() function')
    console.log('  • Create get_age_bracket() function')
    console.log('  • Add indexes and permissions\n')

    console.log('⚠️  IMPORTANT: This script cannot execute raw SQL directly.')
    console.log('   You need to run this migration manually via Supabase SQL Editor.\n')

    console.log('📋 Steps to run the migration:')
    console.log('  1. Go to your Supabase project dashboard')
    console.log('  2. Navigate to SQL Editor')
    console.log('  3. Copy and paste the SQL below')
    console.log('  4. Click "Run" to execute\n')

    console.log('━'.repeat(80))
    console.log(migrationSQL)
    console.log('━'.repeat(80))
    console.log('\n✅ Once you run the SQL above, the migration will be complete!\n')

    console.log('Next steps after migration:')
    console.log('  1. Test the new birthday field in the add member form')
    console.log('  2. Verify parental consent checkbox appears for users under 13')
    console.log('  3. Check that age bracket is calculated correctly')
    console.log('  4. Monitor ad targeting improvements in AdSense\n')

  } catch (error: any) {
    console.error('\n❌ Error reading migration file:', error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('👋 Script complete. Please run the SQL in Supabase dashboard.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  })
