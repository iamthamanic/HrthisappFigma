-- ============================================================================
-- v4.13.1 - TEST BUILDER FOUNDATION - DATABASE MIGRATION
-- ============================================================================
-- Phase 1: Test Management & Test Block Types
-- 
-- WICHTIG: Diesen Code in Supabase SQL Editor einfügen und ausführen!
-- ============================================================================

-- ============================================================================
-- 1. TESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Test Info
  title VARCHAR(300) NOT NULL,
  description TEXT,
  
  -- Test Settings
  pass_percentage INT DEFAULT 80 CHECK (pass_percentage >= 0 AND pass_percentage <= 100),
  reward_coins INT DEFAULT 0 CHECK (reward_coins >= 0),
  max_attempts INT DEFAULT 3 CHECK (max_attempts >= 0),
  time_limit_minutes INT CHECK (time_limit_minutes > 0),
  
  -- Template System
  is_template BOOLEAN DEFAULT FALSE,
  template_category VARCHAR(100),
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_tests_organization ON public.tests(organization_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_tests_template ON public.tests(is_template, template_category) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

-- Read Policy: Users in same organization
CREATE POLICY "Users can view tests in their organization"
  ON public.tests FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Create Policy: HR and Superadmin only
CREATE POLICY "HR and Superadmin can create tests"
  ON public.tests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('hr', 'superadmin')
      AND organization_id = tests.organization_id
    )
  );

-- Update Policy: HR and Superadmin only
CREATE POLICY "HR and Superadmin can update tests"
  ON public.tests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('hr', 'superadmin')
      AND organization_id = tests.organization_id
    )
  );

-- Delete Policy: HR and Superadmin only (soft delete via is_active)
CREATE POLICY "HR and Superadmin can delete tests"
  ON public.tests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('hr', 'superadmin')
      AND organization_id = tests.organization_id
    )
  );

-- ============================================================================
-- 2. TEST BLOCKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.test_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  
  -- Block Type (10 Types)
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'MULTIPLE_CHOICE',    -- Multiple Choice (1 richtige Antwort)
    'MULTIPLE_SELECT',    -- Multiple Select (mehrere richtige Antworten)
    'TRUE_FALSE',         -- True/False
    'SHORT_TEXT',         -- Kurzer Text
    'LONG_TEXT',          -- Langer Text (Textarea)
    'FILL_BLANKS',        -- Lückentext
    'ORDERING',           -- Reihenfolge sortieren
    'MATCHING',           -- Zuordnung (Paare bilden)
    'SLIDER',             -- Slider (Zahl auswählen)
    'FILE_UPLOAD'         -- Datei hochladen
  )),
  
  -- Block Content
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content JSONB NOT NULL, -- Flexible content structure per block type
  
  -- Block Settings
  points INT DEFAULT 10 CHECK (points >= 0),
  is_required BOOLEAN DEFAULT TRUE,
  time_limit_seconds INT CHECK (time_limit_seconds > 0),
  position INT DEFAULT 0 CHECK (position >= 0),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_test_blocks_test_id ON public.test_blocks(test_id, position);
CREATE INDEX IF NOT EXISTS idx_test_blocks_type ON public.test_blocks(type);

-- RLS Policies
ALTER TABLE public.test_blocks ENABLE ROW LEVEL SECURITY;

-- Read Policy: Via test access
CREATE POLICY "Users can view test blocks via test access"
  ON public.test_blocks FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Create Policy: HR and Superadmin only
CREATE POLICY "HR and Superadmin can create test blocks"
  ON public.test_blocks FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id FROM public.tests
      WHERE organization_id IN (
        SELECT organization_id FROM public.users
        WHERE id = auth.uid() AND role IN ('hr', 'superadmin')
      )
    )
  );

-- Update Policy: HR and Superadmin only
CREATE POLICY "HR and Superadmin can update test blocks"
  ON public.test_blocks FOR UPDATE
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE organization_id IN (
        SELECT organization_id FROM public.users
        WHERE id = auth.uid() AND role IN ('hr', 'superadmin')
      )
    )
  );

