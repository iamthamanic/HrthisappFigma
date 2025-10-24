-- ============================================
-- COMPLETE DIAGNOSIS: User, Teams & Roles
-- Zeigt ALLES um das Problem zu verstehen
-- ============================================

-- STEP 1: Alle User in der Datenbank
SELECT 
  '=== STEP 1: ALLE USER ===' as info,
  id,
  email,
  first_name,
  last_name,
  role as global_role,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;


-- STEP 2: Alle Teams in der Datenbank
SELECT 
  '=== STEP 2: ALLE TEAMS ===' as info,
  id,
  name,
  description,
  created_at
FROM teams
ORDER BY name;


-- STEP 3: ALLE Team-Mitgliedschaften mit Rollen
-- ⭐ DAS IST DIE WICHTIGSTE QUERY! ⭐
SELECT 
  '=== STEP 3: TEAM-MITGLIEDSCHAFTEN (mit Rollen) ===' as info,
  t.name as team_name,
  u.email,
  u.first_name,
  u.last_name,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.role = 'TEAMLEAD' THEN '👑 TEAMLEAD'
    WHEN tm.role = 'BACKUP' THEN '🔄 BACKUP'
    WHEN tm.role = 'MEMBER' THEN '👤 MEMBER'
    ELSE '❓ ' || tm.role
  END as role_emoji
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
ORDER BY t.name, 
  CASE tm.role 
    WHEN 'TEAMLEAD' THEN 1 
    WHEN 'BACKUP' THEN 2 
    WHEN 'MEMBER' THEN 3 
    ELSE 4 
  END,
  u.email;


-- STEP 4: Suche spezifisch nach "Anna" und "Tina"
-- (egal ob Vorname, Nachname oder Email)
SELECT 
  '=== STEP 4: SUCHE "ANNA" & "TINA" ===' as info,
  id,
  email,
  first_name,
  last_name,
  role as global_role,
  created_at,
  CASE 
    WHEN LOWER(first_name) LIKE '%anna%' OR LOWER(last_name) LIKE '%anna%' OR LOWER(email) LIKE '%anna%' 
      THEN '👩 Könnte Anna sein'
    WHEN LOWER(first_name) LIKE '%tina%' OR LOWER(last_name) LIKE '%tina%' OR LOWER(email) LIKE '%tina%'
      THEN '👩 Könnte Tina sein'
    ELSE '✅ Match gefunden'
  END as match_type
FROM users
WHERE 
  LOWER(first_name) LIKE '%anna%' OR 
  LOWER(last_name) LIKE '%anna%' OR 
  LOWER(email) LIKE '%anna%' OR
  LOWER(first_name) LIKE '%tina%' OR 
  LOWER(last_name) LIKE '%tina%' OR 
  LOWER(email) LIKE '%tina%'
ORDER BY created_at DESC;


-- STEP 5: Wenn Anna & Tina gefunden wurden - zeige ihre Team-Mitgliedschaften
SELECT 
  '=== STEP 5: ANNA & TINA TEAM-MITGLIEDSCHAFTEN ===' as info,
  t.name as team_name,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN tm.role = 'TEAMLEAD' THEN '👑 Kann Anträge genehmigen'
    WHEN tm.role = 'BACKUP' THEN '🔄 Backup TEAMLEAD'
    WHEN tm.role = 'MEMBER' THEN '👤 Normales Mitglied'
    ELSE '❓ Unbekannte Rolle'
  END as permission_status
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE 
  LOWER(u.first_name) LIKE '%anna%' OR 
  LOWER(u.last_name) LIKE '%anna%' OR 
  LOWER(u.email) LIKE '%anna%' OR
  LOWER(u.first_name) LIKE '%tina%' OR 
  LOWER(u.last_name) LIKE '%tina%' OR 
  LOWER(u.email) LIKE '%tina%'
ORDER BY t.name, u.email;


-- STEP 6: FINAL DIAGNOSIS
-- Zeigt ob Anna Tinas Antrag genehmigen kann
DO $
DECLARE
  v_anna_count int;
  v_tina_count int;
  v_anna_id uuid;
  v_tina_id uuid;
  v_anna_email text;
  v_tina_email text;
  v_tina_in_team boolean;
  v_anna_is_teamlead boolean;
  v_shared_team_name text;
