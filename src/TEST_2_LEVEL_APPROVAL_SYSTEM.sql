-- ============================================
-- TEST: 2-Level Approval System
-- ============================================
-- Testet ob das neue System korrekt funktioniert

-- 1️⃣ Zeige alle User mit ihren Global Roles
SELECT 
  '=== 1. ALLE USERS - GLOBAL ROLES ===' as info,
  email,
  role as global_role,
  first_name,
  last_name
FROM users
ORDER BY 
  CASE role 
    WHEN 'SUPERADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'ADMIN' THEN 3
    WHEN 'USER' THEN 4
  END,
  email;

-- 2️⃣ Zeige alle Teams mit allen TEAMLEADs
SELECT 
  '=== 2. ALLE TEAMS + TEAMLEADS ===' as info,
  t.name as team_name,
  u.email as teamlead_email,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag,
  CASE tm.priority_tag
    WHEN 'PRIMARY' THEN '🥇 Primary'
    WHEN 'BACKUP' THEN '🥈 Backup'
    WHEN 'BACKUP_BACKUP' THEN '🥉 Backup-Backup'
    ELSE '⚪ No Tag'
  END as priority_display
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.role = 'TEAMLEAD'
LEFT JOIN users u ON u.id = tm.user_id
ORDER BY t.name, 
  CASE tm.priority_tag
    WHEN 'PRIMARY' THEN 1
    WHEN 'BACKUP' THEN 2
    WHEN 'BACKUP_BACKUP' THEN 3
    ELSE 4
  END;

-- 3️⃣ Check: Wer kann wessen Antrag genehmigen?
SELECT 
  '=== 3. APPROVAL MATRIX ===' as info,
  requester.email as requester,
  requester.role as requester_global_role,
  approver.email as approver,
  approver.role as approver_global_role,
  CASE 
    -- Check 1: Approver muss Admin-Rolle haben
    WHEN approver.role = 'USER' THEN '❌ Nein (Approver ist USER)'
    
    -- Check 2: Requester ist HR/SUPERADMIN → nur SUPERADMIN kann genehmigen
    WHEN requester.role IN ('HR', 'SUPERADMIN') AND approver.role != 'SUPERADMIN' 
      THEN '❌ Nein (Requester ist HR/SUPERADMIN, Approver nicht SUPERADMIN)'
    
    -- Check 3: Approver muss TEAMLEAD in Requesters Team sein
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members tm_req
      JOIN team_members tm_app ON tm_app.team_id = tm_req.team_id
      WHERE tm_req.user_id = requester.id
        AND tm_app.user_id = approver.id
        AND tm_app.role = 'TEAMLEAD'
    ) THEN '❌ Nein (Approver ist nicht TEAMLEAD in Requesters Team)'
    
    -- Alle Checks bestanden
    ELSE '✅ Ja'
  END as can_approve,
  
  -- Zeige gemeinsame Teams
  (
    SELECT string_agg(t.name, ', ')
    FROM team_members tm_req
    JOIN team_members tm_app ON tm_app.team_id = tm_req.team_id AND tm_app.role = 'TEAMLEAD'
    JOIN teams t ON t.id = tm_req.team_id
    WHERE tm_req.user_id = requester.id
      AND tm_app.user_id = approver.id
  ) as shared_teams
FROM users requester
CROSS JOIN users approver
WHERE requester.id != approver.id
  AND requester.email IN ('social@halterverbot123.de', 'content@halterverbot123.de') -- Beispiel-User
ORDER BY requester.email, approver.email;

-- 4️⃣ Zeige fehlende Team-Zuweisungen
SELECT 
  '=== 4. FEHLENDE TEAMLEAD-ZUWEISUNGEN ===' as info,
  t.name as team_name,
  t.id as team_id,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = t.id 
        AND tm.role = 'TEAMLEAD'
        AND u.role = 'SUPERADMIN'
    ) THEN '❌ Kein SUPERADMIN als TEAMLEAD'
    ELSE '✅ SUPERADMIN vorhanden'
  END as superadmin_check,
  
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = t.id 
        AND tm.role = 'TEAMLEAD'
        AND u.role = 'HR'
    ) THEN '❌ Kein HR als TEAMLEAD'
    ELSE '✅ HR vorhanden'
  END as hr_check,
  
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = t.id 
        AND tm.role = 'TEAMLEAD'
    ) THEN '❌ ÜBERHAUPT KEIN TEAMLEAD!'
    ELSE '✅ Hat TEAMLEADs'
  END as has_any_teamlead
