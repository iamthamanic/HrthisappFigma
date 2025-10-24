-- ============================================
-- SIMPLE CHECK: Kann Anna Tinas Antrag genehmigen?
-- ============================================
-- WICHTIG: Führe jede Query EINZELN aus!

-- ============================================
-- QUERY 1: Zeige Anna & Tina
-- ============================================
SELECT 
  CASE 
    WHEN u.email = 'admin@halterverbot123.de' THEN '👩‍💼 ANNA ADMIN'
    WHEN u.email = 'social@halterverbot123.de' THEN '👩 TINA TEST'
    ELSE u.first_name || ' ' || u.last_name
  END as person,
  u.email,
  u.role as global_role,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email IN ('admin@halterverbot123.de', 'social@halterverbot123.de')
ORDER BY u.email;


-- ============================================
-- QUERY 2: KANN ANNA TINAS ANTRAG GENEHMIGEN?
-- ============================================
SELECT 
  '🎯 HAUPTFRAGE: Kann Anna Tinas Antrag genehmigen?' as question,
  CASE 
    -- Check 1: Anna muss Admin-Rolle haben
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
  END as answer;


-- ============================================
-- QUERY 3: WAS IST DAS PROBLEM? (Falls NEIN)
-- ============================================
SELECT 
  '🔍 DIAGNOSE' as title,
  CASE 
    -- Problem: Anna ist nicht TEAMLEAD in Tinas Team
    WHEN NOT EXISTS (
      SELECT 1 
      FROM team_members tm_tina
      JOIN team_members tm_anna ON tm_anna.team_id = tm_tina.team_id AND tm_anna.role = 'TEAMLEAD'
      WHERE tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
        AND tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
    ) THEN '❌ PROBLEM: Anna ist NICHT TEAMLEAD in Tinas Team!'
    
    ELSE '✅ Kein Problem - alles korrekt konfiguriert'
  END as problem,
  
  -- Lösung
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 
      FROM team_members tm_tina
      JOIN team_members tm_anna ON tm_anna.team_id = tm_tina.team_id AND tm_anna.role = 'TEAMLEAD'
      WHERE tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
        AND tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
    ) THEN '💡 LÖSUNG: Führe QUERY 4 aus (unten)'
    
    ELSE 'Keine Aktion erforderlich'
  END as solution;


-- ============================================
-- QUERY 4: FIX - Anna als TEAMLEAD hinzufügen
-- ============================================
-- ⚠️ NUR AUSFÜHREN WENN QUERY 2 "❌ NEIN" zeigt!

DO $$
DECLARE
  v_tina_team_id uuid;
  v_anna_id uuid;
  v_tina_id uuid;
BEGIN
  -- Hole Tinas Team
  SELECT tm.team_id INTO v_tina_team_id 
  FROM team_members tm
  JOIN users u ON u.id = tm.user_id
  WHERE u.email = 'social@halterverbot123.de'
  LIMIT 1;
  
  -- Hole Anna & Tinas User IDs
  SELECT id INTO v_anna_id FROM users WHERE email = 'admin@halterverbot123.de';
  SELECT id INTO v_tina_id FROM users WHERE email = 'social@halterverbot123.de';
  
  -- Validierung
  IF v_tina_team_id IS NULL THEN
    RAISE EXCEPTION '❌ Tina ist in keinem Team!';
  END IF;
  
  IF v_anna_id IS NULL THEN
    RAISE EXCEPTION '❌ Anna nicht gefunden!';
  END IF;
  
  -- Anna als TEAMLEAD hinzufügen/updaten
  INSERT INTO team_members (team_id, user_id, role, priority_tag)
  VALUES (v_tina_team_id, v_anna_id, 'TEAMLEAD', 'PRIMARY')
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET 
    role = 'TEAMLEAD', 
    priority_tag = 'PRIMARY';
  
  RAISE NOTICE '✅ SUCCESS: Anna ist jetzt TEAMLEAD in Tinas Team!';
  RAISE NOTICE 'ℹ️ Führe QUERY 2 erneut aus um zu verifizieren';
END $$;
