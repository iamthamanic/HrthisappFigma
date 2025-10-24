-- =====================================================
-- DEBUG: Warum kann Anna Tinas Antrag im Frontend nicht genehmigen?
-- =====================================================

-- STEP 1: Zeige Anna's User Info
SELECT 
  '=== ANNA USER INFO ===' as info,
  id,
  email,
  CONCAT(first_name, ' ', last_name) as full_name,
  role as global_role
FROM users
WHERE email LIKE '%admin%' AND role = 'ADMIN';

-- STEP 2: Zeige Anna's Team Memberships
SELECT 
  '=== ANNA TEAM MEMBERSHIPS ===' as info,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.role = 'TEAMLEAD' THEN '✅ Kann Anträge genehmigen'
    ELSE '❌ Keine Approval-Rechte'
  END as approval_status
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email LIKE '%admin%' AND u.role = 'ADMIN'
ORDER BY t.name;

-- STEP 3: Zeige welche Teams Anna als TEAMLEAD hat
SELECT 
  '=== TEAMS WHERE ANNA IS TEAMLEAD ===' as info,
  t.id as team_id,
  t.name as team_name,
  tm.priority_tag
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email LIKE '%admin%'
  AND u.role = 'ADMIN'
  AND tm.role = 'TEAMLEAD';

-- STEP 4: Zeige alle Mitglieder von Anna's Teams
DO $$
DECLARE
  v_anna_team_ids uuid[];
  v_team_member_count integer;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== ANNA''S TEAM MEMBERS ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Get Anna's team IDs where she is TEAMLEAD
  SELECT array_agg(tm.team_id) INTO v_anna_team_ids
  FROM team_members tm
  JOIN users u ON u.id = tm.user_id
  WHERE u.email LIKE '%admin%'
    AND u.role = 'ADMIN'
    AND tm.role = 'TEAMLEAD';
  
  IF v_anna_team_ids IS NULL OR array_length(v_anna_team_ids, 1) = 0 THEN
    RAISE NOTICE '❌ Anna ist in KEINEM Team als TEAMLEAD!';
    RAISE NOTICE '';
    RAISE NOTICE 'Das ist der BUG!';
    RAISE NOTICE 'Anna muss TEAMLEAD in einem Team sein um Anträge zu sehen!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 LÖSUNG: Anna als TEAMLEAD zu einem Team hinzufügen';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Anna ist TEAMLEAD in % Team(s)', array_length(v_anna_team_ids, 1);
  RAISE NOTICE '   Team IDs: %', v_anna_team_ids;
  RAISE NOTICE '';
  
  -- Count team members
  SELECT COUNT(*) INTO v_team_member_count
  FROM team_members
  WHERE team_id = ANY(v_anna_team_ids);
  
  RAISE NOTICE '📋 Anna sollte Anträge von % Mitgliedern sehen', v_team_member_count;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- STEP 5: Zeige alle Mitglieder von Anna's Teams (detailed)
SELECT 
  '=== USERS IN ANNA''S TEAMS ===' as info,
  t.name as team_name,
  CONCAT(u.first_name, ' ', u.last_name) as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  CASE 
    WHEN u.email LIKE '%social%' THEN '👉 TINA - Anna sollte ihren Antrag sehen!'
    WHEN u.email LIKE '%admin%' THEN '👤 ANNA (selbst)'
    ELSE '👥 Anderes Mitglied'
  END as notes
FROM team_members tm
JOIN users u ON u.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
WHERE tm.team_id IN (
  SELECT tm2.team_id
  FROM team_members tm2
  JOIN users u2 ON u2.id = tm2.user_id
  WHERE u2.email LIKE '%admin%'
    AND u2.role = 'ADMIN'
    AND tm2.role = 'TEAMLEAD'
)
ORDER BY t.name, u.first_name;

-- STEP 6: Zeige Tina's Urlaubsanträge
SELECT 
  '=== TINA''S LEAVE REQUESTS ===' as info,
  lr.id,
  lr.type,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.status,
  lr.created_at,
  CONCAT(u.first_name, ' ', u.last_name) as requester,
  u.email as requester_email
