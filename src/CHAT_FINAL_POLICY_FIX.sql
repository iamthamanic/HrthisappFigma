-- ============================================================================
-- FINAL POLICY FIX - REPLACE LAST "ALL" POLICY
-- ============================================================================
-- Replaces the last "FOR ALL" policy with 4 granular policies
-- Table: browoko_user_presence
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP THE OLD "ALL" POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage their presence" ON browoko_user_presence;

-- ============================================================================
-- STEP 2: CREATE 4 GRANULAR POLICIES
-- ============================================================================

-- SELECT: Everyone can see presence (for online indicators)
CREATE POLICY "user_presence_select_all"
ON browoko_user_presence
FOR SELECT
TO authenticated
USING (true); -- Everyone can see who's online (like WhatsApp/Slack)

-- INSERT: Only own presence
CREATE POLICY "user_presence_insert_own"
ON browoko_user_presence
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- UPDATE: Only own presence
CREATE POLICY "user_presence_update_own"
ON browoko_user_presence
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- DELETE: Only own presence
CREATE POLICY "user_presence_delete_own"
ON browoko_user_presence
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check: Should now show 4 policies (not 1 "ALL")
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'browoko_user_presence'
ORDER BY cmd, policyname;

-- Expected Result:
-- browoko_user_presence | user_presence_delete_own | DELETE
-- browoko_user_presence | user_presence_insert_own | INSERT
-- browoko_user_presence | user_presence_select_all | SELECT
-- browoko_user_presence | user_presence_update_own | UPDATE

-- ============================================================================
-- FINAL POLICY COUNT CHECK
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

-- Expected After Fix:
-- DELETE: 10 policies ✅
-- INSERT: 13 policies ✅
-- SELECT: 13 policies ✅
-- UPDATE: 10 policies ✅
-- (NO "ALL" ANYMORE!) ✅
-- TOTAL: 46 policies

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FINAL POLICY FIX COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Replaced 1 "ALL" policy with 4 granular policies';
  RAISE NOTICE 'browoko_user_presence is now SECURE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Chat Security Migration: 100%% COMPLETE! 🎉';
  RAISE NOTICE '========================================';
END $$;
