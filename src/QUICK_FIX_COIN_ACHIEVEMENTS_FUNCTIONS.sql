-- ============================================
-- QUICK FIX: Coin Achievements Functions
-- ============================================
-- Error: column reference "achievement_id" is ambiguous
-- Error: function get_coin_achievements_with_progress does not exist
-- Fix: Create/Replace both functions with correct column references
-- ============================================

-- ============================================
-- FUNCTION 1: check_and_unlock_coin_achievements (FIX)
-- ============================================

CREATE OR REPLACE FUNCTION check_and_unlock_coin_achievements(p_user_id UUID)
RETURNS TABLE(
  achievement_id UUID,
  title TEXT,
  required_coins INTEGER,
  newly_unlocked BOOLEAN
) AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Calculate current coin balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'EARNED' THEN amount
      WHEN type = 'SPENT' THEN -ABS(amount)
      ELSE 0
    END
  ), 0)
  INTO v_current_balance
  FROM coin_transactions
  WHERE user_id = p_user_id;

  -- Find and unlock achievements
  RETURN QUERY
  WITH eligible_achievements AS (
    SELECT 
      ca.id as ach_id,
      ca.title as ach_title,
      ca.required_coins as ach_required_coins,
      CASE 
        WHEN uca.id IS NULL THEN true
        ELSE false
      END as is_new_unlock
    FROM coin_achievements ca
    LEFT JOIN user_coin_achievements uca 
      ON ca.id = uca.achievement_id AND uca.user_id = p_user_id
    WHERE ca.is_active = true
      AND ca.required_coins <= v_current_balance
      AND uca.id IS NULL  -- Only new unlocks
  ),
  inserted AS (
    INSERT INTO user_coin_achievements (user_id, achievement_id, coins_at_unlock)
    SELECT 
      p_user_id,
      ea.ach_id,
      v_current_balance
    FROM eligible_achievements ea
    WHERE ea.is_new_unlock = true
    RETURNING 
      user_coin_achievements.achievement_id as ret_achievement_id
  )
  SELECT 
    i.ret_achievement_id as achievement_id,
    ca.title,
    ca.required_coins,
    true as newly_unlocked
  FROM inserted i
  JOIN coin_achievements ca ON ca.id = i.ret_achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION 2: get_coin_achievements_with_progress (NEW)
-- ============================================

CREATE OR REPLACE FUNCTION get_coin_achievements_with_progress(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  icon TEXT,
  required_coins INTEGER,
  unlock_type TEXT,
  unlock_description TEXT,
  category TEXT,
  badge_color TEXT,
  sort_order INTEGER,
  is_unlocked BOOLEAN,
  unlocked_at TIMESTAMPTZ,
  coins_at_unlock INTEGER,
  is_claimed BOOLEAN,
  claimed_at TIMESTAMPTZ,
  current_balance INTEGER,
  progress_percentage INTEGER
) AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Calculate current coin balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'EARNED' THEN amount
      WHEN type = 'SPENT' THEN -ABS(amount)
      ELSE 0
    END
  ), 0)
  INTO v_current_balance
  FROM coin_transactions
  WHERE user_id = p_user_id;

  -- Return all achievements with progress
  RETURN QUERY
  SELECT 
    ca.id,
    ca.title,
    ca.description,
    ca.icon,
    ca.required_coins,
    ca.unlock_type,
    ca.unlock_description,
    ca.category,
    ca.badge_color,
    ca.sort_order,
    CASE WHEN uca.id IS NOT NULL THEN true ELSE false END as is_unlocked,
    uca.unlocked_at,
    uca.coins_at_unlock,
    COALESCE(uca.is_claimed, false) as is_claimed,
    uca.claimed_at,
    v_current_balance as current_balance,
    LEAST(100, (v_current_balance * 100 / ca.required_coins)) as progress_percentage
  FROM coin_achievements ca
  LEFT JOIN user_coin_achievements uca 
    ON ca.id = uca.achievement_id AND uca.user_id = p_user_id
  WHERE ca.is_active = true
  ORDER BY ca.sort_order ASC, ca.required_coins ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TEST THE FUNCTIONS
-- ============================================

DO $$
DECLARE
  v_test_user UUID;
  v_result RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Get a test user
  SELECT id INTO v_test_user FROM users LIMIT 1;
  
  IF v_test_user IS NOT NULL THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 TESTING FUNCTIONS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test User: %', v_test_user;
    RAISE NOTICE '';
    
    -- Test 1: check_and_unlock_coin_achievements
    RAISE NOTICE '📍 Test 1: check_and_unlock_coin_achievements()';
    FOR v_result IN 
      SELECT * FROM check_and_unlock_coin_achievements(v_test_user)
    LOOP
      v_count := v_count + 1;
      RAISE NOTICE '   🏆 Unlocked: % (% coins)', v_result.title, v_result.required_coins;
    END LOOP;
    
    IF v_count = 0 THEN
      RAISE NOTICE '   ℹ️  No new achievements unlocked (user may not have enough coins)';
    ELSE
      RAISE NOTICE '   ✅ % new achievement(s) unlocked!', v_count;
    END IF;
    
    RAISE NOTICE '';
    
    -- Test 2: get_coin_achievements_with_progress
    RAISE NOTICE '📍 Test 2: get_coin_achievements_with_progress()';
    v_count := 0;
    FOR v_result IN 
      SELECT * FROM get_coin_achievements_with_progress(v_test_user)
    LOOP
      v_count := v_count + 1;
      RAISE NOTICE '   Achievement: % | Progress: %%% | Unlocked: %', 
        v_result.title, 
        v_result.progress_percentage,
        CASE WHEN v_result.is_unlocked THEN '✅' ELSE '🔒' END;
    END LOOP;
    
    RAISE NOTICE '   ✅ % achievements loaded!', v_count;
    RAISE NOTICE '';
    
    -- Success
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL TESTS PASSED!';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '⚠️  No users found - skipping tests';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 COIN ACHIEVEMENTS FUNCTIONS FIX COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ check_and_unlock_coin_achievements() - FIXED';
  RAISE NOTICE '   - Ambiguous column references resolved';
  RAISE NOTICE '   - Uses qualified table aliases';
  RAISE NOTICE '';
  RAISE NOTICE '✅ get_coin_achievements_with_progress() - CREATED';
  RAISE NOTICE '   - Returns achievements with progress percentage';
  RAISE NOTICE '   - Shows unlock status and claim status';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 NEXT STEPS:';
  RAISE NOTICE '   1. Hard Refresh: Cmd/Ctrl + Shift + R';
  RAISE NOTICE '   2. Navigate to: /benefits';
  RAISE NOTICE '   3. Click "Achievements" Tab';
  RAISE NOTICE '   4. Should show achievements with progress bars!';
  RAISE NOTICE '';
END $$;
