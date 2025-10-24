-- =====================================================
-- STEP 2: Anna als PRIMARY Teamlead zu "Büro 2" hinzufügen
-- =====================================================

-- Check: Welche Teams gibt es?
SELECT 
  '=== ALLE TEAMS ===' as info,
  id,
  name,
  created_at
FROM teams
ORDER BY name;

-- Check: Welche ADMINs gibt es?
SELECT 
  '=== ALLE ADMINs ===' as info,
  id,
  email,
  CONCAT(first_name, ' ', last_name) as full_name,
  role
FROM users
WHERE role = 'ADMIN'
ORDER BY email;

-- WICHTIG: Welches Team heißt "Büro 2"? Checke den EXAKTEN Namen!
-- Mögliche Varianten: "Büro 2", "Buero 2", "Büro 2 ", "Team Büro 2"

-- =====================================================
-- OPTION 1: Falls Team "Büro 2" heißt
-- =====================================================

-- Anna zu "Büro 2" hinzufügen
INSERT INTO team_members (team_id, user_id, role, priority_tag)
SELECT 
  t.id,
  u.id,
  'TEAMLEAD',
  'PRIMARY'
FROM teams t
CROSS JOIN users u
WHERE t.name = 'Büro 2'  -- 🔧 Exakter Team-Name
AND u.email = 'admin@halterverbot123.de'  -- 🔧 Anna's E-Mail
ON CONFLICT (team_id, user_id) DO UPDATE
SET role = 'TEAMLEAD',
    priority_tag = 'PRIMARY';

-- =====================================================
-- OPTION 2: Falls du den Team-Namen nicht kennst
-- =====================================================
-- Nutze die Team-ID aus der ersten Query oben!
-- Ersetze 'TEAM_ID_HIER' mit der UUID aus der Query

-- INSERT INTO team_members (team_id, user_id, role, priority_tag)
-- SELECT 
--   'TEAM_ID_HIER'::uuid,  -- 🔧 Team-ID einsetzen
--   u.id,
--   'TEAMLEAD',
--   'PRIMARY'
-- FROM users u
-- WHERE u.email = 'admin@halterverbot123.de'
-- ON CONFLICT (team_id, user_id) DO UPDATE
-- SET role = 'TEAMLEAD',
--     priority_tag = 'PRIMARY';

-- =====================================================
-- VERIFICATION: Zeige Anna's Team-Mitgliedschaften
-- =====================================================

SELECT 
  '=== ANNA''S TEAMS (NACH HINZUFÜGEN) ===' as info,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.role = 'TEAMLEAD' AND tm.priority_tag = 'PRIMARY' THEN '✅ PRIMARY Teamlead'
    WHEN tm.role = 'TEAMLEAD' AND tm.priority_tag = 'BACKUP' THEN '🔄 BACKUP Teamlead'
    WHEN tm.role = 'TEAMLEAD' THEN '👑 Teamlead (ohne Tag)'
    ELSE '👤 ' || tm.role
  END as status
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'admin@halterverbot123.de'
ORDER BY t.name;

-- =====================================================
-- VERIFICATION: Zeige "Büro 2" Team-Mitglieder
-- =====================================================

SELECT 
  '=== TEAM "BÜRO 2" MITGLIEDER ===' as info,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  COALESCE(tm.priority_tag, 'NO TAG') as priority_tag
FROM team_members tm
JOIN users u ON u.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
WHERE t.name = 'Büro 2'  -- 🔧 Exakter Team-Name
ORDER BY 
  CASE tm.priority_tag 
    WHEN 'PRIMARY' THEN 1 
    WHEN 'BACKUP' THEN 2 
    WHEN 'BACKUP_BACKUP' THEN 3 
    ELSE 4 
  END,
  u.first_name;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- Team "Büro 2" sollte haben:
-- ✅ Anna Admin (ADMIN) - TEAMLEAD - PRIMARY
-- ✅ Maria HR (HR) - TEAMLEAD - BACKUP (automatisch)
-- ✅ Stefan Super (SUPERADMIN) - TEAMLEAD - BACKUP_BACKUP (automatisch)
-- ✅ Tina Test (USER) - MEMBER - (normal)
-- =====================================================
