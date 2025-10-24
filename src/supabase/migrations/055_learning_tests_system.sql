-- =====================================================
-- MIGRATION 055: LEARNING TESTS SYSTEM
-- =====================================================
-- Description: Complete test builder system for videos
-- Version: v4.4.0
-- Created: 2025-01-15
-- =====================================================

-- =====================================================
-- 1. TEST BLOCK TYPES ENUM
-- =====================================================
DO $$ BEGIN
  CREATE TYPE test_block_type AS ENUM (
    'MULTIPLE_CHOICE',      -- 1 richtige Antwort
    'MULTIPLE_SELECT',      -- Mehrere richtige Antworten
    'TRUE_FALSE',           -- Richtig/Falsch
    'SHORT_TEXT',           -- Kurze Textantwort
    'LONG_TEXT',            -- Essay/Paragraph
    'FILL_BLANKS',          -- Lückentext
    'ORDERING',             -- Reihenfolge sortieren
    'MATCHING',             -- Zuordnen (Matching pairs)
    'SLIDER',               -- Wert auf Skala wählen
    'FILE_UPLOAD'           -- Datei hochladen
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  
  -- Test Settings
  pass_percentage INTEGER NOT NULL DEFAULT 80 CHECK (pass_percentage >= 0 AND pass_percentage <= 100),
  reward_coins INTEGER NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 0),
  time_limit_minutes INTEGER CHECK (time_limit_minutes IS NULL OR time_limit_minutes > 0),
  
  -- Template System
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_category TEXT, -- e.g. "Basics", "Advanced", "Onboarding"
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Soft Delete
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tests_organization ON tests(organization_id);
CREATE INDEX IF NOT EXISTS idx_tests_is_template ON tests(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_tests_is_active ON tests(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tests in their organization" ON tests;
CREATE POLICY "Users can view tests in their organization"
  ON tests FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage tests" ON tests;
CREATE POLICY "Admins can manage tests"
  ON tests FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- =====================================================
-- 3. TEST BLOCKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS test_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  
  -- Block Info
  type test_block_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT, -- Was dieser Baustein testet
  
  -- Content (JSON for flexibility)
  -- Structure depends on block type:
  -- MULTIPLE_CHOICE: { question: string, options: [{text, isCorrect}] }
  -- FILL_BLANKS: { text: string, blanks: [{position, correctAnswer}] }
  -- etc.
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Settings
  points INTEGER NOT NULL DEFAULT 10 CHECK (points >= 0),
  is_required BOOLEAN NOT NULL DEFAULT true,
  time_limit_seconds INTEGER CHECK (time_limit_seconds IS NULL OR time_limit_seconds > 0),
  
  -- Ordering
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_blocks_test_id ON test_blocks(test_id);
CREATE INDEX IF NOT EXISTS idx_test_blocks_position ON test_blocks(test_id, position);

-- RLS Policies
ALTER TABLE test_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view test blocks in their organization" ON test_blocks;
CREATE POLICY "Users can view test blocks in their organization"
  ON test_blocks FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage test blocks" ON test_blocks;
CREATE POLICY "Admins can manage test blocks"
  ON test_blocks FOR ALL
  USING (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
      )
    )
  );

-- =====================================================
-- 4. TEST VIDEO ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS test_video_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  
  -- Settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Constraint: 1 Video = 1 Test
  UNIQUE(video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_video_assignments_test ON test_video_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_video_assignments_video ON test_video_assignments(video_id);

-- RLS Policies
ALTER TABLE test_video_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view test-video assignments in their organization" ON test_video_assignments;
CREATE POLICY "Users can view test-video assignments in their organization"
  ON test_video_assignments FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage test-video assignments" ON test_video_assignments;
CREATE POLICY "Admins can manage test-video assignments"
  ON test_video_assignments FOR ALL
  USING (
    test_id IN (
      SELECT id FROM tests 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
      )
    )
  );

-- =====================================================
-- 5. TEST ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Attempt Info
  attempt_number INTEGER NOT NULL DEFAULT 1,
  
  -- Answers (JSON array of block answers)
  -- Structure: [{ block_id: uuid, answer: any, is_correct: boolean, points_earned: number }]
  answers JSONB NOT NULL DEFAULT '[]',
  
  -- Results
  total_points INTEGER NOT NULL DEFAULT 0,
  max_points INTEGER NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  passed BOOLEAN NOT NULL DEFAULT false,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_taken_seconds INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_test ON test_attempts(user_id, test_id);

