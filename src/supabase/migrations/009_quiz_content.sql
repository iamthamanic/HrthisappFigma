-- Create quiz_content table
CREATE TABLE IF NOT EXISTS quiz_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'SKILLS',
  is_mandatory BOOLEAN DEFAULT false,
  duration INTEGER DEFAULT 10,
  passing_score INTEGER DEFAULT 80,
  questions JSONB DEFAULT '[]'::jsonb,
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 25,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE quiz_content ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read quizzes
CREATE POLICY "Anyone can read quiz_content"
  ON quiz_content
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert/update/delete
CREATE POLICY "Only admins can modify quiz_content"
  ON quiz_content
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- No demo quizzes inserted - use Learning Admin to create quizzes

-- Create indexes
CREATE INDEX idx_quiz_content_category ON quiz_content(category);
CREATE INDEX idx_quiz_content_order ON quiz_content(order_index);