BEGIN
  -- Suche Anna (COUNT first, then get ID if exactly 1)
  SELECT COUNT(*) INTO v_anna_count
  FROM users
  WHERE LOWER(first_name) LIKE '%anna%' OR LOWER(last_name) LIKE '%anna%' OR LOWER(email) LIKE '%anna%';
  
  IF v_anna_count = 1 THEN
    SELECT id, email INTO v_anna_id, v_anna_email
    FROM users
    WHERE LOWER(first_name) LIKE '%anna%' OR LOWER(last_name) LIKE '%anna%' OR LOWER(email) LIKE '%anna%';
  END IF;
  
  -- Suche Tina (COUNT first, then get ID if exactly 1)
  SELECT COUNT(*) INTO v_tina_count
  FROM users
  WHERE LOWER(first_name) LIKE '%tina%' OR LOWER(last_name) LIKE '%tina%' OR LOWER(email) LIKE '%tina%';
  
  IF v_tina_count = 1 THEN
    SELECT id, email INTO v_tina_id, v_tina_email
    FROM users
    WHERE LOWER(first_name) LIKE '%tina%' OR LOWER(last_name) LIKE '%tina%' OR LOWER(email) LIKE '%tina%';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== 📋 FINAL DIAGNOSIS ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Check 1: Anna gefunden?
  IF v_anna_count = 0 THEN
    RAISE NOTICE '❌ PROBLEM 1: Keine User mit "Anna" gefunden!';
    RAISE NOTICE '   → Führe STEP 1 aus und suche manuell';
  ELSIF v_anna_count > 1 THEN
    RAISE NOTICE '⚠️  WARNUNG: % User mit "Anna" gefunden!', v_anna_count;
    RAISE NOTICE '   → Führe STEP 4 aus und identifiziere die richtige Anna';
  ELSE
    RAISE NOTICE '✅ CHECK 1: Anna gefunden → %', v_anna_email;
  END IF;
  
  -- Check 2: Tina gefunden?
  IF v_tina_count = 0 THEN
    RAISE NOTICE '❌ PROBLEM 2: Keine User mit "Tina" gefunden!';
    RAISE NOTICE '   → Führe STEP 1 aus und suche manuell';
  ELSIF v_tina_count > 1 THEN
    RAISE NOTICE '⚠️  WARNUNG: % User mit "Tina" gefunden!', v_tina_count;
    RAISE NOTICE '   → Führe STEP 4 aus und identifiziere die richtige Tina';
  ELSE
    RAISE NOTICE '✅ CHECK 2: Tina gefunden → %', v_tina_email;
  END IF;
  
  -- Nur weitermachen wenn beide eindeutig gefunden wurden
  IF v_anna_count = 1 AND v_tina_count = 1 THEN
    -- Check 3: Ist Tina in einem Team?
    SELECT EXISTS(
      SELECT 1 FROM team_members WHERE user_id = v_tina_id
    ) INTO v_tina_in_team;
    
    IF NOT v_tina_in_team THEN
      RAISE NOTICE '❌ PROBLEM 3: Tina ist in KEINEM Team!';
      RAISE NOTICE '   → Tina muss zu einem Team hinzugefügt werden';
    ELSE
      RAISE NOTICE '✅ CHECK 3: Tina ist in mindestens einem Team';
      
      -- Check 4: Ist Anna TEAMLEAD in Tinas Team?
      SELECT EXISTS(
        SELECT 1 
        FROM team_members tm_tina
        JOIN team_members tm_anna ON tm_anna.team_id = tm_tina.team_id
        WHERE tm_tina.user_id = v_tina_id
          AND tm_anna.user_id = v_anna_id
          AND tm_anna.role = 'TEAMLEAD'
      ) INTO v_anna_is_teamlead;
      
      IF NOT v_anna_is_teamlead THEN
        RAISE NOTICE '❌ PROBLEM 4: Anna ist NICHT TEAMLEAD in Tinas Team!';
        RAISE NOTICE '   → Anna muss als TEAMLEAD zu Tinas Team hinzugefügt werden';
      ELSE
        -- Finde gemeinsames Team
        SELECT t.name INTO v_shared_team_name
        FROM team_members tm_tina
        JOIN team_members tm_anna ON tm_anna.team_id = tm_tina.team_id
        JOIN teams t ON t.id = tm_tina.team_id
        WHERE tm_tina.user_id = v_tina_id
          AND tm_anna.user_id = v_anna_id
          AND tm_anna.role = 'TEAMLEAD'
        LIMIT 1;
        
        RAISE NOTICE '✅ CHECK 4: Anna ist TEAMLEAD in Team "%"', v_shared_team_name;
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ERFOLG! Anna kann Tinas Anträge genehmigen!';
      END IF;
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '💡 NÄCHSTE SCHRITTE:';
  RAISE NOTICE '   1. Schau dir STEP 1-5 oben an';
  RAISE NOTICE '   2. Identifiziere die E-Mail-Adressen von Anna & Tina';
  RAISE NOTICE '   3. Zeig mir die Ergebnisse';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
