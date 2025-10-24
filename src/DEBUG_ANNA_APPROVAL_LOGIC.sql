-- ============================================
-- DEBUG: Warum kann Anna Tinas Antrag nicht genehmigen?
-- Simuliert EXAKT die canUserApproveRequest() Funktion
-- ============================================

-- VARIABLEN DEFINIEREN
DO $$
DECLARE
  v_anna_id uuid;
  v_tina_id uuid;
  v_anna_email text := 'admin@halterverbot123.de';    -- 🔧 Anna's E-Mail (ADMIN)
  v_tina_email text := 'social@halterverbot123.de';   -- 🔧 Tina's E-Mail (USER)
  v_anna_role text;
  v_tina_role text;
  v_requester_teams uuid[];
  v_approver_is_teamlead boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== 🔍 DEBUG: Anna Approval Logic ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- STEP 1: Get Anna's ID and Role
  SELECT id, role INTO v_anna_id, v_anna_role
  FROM users
  WHERE email = v_anna_email;
  
  IF v_anna_id IS NULL THEN
    RAISE EXCEPTION '❌ Anna nicht gefunden mit E-Mail: %', v_anna_email;
  END IF;
  
  RAISE NOTICE '✅ STEP 1: Anna gefunden';
  RAISE NOTICE '   ID: %', v_anna_id;
  RAISE NOTICE '   E-Mail: %', v_anna_email;
  RAISE NOTICE '   Global Role: %', v_anna_role;
  RAISE NOTICE '';
  
  -- STEP 2: Get Tina's ID and Role
  SELECT id, role INTO v_tina_id, v_tina_role
  FROM users
  WHERE email = v_tina_email;
  
  IF v_tina_id IS NULL THEN
    RAISE EXCEPTION '❌ Tina nicht gefunden mit E-Mail: %', v_tina_email;
  END IF;
  
  RAISE NOTICE '✅ STEP 2: Tina gefunden';
  RAISE NOTICE '   ID: %', v_tina_id;
  RAISE NOTICE '   E-Mail: %', v_tina_email;
  RAISE NOTICE '   Global Role: %', v_tina_role;
  RAISE NOTICE '';
  
  -- STEP 3: RULE 1 - Only SUPERADMIN can approve HR/SUPERADMIN requests
  IF v_tina_role IN ('HR', 'SUPERADMIN') THEN
    RAISE NOTICE '⚠️  STEP 3: Tina ist HR oder SUPERADMIN';
    IF v_anna_role != 'SUPERADMIN' THEN
      RAISE NOTICE '❌ RESULT: Nur SUPERADMIN kann HR/SUPERADMIN Anträge genehmigen';
      RAISE NOTICE '   Anna Role: %', v_anna_role;
      RETURN;
    END IF;
    RAISE NOTICE '✅ Anna ist SUPERADMIN - kann fortfahren';
  ELSE
    RAISE NOTICE '✅ STEP 3: Tina ist weder HR noch SUPERADMIN - normale Regeln gelten';
  END IF;
  RAISE NOTICE '';
  
  -- STEP 4: RULE 2 - Approver must not be USER
  IF v_anna_role = 'USER' THEN
    RAISE NOTICE '❌ STEP 4: Anna ist USER - keine Approval-Berechtigung';
    RETURN;
  END IF;
  RAISE NOTICE '✅ STEP 4: Anna hat admin-level Role: %', v_anna_role;
  RAISE NOTICE '';
  
  -- STEP 5: RULE 3 - Get Tina's teams
  SELECT array_agg(team_id) INTO v_requester_teams
  FROM team_members
  WHERE user_id = v_tina_id;
  
  IF v_requester_teams IS NULL OR array_length(v_requester_teams, 1) = 0 THEN
    RAISE NOTICE '❌ STEP 5: Tina ist in KEINEM Team!';
    RAISE NOTICE '   → Tina muss zu einem Team hinzugefügt werden';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ STEP 5: Tina ist in % Team(s)', array_length(v_requester_teams, 1);
  RAISE NOTICE '   Team IDs: %', v_requester_teams;
  RAISE NOTICE '';
  
  -- STEP 6: RULE 3 - Check if Anna is TEAMLEAD in any of Tina's teams
  SELECT EXISTS(
    SELECT 1
    FROM team_members
    WHERE user_id = v_anna_id
      AND team_id = ANY(v_requester_teams)
      AND role = 'TEAMLEAD'
  ) INTO v_approver_is_teamlead;
  
  RAISE NOTICE '🔍 STEP 6: Prüfe ob Anna TEAMLEAD in Tinas Team(s) ist';
  RAISE NOTICE '   Query: SELECT * FROM team_members WHERE user_id = % AND team_id IN (%)', 
    v_anna_id, array_to_string(v_requester_teams, ', ');
  
  IF v_approver_is_teamlead THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ERFOLG! Anna KANN Tinas Antrag genehmigen!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Zusammenfassung:';
    RAISE NOTICE '  - Anna Global Role: %', v_anna_role;
    RAISE NOTICE '  - Anna Team Role: TEAMLEAD in Tinas Team';
    RAISE NOTICE '  - Tina Global Role: %', v_tina_role;
    RAISE NOTICE '  - Tina ist in % Team(s)', array_length(v_requester_teams, 1);
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '❌ FEHLER! Anna ist NICHT TEAMLEAD in Tinas Team!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    -- DETAILED DEBUG: Zeige Anna's Memberships
    RAISE NOTICE '🔍 DEBUG: Anna''s Team-Mitgliedschaften:';
    PERFORM t.name, tm.role, tm.priority_tag
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = v_anna_id;
    
    IF NOT FOUND THEN
      RAISE NOTICE '   ⚠️  Anna ist in KEINEM Team!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DEBUG: Tina''s Team-Mitgliedschaften:';
    PERFORM t.name, tm.role, tm.priority_tag
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = v_tina_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 LÖSUNG:';
    RAISE NOTICE '   Anna muss als TEAMLEAD zu einem gemeinsamen Team mit Tina hinzugefügt werden!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- SHOW DETAILED TEAM MEMBERSHIPS
