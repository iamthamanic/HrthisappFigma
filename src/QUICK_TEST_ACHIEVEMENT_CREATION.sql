-- ============================================
-- QUICK TEST: Achievement Creation (Admin)
-- ============================================
-- Test Script für v3.9.1 Achievement Management
-- ============================================

-- ============================================
-- TEST 1: Count Existing Achievements
-- ============================================

SELECT 
  COUNT(*) as total_achievements,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_achievements,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_achievements
FROM coin_achievements;

-- Expected: 7 demo achievements (all active)

-- ============================================
-- TEST 2: List All Achievements
-- ============================================

SELECT 
  title,
  required_coins,
  category,
  badge_color,
  unlock_type,
  sort_order,
  is_active,
  created_at
FROM coin_achievements
ORDER BY sort_order ASC, required_coins ASC;

-- Expected: 7 rows from demo data

-- ============================================
-- TEST 3: Create Test Achievement (Manual)
-- ============================================

-- This should work if you're logged in as ADMIN/HR/SUPERADMIN
INSERT INTO coin_achievements (
  title,
  description,
  icon,
  required_coins,
  unlock_type,
  unlock_description,
  category,
  badge_color,
  sort_order,
  is_active
) VALUES (
  'Test Achievement',
  'Dies ist ein Test Achievement',
  'Crown',
  999,
  'PRIVILEGE',
  'Gratulation! Test Achievement freigeschaltet.',
  'MILESTONE',
  'gold',
  99,
  true
) RETURNING *;

-- Expected: New row created with all fields

-- ============================================
-- TEST 4: Verify RLS (Admin Access)
-- ============================================

-- Check if current user has admin role
SELECT 
  id,
  email,
  role,
  CASE 
    WHEN role IN ('ADMIN', 'HR', 'SUPERADMIN') THEN '✅ Has Admin Access'
    ELSE '❌ No Admin Access'
  END as admin_status
FROM users
WHERE id = auth.uid();

-- Expected: Shows your role and admin status

-- ============================================
-- TEST 5: Check Achievement Categories
-- ============================================

SELECT 
  category,
  COUNT(*) as count,
  MIN(required_coins) as min_coins,
  MAX(required_coins) as max_coins
FROM coin_achievements
WHERE is_active = true
GROUP BY category
ORDER BY category;

-- Expected:
-- MILESTONE: 3-4 achievements
-- EVENT: 2-3 achievements
-- EXCLUSIVE: 2-3 achievements

-- ============================================
-- TEST 6: Check Badge Color Distribution
-- ============================================

SELECT 
  badge_color,
  COUNT(*) as count,
  ARRAY_AGG(title ORDER BY required_coins) as titles
FROM coin_achievements
WHERE is_active = true
GROUP BY badge_color
ORDER BY 
  CASE badge_color
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'platinum' THEN 4
  END;

-- Expected:
-- bronze: Coin Starter (100)
-- silver: Coin Sammler (500)
-- gold: Coin Master, Premium Lunch, Home Office Elite
-- platinum: Firmenreise, Coin Legend

-- ============================================
-- TEST 7: Check Recent Achievements
-- ============================================

SELECT 
  title,
  required_coins,
  created_at,
  AGE(NOW(), created_at) as age
FROM coin_achievements
ORDER BY created_at DESC
LIMIT 5;

-- Expected: Shows newest achievements first

-- ============================================
-- TEST 8: Simulate User Achievement Progress
-- ============================================

WITH user_balance AS (
  SELECT 
    user_id,
    COALESCE(SUM(
      CASE 
        WHEN type = 'EARNED' THEN amount
        WHEN type = 'SPENT' THEN -ABS(amount)
        ELSE 0
      END
    ), 0) as current_balance
  FROM coin_transactions
  WHERE user_id = auth.uid()
  GROUP BY user_id
)
SELECT 
  ca.title,
  ca.required_coins,
  ub.current_balance,
  CASE 
    WHEN ub.current_balance >= ca.required_coins THEN '✅ Unlocked'
    ELSE '🔒 Locked'
  END as status,
  LEAST(100, (ub.current_balance * 100 / ca.required_coins)) as progress_percentage
FROM coin_achievements ca
CROSS JOIN user_balance ub
WHERE ca.is_active = true
ORDER BY ca.sort_order ASC, ca.required_coins ASC;

-- Expected: Shows which achievements you can unlock

-- ============================================
-- TEST 9: Check User Unlocked Achievements
-- ============================================

SELECT 
  ca.title,
  uca.unlocked_at,
  uca.coins_at_unlock,
  uca.is_claimed,
  uca.claimed_at
FROM user_coin_achievements uca
JOIN coin_achievements ca ON ca.id = uca.achievement_id
WHERE uca.user_id = auth.uid()
ORDER BY uca.unlocked_at DESC;

-- Expected: Shows achievements you've unlocked

-- ============================================
-- TEST 10: Achievement Stats
-- ============================================

WITH user_stats AS (
  SELECT 
    COUNT(*) as total_unlocked,
    COUNT(CASE WHEN is_claimed = true THEN 1 END) as total_claimed,
    MAX(unlocked_at) as last_unlock
  FROM user_coin_achievements
  WHERE user_id = auth.uid()
)
SELECT 
  (SELECT COUNT(*) FROM coin_achievements WHERE is_active = true) as total_achievements,
  COALESCE(us.total_unlocked, 0) as unlocked_achievements,
  COALESCE(us.total_claimed, 0) as claimed_achievements,
  us.last_unlock
FROM user_stats us;

-- Expected: Shows your achievement statistics

-- ============================================
-- SUCCESS INDICATORS
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Check achievements exist
  SELECT COUNT(*) INTO v_count FROM coin_achievements;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 ACHIEVEMENT CREATION TEST RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total Achievements: %', v_count;
  
  IF v_count >= 7 THEN
    RAISE NOTICE '   ✅ Demo achievements exist!';
  ELSE
    RAISE NOTICE '   ⚠️  Expected at least 7 demo achievements!';
  END IF;
  
  -- Check admin access
  SELECT role IN ('ADMIN', 'HR', 'SUPERADMIN') 
  INTO v_is_admin
  FROM users 
  WHERE id = auth.uid();
  
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Admin Access Check:';
  IF v_is_admin THEN
    RAISE NOTICE '   ✅ You have admin access!';
    RAISE NOTICE '   ✅ Can create/edit/delete achievements';
  ELSE
    RAISE NOTICE '   ❌ No admin access';
    RAISE NOTICE '   ℹ️  Only ADMIN/HR/SUPERADMIN can manage achievements';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TEST COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 NEXT: Navigate to /admin/benefits-management';
  RAISE NOTICE '📍 Click "Achievements" Tab';
  RAISE NOTICE '🎯 Create your first custom achievement!';
  RAISE NOTICE '';
END $$;
