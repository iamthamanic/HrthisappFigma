-- ============================================================================
-- CHECK MISSING TABLES - FEEDBACK_COMMENTS & USER_PRESENCE
-- ============================================================================

-- Check 1: What policies exist on browoko_feedback_comments?
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN length(qual::text) > 150 THEN substring(qual::text, 1, 150) || '...'
    ELSE qual::text
  END as using_clause,
  CASE 
    WHEN length(with_check::text) > 150 THEN substring(with_check::text, 1, 150) || '...'
    ELSE with_check::text
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'browoko_feedback_comments'
ORDER BY cmd, policyname;

-- Check 2: What policies exist on browoko_user_presence?
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN length(qual::text) > 150 THEN substring(qual::text, 1, 150) || '...'
    ELSE qual::text
  END as using_clause,
  CASE 
    WHEN length(with_check::text) > 150 THEN substring(with_check::text, 1, 150) || '...'
    ELSE with_check::text
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'browoko_user_presence'
ORDER BY cmd, policyname;

-- Check 3: What columns do these tables have?
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('browoko_feedback_comments', 'browoko_user_presence')
ORDER BY table_name, ordinal_position;

-- Check 4: Are there any data in these tables?
SELECT 
  'browoko_feedback_comments' as table_name,
  COUNT(*) as row_count
FROM browoko_feedback_comments
UNION ALL
SELECT 
  'browoko_user_presence' as table_name,
  COUNT(*) as row_count
FROM browoko_user_presence;