-- ============================================
SELECT 
  '=== Anna''s Team-Mitgliedschaften ===' as info,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.role = 'TEAMLEAD' THEN '👑 Kann Anträge genehmigen'
    WHEN tm.role = 'BACKUP' THEN '🔄 Backup'
    WHEN tm.role = 'MEMBER' THEN '👤 Normales Mitglied'
    ELSE '❓ ' || tm.role
  END as status
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'admin@halterverbot123.de'
ORDER BY t.name;


SELECT 
  '=== Tina''s Team-Mitgliedschaften ===' as info,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.role = 'TEAMLEAD' THEN '👑 Kann Anträge genehmigen'
    WHEN tm.role = 'BACKUP' THEN '🔄 Backup'
    WHEN tm.role = 'MEMBER' THEN '👤 Normales Mitglied'
    ELSE '❓ ' || tm.role
  END as status
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'social@halterverbot123.de'
ORDER BY t.name;


-- ============================================
-- FIND SHARED TEAMS
-- ============================================
SELECT 
  '=== Gemeinsame Teams ===' as info,
  t.name as team_name,
  tm_anna.role as anna_team_role,
  tm_tina.role as tina_team_role,
  CASE 
    WHEN tm_anna.role = 'TEAMLEAD' THEN '✅ Anna kann genehmigen'
    ELSE '❌ Anna ist kein TEAMLEAD'
  END as approval_status
FROM teams t
JOIN team_members tm_anna ON tm_anna.team_id = t.id
JOIN team_members tm_tina ON tm_tina.team_id = t.id
WHERE tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
  AND tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
ORDER BY t.name;
