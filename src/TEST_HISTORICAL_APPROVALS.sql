-- =====================================================
-- TEST: Historical Approvals bleiben sichtbar
-- =====================================================
-- Dieses Script testet ob Admin-User ihre Historical
-- Approvals sehen, auch nachdem das Team gelöscht wurde
-- =====================================================

-- SETUP: Erstelle Test-Szenario
DO $$
DECLARE
  v_anna_id uuid;
  v_tina_id uuid;
  v_test_team_id uuid;
  v_leave_request_id uuid;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== SETUP TEST SCENARIO ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Get IDs
  SELECT id INTO v_anna_id FROM users WHERE email LIKE '%admin%' AND role = 'ADMIN';
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
  
  -- STEP 1: Erstelle Test-Team
  INSERT INTO teams (name, description)
  VALUES ('Test Team DELETE ME', 'Test Team für Historical Approvals Test')
  RETURNING id INTO v_test_team_id;
  
  RAISE NOTICE '✅ STEP 1: Test Team erstellt: %', v_test_team_id;
  
  -- STEP 2: Anna als TEAMLEAD hinzufügen
  INSERT INTO team_members (team_id, user_id, role, priority_tag)
  VALUES (v_test_team_id, v_anna_id, 'TEAMLEAD', 'PRIMARY');
  
  RAISE NOTICE '✅ STEP 2: Anna als PRIMARY TEAMLEAD hinzugefügt';
  
  -- STEP 3: Tina als Member hinzufügen
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (v_test_team_id, v_tina_id, 'MEMBER');
  
  RAISE NOTICE '✅ STEP 3: Tina als MEMBER hinzugefügt';
  
  -- STEP 4: Tina erstellt Urlaubsantrag
  INSERT INTO leave_requests (
    user_id,
    type,
    start_date,
    end_date,
    total_days,
    status,
    reason
  ) VALUES (
    v_tina_id,
    'VACATION',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '35 days',
    5,
    'PENDING',
    'Test Urlaub für Historical Approvals Test'
  ) RETURNING id INTO v_leave_request_id;
  
  RAISE NOTICE '✅ STEP 4: Urlaubsantrag erstellt: %', v_leave_request_id;
  
  -- STEP 5: Anna genehmigt den Antrag
  UPDATE leave_requests
  SET 
    status = 'APPROVED',
    approved_by = v_anna_id,
    approved_at = NOW()
  WHERE id = v_leave_request_id;
  
  RAISE NOTICE '✅ STEP 5: Anna hat den Antrag GENEHMIGT';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== SETUP COMPLETE ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Test-Daten:';
  RAISE NOTICE '  Team: "Test Team DELETE ME" (%)', v_test_team_id;
  RAISE NOTICE '  Anna: TEAMLEAD in Team';
  RAISE NOTICE '  Tina: MEMBER in Team';
  RAISE NOTICE '  Leave Request: % (APPROVED by Anna)', v_leave_request_id;
  RAISE NOTICE '';
  
END $$;

-- =====================================================
-- TEST 1: Anna sieht den Antrag AKTUELL
-- =====================================================

SELECT 
  '=== TEST 1: Anna sieht Antrag (Team existiert noch) ===' as test,
  lr.id,
  lr.type,
  lr.status,
  CONCAT(u.first_name, ' ', u.last_name) as requester,
  CONCAT(approver.first_name, ' ', approver.last_name) as approved_by,
  lr.approved_at
FROM leave_requests lr
JOIN users u ON u.id = lr.user_id
LEFT JOIN users approver ON approver.id = lr.approved_by
WHERE lr.approved_by = (SELECT id FROM users WHERE email LIKE '%admin%' AND role = 'ADMIN')
  AND lr.withdrawn_at IS NULL
  AND lr.cancelled_at IS NULL
ORDER BY lr.created_at DESC;

-- =====================================================
-- TEST 2: Team löschen (simuliert)
-- =====================================================

DO $$
DECLARE
  v_test_team_id uuid;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== DELETE TEAM ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Get team ID
  SELECT id INTO v_test_team_id FROM teams WHERE name = 'Test Team DELETE ME';
  
  IF v_test_team_id IS NULL THEN
    RAISE NOTICE '⚠️  Team nicht gefunden (bereits gelöscht?)';
    RETURN;
  END IF;
  
  RAISE NOTICE '🗑️  Lösche Team: %', v_test_team_id;
  
  -- Delete team members first (FK constraint)
  DELETE FROM team_members WHERE team_id = v_test_team_id;
  RAISE NOTICE '✅ Team Members gelöscht';
  
  -- Delete team
  DELETE FROM teams WHERE id = v_test_team_id;
  RAISE NOTICE '✅ Team gelöscht';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== TEAM DELETED ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
END $$;

-- =====================================================
-- TEST 3: Anna sieht den Antrag NOCH IMMER (Historical!)
-- =====================================================

SELECT 
  '=== TEST 3: Anna sieht Antrag (Team GELÖSCHT!) ===' as test,
  lr.id,
  lr.type,
  lr.status,
  CONCAT(u.first_name, ' ', u.last_name) as requester,
  CONCAT(approver.first_name, ' ', approver.last_name) as approved_by,
  lr.approved_at,
  CASE 
    WHEN lr.status IN ('APPROVED', 'REJECTED') AND lr.approved_by = (SELECT id FROM users WHERE email LIKE '%admin%' AND role = 'ADMIN')
    THEN '✅ HISTORICAL APPROVAL - Anna sollte das sehen!'
    ELSE '❌ Sollte nicht sichtbar sein'
  END as visibility
