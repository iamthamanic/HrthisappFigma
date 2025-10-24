-- ============================================
-- DEBUG: Warum kann Anna Tinas Antrag nicht genehmigen?
-- ============================================

-- 1️⃣ Zeige Annas Global Role
SELECT 
  '=== 1. ANNA ADMIN - GLOBAL ROLE ===' as info,
  email,
  role as global_role,
  first_name,
  last_name
FROM users
WHERE email = 'admin@halterverbot123.de';

-- 2️⃣ Zeige Annas Team-Mitgliedschaften
SELECT 
  '=== 2. ANNA ADMIN - TEAM MEMBERSHIPS ===' as info,
  t.name as team_name,
  t.id as team_id,
  tm.role as team_role,
  tm.priority_tag
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'admin@halterverbot123.de'
ORDER BY tm.role DESC, tm.priority_tag;

-- 3️⃣ Zeige Tinas Global Role
SELECT 
  '=== 3. TINA TEST - GLOBAL ROLE ===' as info,
  email,
  role as global_role,
  first_name,
  last_name
FROM users
WHERE email = 'social@halterverbot123.de';

-- 4️⃣ Zeige Tinas Team-Mitgliedschaften
SELECT 
  '=== 4. TINA TEST - TEAM MEMBERSHIPS ===' as info,
  t.name as team_name,
  t.id as team_id,
  tm.role as team_role
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'social@halterverbot123.de'
ORDER BY tm.role DESC;

-- 5️⃣ KRITISCH: Ist Anna TEAMLEAD in TINAS Team?
SELECT 
  '=== 5. IST ANNA TEAMLEAD IN TINAS TEAM? ===' as info,
  CASE 
    WHEN EXISTS (
      -- Finde Tinas Teams
      SELECT 1 FROM team_members tm_tina
      JOIN users u_tina ON u_tina.id = tm_tina.user_id
      WHERE u_tina.email = 'social@halterverbot123.de'
      AND EXISTS (
        -- Anna ist TEAMLEAD in diesem Team
        SELECT 1 FROM team_members tm_anna
        JOIN users u_anna ON u_anna.id = tm_anna.user_id
        WHERE u_anna.email = 'admin@halterverbot123.de'
        AND tm_anna.team_id = tm_tina.team_id
        AND tm_anna.role = 'TEAMLEAD'
      )
    ) THEN '✅ JA - Anna ist TEAMLEAD in Tinas Team'
    ELSE '❌ NEIN - Anna ist NICHT TEAMLEAD in Tinas Team!'
  END as result;

-- 6️⃣ Details: Welche Teams haben beide gemeinsam?
SELECT 
  '=== 6. GEMEINSAME TEAMS ===' as info,
  t.name as team_name,
  t.id as team_id,
  anna_tm.role as annas_role,
  anna_tm.priority_tag as annas_priority,
  tina_tm.role as tinas_role
FROM teams t
LEFT JOIN team_members anna_tm ON anna_tm.team_id = t.id 
  AND anna_tm.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
LEFT JOIN team_members tina_tm ON tina_tm.team_id = t.id 
  AND tina_tm.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
WHERE anna_tm.id IS NOT NULL OR tina_tm.id IS NOT NULL
ORDER BY t.name;

-- 7️⃣ Zeige TINAS aktuelle Leave Requests
SELECT 
  '=== 7. TINAS LEAVE REQUESTS ===' as info,
  lr.id,
  lr.start_date,
  lr.end_date,
  lr.leave_type,
  lr.status,
  lr.created_at
FROM leave_requests lr
WHERE lr.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
ORDER BY lr.created_at DESC
LIMIT 5;

-- 8️⃣ FINALE DIAGNOSE: Kann Anna genehmigen?
SELECT 
  '=== 8. DIAGNOSE: KANN ANNA TINAS ANTRAG GENEHMIGEN? ===' as info,
  CASE 
    -- Check 1: Anna ist SUPERADMIN
    WHEN (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') = 'SUPERADMIN' 
      THEN '✅ JA - Anna ist SUPERADMIN'
    
    -- Check 2: Anna ist HR
    WHEN (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') = 'HR' 
      THEN '✅ JA - Anna ist HR'
    
    -- Check 3: Anna ist ADMIN + TEAMLEAD in Tinas Team
    WHEN (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') = 'ADMIN' 
      AND EXISTS (
        SELECT 1 FROM team_members tm_tina
        JOIN users u_tina ON u_tina.id = tm_tina.user_id
        WHERE u_tina.email = 'social@halterverbot123.de'
        AND EXISTS (
          SELECT 1 FROM team_members tm_anna
          JOIN users u_anna ON u_anna.id = tm_anna.user_id
          WHERE u_anna.email = 'admin@halterverbot123.de'
          AND tm_anna.team_id = tm_tina.team_id
          AND tm_anna.role = 'TEAMLEAD'
        )
      )
      THEN '✅ JA - Anna ist ADMIN und TEAMLEAD in Tinas Team'
    
    -- Check 4: Tina ist HR oder SUPERADMIN (nur SUPERADMIN kann genehmigen)
    WHEN (SELECT role FROM users WHERE email = 'social@halterverbot123.de') IN ('HR', 'SUPERADMIN')
      THEN '❌ NEIN - Tina ist HR/SUPERADMIN, nur SUPERADMIN kann genehmigen'
    
    ELSE '❌ NEIN - Anna erfüllt keine Bedingungen!'
  END as diagnose,
  
  -- Details
  (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') as annas_global_role,
  (SELECT role FROM users WHERE email = 'social@halterverbot123.de') as tinas_global_role,
  
  -- Anna's Team-Rollen
  (SELECT string_agg(t.name || ' (' || tm.role || ')', ', ')
   FROM team_members tm 
   JOIN teams t ON t.id = tm.team_id
   WHERE tm.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
  ) as annas_teams,
  
  -- Tina's Team-Rollen
  (SELECT string_agg(t.name || ' (' || tm.role || ')', ', ')
   FROM team_members tm 
   JOIN teams t ON t.id = tm.team_id
   WHERE tm.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
  ) as tinas_teams;

-- 9️⃣ ALLE Teams und ihre Mitglieder (Übersicht)
SELECT 
  '=== 9. ALLE TEAMS - ÜBERSICHT ===' as info,
  t.name as team_name,
  u.email as member_email,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN users u ON u.id = tm.user_id
ORDER BY t.name, tm.role DESC, tm.priority_tag, u.email;
