-- ============================================
-- SHOW EVERYTHING - No filters!
-- ============================================

-- 1️⃣ ALLE USER
SELECT 
  '=== 1️⃣ ALLE USER ===' as info,
  id,
  email,
  first_name,
  last_name,
  role as global_role,
  created_at
FROM users
ORDER BY created_at DESC;


-- 2️⃣ ALLE TEAMS
SELECT 
  '=== 2️⃣ ALLE TEAMS ===' as info,
  id,
  name,
  description,
  created_at
FROM teams
ORDER BY name;


-- 3️⃣ ALLE TEAM-MITGLIEDSCHAFTEN (mit Rollen!)
-- ⭐ WICHTIGSTE QUERY ⭐
SELECT 
  '=== 3️⃣ TEAM-MITGLIEDSCHAFTEN ===' as info,
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
    ELSE '❓ ' || COALESCE(tm.role::text, 'NULL')
  END as role_status
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


-- 4️⃣ URLAUBSANTRÄGE (falls vorhanden)
SELECT 
  '=== 4️⃣ URLAUBSANTRÄGE ===' as info,
  lr.id,
  lr.type as leave_type,
  lr.start_date,
  lr.end_date,
  lr.status,
  u.email as employee_email,
  u.first_name || ' ' || u.last_name as employee_name,
  approver.email as approver_email,
  approver.first_name || ' ' || approver.last_name as approver_name,
  lr.created_at
FROM leave_requests lr
JOIN users u ON u.id = lr.user_id
LEFT JOIN users approver ON approver.id = lr.approved_by
ORDER BY lr.created_at DESC
LIMIT 20;
