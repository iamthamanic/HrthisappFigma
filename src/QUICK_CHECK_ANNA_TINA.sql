-- ============================================
-- QUICK CHECK: Kann Anna Tinas Antrag genehmigen?
-- ============================================

-- 1️⃣ ANNA & TINA - Basis Info
SELECT 
  '=== 1. ANNA & TINA - BASIC INFO ===' as section,
  NULL as person, NULL as email, NULL as global_role, NULL as team_name, NULL as team_role, NULL as priority_tag
UNION ALL
SELECT 
  NULL as section,
  'ANNA ADMIN' as person,
  u.email,
  u.role as global_role,
  COALESCE(t.name, '❌ KEIN TEAM') as team_name,
  COALESCE(tm.role, '❌ KEINE ROLLE') as team_role,
  COALESCE(tm.priority_tag, '-') as priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email = 'admin@halterverbot123.de'

UNION ALL

SELECT 
  NULL as section,
  'TINA TEST' as person,
  u.email,
  u.role as global_role,
  COALESCE(t.name, '❌ KEIN TEAM') as team_name,
  COALESCE(tm.role, '❌ KEINE ROLLE') as team_role,
  COALESCE(tm.priority_tag, '-') as priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email = 'social@halterverbot123.de';

-- 2️⃣ ENTSCHEIDUNG: Kann Anna genehmigen?
SELECT 
  '=== 2. KANN ANNA TINAS ANTRAG GENEHMIGEN? ===' as question,
  CASE 
    -- Check 1: Anna muss ADMIN/HR/SUPERADMIN sein
    WHEN (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') NOT IN ('ADMIN', 'HR', 'SUPERADMIN')
      THEN '❌ NEIN - Anna hat keine Admin-Rolle'
    
    -- Check 2: Tina muss in einem Team sein
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
    ) THEN '❌ NEIN - Tina ist in keinem Team'
    
    -- Check 3: Anna muss TEAMLEAD in Tinas Team sein
    WHEN NOT EXISTS (
      SELECT 1 
      FROM team_members tm_tina
      JOIN team_members tm_anna ON tm_anna.team_id = tm_tina.team_id AND tm_anna.role = 'TEAMLEAD'
      WHERE tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
        AND tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
    ) THEN '❌ NEIN - Anna ist NICHT TEAMLEAD in Tinas Team'
    
    ELSE '✅ JA - Anna kann Tinas Antrag genehmigen!'
  END as answer,
  
  -- Details zur Diagnose
  (SELECT role FROM users WHERE email = 'admin@halterverbot123.de') as annas_global_role,
  
  (SELECT string_agg(t.name || ' (' || tm.role || COALESCE(', ' || tm.priority_tag, '') || ')', ', ')
   FROM team_members tm 
   JOIN teams t ON t.id = tm.team_id
   WHERE tm.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
  ) as annas_teams,
  
  (SELECT string_agg(t.name || ' (' || tm.role || ')', ', ')
   FROM team_members tm 
   JOIN teams t ON t.id = tm.team_id
   WHERE tm.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
  ) as tinas_teams;

-- 3️⃣ SIND SIE IM GLEICHEN TEAM?
SELECT 
  '=== 3. GEMEINSAME TEAMS ===' as section,
  t.name as team_name,
  t.id as team_id,
  anna_tm.role as annas_role,
  anna_tm.priority_tag as annas_priority,
  tina_tm.role as tinas_role,
  CASE 
    WHEN anna_tm.role = 'TEAMLEAD' AND tina_tm.role IS NOT NULL 
      THEN '✅ Anna ist TEAMLEAD, Tina ist Member'
    WHEN anna_tm.role IS NOT NULL AND tina_tm.role IS NOT NULL 
      THEN '⚠️ Beide im Team, aber Anna ist NICHT TEAMLEAD'
    WHEN anna_tm.role IS NOT NULL 
      THEN '⚠️ Nur Anna im Team'
    WHEN tina_tm.role IS NOT NULL 
      THEN '❌ Nur Tina im Team'
    ELSE '❌ Keiner im Team'
  END as status
