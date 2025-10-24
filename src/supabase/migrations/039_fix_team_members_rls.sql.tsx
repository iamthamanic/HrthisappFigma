-- =====================================================
-- FIX: Team Members RLS Policies
-- =====================================================
-- This fixes the "new row violates row-level security policy" error
-- when creating teams and adding team members
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON team_members;
DROP POLICY IF EXISTS "Enable insert for admins and team leads" ON team_members;
DROP POLICY IF EXISTS "Enable update for admins and team leads" ON team_members;
DROP POLICY IF EXISTS "Enable delete for admins and team leads" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Admins can manage all team memberships" ON team_members;

-- Enable RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Everyone can view team memberships
CREATE POLICY "team_members_select_policy" ON team_members
  FOR SELECT
  USING (true);

-- Policy 2: INSERT - HR, ADMIN, SUPERADMIN, and TEAMLEAD can add team members
CREATE POLICY "team_members_insert_policy" ON team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  );

-- Policy 3: UPDATE - HR, ADMIN, SUPERADMIN, and TEAMLEAD can update team members
CREATE POLICY "team_members_update_policy" ON team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  );

-- Policy 4: DELETE - HR, ADMIN, SUPERADMIN, and TEAMLEAD can remove team members
CREATE POLICY "team_members_delete_policy" ON team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  );

-- =====================================================
-- Also check teams table RLS policies
-- =====================================================

-- Drop existing team policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON teams;
DROP POLICY IF EXISTS "Enable insert for admins and team leads" ON teams;
DROP POLICY IF EXISTS "Enable update for admins and team leads" ON teams;
DROP POLICY IF EXISTS "Enable delete for admins and team leads" ON teams;
DROP POLICY IF EXISTS "Users can view all teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

-- Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Everyone can view teams
CREATE POLICY "teams_select_policy" ON teams
  FOR SELECT
  USING (true);

-- Policy 2: INSERT - HR, ADMIN, SUPERADMIN, and TEAMLEAD can create teams
CREATE POLICY "teams_insert_policy" ON teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  );

-- Policy 3: UPDATE - HR, ADMIN, SUPERADMIN, and TEAMLEAD can update teams
CREATE POLICY "teams_update_policy" ON teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  );

-- Policy 4: DELETE - HR, ADMIN, SUPERADMIN, and TEAMLEAD can delete teams
CREATE POLICY "teams_delete_policy" ON teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HR', 'ADMIN', 'SUPERADMIN', 'TEAMLEAD')
    )
  );

-- =====================================================
-- DONE! Now you can:
-- 1. Create teams without RLS errors
-- 2. Add team members with roles
-- 3. Update and delete team memberships
-- =====================================================

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('teams', 'team_members')
ORDER BY tablename, policyname;
