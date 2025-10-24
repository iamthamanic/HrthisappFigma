-- Achievement System Tables

-- Achievements table (already exists from initial schema, but let's ensure it's correct)
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

-- User Achievements table (already exists, but ensure it's correct)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Anyone can read achievements"
  ON achievements
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify achievements"
  ON achievements
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- RLS Policies for user_achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user achievements"
  ON user_achievements
  FOR INSERT
  WITH CHECK (true);

-- Insert demo achievements
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Function to check and award achievements automatically
CREATE OR REPLACE FUNCTION check_user_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- This function would be called by triggers on various tables
  -- to automatically check if user has earned achievements
  -- For now, we'll handle this in the application layer
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
