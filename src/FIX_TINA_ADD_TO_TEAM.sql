-- ============================================
-- FIX: Tina zu Team hinzufügen & Anna als TEAMLEAD
-- ============================================

-- STEP 1: Zeige alle existierenden Teams
SELECT 
  '=== STEP 1: Welche Teams gibt es? ===' as info,
  id,
  name,
  created_at
FROM teams
ORDER BY name;


-- STEP 2: Zeige User Tina & Anna
SELECT 
  '=== STEP 2: User Tina & Anna ===' as info,
  id,
  email,
  first_name,
  last_name,
  role as global_role
FROM users
WHERE email IN ('admin@halterverbot123.de', 'social@halterverbot123.de')
ORDER BY email;


-- STEP 3: FIX - Tina zu Team "Büro 2" hinzufügen (als MEMBER)
--         UND Anna als TEAMLEAD hinzufügen
-- ⚠️ NUR AUSFÜHREN WENN STEP 1 ein Team "Büro 2" zeigt!

DO $$
DECLARE
  v_team_id uuid;
  v_anna_id uuid;
  v_tina_id uuid;
  v_team_name text := 'Büro 2'; -- 🔧 ÄNDERE DIES falls Team anders heißt!
BEGIN
  -- Hole Team "Büro 2"
  SELECT id INTO v_team_id FROM teams WHERE name = v_team_name LIMIT 1;
  
  -- Hole User IDs
  SELECT id INTO v_anna_id FROM users WHERE email = 'admin@halterverbot123.de';
  SELECT id INTO v_tina_id FROM users WHERE email = 'social@halterverbot123.de';
  
  -- Validierung
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION '❌ Team "%" nicht gefunden! Ändere v_team_name in Zeile 33', v_team_name;
  END IF;
  
  IF v_anna_id IS NULL THEN
    RAISE EXCEPTION '❌ Anna nicht gefunden!';
  END IF;
  
  IF v_tina_id IS NULL THEN
    RAISE EXCEPTION '❌ Tina nicht gefunden!';
  END IF;
  
  -- 1️⃣ Tina als MEMBER hinzufügen
  INSERT INTO team_members (team_id, user_id, role, priority_tag)
  VALUES (v_team_id, v_tina_id, 'MEMBER', NULL)
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET role = 'MEMBER';
  
  RAISE NOTICE '✅ Tina ist jetzt MEMBER in Team "%"', v_team_name;
  
  -- 2️⃣ Anna als TEAMLEAD hinzufügen
  INSERT INTO team_members (team_id, user_id, role, priority_tag)
  VALUES (v_team_id, v_anna_id, 'TEAMLEAD', 'PRIMARY')
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET role = 'TEAMLEAD', priority_tag = 'PRIMARY';
  
  RAISE NOTICE '✅ Anna ist jetzt TEAMLEAD (PRIMARY) in Team "%"', v_team_name;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ERFOLG! Führe jetzt STEP 4 aus um zu verifizieren';
END $$;


-- STEP 4: VERIFY - Zeige Team-Mitgliedschaften
SELECT 
  '=== STEP 4: VERIFY - Team Mitgliedschaften ===' as info,
  t.name as team_name,
  u.email,
  u.first_name || ' ' || u.last_name as full_name,
  tm.role as team_role,
  tm.priority_tag,
  CASE 
    WHEN u.email = 'admin@halterverbot123.de' AND tm.role = 'TEAMLEAD' 
      THEN '✅ Anna ist TEAMLEAD'
    WHEN u.email = 'social@halterverbot123.de' AND tm.role = 'MEMBER' 
      THEN '✅ Tina ist MEMBER'
    WHEN u.email = 'admin@halterverbot123.de' 
      THEN '⚠️ Anna ist nicht TEAMLEAD'
    WHEN u.email = 'social@halterverbot123.de' 
      THEN '⚠️ Tina ist nicht MEMBER'
    ELSE '✅ OK'
  END as status
FROM team_members tm
JOIN teams t ON t.id = tm.team_id
JOIN users u ON u.id = tm.user_id
WHERE u.email IN ('admin@halterverbot123.de', 'social@halterverbot123.de')
ORDER BY t.name, tm.role DESC;


-- STEP 5: FINAL CHECK - Kann Anna Tinas Antrag genehmigen?
SELECT 
  '=== STEP 5: FINAL CHECK ===' as info,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM team_members 
      WHERE user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
    ) THEN '❌ NEIN - Tina ist in keinem Team'
    
    WHEN NOT EXISTS (
      SELECT 1 
      FROM team_members tm_tina
      JOIN team_members tm_anna ON tm_anna.team_id = tm_tina.team_id AND tm_anna.role = 'TEAMLEAD'
      WHERE tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
        AND tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
    ) THEN '❌ NEIN - Anna ist NICHT TEAMLEAD in Tinas Team'
    
    ELSE '✅ JA - Anna kann Tinas Antrag genehmigen!'
  END as result;


-- ============================================
-- ALTERNATIVE: Falls kein Team "Büro 2" existiert
-- ============================================
-- Uncomment und führe aus um ein neues Team zu erstellen:

/*
INSERT INTO teams (name, description)
VALUES ('Büro 2', 'Team Büro 2')
ON CONFLICT (name) DO NOTHING
RETURNING id, name, created_at;

-- Dann führe STEP 3 erneut aus!
*/