FROM leave_requests lr
JOIN users u ON u.id = lr.user_id
WHERE u.email LIKE '%social%'
  AND lr.withdrawn_at IS NULL
  AND lr.cancelled_at IS NULL
ORDER BY lr.created_at DESC;

-- STEP 7: Test canUserApproveRequest Logic
DO $$
DECLARE
  v_anna_id uuid;
  v_tina_id uuid;
  v_anna_role text;
  v_tina_teams uuid[];
  v_anna_is_teamlead_in_tina_team boolean;
  v_can_approve boolean := true;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== TEST canUserApproveRequest() ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Get IDs
  SELECT id, role INTO v_anna_id, v_anna_role FROM users WHERE email LIKE '%admin%' AND role = 'ADMIN';
  SELECT id INTO v_tina_id FROM users WHERE email LIKE '%social%';
  
  IF v_anna_id IS NULL THEN
    RAISE NOTICE '❌ Anna nicht gefunden!';
    RETURN;
  END IF;
  
  IF v_tina_id IS NULL THEN
    RAISE NOTICE '❌ Tina nicht gefunden!';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Anna ID: %', v_anna_id;
  RAISE NOTICE '✅ Tina ID: %', v_tina_id;
  RAISE NOTICE '';
  
  -- CHECK 1: Global Role
  IF v_anna_role = 'USER' THEN
    v_can_approve := false;
    RAISE NOTICE '❌ FAIL: Anna ist USER (keine Admin-Rechte)';
    RAISE NOTICE '   Anna Role: %', v_anna_role;
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ CHECK 1: Anna hat Admin-Level Role: %', v_anna_role;
  
  -- CHECK 2: Team Role
  SELECT array_agg(team_id) INTO v_tina_teams
  FROM team_members
  WHERE user_id = v_tina_id;
  
  IF v_tina_teams IS NULL OR array_length(v_tina_teams, 1) = 0 THEN
    v_can_approve := false;
    RAISE NOTICE '❌ FAIL: Tina ist in KEINEM Team!';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ CHECK 2: Tina ist in % Team(s)', array_length(v_tina_teams, 1);
  RAISE NOTICE '   Tina Team IDs: %', v_tina_teams;
  
  -- CHECK 3: Is Anna TEAMLEAD in Tina's team?
  SELECT EXISTS(
    SELECT 1
    FROM team_members
    WHERE user_id = v_anna_id
      AND team_id = ANY(v_tina_teams)
      AND role = 'TEAMLEAD'
  ) INTO v_anna_is_teamlead_in_tina_team;
  
  IF NOT v_anna_is_teamlead_in_tina_team THEN
    v_can_approve := false;
    RAISE NOTICE '❌ FAIL: Anna ist NICHT TEAMLEAD in Tinas Team!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Das ist der BUG! Anna muss TEAMLEAD in Tinas Team sein!';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ CHECK 3: Anna ist TEAMLEAD in Tinas Team';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SUCCESS! Anna KANN Tinas Antrag genehmigen!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Frontend sollte funktionieren wenn:';
  RAISE NOTICE '1. Anna als %@ eingeloggt ist', (SELECT email FROM users WHERE id = v_anna_id);
  RAISE NOTICE '2. Anna zu "Zeit & Urlaub" → "Anträge" navigiert';
  RAISE NOTICE '3. Anna Tinas Antrag sieht (weil sie TEAMLEAD des Teams ist)';
  RAISE NOTICE '4. Anna "Genehmigen" klickt';
  RAISE NOTICE '';
  RAISE NOTICE 'Falls der Button rot ist:';
  RAISE NOTICE '→ Öffne Browser Console (F12)';
  RAISE NOTICE '→ Schaue nach Fehlermeldungen';
  RAISE NOTICE '→ Toast-Notification sollte "Sie haben keine Berechtigung..." zeigen';
  
END $$;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- ✅ Anna ist TEAMLEAD in mind. 1 Team
-- ✅ Tina ist Member in einem von Anna's Teams
-- ✅ canUserApproveRequest() gibt TRUE zurück
-- ✅ Frontend sollte Genehmigen-Button zeigen
-- =====================================================
