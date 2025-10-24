-- ============================================
-- SINGLE QUERY: Zeigt ALLES auf einmal
-- ============================================

WITH 
  all_users AS (
    SELECT 
      id,
      email,
      first_name,
      last_name,
      role as global_role,
      created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 20
  ),
  all_teams AS (
    SELECT 
      id,
      name,
      description,
      created_at
    FROM teams
    ORDER BY name
  ),
  all_memberships AS (
    SELECT 
      t.id as team_id,
      t.name as team_name,
      u.id as user_id,
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
      u.email
  )

SELECT 
  '=== 👥 ALLE USER ===' as section,
  email,
  first_name,
  last_name,
  global_role,
  NULL::text as team_name,
  NULL::text as team_role,
  NULL::text as priority_tag,
  NULL::text as role_emoji
FROM all_users

UNION ALL

SELECT 
  '=== 🏢 ALLE TEAMS ===' as section,
  name::text as email,
  description as first_name,
  NULL::text as last_name,
  NULL::text as global_role,
  NULL::text as team_name,
  NULL::text as team_role,
  NULL::text as priority_tag,
  NULL::text as role_emoji
FROM all_teams

UNION ALL

SELECT 
  '=== 👥📋 TEAM-MITGLIEDSCHAFTEN ===' as section,
  email,
  first_name,
  last_name,
  global_role,
  team_name,
  team_role,
  priority_tag,
  role_emoji
FROM all_memberships

ORDER BY section DESC, email;
