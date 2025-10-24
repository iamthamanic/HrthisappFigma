-- ============================================
-- PART 1: DIAGNOSIS QUERIES
-- Führe dies ZUERST aus
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


-- ============================================
-- ✅ FERTIG! 
-- Schau dir die Ergebnisse an und führe dann PART 2 aus
-- ============================================
