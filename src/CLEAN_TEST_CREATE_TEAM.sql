-- =====================================================
-- CLEAN TEST: Neues Team "Test Büro" erstellen
-- =====================================================
-- Dieser Test erstellt ein frisches Team um die
-- Migration 045 Logik zu verifizieren
-- =====================================================

-- STEP 1: Lösche altes Test-Team falls vorhanden
DELETE FROM team_members 
WHERE team_id IN (
  SELECT id FROM teams WHERE name = 'Test Büro'
);

DELETE FROM teams WHERE name = 'Test Büro';

-- STEP 2: Erstelle neues Team "Test Büro"
-- Trigger sollte automatisch HR & SUPERADMIN als TEAMLEAD hinzufügen
-- ADMIN sollte NICHT automatisch hinzugefügt werden!

INSERT INTO teams (name, description)
VALUES ('Test Büro', 'Clean Test Team für Migration 045 Verification')
RETURNING id, name, created_at;

-- STEP 3: Warte kurz für Trigger...
SELECT pg_sleep(1);

-- STEP 4: Zeige was automatisch hinzugefügt wurde
SELECT 
  '=== AUTOMATISCH HINZUGEFÜGT ===' as info,
  CONCAT(u.first_name, ' ', u.last_name) as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  COALESCE(tm.priority_tag, 'KEIN TAG') as priority_tag,
  CASE 
    WHEN u.role = 'ADMIN' THEN '❌ ADMIN sollte NICHT auto-added sein!'
    WHEN u.role = 'HR' AND tm.priority_tag = 'BACKUP' THEN '✅ HR korrekt (BACKUP)'
    WHEN u.role = 'SUPERADMIN' AND tm.priority_tag = 'BACKUP_BACKUP' THEN '✅ SUPERADMIN korrekt (BACKUP_BACKUP)'
    ELSE '⚠️ Unerwartete Konfiguration'
  END as status
FROM team_members tm
JOIN users u ON u.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
WHERE t.name = 'Test Büro'
ORDER BY 
  CASE u.role
    WHEN 'ADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'SUPERADMIN' THEN 3
    ELSE 4
  END;

-- STEP 5: Anna manuell als PRIMARY Teamlead hinzufügen
INSERT INTO team_members (team_id, user_id, role, priority_tag)
SELECT 
  t.id,
  u.id,
  'TEAMLEAD',
  'PRIMARY'
FROM teams t
CROSS JOIN users u
WHERE t.name = 'Test Büro'
  AND u.email LIKE '%admin%'
  AND u.role = 'ADMIN'
ON CONFLICT (team_id, user_id) DO UPDATE
SET role = 'TEAMLEAD',
    priority_tag = 'PRIMARY';

-- STEP 6: Tina als Member hinzufügen
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id,
  u.id,
  'MEMBER'
FROM teams t
CROSS JOIN users u
WHERE t.name = 'Test Büro'
  AND u.email LIKE '%social%'
ON CONFLICT (team_id, user_id) DO UPDATE
SET role = 'MEMBER';

-- STEP 7: Zeige finales Team Setup
SELECT 
  '=== FINALES TEAM SETUP ===' as info,
  CONCAT(u.first_name, ' ', u.last_name) as member_name,
  u.email,
  u.role as global_role,
  tm.role as team_role,
  COALESCE(tm.priority_tag, 'KEIN TAG') as priority_tag,
  CASE 
    WHEN tm.priority_tag = 'PRIMARY' THEN '👑 PRIMARY'
    WHEN tm.priority_tag = 'BACKUP' THEN '🔄 BACKUP'
    WHEN tm.priority_tag = 'BACKUP_BACKUP' THEN '🔄 BACKUP_BACKUP'
    WHEN tm.role = 'MEMBER' THEN '👤 MEMBER'
    ELSE '❓ UNKNOWN'
  END as icon
FROM team_members tm
JOIN users u ON u.id = tm.user_id
JOIN teams t ON t.id = tm.team_id
WHERE t.name = 'Test Büro'
ORDER BY 
  CASE tm.priority_tag 
    WHEN 'PRIMARY' THEN 1 
    WHEN 'BACKUP' THEN 2 
    WHEN 'BACKUP_BACKUP' THEN 3 
    ELSE 4 
  END,
  u.first_name;

-- STEP 8: Teste Approval Logic
DO $$
DECLARE
  v_anna_id uuid;
  v_tina_id uuid;
  v_can_approve boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== 🧪 TEST APPROVAL LOGIC ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Get IDs
  SELECT id INTO v_anna_id FROM users WHERE email LIKE '%admin%' AND role = 'ADMIN';
  SELECT id INTO v_tina_id FROM users WHERE email LIKE '%social%';
  
  -- Test if Anna can approve
  SELECT EXISTS(
    SELECT 1 
    FROM team_members tm_anna
    JOIN team_members tm_tina ON tm_tina.team_id = tm_anna.team_id
    JOIN teams t ON t.id = tm_anna.team_id
    WHERE tm_anna.user_id = v_anna_id
      AND tm_tina.user_id = v_tina_id
      AND tm_anna.role = 'TEAMLEAD'
      AND t.name = 'Test Büro'
  ) INTO v_can_approve;
  
  IF v_can_approve THEN
    RAISE NOTICE '✅ SUCCESS: Anna KANN Tinas Antrag genehmigen!';
    RAISE NOTICE '';
    RAISE NOTICE 'Bedingungen erfüllt:';
    RAISE NOTICE '  1. Anna hat Global Role ADMIN ✅';
    RAISE NOTICE '  2. Anna ist TEAMLEAD in "Test Büro" ✅';
    RAISE NOTICE '  3. Tina ist Member in "Test Büro" ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Nächster Schritt:';
    RAISE NOTICE '→ Teste im Frontend!';
  ELSE
    RAISE NOTICE '❌ FAIL: Anna kann Tinas Antrag NICHT genehmigen!';
    RAISE NOTICE '';
    RAISE NOTICE 'Debug Info:';
    RAISE NOTICE '  Anna ID: %', v_anna_id;
    RAISE NOTICE '  Tina ID: %', v_tina_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- Team "Test Büro" sollte haben:
-- ✅ Anna (ADMIN) - TEAMLEAD - PRIMARY (manuell hinzugefügt)
-- ✅ Maria (HR) - TEAMLEAD - BACKUP (automatisch)
-- ✅ Stefan (SUPERADMIN) - TEAMLEAD - BACKUP_BACKUP (automatisch)
-- ✅ Tina (USER) - MEMBER (manuell hinzugefügt)
--
-- Test Result:
-- ✅ Anna KANN Tinas Antrag genehmigen
-- =====================================================
