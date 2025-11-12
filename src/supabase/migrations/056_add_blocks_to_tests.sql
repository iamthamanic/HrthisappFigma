-- ============================================================================
-- v4.13.2 - ADD BLOCKS COLUMN TO TESTS TABLE
-- ============================================================================
-- Fügt eine JSONB Spalte für Test-Blöcke hinzu (für Test Builder)
-- Zusätzlich: xp_reward, passing_score, coin_reward, published
-- ============================================================================

-- Blocks Column (JSONB Array)
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb;

-- Additional Columns for Test Builder
ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS xp_reward INT DEFAULT 0 CHECK (xp_reward >= 0);

ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS passing_score INT DEFAULT 80 CHECK (passing_score >= 0 AND passing_score <= 100);

ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS coin_reward INT DEFAULT 0 CHECK (coin_reward >= 0);

ALTER TABLE public.tests 
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

-- Comment
COMMENT ON COLUMN public.tests.blocks IS 'JSONB array of test blocks created in Test Builder (v4.13.2)';
COMMENT ON COLUMN public.tests.xp_reward IS 'XP reward for completing test';
COMMENT ON COLUMN public.tests.passing_score IS 'Minimum score to pass test (percentage)';
COMMENT ON COLUMN public.tests.coin_reward IS 'Coin reward for completing test';
COMMENT ON COLUMN public.tests.published IS 'Whether test is published and visible to users';
