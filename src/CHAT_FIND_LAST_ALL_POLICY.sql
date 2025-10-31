-- ============================================================================
-- FIND THE LAST "FOR ALL" POLICY
-- ============================================================================
-- There is 1 policy with operation "ALL" that needs to be replaced
-- ============================================================================

-- Query 1: Find the table and policy name
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN length(qual::text) > 200 THEN substring(qual::text, 1, 200) || '...'
    ELSE qual::text
  END as using_clause,
  CASE 
    WHEN length(with_check::text) > 200 THEN substring(with_check::text, 1, 200) || '...'
    ELSE with_check::text
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename LIKE 'browoko_%'
  AND cmd = 'ALL' -- ← This is the problem!
ORDER BY tablename, policyname;

-- Expected: 1 row showing which table still has an "ALL" policy

-- ============================================================================
-- Once you find it, we'll replace it with granular policies
-- ============================================================================
