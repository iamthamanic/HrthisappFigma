-- ============================================
-- COIN ACHIEVEMENTS SYSTEM (v3.9.0)
-- ============================================
-- Description: Unlockable achievements based on coin balance
-- Example: "2500 Coins = Qualified for company trip"
-- These DON'T cost coins - you just need to HAVE the balance
-- ============================================

-- ============================================
-- 1. COIN ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS coin_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Trophy', -- Lucide icon name
  
  -- Requirements
  required_coins INTEGER NOT NULL CHECK (required_coins > 0),
  
  -- Reward/Unlock
  unlock_type TEXT NOT NULL CHECK (unlock_type IN ('ACCESS', 'PRIVILEGE', 'BENEFIT', 'EVENT')),
  unlock_description TEXT, -- What you get access to
  
  -- Metadata
  category TEXT NOT NULL DEFAULT 'MILESTONE' CHECK (category IN ('MILESTONE', 'EVENT', 'EXCLUSIVE', 'SEASONAL')),
  badge_color TEXT NOT NULL DEFAULT 'gold', -- UI color: gold, silver, bronze, platinum
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. USER COIN ACHIEVEMENTS (Unlocked Status)
-- ============================================

CREATE TABLE IF NOT EXISTS user_coin_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES coin_achievements(id) ON DELETE CASCADE,
  
  -- Unlock Info
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  coins_at_unlock INTEGER NOT NULL, -- How many coins did they have when unlocked?
  
  -- Status
  is_claimed BOOLEAN NOT NULL DEFAULT false, -- Did they claim the reward?
  claimed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_coin_achievements_active ON coin_achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_coin_achievements_required_coins ON coin_achievements(required_coins);
CREATE INDEX IF NOT EXISTS idx_coin_achievements_category ON coin_achievements(category);

CREATE INDEX IF NOT EXISTS idx_user_coin_achievements_user ON user_coin_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coin_achievements_achievement ON user_coin_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_coin_achievements_unlocked ON user_coin_achievements(unlocked_at);

-- ============================================
-- 4. RLS POLICIES
-- ============================================

ALTER TABLE coin_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coin_achievements ENABLE ROW LEVEL SECURITY;

-- Coin Achievements: Everyone can read active achievements
DROP POLICY IF EXISTS "Anyone can view active coin achievements" ON coin_achievements;
CREATE POLICY "Anyone can view active coin achievements"
  ON coin_achievements FOR SELECT
  USING (is_active = true);

-- Admin can manage achievements
DROP POLICY IF EXISTS "Admin can manage coin achievements" ON coin_achievements;
CREATE POLICY "Admin can manage coin achievements"
  ON coin_achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'HR', 'SUPERADMIN')
    )
  );

-- User Achievements: Users can view their own unlocked achievements
DROP POLICY IF EXISTS "Users can view own unlocked achievements" ON user_coin_achievements;
CREATE POLICY "Users can view own unlocked achievements"
  ON user_coin_achievements FOR SELECT
  USING (user_id = auth.uid());

-- System can insert (via function)
DROP POLICY IF EXISTS "System can insert unlocked achievements" ON user_coin_achievements;
CREATE POLICY "System can insert unlocked achievements"
  ON user_coin_achievements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own achievements (claim status)
DROP POLICY IF EXISTS "Users can update own achievements" ON user_coin_achievements;
CREATE POLICY "Users can update own achievements"
  ON user_coin_achievements FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 5. AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_coin_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_coin_achievements_updated_at ON coin_achievements;
CREATE TRIGGER set_coin_achievements_updated_at
  BEFORE UPDATE ON coin_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_coin_achievements_updated_at();

-- ============================================
-- 6. FUNCTION: CHECK & UNLOCK ACHIEVEMENTS
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
  -- Get user's current coin balance
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6B. FUNCTION: GET ACHIEVEMENTS WITH PROGRESS
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
) AS $
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. DEMO DATA - EXAMPLE ACHIEVEMENTS
-- ============================================

INSERT INTO coin_achievements (title, description, icon, required_coins, unlock_type, unlock_description, category, badge_color, sort_order)
VALUES
  -- Milestones
  (
    'Coin Starter',
    'Erreiche 100 Coins auf deinem Konto',
    'Trophy',
    100,
    'PRIVILEGE',
    'Gratulation! Du hast deine ersten 100 Coins gesammelt.',
    'MILESTONE',
    'bronze',
    1
  ),
  (
    'Coin Sammler',
    'Erreiche 500 Coins auf deinem Konto',
    'Award',
    500,
    'PRIVILEGE',
    'Toll gemacht! 500 Coins sind eine beachtliche Leistung.',
    'MILESTONE',
    'silver',
    2
  ),
  (
    'Coin Master',
    'Erreiche 1.000 Coins auf deinem Konto',
    'Medal',
    1000,
    'PRIVILEGE',
    'Beeindruckend! Du gehörst zur Elite der Coin-Sammler.',
    'MILESTONE',
    'gold',
    3
  ),
  
  -- Exclusive Events
  (
    'Firmenreise Qualifikation',
    'Qualifiziere dich für die jährliche Firmenreise',
    'Plane',
    2500,
    'EVENT',
    'Du hast dich für die Teilnahme an der Firmenreise qualifiziert! Details folgen per E-Mail.',
    'EVENT',
    'platinum',
    10
  ),
  (
    'Premium Lunch Club',
    'Zugang zum exklusiven Premium Lunch Programm',
    'Utensils',
    1500,
    'ACCESS',
    'Erhalte Zugang zu Premium-Restaurants im Lunch-Programm.',
    'EXCLUSIVE',
    'gold',
    11
  ),
  (
    'Home Office Elite',
    'Erweiterte Home Office Ausstattung verfügbar',
    'Home',
    2000,
    'BENEFIT',
    'Zugang zu Premium Home Office Equipment und Möbeln.',
    'EXCLUSIVE',
    'gold',
    12
  ),
  
  -- High Tier
  (
    'Coin Legend',
    'Erreiche 5.000 Coins - Eine legendäre Leistung!',
    'Crown',
    5000,
    'PRIVILEGE',
    'Du bist eine Legende! Nur wenige erreichen dieses Level.',
    'MILESTONE',
    'platinum',
    20
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. VIEW: USER ACHIEVEMENTS WITH DETAILS
-- ============================================

CREATE OR REPLACE VIEW user_coin_achievements_with_details AS
SELECT 
  uca.id,
  uca.user_id,
  uca.achievement_id,
  ca.title,
  ca.description,
  ca.icon,
  ca.required_coins,
  ca.unlock_type,
  ca.unlock_description,
  ca.category,
  ca.badge_color,
  uca.unlocked_at,
  uca.coins_at_unlock,
  uca.is_claimed,
  uca.claimed_at,
  CONCAT(u.first_name, ' ', u.last_name) as user_name,
  u.email as user_email
FROM user_coin_achievements uca
JOIN coin_achievements ca ON uca.achievement_id = ca.id
JOIN users u ON uca.user_id = u.id
ORDER BY uca.unlocked_at DESC;

-- ============================================
-- 9. FUNCTION: GET ACHIEVEMENTS WITH PROGRESS
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
  -- Get current balance
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
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ COIN ACHIEVEMENTS SYSTEM INSTALLED! (v3.9.0)';
  RAISE NOTICE '📊 Tables: coin_achievements, user_coin_achievements';
  RAISE NOTICE '🎯 Demo: 7 example achievements created';
  RAISE NOTICE '🔧 Functions: check_and_unlock_coin_achievements(), get_coin_achievements_with_progress()';
  RAISE NOTICE '🚀 Ready to use!';
END $$;
