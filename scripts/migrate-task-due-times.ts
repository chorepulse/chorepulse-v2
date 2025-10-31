/**
 * One-time migration script to set due_time for all tasks that don't have one.
 * For tasks without a due_time, we'll set it to match their scheduled time.
 *
 * Run this script with: npx tsx scripts/migrate-task-due-times.ts
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
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateDueTimes() {
  console.log('🔄 Starting migration: Setting due_time for tasks without one...')

  try {
    // Fetch all tasks that don't have a due_time set
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, name, due_time, frequency, recurrence_pattern')
      .is('due_time', null)

    if (fetchError) {
      throw fetchError
    }

    if (!tasks || tasks.length === 0) {
      console.log('✅ No tasks found without due_time. Migration complete!')
      return
    }

    console.log(`📋 Found ${tasks.length} tasks without due_time`)

    let updated = 0
    let skipped = 0

    // For each task, set a default due_time
    for (const task of tasks) {
      // Default to end of day (11:59 PM) if no specific time can be determined
      const defaultDueTime = '23:59'

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ due_time: defaultDueTime })
        .eq('id', task.id)

      if (updateError) {
        console.error(`❌ Failed to update task "${task.name}" (${task.id}):`, updateError.message)
        skipped++
      } else {
        console.log(`✅ Updated task "${task.name}" (${task.id}) - due_time set to ${defaultDueTime}`)
        updated++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successfully updated: ${updated}`)
    console.log(`   ❌ Failed/Skipped: ${skipped}`)
    console.log(`   📝 Total tasks processed: ${tasks.length}`)
    console.log('\n✨ Migration complete!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
migrateDueTimes()
  .then(() => {
    console.log('\n👋 Exiting...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  })
