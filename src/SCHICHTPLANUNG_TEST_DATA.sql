-- =====================================================
-- SCHICHTPLANUNG - TEST DATEN
-- =====================================================
-- Quick test data for Shift Planning system
-- Run this AFTER CREATE_SHIFTS_TABLE.sql + v4.12.0 migration
-- =====================================================

-- =====================================================
-- 1. GET SOME USER IDs (to use in shifts)
-- =====================================================
DO $$
DECLARE
  test_user_id UUID;
  test_team_id UUID;
  test_location_id UUID;
  test_department_id UUID;
BEGIN
  -- Get first user
  SELECT id INTO test_user_id FROM public.users WHERE role = 'EMPLOYEE' LIMIT 1;
  
  -- Get first team
  SELECT id INTO test_team_id FROM public.teams LIMIT 1;
  
  -- Get first location
  SELECT id INTO test_location_id FROM public.locations LIMIT 1;
  
  -- Get first department
  SELECT id INTO test_department_id FROM public.departments LIMIT 1;
  
  -- Create test shifts for this week
  IF test_user_id IS NOT NULL THEN
    -- Monday shift
    INSERT INTO public.shifts (
      user_id,
      team_id,
      date,
      shift_type,
      start_time,
      end_time,
      specialization,
      location_id,
      department_id,
      notes
    ) VALUES (
      test_user_id,
      test_team_id,
      CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1, -- This Monday
      'MORNING',
      '08:00',
      '16:00',
      'Baustelle',
      test_location_id,
      test_department_id,
      'Test Schicht Montag'
    ) ON CONFLICT DO NOTHING;
    
    -- Wednesday shift
    INSERT INTO public.shifts (
      user_id,
      team_id,
      date,
      shift_type,
      start_time,
      end_time,
      specialization,
      location_id,
      department_id,
      notes
    ) VALUES (
      test_user_id,
      test_team_id,
      CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 3, -- This Wednesday
      'AFTERNOON',
      '12:00',
      '20:00',
      'BACKSTUBE',
      test_location_id,
      test_department_id,
      'Test Schicht Mittwoch'
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Created 2 test shifts for user %', test_user_id;
  ELSE
    RAISE NOTICE '⚠️  No users found - cannot create test shifts';
  END IF;
END $$;

-- =====================================================
-- 2. ADD SOME SPECIALIZATIONS TO USERS
-- =====================================================
-- Update first 5 users with different specializations
UPDATE public.users
SET specialization = (
  CASE 
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 0 THEN 'Baustelle'
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 1 THEN 'BACKSTUBE'
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 2 THEN 'GEMÜSE'
    WHEN MOD(ROW_NUMBER() OVER (ORDER BY id), 5) = 3 THEN 'SCHUMIBÄCKER ZONE'
    ELSE 'NETZWERKRAUM-APPLE'
  END
)
WHERE role = 'EMPLOYEE'
  AND id IN (
    SELECT id FROM public.users 
    WHERE role = 'EMPLOYEE' 
    LIMIT 5
  );

RAISE NOTICE '✅ Added specializations to 5 users';

-- =====================================================
-- 3. VERIFICATION
-- =====================================================
-- Show what we created
DO $$
DECLARE
  shifts_count INTEGER;
  users_with_spec INTEGER;
BEGIN
  SELECT COUNT(*) INTO shifts_count FROM public.shifts;
  SELECT COUNT(*) INTO users_with_spec FROM public.users WHERE specialization IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ TEST DATA CREATED';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total shifts: %', shifts_count;
  RAISE NOTICE 'Users with specialization: %', users_with_spec;
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Open Field Verwaltung → Einsatzplanung → Schichtplanung';
  RAISE NOTICE '================================================';
END $$;

-- Display created shifts
SELECT 
  s.id,
  u.first_name || ' ' || u.last_name as employee,
  s.date,
  s.shift_type,
  s.start_time || ' - ' || s.end_time as time_range,
  s.specialization,
  l.name as location,
  d.name as department
FROM public.shifts s
LEFT JOIN public.users u ON s.user_id = u.id
LEFT JOIN public.locations l ON s.location_id = l.id
LEFT JOIN public.departments d ON s.department_id = d.id
ORDER BY s.date, s.start_time
LIMIT 10;
