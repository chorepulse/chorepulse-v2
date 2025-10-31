const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addColorColumn() {
  try {
    console.log('Adding color column to users table...')

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE public.users ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#FFA07A';"
    })

    if (error) {
      console.error('Error adding column:', error)
      // Try alternative approach - direct query
      const { error: error2 } = await supabase
        .from('users')
        .select('color')
        .limit(1)

      if (error2 && error2.message.includes('column "color" does not exist')) {
        console.log('Column does not exist yet, this is expected.')
        console.log('Please run the migration manually in your Supabase dashboard:')
        console.log("ALTER TABLE public.users ADD COLUMN color TEXT DEFAULT '#FFA07A';")
      } else {
        console.log('Color column already exists or was added successfully!')
      }
    } else {
      console.log('Success! Color column added.')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

addColorColumn()
