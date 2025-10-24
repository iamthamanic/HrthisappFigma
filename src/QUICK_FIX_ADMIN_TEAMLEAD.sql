-- =====================================================
-- QUICK FIX: Add ADMIN users as TEAMLEAD to all teams
-- =====================================================
-- Problem: Anna Admin kann Urlaubsanträge nicht genehmigen,
-- weil ADMIN-Rolle nicht automatisch als TEAMLEAD hinzugefügt wurde.
--
-- Lösung: Füge alle ADMIN-Benutzer als TEAMLEAD zu allen Teams hinzu
-- =====================================================

-- Step 1: Add ADMIN to all existing teams as TEAMLEAD
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role
FROM teams t
CROSS JOIN users u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (
  -- Don't add if already a member
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.user_id = u.id
);

-- Step 2: Update existing ADMIN team members to TEAMLEAD role
UPDATE team_members tm
SET role = 'TEAMLEAD'
FROM users u
WHERE tm.user_id = u.id
AND u.role = 'ADMIN'
AND tm.role != 'TEAMLEAD';

-- Verify: Show all ADMIN users and their team memberships
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  u.role as global_role,
  t.name as team_name,
  tm.role as team_role
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE u.role = 'ADMIN'
ORDER BY u.first_name, u.last_name, t.name;

-- =====================================================
-- FERTIG! Anna Admin sollte jetzt:
-- ✅ Als TEAMLEAD in allen Teams sein
-- ✅ Urlaubsanträge von Tina Test genehmigen können
-- ✅ Als "Zuständig" bei Tina's Anträgen angezeigt werden
-- =====================================================