FROM teams t
ORDER BY t.name;

-- 5️⃣ Fix für fehlende Zuweisungen (KOPIEREN & AUSFÜHREN FALLS 4️⃣ Fehler zeigt)
/*
INSERT INTO team_members (team_id, user_id, role, priority_tag)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role,
  CASE 
    WHEN u.role = 'SUPERADMIN' THEN 'BACKUP_BACKUP'
    WHEN u.role = 'HR' THEN 'BACKUP'
    WHEN u.role = 'ADMIN' THEN 'PRIMARY'
  END as priority_tag
FROM teams t
CROSS JOIN users u
WHERE u.role IN ('ADMIN', 'HR', 'SUPERADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = t.id 
      AND tm.user_id = u.id
  )
ON CONFLICT (team_id, user_id) 
DO UPDATE SET 
  role = EXCLUDED.role,
  priority_tag = EXCLUDED.priority_tag;
*/

-- 6️⃣ Spezifischer Test: Anna & Tina
SELECT 
  '=== 6. ANNA & TINA TEST ===' as info,
  CASE 
    -- Anna muss ADMIN sein
    WHEN (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') != 'ADMIN' 
      THEN '❌ Anna ist nicht ADMIN'
    
    -- Anna muss TEAMLEAD in Tinas Team sein
    WHEN NOT EXISTS (
      SELECT 1 
      FROM team_members tm_tina
      JOIN team_members tm_anna ON tm_anna.team_id = tm_tina.team_id AND tm_anna.role = 'TEAMLEAD'
      WHERE tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
        AND tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
    ) THEN '❌ Anna ist nicht TEAMLEAD in Tinas Team'
    
    ELSE '✅ Anna kann Tinas Antrag genehmigen!'
  END as result,
  
  -- Details
  (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') as annas_global_role,
  (SELECT role FROM users WHERE email = 'social@halterverbot123.de') as tinas_global_role,
  
  (
    SELECT string_agg(t.name || ' (' || tm.role || ', ' || tm.priority_tag || ')', ', ')
    FROM team_members tm 
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
  ) as annas_teams,
  
  (
    SELECT string_agg(t.name || ' (' || tm.role || ')', ', ')
    FROM team_members tm 
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
  ) as tinas_teams;

-- 7️⃣ Summary: System Health Check
SELECT 
  '=== 7. SYSTEM HEALTH CHECK ===' as info,
  
  -- Count: Wie viele Admins gibt es?
  (SELECT COUNT(*) FROM users WHERE role IN ('ADMIN', 'HR', 'SUPERADMIN')) as total_admins,
  
  -- Count: Wie viele Teams haben mindestens einen TEAMLEAD?
  (SELECT COUNT(DISTINCT team_id) FROM team_members WHERE role = 'TEAMLEAD') as teams_with_teamlead,
  
  -- Count: Wie viele Teams gibt es insgesamt?
  (SELECT COUNT(*) FROM teams) as total_teams,
  
  -- Count: Wie viele Teams haben KEINEN TEAMLEAD?
  (SELECT COUNT(*) FROM teams t 
   WHERE NOT EXISTS (
     SELECT 1 FROM team_members tm 
     WHERE tm.team_id = t.id AND tm.role = 'TEAMLEAD'
   )
  ) as teams_without_teamlead,
  
  -- Gesundheitsstatus
  CASE 
    WHEN (SELECT COUNT(*) FROM teams t 
          WHERE NOT EXISTS (
            SELECT 1 FROM team_members tm 
            WHERE tm.team_id = t.id AND tm.role = 'TEAMLEAD'
          )
         ) = 0 
      THEN '✅ SYSTEM HEALTHY - Alle Teams haben TEAMLEADs'
    ELSE '⚠️ WARNING - Einige Teams haben keine TEAMLEADs!'
  END as health_status;
