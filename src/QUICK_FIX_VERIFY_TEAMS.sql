-- ==============================================
-- QUICK FIX: Zeige Anna & Tina Teams
-- ==============================================

-- Zeige alles auf einen Blick
SELECT 
  'ANNA ADMIN' as person,
  u.email,
  u.role as global_role,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email = 'admin@halterverbot123.de'

UNION ALL

SELECT 
  'TINA TEST' as person,
  u.email,
  u.role as global_role,
  t.name as team_name,
  tm.role as team_role,
  tm.priority_tag
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE u.email = 'social@halterverbot123.de'

ORDER BY person, team_name;

-- Schnellcheck: Sind sie im gleichen Team?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM team_members tm_anna
      JOIN team_members tm_tina ON tm_anna.team_id = tm_tina.team_id
      WHERE tm_anna.user_id = (SELECT id FROM users WHERE email = 'admin@halterverbot123.de')
        AND tm_tina.user_id = (SELECT id FROM users WHERE email = 'social@halterverbot123.de')
        AND tm_anna.role = 'TEAMLEAD'
    ) THEN '✅ JA - Anna ist TEAMLEAD in Tinas Team'
    ELSE '❌ NEIN - Anna ist NICHT im gleichen Team oder nicht TEAMLEAD'
  END as result;