-- RLS Policies
ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own test attempts" ON test_attempts;
CREATE POLICY "Users can view their own test attempts"
  ON test_attempts FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own test attempts" ON test_attempts;
CREATE POLICY "Users can create their own test attempts"
  ON test_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own test attempts" ON test_attempts;
CREATE POLICY "Users can update their own test attempts"
  ON test_attempts FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all test attempts in their organization" ON test_attempts;
CREATE POLICY "Admins can view all test attempts in their organization"
  ON test_attempts FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users 
      WHERE organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
      )
    )
  );

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function: Get test statistics
CREATE OR REPLACE FUNCTION get_test_statistics(p_test_id UUID)
RETURNS TABLE (
  total_attempts BIGINT,
  unique_users BIGINT,
  average_score DECIMAL,
  pass_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_attempts,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    ROUND(AVG(percentage), 2) as average_score,
    ROUND(
      (COUNT(*) FILTER (WHERE passed = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as pass_rate
  FROM test_attempts
  WHERE test_id = p_test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's best attempt
CREATE OR REPLACE FUNCTION get_user_best_attempt(p_user_id UUID, p_test_id UUID)
RETURNS TABLE (
  attempt_id UUID,
  percentage DECIMAL,
  passed BOOLEAN,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id as attempt_id,
    ta.percentage,
    ta.passed,
    ta.completed_at
  FROM test_attempts ta
  WHERE ta.user_id = p_user_id
    AND ta.test_id = p_test_id
    AND ta.completed_at IS NOT NULL
  ORDER BY ta.percentage DESC, ta.completed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user can attempt test
CREATE OR REPLACE FUNCTION can_user_attempt_test(p_user_id UUID, p_test_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_attempts INTEGER;
  v_attempts_count INTEGER;
BEGIN
  -- Get max attempts for test
  SELECT max_attempts INTO v_max_attempts
  FROM tests
  WHERE id = p_test_id;
  
  -- Count user's attempts
  SELECT COUNT(*) INTO v_attempts_count
  FROM test_attempts
  WHERE user_id = p_user_id
    AND test_id = p_test_id
    AND completed_at IS NOT NULL;
  
  -- Check if user can attempt (0 = unlimited)
  RETURN v_max_attempts = 0 OR v_attempts_count < v_max_attempts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Update updated_at on tests
CREATE OR REPLACE FUNCTION update_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tests_updated_at ON tests;
CREATE TRIGGER trigger_update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION update_tests_updated_at();

-- Update updated_at on test_blocks
CREATE OR REPLACE FUNCTION update_test_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_test_blocks_updated_at ON test_blocks;
CREATE TRIGGER trigger_update_test_blocks_updated_at
  BEFORE UPDATE ON test_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_test_blocks_updated_at();

-- =====================================================
-- 8. VIEWS
-- =====================================================

-- View: Learning Units (Video + Test = Lerneinheit)
CREATE OR REPLACE VIEW learning_units AS
SELECT
  v.id as video_id,
  v.title as video_title,
  v.category as video_category,
  v.duration as video_duration,
  t.id as test_id,
  t.title as test_title,
  t.pass_percentage,
  t.reward_coins,
  tva.is_active,
  tva.created_at as assigned_at,
  v.organization_id
FROM videos v
INNER JOIN test_video_assignments tva ON v.id = tva.video_id
INNER JOIN tests t ON tva.test_id = t.id
WHERE v.is_active = true
  AND t.is_active = true
  AND tva.is_active = true;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comment
COMMENT ON TABLE tests IS 'Tests/Quizzes for learning videos';
COMMENT ON TABLE test_blocks IS 'Individual question/task blocks within a test';
COMMENT ON TABLE test_video_assignments IS 'Many-to-Many: Tests assigned to Videos (1 Video = 1 Test)';
COMMENT ON TABLE test_attempts IS 'User attempts at completing tests';
COMMENT ON VIEW learning_units IS 'Automatic view: Videos with assigned tests';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 055: Learning Tests System - COMPLETE!';
  RAISE NOTICE '📋 Created tables: tests, test_blocks, test_video_assignments, test_attempts';
  RAISE NOTICE '🔧 Created functions: get_test_statistics, get_user_best_attempt, can_user_attempt_test';
  RAISE NOTICE '👁️ Created view: learning_units';
  RAISE NOTICE '🎯 Ready for test builder implementation!';
END $$;
