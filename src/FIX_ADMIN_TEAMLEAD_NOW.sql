-- =====================================================
-- SOFORT-FIX: Anna Admin als TEAMLEAD hinzufügen
-- =====================================================
-- Führe dieses SQL in Supabase aus, um:
-- 1. Alle ADMIN-Benutzer als TEAMLEAD zu allen Teams hinzuzufügen
-- 2. Das Problem "Kein Zuständiger" bei Tina Test zu beheben
-- 3. Anna Admin Genehmigungsrechte zu geben
-- =====================================================

-- Step 1: Füge alle ADMIN-Benutzer als TEAMLEAD zu allen Teams hinzu
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  t.id as team_id,
  u.id as user_id,
  'TEAMLEAD' as role
FROM teams t
CROSS JOIN users u
WHERE u.role = 'ADMIN'
AND NOT EXISTS (
  -- Nicht hinzufügen, wenn bereits Mitglied
  SELECT 1 FROM team_members tm 
  WHERE tm.team_id = t.id 
  AND tm.user_id = u.id
)
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Step 2: Aktualisiere bestehende ADMIN Team-Mitgliedschaften auf TEAMLEAD
UPDATE team_members tm
SET role = 'TEAMLEAD'
FROM users u
WHERE tm.user_id = u.id
AND u.role = 'ADMIN'
AND tm.role != 'TEAMLEAD';

-- =====================================================
-- VERIFICATION: Zeige Ergebnis für ADMIN-Benutzer
-- =====================================================

SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as name,
  u.role as global_role,
  t.name as team,
  tm.role as team_role
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE u.role = 'ADMIN'
ORDER BY u.first_name, u.last_name, t.name;

-- =====================================================
-- ERWARTETES ERGEBNIS:
-- Anna Admin | ADMIN | Team 1    | TEAMLEAD
-- Anna Admin | ADMIN | Team 2    | TEAMLEAD  
-- Anna Admin | ADMIN | Team 3    | TEAMLEAD
-- Anna Admin | ADMIN | Büro 2    | TEAMLEAD
-- =====================================================

-- ℹ️ HINWEIS: Nach Ausführung dieses SQL:
-- ✅ Browser-Refresh machen
-- ✅ Tina Test's Antrag zeigt jetzt "Anna Admin" als Zuständige
-- ✅ Anna kann den Antrag genehmigen
-- =====================================================
