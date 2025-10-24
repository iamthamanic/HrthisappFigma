-- ============================================
-- CHECK: Aktueller Status von Team-Rollen
-- ============================================
-- Zeigt wer welche Rolle in welchem Team hat

-- 1. Alle User und ihre Global Roles
SELECT 
  '=== USERS & GLOBAL ROLES ===' as info,
  email,
  role as global_role,
  first_name,
  last_name
FROM users
ORDER BY role DESC, email;

-- 2. Alle Team-Mitgliedschaften
SELECT 
  '=== TEAM MEMBERSHIPS ===' as info,
  t.name as team_name,
  u.email as user_email,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
ORDER BY t.name, tm.role DESC, tm.priority_tag, u.email;

-- 3. Tina's Team-Mitgliedschaft
SELECT 
  '=== TINA TEST - TEAM INFO ===' as info,
  t.name as team_name,
  t.id as team_id,
  tm.role as tinas_team_role
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'social@halterverbot123.de';

-- 4. Anna's Team-Mitgliedschaft(en)
SELECT 
  '=== ANNA ADMIN - TEAM INFO ===' as info,
  t.name as team_name,
  t.id as team_id,
  tm.role as annas_team_role,
  tm.priority_tag
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'admin@halterverbot123.de'
ORDER BY tm.role DESC;

-- 5. Wer kann Tinas Anträge genehmigen?
SELECT 
  '=== WHO CAN APPROVE TINAS REQUESTS? ===' as info,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN u.role = 'SUPERADMIN' THEN '✅ Ja (SUPERADMIN)'
    WHEN u.role = 'HR' THEN '✅ Ja (HR)'
    WHEN u.role = 'ADMIN' AND tm.role = 'TEAMLEAD' THEN '✅ Ja (ADMIN + TEAMLEAD)'
    WHEN u.role = 'ADMIN' AND tm.role != 'TEAMLEAD' THEN '❌ Nein (ADMIN aber nicht TEAMLEAD)'
    ELSE '❌ Nein'
  END as can_approve
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
WHERE tm.team_id IN (
  SELECT team_id FROM team_members WHERE user_id = (
    SELECT id FROM users WHERE email = 'social@halterverbot123.de'
  )
)
OR u.role IN ('HR', 'SUPERADMIN')
ORDER BY 
  CASE u.role 
    WHEN 'SUPERADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'ADMIN' THEN 3
    ELSE 4
  END,
  CASE tm.role
    WHEN 'TEAMLEAD' THEN 1
    ELSE 2
  END;
