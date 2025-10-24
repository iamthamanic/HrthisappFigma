-- Check Tina Test's leave requests
SELECT 
  id,
  user_id,
  start_date,
  end_date,
  type,
  status,
  total_days,
  withdrawn_at,
  cancelled_at,
  created_at
FROM leave_requests
WHERE user_id IN (
  SELECT id FROM users WHERE email = 'tina@test.com'
)
ORDER BY created_at DESC;

-- Check if Tina Test is in any teams
SELECT 
  tm.id,
  tm.user_id,
  tm.team_id,
  tm.role as team_role,
  t.name as team_name,
  u.first_name,
  u.last_name,
  u.email
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id
WHERE u.email = 'tina@test.com';

-- Check if Anna Admin is a TEAMLEAD in Tina's teams
SELECT 
  tm.id,
  tm.user_id,
  tm.team_id,
  tm.role as team_role,
  tm.priority_tag,
  t.name as team_name,
  u.first_name,
  u.last_name,
  u.email,
  u.role as global_role
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
JOIN users u ON tm.user_id = u.id
WHERE tm.team_id IN (
  SELECT team_id FROM team_members WHERE user_id IN (
    SELECT id FROM users WHERE email = 'tina@test.com'
  )
)
AND tm.role = 'TEAMLEAD'
ORDER BY tm.priority_tag DESC;

-- Check Anna Admin's role and team memberships
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role as global_role,
  tm.team_id,
  tm.role as team_role,
  tm.priority_tag,
  t.name as team_name
FROM users u
LEFT JOIN team_members tm ON u.id = tm.user_id
LEFT JOIN teams t ON tm.team_id = t.id
WHERE u.email = 'anna@admin.com';

-- Check if withdrawn_at and cancelled_at columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
AND column_name IN ('withdrawn_at', 'cancelled_at')
ORDER BY column_name;

-- FIX: Setup team memberships
DO $$
DECLARE
  v_team_id uuid;
  v_tina_id uuid;
  v_anna_id uuid;
BEGIN
  SELECT id INTO v_tina_id FROM users WHERE email = 'tina@test.com';
  SELECT id INTO v_anna_id FROM users WHERE email = 'anna@admin.com';
  
  IF v_tina_id IS NULL THEN
    RAISE NOTICE 'Tina Test not found';
    RETURN;
  END IF;
  
  IF v_anna_id IS NULL THEN
    RAISE NOTICE 'Anna Admin not found';
    RETURN;
  END IF;
  
  SELECT team_id INTO v_team_id 
  FROM team_members 
  WHERE user_id = v_tina_id 
  LIMIT 1;
  
  IF v_team_id IS NULL THEN
    INSERT INTO teams (name, description)
    VALUES ('Standard Team', 'Automatisch erstelltes Team')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_team_id;
    
    IF v_team_id IS NULL THEN
      SELECT id INTO v_team_id FROM teams LIMIT 1;
    END IF;
    
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (v_team_id, v_tina_id, 'MEMBER')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Added Tina Test to team %', v_team_id;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = v_team_id 
    AND user_id = v_anna_id 
    AND role = 'TEAMLEAD'
  ) THEN
    INSERT INTO team_members (team_id, user_id, role, priority_tag)
    VALUES (v_team_id, v_anna_id, 'TEAMLEAD', 1)
    ON CONFLICT (team_id, user_id) 
    DO UPDATE SET 
      role = 'TEAMLEAD',
      priority_tag = 1;
    
    RAISE NOTICE 'Added Anna Admin as TEAMLEAD to team %', v_team_id;
  END IF;
  
  RAISE NOTICE 'Team setup complete: Tina (MEMBER) and Anna (TEAMLEAD) in team %', v_team_id;
END $$;

-- FIX: Ensure columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' AND column_name = 'withdrawn_at'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN withdrawn_at timestamptz DEFAULT NULL;
    RAISE NOTICE 'Added withdrawn_at column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN cancelled_at timestamptz DEFAULT NULL;
    RAISE NOTICE 'Added cancelled_at column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' AND column_name = 'cancelled_by'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN cancelled_by uuid REFERENCES users(id) DEFAULT NULL;
    RAISE NOTICE 'Added cancelled_by column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' AND column_name = 'cancellation_confirmed'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN cancellation_confirmed boolean DEFAULT false;
    RAISE NOTICE 'Added cancellation_confirmed column';
  END IF;
END $$;

-- Verify team setup
SELECT 
  'Team Setup' as check_type,
  u.email,
  u.first_name,
  u.last_name,
  tm.role as team_role,
  tm.priority_tag,
  t.name as team_name
FROM users u
JOIN team_members tm ON u.id = tm.user_id
JOIN teams t ON tm.team_id = t.id
WHERE u.email IN ('tina@test.com', 'anna@admin.com')
ORDER BY t.name, tm.role DESC, tm.priority_tag DESC;

-- Verify columns exist
SELECT 
  'Column Check' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leave_requests'
AND column_name IN ('withdrawn_at', 'cancelled_at', 'cancelled_by', 'cancellation_confirmed')
ORDER BY column_name;

-- Show all leave requests for Tina
SELECT 
  'Tina Leave Requests' as check_type,
  lr.id,
  lr.start_date,
  lr.end_date,
  lr.type,
  lr.status,
  lr.total_days,
  lr.withdrawn_at IS NOT NULL as is_withdrawn,
  lr.cancelled_at IS NOT NULL as is_cancelled,
  lr.created_at
FROM leave_requests lr
WHERE lr.user_id IN (SELECT id FROM users WHERE email = 'tina@test.com')
ORDER BY lr.created_at DESC;
