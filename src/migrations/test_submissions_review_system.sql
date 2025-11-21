/**
 * TEST SUBMISSIONS & REVIEW SYSTEM
 * =================================
 * Migration für Test-Abgaben und manuelles Review-System
 * 
 * WICHTIG: In Supabase SQL Editor ausführen!
 */

-- ========================================
-- 1. TEST_SUBMISSIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_content(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'FAILED')),
  attempt_number INTEGER NOT NULL DEFAULT 1 CHECK (attempt_number >= 1 AND attempt_number <= 3),
  
  -- Auto-Scores (sofort berechnet)
  auto_answers JSONB DEFAULT '{}'::jsonb,
  auto_score NUMERIC(10,2) DEFAULT 0,
  auto_max_score NUMERIC(10,2) DEFAULT 0,
  auto_percentage NUMERIC(5,2) DEFAULT 0,
  
  -- Praktische Aufgaben (File/Video Uploads)
  practical_submissions JSONB DEFAULT '[]'::jsonb,
  
  -- Review Data
  reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_decision TEXT CHECK (review_decision IN ('approve', 'needs_revision', 'fail')),
  review_reason TEXT,
  review_stars INTEGER CHECK (review_stars >= 1 AND review_stars <= 5),
  
  -- Calculated Final Score
  final_score NUMERIC(10,2) DEFAULT 0,
  final_percentage NUMERIC(5,2) DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(test_id, user_id, attempt_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_submissions_user ON test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_test ON test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_status ON test_submissions(status);
CREATE INDEX IF NOT EXISTS idx_test_submissions_reviewer ON test_submissions(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_pending_review ON test_submissions(status) WHERE status = 'PENDING_REVIEW';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for test_submissions.updated_at
DROP TRIGGER IF EXISTS test_submissions_updated_at ON test_submissions;
CREATE TRIGGER test_submissions_updated_at
  BEFORE UPDATE ON test_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
DROP POLICY IF EXISTS "Users can view own submissions" ON test_submissions;
CREATE POLICY "Users can view own submissions"
  ON test_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own submissions
DROP POLICY IF EXISTS "Users can create own submissions" ON test_submissions;
CREATE POLICY "Users can create own submissions"
  ON test_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own DRAFT submissions
DROP POLICY IF EXISTS "Users can update own drafts" ON test_submissions;
CREATE POLICY "Users can update own drafts"
  ON test_submissions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'DRAFT');

-- Admins/Trainers can view all submissions
DROP POLICY IF EXISTS "Admins can view all submissions" ON test_submissions;
CREATE POLICY "Admins can view all submissions"
  ON test_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Admins/Trainers can update submissions (for review)
DROP POLICY IF EXISTS "Admins can update submissions" ON test_submissions;
CREATE POLICY "Admins can update submissions"
  ON test_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- ========================================
-- 2. REVIEW_COMMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES test_submissions(id) ON DELETE CASCADE,
  block_id UUID NOT NULL REFERENCES test_blocks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Comment Type
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  
  -- For image comments (position as % from top/left)
  position_x NUMERIC(5,2) CHECK (position_x >= 0 AND position_x <= 100),
  position_y NUMERIC(5,2) CHECK (position_y >= 0 AND position_y <= 100),
  
  -- For video comments (timestamp in seconds)
  timestamp NUMERIC(10,2) CHECK (timestamp >= 0),
  
  -- Comment text
  text TEXT NOT NULL CHECK (length(text) >= 1 AND length(text) <= 1000),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_review_comments_submission ON review_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_block ON review_comments(block_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_reviewer ON review_comments(reviewer_id);

-- Trigger for review_comments.created_at (auto-set on insert)
DROP TRIGGER IF EXISTS review_comments_created_at ON review_comments;
CREATE TRIGGER review_comments_created_at
  BEFORE INSERT ON review_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their own submissions
DROP POLICY IF EXISTS "Users can view comments on own submissions" ON review_comments;
CREATE POLICY "Users can view comments on own submissions"
  ON review_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_submissions
      WHERE test_submissions.id = review_comments.submission_id
      AND test_submissions.user_id = auth.uid()
    )
  );

-- Admins/Trainers can view all comments
DROP POLICY IF EXISTS "Admins can view all comments" ON review_comments;
CREATE POLICY "Admins can view all comments"
  ON review_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Admins/Trainers can create comments
DROP POLICY IF EXISTS "Admins can create comments" ON review_comments;
CREATE POLICY "Admins can create comments"
  ON review_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Admins/Trainers can update their own comments
DROP POLICY IF EXISTS "Admins can update own comments" ON review_comments;
CREATE POLICY "Admins can update own comments"
  ON review_comments
  FOR UPDATE
  USING (auth.uid() = reviewer_id);

-- Admins/Trainers can delete their own comments
DROP POLICY IF EXISTS "Admins can delete own comments" ON review_comments;
CREATE POLICY "Admins can delete own comments"
  ON review_comments
  FOR DELETE
  USING (auth.uid() = reviewer_id);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================
GRANT ALL ON test_submissions TO authenticated;
GRANT ALL ON review_comments TO authenticated;

-- ========================================
-- DONE! 🎉
-- ========================================
-- Tables created:
-- ✅ test_submissions (Test-Abgaben mit Auto-Score und Review-Status)
-- ✅ review_comments (Kommentare für Bilder/Videos mit Positions/Timestamps)
--
-- RLS Policies:
-- ✅ Users können ihre eigenen Submissions sehen und bearbeiten (nur DRAFT)
-- ✅ Admins/HR können alle Submissions sehen und reviewen
-- ✅ Kommentare können nur von Admins/HR erstellt werden
-- ✅ Users können Kommentare auf ihren eigenen Submissions sehen