-- Delete Policy: HR and Superadmin only
CREATE POLICY "HR and Superadmin can delete test blocks"
  ON public.test_blocks FOR DELETE
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE organization_id IN (
        SELECT organization_id FROM public.users
        WHERE id = auth.uid() AND role IN ('hr', 'superadmin')
      )
    )
  );

-- ============================================================================
-- 3. TEST-VIDEO ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.test_video_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.video_content(id) ON DELETE CASCADE,
  
  -- Ensure 1:1 relationship (one test per video)
  UNIQUE(video_id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_test_video_assignments_test ON public.test_video_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_video_assignments_video ON public.test_video_assignments(video_id);

-- RLS Policies
ALTER TABLE public.test_video_assignments ENABLE ROW LEVEL SECURITY;

-- Read Policy
CREATE POLICY "Users can view test assignments in their organization"
  ON public.test_video_assignments FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Create Policy
CREATE POLICY "HR and Superadmin can create test assignments"
  ON public.test_video_assignments FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id FROM public.tests
      WHERE organization_id IN (
        SELECT organization_id FROM public.users
        WHERE id = auth.uid() AND role IN ('hr', 'superadmin')
      )
    )
  );

-- Delete Policy
CREATE POLICY "HR and Superadmin can delete test assignments"
  ON public.test_video_assignments FOR DELETE
  USING (
    test_id IN (
      SELECT id FROM public.tests
      WHERE organization_id IN (
        SELECT organization_id FROM public.users
        WHERE id = auth.uid() AND role IN ('hr', 'superadmin')
      )
    )
  );

-- ============================================================================
-- 4. TEST ATTEMPTS TABLE (für später - Phase 3)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Attempt Data
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL, -- User answers per block
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_taken_seconds INT, -- Calculated
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_user ON public.test_attempts(test_id, user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON public.test_attempts(user_id, completed_at DESC);

-- RLS Policies
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Read Policy: Users can see their own attempts
CREATE POLICY "Users can view their own test attempts"
  ON public.test_attempts FOR SELECT
  USING (user_id = auth.uid());

-- Create Policy: Users can create their own attempts
CREATE POLICY "Users can create test attempts"
  ON public.test_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger für tests table
CREATE OR REPLACE FUNCTION update_tests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tests_updated_at_trigger
  BEFORE UPDATE ON public.tests
  FOR EACH ROW
  EXECUTE FUNCTION update_tests_updated_at();

-- Trigger für test_blocks table
CREATE OR REPLACE FUNCTION update_test_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER test_blocks_updated_at_trigger
  BEFORE UPDATE ON public.test_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_test_blocks_updated_at();

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get test with block count
CREATE OR REPLACE FUNCTION get_tests_with_block_count(org_id UUID)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  title VARCHAR,
  description TEXT,
  pass_percentage INT,
  reward_coins INT,
  max_attempts INT,
  time_limit_minutes INT,
  is_template BOOLEAN,
  template_category VARCHAR,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  block_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.*,
    COUNT(tb.id) AS block_count
  FROM public.tests t
  LEFT JOIN public.test_blocks tb ON tb.test_id = t.id
  WHERE t.organization_id = org_id AND t.is_active = TRUE
  GROUP BY t.id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ✅ MIGRATION COMPLETE!
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE '✅ Tests table: %', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'tests');
  RAISE NOTICE '✅ Test Blocks table: %', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'test_blocks');
  RAISE NOTICE '✅ Test Video Assignments table: %', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'test_video_assignments');
  RAISE NOTICE '✅ Test Attempts table: %', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'test_attempts');
  RAISE NOTICE '';
  RAISE NOTICE '🎉 v4.13.1 Migration erfolgreich abgeschlossen!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Nächste Schritte:';
  RAISE NOTICE '1. Code-Änderung in LearningManagementScreen.tsx (siehe v4.13.1_APPLY_THIS_CHANGE.md)';
  RAISE NOTICE '2. App neu laden';
  RAISE NOTICE '3. Tests erstellen! 🚀';
END $$;
