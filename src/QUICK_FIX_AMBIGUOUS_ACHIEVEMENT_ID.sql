-- ============================================
-- QUICK FIX: Ambiguous achievement_id in check_and_unlock_coin_achievements
-- ============================================
-- Error: column reference "achievement_id" is ambiguous
-- Fix: Qualify all column references with proper aliases
-- ============================================

-- Drop and recreate the function with fixed column references
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

-- Test the function
DO $$
DECLARE
  v_test_user UUID;
  v_result RECORD;
BEGIN
  -- Get a test user (any user)
  SELECT id INTO v_test_user FROM users LIMIT 1;
  
  IF v_test_user IS NOT NULL THEN
    RAISE NOTICE '✅ Testing function with user: %', v_test_user;
    
    -- Test the function (this will show newly unlocked achievements)
    FOR v_result IN 
      SELECT * FROM check_and_unlock_coin_achievements(v_test_user)
    LOOP
      RAISE NOTICE '   🏆 Unlocked: % (% coins required)', v_result.title, v_result.required_coins;
    END LOOP;
    
    RAISE NOTICE '✅ Function test complete!';
  ELSE
    RAISE NOTICE '⚠️ No users found - skipping test';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 FUNCTION FIX COMPLETE!';
  RAISE NOTICE '✅ check_and_unlock_coin_achievements() fixed';
  RAISE NOTICE '✅ Ambiguous column references resolved';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 NEXT: Hard Refresh (Cmd/Ctrl + Shift + R)';
  RAISE NOTICE '📍 Then navigate to: /benefits → Achievements Tab';
END $$;
