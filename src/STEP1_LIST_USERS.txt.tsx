-- Check auth.users (Supabase Auth table)
SELECT 
  au.id,
  au.email,
  au.created_at,
  'AUTH_ONLY' as source
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ORDER BY au.email;

-- Check public.users (Profile table)
SELECT 
  id,
  email,
  first_name,
  last_name,
  role as global_role,
  'PROFILE' as source
FROM public.users
ORDER BY email;

-- Check team_members (Team assignments)
SELECT 
  u.email,
  u.first_name || ' ' || u.last_name as name,
  u.role as global_role,
  tm.role as team_role,
  tm.priority_tag,
  t.name as team_name
FROM public.users u
LEFT JOIN team_members tm ON u.id = tm.user_id
LEFT JOIN teams t ON tm.team_id = t.id
ORDER BY t.name, tm.role DESC, tm.priority_tag ASC;