-- =====================================================
-- STEP 3: Verify Anna kann Tinas Antrag genehmigen
-- =====================================================

-- Run the comprehensive DEBUG script
-- Copy from: /DEBUG_ANNA_APPROVAL_LOGIC.sql

-- OR use this quick check:

DO $$
DECLARE
  v_anna_id uuid;
  v_tina_id uuid;
  v_can_approve boolean := false;
  v_anna_teams uuid[];
  v_tina_teams uuid[];
  v_shared_teams uuid[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== 🔍 QUICK CHECK: Anna & Tina ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Get IDs
  SELECT id INTO v_anna_id FROM users WHERE email = 'admin@halterverbot123.de';
  SELECT id INTO v_tina_id FROM users WHERE email = 'social@halterverbot123.de';
  
  IF v_anna_id IS NULL THEN
    RAISE NOTICE '❌ Anna nicht gefunden (admin@halterverbot123.de)';
    RETURN;
  END IF;
  
  IF v_tina_id IS NULL THEN
    RAISE NOTICE '❌ Tina nicht gefunden (social@halterverbot123.de)';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Anna ID: %', v_anna_id;
  RAISE NOTICE '✅ Tina ID: %', v_tina_id;
  RAISE NOTICE '';
  
  -- Get Anna's teams where she is TEAMLEAD
  SELECT array_agg(team_id) INTO v_anna_teams
  FROM team_members
  WHERE user_id = v_anna_id AND role = 'TEAMLEAD';
  
  -- Get Tina's teams
  SELECT array_agg(team_id) INTO v_tina_teams
  FROM team_members
  WHERE user_id = v_tina_id;
  
  RAISE NOTICE '📋 Anna ist TEAMLEAD in % Team(s)', COALESCE(array_length(v_anna_teams, 1), 0);
  RAISE NOTICE '📋 Tina ist Mitglied in % Team(s)', COALESCE(array_length(v_tina_teams, 1), 0);
  RAISE NOTICE '';
  
  -- Find shared teams
  IF v_anna_teams IS NOT NULL AND v_tina_teams IS NOT NULL THEN
    SELECT array_agg(t) INTO v_shared_teams
    FROM unnest(v_anna_teams) AS t
    WHERE t = ANY(v_tina_teams);
    
    IF v_shared_teams IS NOT NULL AND array_length(v_shared_teams, 1) > 0 THEN
      v_can_approve := true;
      RAISE NOTICE '✅ Gemeinsame Teams gefunden: %', array_length(v_shared_teams, 1);
      RAISE NOTICE '';
      RAISE NOTICE '========================================';
      RAISE NOTICE '✅ ERFOLG! Anna KANN Tinas Antrag genehmigen!';
      RAISE NOTICE '========================================';
    ELSE
      RAISE NOTICE '❌ FEHLER! Keine gemeinsamen Teams!';
      RAISE NOTICE '';
      RAISE NOTICE 'Anna''s Teams: %', v_anna_teams;
      RAISE NOTICE 'Tina''s Teams: %', v_tina_teams;
    END IF;
  ELSE
    RAISE NOTICE '❌ FEHLER! Anna oder Tina sind in keinem Team!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- DETAILED VIEW: Zeige gemeinsame Teams
-- =====================================================

SELECT 
  '=== GEMEINSAME TEAMS ===' as info,
  t.name as team_name,
  tm_anna.role as anna_role,
  tm_anna.priority_tag as anna_tag,
  tm_tina.role as tina_role,
  CASE 
    WHEN tm_anna.role = 'TEAMLEAD' THEN '✅ Anna kann genehmigen'
    ELSE '❌ Anna ist kein TEAMLEAD'
  END as can_approve
FROM teams t
JOIN team_members tm_anna ON tm_anna.team_id = t.id
JOIN team_members tm_tina ON tm_tina.team_id = t.id
WHERE tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
  AND tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
ORDER BY t.name;

-- =====================================================
-- TEST canUserApproveRequest() Logic
-- =====================================================

SELECT 
  '=== TEST APPROVAL LOGIC ===' as info,
  CASE
    WHEN anna.role = 'USER' THEN '❌ FAIL: Anna ist USER (keine Admin-Rechte)'
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members tm_anna
      JOIN team_members tm_tina ON tm_tina.team_id = tm_anna.team_id
      WHERE tm_anna.user_id = anna.id
        AND tm_tina.user_id = tina.id
        AND tm_anna.role = 'TEAMLEAD'
    ) THEN '❌ FAIL: Anna ist nicht TEAMLEAD in Tinas Team'
    ELSE '✅ SUCCESS: Anna KANN Tinas Antrag genehmigen!'
  END as test_result,
  anna.role as anna_global_role,
  tina.role as tina_global_role
FROM users anna, users tina
WHERE anna.email = 'admin@halterverbot123.de'
  AND tina.email = 'social@halterverbot123.de';

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

SELECT 
  '=== FINAL SUMMARY ===' as info,
  CONCAT(u.first_name, ' ', u.last_name) as name,
  u.email,
  u.role as global_role,
  COUNT(tm.id) as total_teams,
  COUNT(CASE WHEN tm.role = 'TEAMLEAD' THEN 1 END) as teamlead_count,
  COUNT(CASE WHEN tm.role = 'MEMBER' THEN 1 END) as member_count
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
WHERE u.email IN ('admin@halterverbot123.de', 'social@halterverbot123.de')
GROUP BY u.id, u.first_name, u.last_name, u.email, u.role
ORDER BY u.email;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- ✅ Gemeinsame Teams: 1 (Büro 2)
-- ✅ Anna ist TEAMLEAD in "Büro 2"
-- ✅ Tina ist MEMBER in "Büro 2"
-- ✅ TEST APPROVAL LOGIC: SUCCESS
-- =====================================================
