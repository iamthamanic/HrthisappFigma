-- Activity Feed System

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies - anyone can read, only system can write
CREATE POLICY "Anyone can read activity_feed"
  ON activity_feed
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert activity_feed"
  ON activity_feed
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(type);

-- Function to create activity
CREATE OR REPLACE FUNCTION create_activity(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activity_feed (user_id, type, title, description, metadata)
  VALUES (p_user_id, p_type, p_title, p_description, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create activity when video is completed
CREATE OR REPLACE FUNCTION on_video_completed() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    PERFORM create_activity(
      NEW.user_id,
      'VIDEO_COMPLETED',
      'Video abgeschlossen',
      'Hat ein Lernvideo abgeschlossen',
      jsonb_build_object('video_id', NEW.video_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_video_completed
  AFTER UPDATE ON learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION on_video_completed();

-- Trigger: Create activity when achievement is unlocked
CREATE OR REPLACE FUNCTION on_achievement_unlocked() RETURNS TRIGGER AS $$
DECLARE
  v_achievement_name TEXT;
BEGIN
  SELECT name INTO v_achievement_name
  FROM achievements
  WHERE id = NEW.achievement_id;
  
  PERFORM create_activity(
    NEW.user_id,
    'ACHIEVEMENT_UNLOCKED',
    'Achievement freigeschaltet',
    'Hat das Achievement "' || v_achievement_name || '" freigeschaltet',
    jsonb_build_object('achievement_id', NEW.achievement_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_achievement_unlocked
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION on_achievement_unlocked();

-- Trigger: Create activity when user levels up
CREATE OR REPLACE FUNCTION on_level_up() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.level > OLD.level THEN
    PERFORM create_activity(
      NEW.user_id,
      'LEVEL_UP',
      'Level Up!',
      'Ist auf Level ' || NEW.level || ' aufgestiegen',
      jsonb_build_object('new_level', NEW.level, 'old_level', OLD.level)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_level_up
  AFTER UPDATE ON user_avatars
  FOR EACH ROW
  WHEN (NEW.level > OLD.level)
  EXECUTE FUNCTION on_level_up();

-- Trigger: Create activity when coins are earned
CREATE OR REPLACE FUNCTION on_coins_earned() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'EARNED' AND NEW.amount > 0 THEN
    PERFORM create_activity(
      NEW.user_id,
      'COINS_EARNED',
      'Coins verdient',
      'Hat ' || NEW.amount || ' Coins verdient: ' || NEW.reason,
      jsonb_build_object('amount', NEW.amount, 'reason', NEW.reason)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_coins_earned
  AFTER INSERT ON coin_transactions
  FOR EACH ROW
  WHEN (NEW.type = 'EARNED')
  EXECUTE FUNCTION on_coins_earned();

COMMENT ON TABLE activity_feed IS 'User activity feed for real-time updates';
COMMENT ON FUNCTION create_activity IS 'Helper function to create activity feed entries';