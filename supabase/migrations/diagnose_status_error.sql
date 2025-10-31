-- Diagnostic queries to find the status column issue

-- Check if rewards table exists and what columns it has
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('rewards', 'reward_redemptions', 'reward_templates', 'tasks', 'task_completions')
ORDER BY table_name, ordinal_position;

-- Check for any views or triggers that might reference 'status'
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE definition LIKE '%status%'
  AND schemaname = 'public';

-- Check for any existing constraints
SELECT
  con.conname AS constraint_name,
  rel.relname AS table_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname IN ('rewards', 'reward_redemptions', 'tasks', 'task_completions')
ORDER BY rel.relname;