FROM leave_requests lr
JOIN users u ON u.id = lr.user_id
LEFT JOIN users approver ON approver.id = lr.approved_by
WHERE lr.approved_by = (SELECT id FROM users WHERE email LIKE '%admin%' AND role = 'ADMIN')
  AND lr.withdrawn_at IS NULL
  AND lr.cancelled_at IS NULL
ORDER BY lr.created_at DESC;

-- =====================================================
-- TEST 4: Simuliere Frontend-Logik
-- =====================================================

DO $$
DECLARE
  v_anna_id uuid;
  v_team_ids uuid[];
  v_current_team_user_ids uuid[];
  v_historical_user_ids uuid[];
  v_all_user_ids uuid[];
  v_request_count integer;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== SIMULATE FRONTEND LOGIC ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Get Anna ID
  SELECT id INTO v_anna_id FROM users WHERE email LIKE '%admin%' AND role = 'ADMIN';
  
  -- STEP 1: Get current teams where Anna is TEAMLEAD
  SELECT array_agg(team_id) INTO v_team_ids
  FROM team_members
  WHERE user_id = v_anna_id
    AND role = 'TEAMLEAD';
  
  IF v_team_ids IS NULL OR array_length(v_team_ids, 1) = 0 THEN
    RAISE NOTICE '📋 Anna ist NICHT TEAMLEAD in irgendwelchen Teams (erwartet nach Team-Löschung)';
    v_current_team_user_ids := ARRAY[]::uuid[];
  ELSE
    RAISE NOTICE '📋 Anna ist TEAMLEAD in % Team(s)', array_length(v_team_ids, 1);
    
    -- Get team members
    SELECT array_agg(user_id) INTO v_current_team_user_ids
    FROM team_members
    WHERE team_id = ANY(v_team_ids);
    
    RAISE NOTICE '   → % User(s) in aktuellen Teams', array_length(v_current_team_user_ids, 1);
  END IF;
  
  -- STEP 2: Get historical approvals
  SELECT array_agg(DISTINCT user_id) INTO v_historical_user_ids
  FROM leave_requests
  WHERE approved_by = v_anna_id
    AND status IN ('APPROVED', 'REJECTED')
    AND withdrawn_at IS NULL
    AND cancelled_at IS NULL;
  
  IF v_historical_user_ids IS NULL OR array_length(v_historical_user_ids, 1) = 0 THEN
    RAISE NOTICE '📋 Keine Historical Approvals gefunden';
    v_historical_user_ids := ARRAY[]::uuid[];
  ELSE
    RAISE NOTICE '📋 Historical Approvals: % User(s)', array_length(v_historical_user_ids, 1);
  END IF;
  
  -- STEP 3: Combine
  v_all_user_ids := array_cat(
    array_cat(ARRAY[v_anna_id], COALESCE(v_current_team_user_ids, ARRAY[]::uuid[])),
    COALESCE(v_historical_user_ids, ARRAY[]::uuid[])
  );
  
  -- Remove duplicates
  SELECT array_agg(DISTINCT unnest) INTO v_all_user_ids
  FROM unnest(v_all_user_ids);
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 TOTAL: Anna sollte Anträge von % User(s) sehen', array_length(v_all_user_ids, 1);
  RAISE NOTICE '';
  
  -- STEP 4: Count requests
  SELECT COUNT(*) INTO v_request_count
  FROM leave_requests
  WHERE user_id = ANY(v_all_user_ids)
    AND withdrawn_at IS NULL
    AND cancelled_at IS NULL;
  
  RAISE NOTICE '📋 Anzahl Anträge die Anna sehen sollte: %', v_request_count;
  
  IF v_request_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ SUCCESS! Anna sieht noch Anträge trotz gelöschtem Team!';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '❌ FAIL! Anna sieht keine Anträge mehr!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
END $$;

-- =====================================================
-- CLEANUP (Optional - auskommentiert)
-- =====================================================

-- Um Test-Daten zu behalten, auskommentiert lassen!
-- Wenn du aufräumen willst, kommentiere die Zeilen unten ein:

-- DELETE FROM leave_requests 
-- WHERE reason = 'Test Urlaub für Historical Approvals Test';

-- DELETE FROM team_members 
-- WHERE team_id IN (SELECT id FROM teams WHERE name = 'Test Team DELETE ME');

-- DELETE FROM teams 
-- WHERE name = 'Test Team DELETE ME';

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- TEST 1: Anna sieht den Antrag (Team existiert) ✅
-- TEST 2: Team wird gelöscht ✅
-- TEST 3: Anna sieht den Antrag NOCH IMMER ✅ (HISTORICAL!)
-- TEST 4: Frontend-Logik findet den Antrag ✅
-- 
-- 💡 Anna sieht ALLE Anträge die sie jemals genehmigt/abgelehnt hat,
--    auch wenn das Team gelöscht wurde!
-- =====================================================