FROM teams t
LEFT JOIN team_members anna_tm ON anna_tm.team_id = t.id 
  AND anna_tm.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
LEFT JOIN team_members tina_tm ON tina_tm.team_id = t.id 
  AND tina_tm.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
WHERE anna_tm.user_id IS NOT NULL OR tina_tm.user_id IS NOT NULL
ORDER BY t.name;

-- 4️⃣ WENN PROBLEM: Welches?
SELECT 
  '=== 4. DIAGNOSE ===' as section,
  CASE 
    -- Problem 1: Anna ist in keinem Team
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members WHERE user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
    ) THEN '❌ PROBLEM: Anna ist in KEINEM Team!'
    
    -- Problem 2: Tina ist in keinem Team  
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members WHERE user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
    ) THEN '❌ PROBLEM: Tina ist in KEINEM Team!'
    
    -- Problem 3: Anna ist in Team aber nicht als TEAMLEAD
    WHEN EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
        AND role != 'TEAMLEAD'
    ) THEN '❌ PROBLEM: Anna ist im Team aber NICHT als TEAMLEAD!'
    
    -- Problem 4: Anna und Tina sind in verschiedenen Teams
    WHEN NOT EXISTS (
      SELECT 1 
      FROM team_members tm_anna
      JOIN team_members tm_tina ON tm_anna.team_id = tm_tina.team_id
      WHERE tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
        AND tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
    ) THEN '❌ PROBLEM: Anna und Tina sind in VERSCHIEDENEN Teams!'
    
    -- Alles OK
    ELSE '✅ Alles korrekt konfiguriert!'
  END as problem,
  
  -- Suggested Fix
  CASE 
    -- Fix 1: Anna zu Tinas Team als TEAMLEAD hinzufügen
    WHEN NOT EXISTS (
      SELECT 1 
      FROM team_members tm_anna
      JOIN team_members tm_tina ON tm_anna.team_id = tm_tina.team_id
      WHERE tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
        AND tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
        AND tm_anna.role = 'TEAMLEAD'
    ) THEN 'FIX: Anna als TEAMLEAD zu Tinas Team hinzufügen (siehe FIX_ANNA_AS_TEAMLEAD.sql)'
    
    ELSE 'Keine Aktion erforderlich'
  END as suggested_fix;

-- 5️⃣ READY-TO-RUN FIX (falls nötig)
SELECT 
  '=== 5. AUTO-FIX (Kopiere & Führe aus falls Problem) ===' as info;

-- Dieser Code wird nur angezeigt, aber NICHT automatisch ausgeführt
-- Kopiere ihn und führe ihn manuell aus wenn Abschnitt 2 "❌ NEIN" zeigt
/*
DO $$
DECLARE
  v_tina_team_id uuid;
  v_anna_id uuid;
BEGIN
  -- Hole Tinas Team
  SELECT team_id INTO v_tina_team_id 
  FROM team_members 
  WHERE user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
  LIMIT 1;
  
  -- Hole Annas User ID
  SELECT id INTO v_anna_id FROM users WHERE email = 'admin@halterverbot123.de';
  
  IF v_tina_team_id IS NULL THEN
    RAISE EXCEPTION 'Tina ist in keinem Team!';
  END IF;
  
  IF v_anna_id IS NULL THEN
    RAISE EXCEPTION 'Anna nicht gefunden!';
  END IF;
  
  -- Anna als TEAMLEAD hinzufügen/updaten
  INSERT INTO team_members (team_id, user_id, role, priority_tag)
  VALUES (v_tina_team_id, v_anna_id, 'TEAMLEAD', 'PRIMARY')
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET role = 'TEAMLEAD', priority_tag = 'PRIMARY';
  
  RAISE NOTICE '✅ Anna ist jetzt TEAMLEAD in Tinas Team!';
END $$;
*/
