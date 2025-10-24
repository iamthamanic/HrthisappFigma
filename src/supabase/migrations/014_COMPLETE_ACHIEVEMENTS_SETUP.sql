-- ================================================
-- COMPLETE ACHIEVEMENTS SETUP
-- ================================================
-- Creates achievements table with all required columns
-- and inserts demo achievements

-- ================================================
-- 1. CREATE ACHIEVEMENTS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '🏆',
  badge_color TEXT DEFAULT '#FFD700',
  xp_reward INTEGER DEFAULT 0,
  coin_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'SPECIAL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. ADD MISSING COLUMNS (if table already existed)
-- ================================================

-- Add category column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'achievements' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE achievements ADD COLUMN category TEXT NOT NULL DEFAULT 'SPECIAL';
  END IF;
END $$;

-- Fix requirement_value if it's JSONB instead of INTEGER
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'achievements' 
    AND column_name = 'requirement_value'
    AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE achievements DROP COLUMN requirement_value;
    ALTER TABLE achievements ADD COLUMN requirement_value INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- ================================================
-- 3. ENABLE RLS
-- ================================================

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read achievements" ON achievements;
DROP POLICY IF EXISTS "Only admins can modify achievements" ON achievements;

-- RLS Policies for achievements
CREATE POLICY "Anyone can read achievements"
  ON achievements
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify achievements"
  ON achievements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- ================================================
-- 4. CREATE INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_requirement_type ON achievements(requirement_type);

-- ================================================
-- 5. INSERT DEMO ACHIEVEMENTS (only if empty)
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM achievements LIMIT 1) THEN
    INSERT INTO achievements (name, description, icon, badge_color, xp_reward, coin_reward, requirement_type, requirement_value, category) VALUES
    -- Learning Achievements
    ('Erste Schritte', 'Schließe dein erstes Video ab', '🎓', '#9333EA', 50, 25, 'VIDEOS_WATCHED', 1, 'LEARNING'),
    ('Wissbegierig', 'Schaue 5 Videos', '📚', '#9333EA', 100, 50, 'VIDEOS_WATCHED', 5, 'LEARNING'),
    ('Wissenssammler', 'Schaue 10 Videos', '🧠', '#9333EA', 200, 100, 'VIDEOS_WATCHED', 10, 'LEARNING'),
    ('Lernexperte', 'Schaue 25 Videos', '🎯', '#9333EA', 500, 250, 'VIDEOS_WATCHED', 25, 'LEARNING'),
    
    ('Quiz-Anfänger', 'Bestehe dein erstes Quiz', '✅', '#8B5CF6', 50, 25, 'QUIZZES_PASSED', 1, 'LEARNING'),
    ('Quiz-Profi', 'Bestehe 5 Quizzes', '🌟', '#8B5CF6', 150, 75, 'QUIZZES_PASSED', 5, 'LEARNING'),
    ('Quiz-Meister', 'Bestehe 10 Quizzes', '👑', '#8B5CF6', 300, 150, 'QUIZZES_PASSED', 10, 'LEARNING'),
    
    ('Perfektionist', 'Erreiche 100% in einem Quiz', '💯', '#A855F7', 200, 100, 'PERFECT_QUIZ', 1, 'LEARNING'),
    
    -- Time Achievements
    ('Pünktlich', 'Stempel dich das erste Mal ein', '⏰', '#3B82F6', 25, 10, 'DAYS_WORKED', 1, 'TIME'),
    ('Zuverlässig', 'Arbeite 5 Tage', '📅', '#3B82F6', 75, 35, 'DAYS_WORKED', 5, 'TIME'),
    ('Fleißig', 'Arbeite 20 Tage', '💼', '#3B82F6', 200, 100, 'DAYS_WORKED', 20, 'TIME'),
    ('Arbeitstier', 'Arbeite 50 Tage', '🔥', '#3B82F6', 500, 250, 'DAYS_WORKED', 50, 'TIME'),
    
    ('Frühaufsteher', 'Stempel dich vor 8:00 Uhr ein', '🌅', '#60A5FA', 100, 50, 'EARLY_CHECKIN', 5, 'TIME'),
    ('Nachtarbeiter', 'Stempel dich nach 20:00 Uhr aus', '🌙', '#60A5FA', 100, 50, 'LATE_CHECKOUT', 5, 'TIME'),
    
    -- Social Achievements
    ('Team-Player', 'Tritt einem Team bei', '👥', '#10B981', 50, 25, 'JOINED_TEAM', 1, 'SOCIAL'),
    ('Netzwerker', 'Verbinde dich mit 5 Kollegen', '🤝', '#10B981', 100, 50, 'CONNECTIONS', 5, 'SOCIAL'),
    ('Hilfsbereit', 'Hilf einem Kollegen', '🆘', '#10B981', 75, 35, 'HELPED_COLLEAGUE', 1, 'SOCIAL'),
    
    -- Special Achievements
    ('Willkommen', 'Erstelle dein Profil', '👋', '#F59E0B', 100, 50, 'PROFILE_COMPLETE', 1, 'SPECIAL'),
    ('Coin-Sammler', 'Sammle 100 Coins', '🪙', '#F59E0B', 150, 0, 'COINS_EARNED', 100, 'SPECIAL'),
    ('Coin-Magnat', 'Sammle 500 Coins', '💰', '#F59E0B', 300, 0, 'COINS_EARNED', 500, 'SPECIAL'),
    
    ('Level Up!', 'Erreiche Level 2', '⬆️', '#EAB308', 200, 100, 'LEVEL_REACHED', 2, 'SPECIAL'),
    ('Aufsteiger', 'Erreiche Level 5', '🚀', '#EAB308', 500, 250, 'LEVEL_REACHED', 5, 'SPECIAL'),
    ('Legende', 'Erreiche Level 10', '⭐', '#EAB308', 1000, 500, 'LEVEL_REACHED', 10, 'SPECIAL'),
    
    ('Vollständig', 'Vervollständige dein Profil zu 100%', '✨', '#EC4899', 150, 75, 'PROFILE_100', 1, 'SPECIAL'),
    ('Streak-Starter', 'Arbeite 7 Tage in Folge', '🔥', '#EC4899', 200, 100, 'WORK_STREAK', 7, 'SPECIAL'),
    ('Unaufhaltsam', 'Arbeite 30 Tage in Folge', '💪', '#EC4899', 1000, 500, 'WORK_STREAK', 30, 'SPECIAL');
    
    RAISE NOTICE '✓ Inserted % demo achievements', (SELECT COUNT(*) FROM achievements);
  ELSE
    RAISE NOTICE '✓ Achievements already exist (% achievements)', (SELECT COUNT(*) FROM achievements);
  END IF;
END $$;

-- ================================================
-- 6. VERIFICATION
-- ================================================

DO $$
DECLARE
  achievement_count INTEGER;
  has_category BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO achievement_count FROM achievements;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'achievements' 
    AND column_name = 'category'
  ) INTO has_category;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ACHIEVEMENTS SETUP COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total achievements: %', achievement_count;
  RAISE NOTICE 'Category column exists: %', has_category;
  RAISE NOTICE '========================================';
END $$;
