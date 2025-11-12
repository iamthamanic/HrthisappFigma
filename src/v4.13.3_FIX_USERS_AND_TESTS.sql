-- ═══════════════════════════════════════════════════════════════════════════════
-- v4.13.3 - Fix Users & Tests Problem
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEM:
-- 1. Training Progress API findet keine Users (organization_id fehlt/falsch)
-- 2. Keine Tests/Quizzes in Datenbank (obwohl Frontend 1 Test zeigt)
--
-- LÖSUNG:
-- 1. Setze organization_id für alle Users
-- 2. Check ob quizzes Tabelle existiert und RLS korrekt ist
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ==================== STEP 1: CHECK CURRENT STATUS ====================

-- Check 1: Wie viele Users haben KEINE organization_id?
SELECT 
  COUNT(*) as users_without_org,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as null_org,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as has_org
FROM users;

-- Check 2: Welche Organization existiert?
SELECT id, name, is_default 
FROM organizations 
ORDER BY created_at;

-- Check 3: Existiert die quizzes Tabelle?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'quizzes'
) as quizzes_table_exists;

-- Check 4: Wie viele Quizzes existieren?
SELECT COUNT(*) as total_quizzes FROM quizzes;


-- ==================== STEP 2: FIX USERS ORGANIZATION ====================

-- Get default organization ID
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the default organization (or first one)
  SELECT id INTO default_org_id 
  FROM organizations 
  WHERE is_default = true 
  LIMIT 1;
  
  -- If no default, take the first one
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id 
    FROM organizations 
    ORDER BY created_at 
    LIMIT 1;
  END IF;
  
  -- Update all users without organization_id
  UPDATE users 
  SET organization_id = default_org_id 
  WHERE organization_id IS NULL;
  
  RAISE NOTICE 'Updated users to organization: %', default_org_id;
END $$;


-- ==================== STEP 3: VERIFY USERS FIX ====================

-- Check: All users should now have organization_id
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as without_org,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as with_org,
  COUNT(DISTINCT organization_id) as unique_orgs
FROM users;

-- Show all users with their organization
SELECT 
  id,
  email,
  CONCAT(first_name, ' ', last_name) as name,
  role,
  organization_id,
  (SELECT name FROM organizations WHERE id = users.organization_id) as org_name
FROM users
ORDER BY last_name;


-- ==================== STEP 4: CHECK QUIZZES/TESTS ====================

-- Check if quizzes exist
SELECT 
  id,
  title,
  video_id,
  passing_score,
  created_at,
  (SELECT title FROM video_content WHERE id = quizzes.video_id) as video_title
FROM quizzes
ORDER BY created_at DESC;

-- Check quiz questions
SELECT 
  qq.id,
  qq.quiz_id,
  q.title as quiz_title,
  qq.question_text,
  qq.question_type,
  qq.order_index
FROM quiz_questions qq
JOIN quizzes q ON qq.quiz_id = q.id
ORDER BY qq.quiz_id, qq.order_index;


-- ==================== STEP 5: CHECK RLS POLICIES ====================

-- Check RLS on quizzes table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'quizzes'
ORDER BY policyname;


-- ==================== VERIFICATION QUERIES ====================

-- Final Check 1: Can Training Progress API find users?
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.organization_id,
  o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.organization_id IS NOT NULL
ORDER BY u.last_name;

-- Final Check 2: Videos with organization
SELECT 
  id,
  title,
  organization_id,
  (SELECT name FROM organizations WHERE id = video_content.organization_id) as org_name,
  youtube_url
FROM video_content
ORDER BY title;

-- Final Check 3: Quizzes with video info
SELECT 
  q.id,
  q.title,
  q.video_id,
  v.title as video_title,
  (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
FROM quizzes q
LEFT JOIN video_content v ON q.video_id = v.id
ORDER BY q.created_at DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- EXPECTED RESULTS AFTER FIX:
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- 1. ALL users should have organization_id = '60f2a9c9-dc19-4edc-9491-900819649b4a'
-- 2. Training Progress API should return users array with all users
-- 3. Quizzes table should show existing quizzes (or be empty if none created yet)
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Quick Diagnosis Report
DO $$
DECLARE
  user_count INT;
  users_with_org INT;
  quiz_count INT;
  video_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO users_with_org FROM users WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO quiz_count FROM quizzes;
  SELECT COUNT(*) INTO video_count FROM video_content;
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'TRAINING COMPLIANCE SYSTEM - DIAGNOSIS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE 'Total Users: %', user_count;
  RAISE NOTICE 'Users with Organization: %', users_with_org;
  RAISE NOTICE 'Total Quizzes: %', quiz_count;
  RAISE NOTICE 'Total Videos: %', video_count;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  
  IF users_with_org = user_count THEN
    RAISE NOTICE '✅ ALL users have organization_id!';
  ELSE
    RAISE WARNING '❌ % users missing organization_id!', user_count - users_with_org;
  END IF;
  
  IF quiz_count > 0 THEN
    RAISE NOTICE '✅ Quizzes exist: %', quiz_count;
  ELSE
    RAISE WARNING '⚠️  No quizzes found in database!';
  END IF;
END $$;
