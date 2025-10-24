-- ============================================
-- FIX: Anna Admin als TEAMLEAD setzen
-- ============================================
-- Dieses Script macht Anna Admin zum TEAMLEAD von Tinas Team
-- und gibt ihr damit die Berechtigung, Tinas Urlaubs-Anträge zu genehmigen

DO $$
DECLARE
  v_team_id uuid;
  v_tina_id uuid;
  v_anna_id uuid;
  v_tina_email text := 'social@halterverbot123.de';  -- Tina Test
  v_anna_email text := 'admin@halterverbot123.de';   -- Anna Admin
BEGIN
  -- Hole User IDs
  SELECT id INTO v_tina_id FROM users WHERE email = v_tina_email;
  SELECT id INTO v_anna_id FROM users WHERE email = v_anna_email;
  
  IF v_tina_id IS NULL THEN
    RAISE EXCEPTION 'Tina Test (%) nicht gefunden!', v_tina_email;
  END IF;
  
  IF v_anna_id IS NULL THEN
    RAISE EXCEPTION 'Anna Admin (%) nicht gefunden!', v_anna_email;
  END IF;
  
  -- Finde Tinas Team
  SELECT team_id INTO v_team_id FROM team_members WHERE user_id = v_tina_id LIMIT 1;
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Tina ist in keinem Team! Bitte erst Team erstellen.';
  END IF;
  
  -- Anna als TEAMLEAD mit PRIMARY priority tag hinzufügen/updaten
  INSERT INTO team_members (team_id, user_id, role, priority_tag)
  VALUES (v_team_id, v_anna_id, 'TEAMLEAD', 'PRIMARY')
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET 
    role = 'TEAMLEAD', 
    priority_tag = 'PRIMARY';
  
  RAISE NOTICE '✅ SUCCESS!';
  RAISE NOTICE '✅ Anna Admin (%) ist jetzt TEAMLEAD (PRIMARY) in Team %', v_anna_email, v_team_id;
  RAISE NOTICE '✅ Sie kann jetzt Tinas Urlaubs-Anträge genehmigen!';
  
  -- Zeige alle Team-Mitglieder zur Überprüfung
  RAISE NOTICE '';
  RAISE NOTICE '📋 Team-Mitglieder:';
  FOR v_anna_email, v_anna_id IN 
    SELECT u.email, tm.role 
    FROM team_members tm 
    JOIN users u ON u.id = tm.user_id 
    WHERE tm.team_id = v_team_id
  LOOP
    RAISE NOTICE '  - % (Role: %)', v_anna_email, v_anna_id;
  END LOOP;
END $$;
