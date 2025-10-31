-- ============================================================================
-- CHAT SYSTEM - FINAL VERIFICATION
-- ============================================================================
-- Verify that all policies are correctly set up after complete migration
-- ============================================================================

-- ============================================================================
-- QUERY 1: COMPLETE POLICY COUNT (SHOULD BE 49 TOTAL)
-- ============================================================================

SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename LIKE 'browoko_%'
  AND (
    tablename LIKE '%conversation%' 
    OR tablename LIKE '%message%'
    OR tablename LIKE '%typing%'
    OR tablename = 'browoko_user_status'
    OR tablename = 'browoko_user_presence'
    OR tablename LIKE '%knowledge%'
    OR tablename = 'browoko_feedback'
    OR tablename = 'browoko_feedback_comments'
  )
GROUP BY tablename
ORDER BY tablename;

-- Expected Result:
-- browoko_conversation_members: 4 policies
-- browoko_conversations: 4 policies
-- browoko_feedback: 4 policies
-- browoko_feedback_comments: 4 policies ← NEW!
-- browoko_knowledge_articles: 4 policies
-- browoko_knowledge_categories: 4 policies
-- browoko_message_attachments: 3 policies
-- browoko_message_reactions: 3 policies
-- browoko_message_reads: 3 policies
-- browoko_messages: 4 policies
-- browoko_typing_indicators: 4 policies
-- browoko_user_presence: 4 policies ← NEW!
-- browoko_user_status: 4 policies
-- TOTAL: 49 policies ✅

-- ============================================================================
-- QUERY 2: CHECK NO OLD POLICIES REMAIN
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'browoko_%'
  AND (
    policyname LIKE 'Users can%'
    OR policyname LIKE 'Admins can%'
    OR policyname LIKE 'Authenticated users%'
    OR policyname LIKE 'Everyone can%'
    OR policyname LIKE 'Creators can%'
  )
ORDER BY tablename, policyname;

-- Expected: 0 ROWS (keine alten Policies mehr!)

-- ============================================================================
-- QUERY 3: VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================================================

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'browoko_%'
  AND (
    tablename LIKE '%conversation%' 
    OR tablename LIKE '%message%'
    OR tablename LIKE '%typing%'
    OR tablename LIKE '%user_%'
    OR tablename LIKE '%knowledge%'
    OR tablename = 'browoko_feedback'
    OR tablename = 'browoko_feedback_comments'
  )
ORDER BY tablename;

-- Expected: ALL tables should show "✅ RLS ENABLED"

-- ============================================================================
-- QUERY 4: CHECK SPECIFIC POLICY DETAILS FOR CRITICAL TABLES
-- ============================================================================

-- Check Messages Policies
SELECT 
  'MESSAGES' as table_group,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%auth.uid()%' THEN '✅ Uses auth.uid()'
    ELSE '⚠️ No auth check'
  END as auth_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'browoko_messages'
ORDER BY cmd, policyname;

-- Expected: All policies should show "✅ Uses auth.uid()"

-- ============================================================================
-- QUERY 5: VERIFY FEEDBACK_COMMENTS & USER_PRESENCE POLICIES
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('browoko_feedback_comments', 'browoko_user_presence')
ORDER BY tablename, cmd, policyname;

-- Expected for browoko_feedback_comments:
-- - feedback_comments_delete_own_or_admin (DELETE)
-- - feedback_comments_insert_authorized (INSERT)
-- - feedback_comments_select_own_or_admin (SELECT)
-- - feedback_comments_update_own (UPDATE)

-- Expected for browoko_user_presence:
-- - user_presence_delete_own (DELETE)
-- - user_presence_insert_own (INSERT)
-- - user_presence_select_all (SELECT)
-- - user_presence_update_own (UPDATE)

-- ============================================================================
-- SUMMARY QUERY: TOTAL POLICIES BY OPERATION TYPE
-- ============================================================================

SELECT 
  cmd as operation,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename LIKE 'browoko_%'
  AND (
    tablename LIKE '%conversation%' 
    OR tablename LIKE '%message%'
    OR tablename LIKE '%typing%'
    OR tablename LIKE '%user_%'
    OR tablename LIKE '%knowledge%'
    OR tablename = 'browoko_feedback'
    OR tablename = 'browoko_feedback_comments'
  )
GROUP BY cmd
ORDER BY cmd;

-- Expected:
-- DELETE: ~13 policies
-- INSERT: ~13 policies
-- SELECT: ~13 policies
-- UPDATE: ~10 policies
-- TOTAL: ~49 policies

-- ============================================================================
-- FINAL SUCCESS CHECK
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  old_policy_count INTEGER;
  rls_disabled_count INTEGER;
BEGIN
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' 
    AND tablename LIKE 'browoko_%'
    AND (
      tablename LIKE '%conversation%' 
      OR tablename LIKE '%message%'
      OR tablename LIKE '%typing%'
      OR tablename LIKE '%user_%'
      OR tablename LIKE '%knowledge%'
      OR tablename = 'browoko_feedback'
      OR tablename = 'browoko_feedback_comments'
    );

  -- Count old policies
  SELECT COUNT(*) INTO old_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename LIKE 'browoko_%'
    AND (
      policyname LIKE 'Users can%'
      OR policyname LIKE 'Admins can%'
    );

  -- Count tables with RLS disabled
  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename LIKE 'browoko_%'
    AND rowsecurity = false
    AND (
      tablename LIKE '%conversation%' 
      OR tablename LIKE '%message%'
      OR tablename LIKE '%user_%'
      OR tablename = 'browoko_feedback'
    );

  -- Output results
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CHAT SECURITY MIGRATION - FINAL STATUS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Policies: % (Expected: 49)', policy_count;
  RAISE NOTICE 'Old Policies Remaining: % (Expected: 0)', old_policy_count;
  RAISE NOTICE 'Tables with RLS Disabled: % (Expected: 0)', rls_disabled_count;
  RAISE NOTICE '========================================';
  
  IF policy_count >= 45 AND old_policy_count = 0 AND rls_disabled_count = 0 THEN
    RAISE NOTICE '✅ SUCCESS! Chat security is PRODUCTION-READY!';
  ELSE
    RAISE NOTICE '⚠️ WARNING! Please review the issues above.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
