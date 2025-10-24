-- ============================================
-- PART 2: FINAL DIAGNOSIS ANALYSIS
-- Führe dies NACH PART 1 aus
-- ============================================

DO $$
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
    RAISE NOTICE '   → Führe PART 1 aus und suche manuell';
  ELSIF v_anna_count > 1 THEN
    RAISE NOTICE '⚠️  WARNUNG: % User mit "Anna" gefunden!', v_anna_count;
    RAISE NOTICE '   → Führe PART 1 STEP 4 aus und identifiziere die richtige Anna';
  ELSE
    RAISE NOTICE '✅ CHECK 1: Anna gefunden → %', v_anna_email;
  END IF;
  
  -- Check 2: Tina gefunden?
  IF v_tina_count = 0 THEN
    RAISE NOTICE '❌ PROBLEM 2: Keine User mit "Tina" gefunden!';
    RAISE NOTICE '   → Führe PART 1 aus und suche manuell';
  ELSIF v_tina_count > 1 THEN
    RAISE NOTICE '⚠️  WARNUNG: % User mit "Tina" gefunden!', v_tina_count;
    RAISE NOTICE '   → Führe PART 1 STEP 4 aus und identifiziere die richtige Tina';
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
  RAISE NOTICE '   1. Schau dir PART 1 Ergebnisse an';
  RAISE NOTICE '   2. Identifiziere die E-Mail-Adressen von Anna & Tina';
  RAISE NOTICE '   3. Zeig mir die Ergebnisse';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
