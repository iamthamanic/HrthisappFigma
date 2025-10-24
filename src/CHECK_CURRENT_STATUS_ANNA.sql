-- =====================================================
-- CHECK CURRENT STATUS: Ist Anna schon TEAMLEAD?
-- =====================================================

-- STEP 1: Zeige ALLE Teams
SELECT 
  '=== ALLE TEAMS ===' as info,
  id,
  name,
  created_at
FROM teams
ORDER BY name;

-- STEP 2: Zeige ALLE Users mit ADMIN Role
SELECT 
  '=== ALLE ADMINs ===' as info,
  id,
  email,
  CONCAT(first_name, ' ', last_name) as full_name,
  role
FROM users
WHERE role = 'ADMIN'
ORDER BY email;

-- STEP 3: Zeige Anna's AKTUELLE Team-Mitgliedschaften
SELECT 
  '=== ANNA''S TEAMS (AKTUELL) ===' as info,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.role = 'TEAMLEAD' AND tm.priority_tag = 'PRIMARY' THEN '✅ PRIMARY Teamlead'
    WHEN tm.role = 'TEAMLEAD' AND tm.priority_tag = 'BACKUP' THEN '🔄 BACKUP'
    WHEN tm.role = 'TEAMLEAD' AND tm.priority_tag IS NULL THEN '⚠️ TEAMLEAD (KEIN TAG!)'
    WHEN tm.role = 'MEMBER' THEN '👤 Member'
    ELSE '❓ ' || tm.role
  END as status
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email LIKE '%admin%'
ORDER BY t.name;

-- STEP 4: Zeige Team "Büro 2" Mitglieder (oder ähnliche Namen)
SELECT 
  '=== TEAM MIT "BÜRO" IM NAMEN ===' as info,
  t.name as team_name,
  CONCAT(u.first_name, ' ', u.last_name) as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  COALESCE(tm.priority_tag, 'KEIN TAG') as priority_tag
FROM team_members tm
JOIN users u ON u.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
WHERE t.name ILIKE '%büro%' OR t.name ILIKE '%buero%'
ORDER BY 
  t.name,
  CASE tm.priority_tag 
    WHEN 'PRIMARY' THEN 1 
    WHEN 'BACKUP' THEN 2 
    WHEN 'BACKUP_BACKUP' THEN 3 
    ELSE 4 
  END,
  u.first_name;

-- STEP 5: Zeige Tina's Teams
SELECT 
  '=== TINA''S TEAMS ===' as info,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email LIKE '%social%'
ORDER BY t.name;

-- =====================================================
-- DECISION TREE
-- =====================================================

DO $$
DECLARE
  v_anna_in_buero boolean := false;
  v_anna_is_teamlead boolean := false;
  v_anna_has_primary_tag boolean := false;
  v_team_exists boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== 🔍 DECISION TREE ===' ;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Check if team "Büro 2" exists
  SELECT EXISTS(
    SELECT 1 FROM teams WHERE name ILIKE '%büro%' OR name ILIKE '%buero%'
  ) INTO v_team_exists;
  
  IF NOT v_team_exists THEN
    RAISE NOTICE '❌ KEIN Team mit "Büro" im Namen gefunden!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 EMPFEHLUNG: Neues Team erstellen';
    RAISE NOTICE '   → Führe /CLEAN_TEST_CREATE_TEAM.sql aus';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Team mit "Büro" im Namen gefunden';
  
  -- Check if Anna is in team
  SELECT EXISTS(
    SELECT 1 
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    JOIN teams t ON t.id = tm.team_id
    WHERE u.email LIKE '%admin%'
      AND (t.name ILIKE '%büro%' OR t.name ILIKE '%buero%')
  ) INTO v_anna_in_buero;
  
  IF NOT v_anna_in_buero THEN
    RAISE NOTICE '❌ Anna ist NICHT im Büro-Team!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 EMPFEHLUNG: Anna hinzufügen';
    RAISE NOTICE '   → Führe /STEP2_ADD_ANNA_TO_BUERO2.sql aus';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Anna ist im Büro-Team';
  
  -- Check if Anna is TEAMLEAD
  SELECT EXISTS(
    SELECT 1 
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    JOIN teams t ON t.id = tm.team_id
    WHERE u.email LIKE '%admin%'
      AND (t.name ILIKE '%büro%' OR t.name ILIKE '%buero%')
      AND tm.role = 'TEAMLEAD'
  ) INTO v_anna_is_teamlead;
  
  IF NOT v_anna_is_teamlead THEN
    RAISE NOTICE '❌ Anna ist nur MEMBER, nicht TEAMLEAD!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 EMPFEHLUNG: Role auf TEAMLEAD setzen';
    RAISE NOTICE '   → SQL unten ausführen';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Anna ist TEAMLEAD';
  
  -- Check if Anna has PRIMARY tag
  SELECT EXISTS(
    SELECT 1 
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    JOIN teams t ON t.id = tm.team_id
    WHERE u.email LIKE '%admin%'
      AND (t.name ILIKE '%büro%' OR t.name ILIKE '%buero%')
      AND tm.role = 'TEAMLEAD'
      AND tm.priority_tag = 'PRIMARY'
  ) INTO v_anna_has_primary_tag;
  
  IF NOT v_anna_has_primary_tag THEN
    RAISE NOTICE '⚠️  Anna ist TEAMLEAD aber OHNE PRIMARY Tag!';
    RAISE NOTICE '';
    RAISE NOTICE '💡 EMPFEHLUNG: Priority Tag setzen';
    RAISE NOTICE '   → SQL unten ausführen';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ Anna hat PRIMARY Tag';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 PERFEKT! Anna ist korrekt konfiguriert!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nächster Schritt:';
  RAISE NOTICE '→ Führe /STEP3_VERIFY_ANNA_CAN_APPROVE.sql aus';
  
END $$;

-- =====================================================
-- QUICK FIX SQLs (falls nötig)
-- =====================================================

-- Falls Anna nur MEMBER ist → auf TEAMLEAD setzen:
-- UPDATE team_members tm
-- SET role = 'TEAMLEAD', priority_tag = 'PRIMARY'
-- FROM users u, teams t
-- WHERE tm.user_id = u.id
--   AND tm.team_id = t.id
--   AND u.email LIKE '%admin%'
--   AND (t.name ILIKE '%büro%' OR t.name ILIKE '%buero%');

-- Falls Anna TEAMLEAD ohne Tag ist → Tag setzen:
-- UPDATE team_members tm
-- SET priority_tag = 'PRIMARY'
-- FROM users u, teams t
-- WHERE tm.user_id = u.id
--   AND tm.team_id = t.id
--   AND u.email LIKE '%admin%'
--   AND (t.name ILIKE '%büro%' OR t.name ILIKE '%buero%')
--   AND tm.role = 'TEAMLEAD';
