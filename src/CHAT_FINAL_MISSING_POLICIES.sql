-- ============================================================================
-- BROWO KOORDINATOR - MISSING CHAT POLICIES
-- ============================================================================
-- Adds secure policies for 2 tables that were missed in the main migration:
-- - browoko_feedback_comments
-- - browoko_user_presence
-- ============================================================================

-- ============================================================================
-- OPTION 1: IF YOU WANT TO SECURE THESE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FEEDBACK_COMMENTS - Comments on Feedback (Like Ticket System)
-- ----------------------------------------------------------------------------

-- Assuming structure:
-- - id (uuid)
-- - feedback_id (uuid) → FK to browoko_feedback
-- - user_id (uuid) → Comment author
-- - content (text)
-- - created_at (timestamp)

-- SELECT: User can see comments on their own feedback OR if they are HR/SUPERADMIN
CREATE POLICY "feedback_comments_select_own_or_admin"
ON browoko_feedback_comments
FOR SELECT
TO authenticated
USING (
  -- Can see comments on own feedback
  EXISTS (
    SELECT 1 
    FROM browoko_feedback f
    WHERE f.id = feedback_id
      AND (
        f.submitted_by = auth.uid() -- Own feedback
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
            AND role IN ('HR', 'SUPERADMIN')
        )
      )
  )
);

-- INSERT: HR/SUPERADMIN can comment on any feedback, users can comment on their own
CREATE POLICY "feedback_comments_insert_authorized"
ON browoko_feedback_comments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() -- Author is me
  AND EXISTS (
    SELECT 1 
    FROM browoko_feedback f
    WHERE f.id = feedback_id
      AND (
        f.submitted_by = auth.uid() -- Own feedback
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
            AND role IN ('HR', 'SUPERADMIN')
        )
      )
  )
);

-- UPDATE: Only own comments (within reasonable time)
CREATE POLICY "feedback_comments_update_own"
ON browoko_feedback_comments
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '1 hour' -- Edit timeout
);

-- DELETE: Only own comments or HR/SUPERADMIN
CREATE POLICY "feedback_comments_delete_own_or_admin"
ON browoko_feedback_comments
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN ('HR', 'SUPERADMIN')
  )
);

-- ----------------------------------------------------------------------------
-- USER_PRESENCE - Realtime Presence (Like "Anna is viewing Chat")
-- ----------------------------------------------------------------------------

-- Assuming structure:
-- - id (uuid)
-- - user_id (uuid)
-- - status (text) → e.g. "ONLINE", "AWAY", "VIEWING_CHAT"
-- - last_seen (timestamp)
-- - metadata (jsonb) → e.g. { "page": "/chat", "conversation_id": "..." }

-- SELECT: Everyone can see presence (for online indicators)
CREATE POLICY "user_presence_select_all"
ON browoko_user_presence
FOR SELECT
TO authenticated
USING (true); -- Everyone can see who's online

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
-- OPTION 2: IF THESE TABLES ARE UNUSED/LEGACY
-- ============================================================================

-- If you're not using these tables at all, you can drop the old policies
-- and disable RLS to avoid overhead:

/*
-- Drop existing policies
DO $$ 
DECLARE r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('browoko_feedback_comments', 'browoko_user_presence')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON browoko_%s', 
      r.policyname, 
      CASE 
        WHEN r.tablename LIKE '%feedback_comments%' THEN 'feedback_comments'
        ELSE 'user_presence'
      END
    );
  END LOOP;
END $$;

-- Disable RLS (only if tables are completely unused!)
ALTER TABLE browoko_feedback_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE browoko_user_presence DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check final policy count (should be 4 per table)
/*
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('browoko_feedback_comments', 'browoko_user_presence')
GROUP BY tablename
ORDER BY tablename;
*/

-- Expected after running OPTION 1:
-- browoko_feedback_comments: 4 policies
-- browoko_user_presence: 4 policies

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- OPTION 1: Run the CREATE POLICY statements above (adds 8 secure policies)
-- OPTION 2: If tables unused, drop policies and disable RLS
-- ============================================================================
