-- =============================================
-- SAVED SEARCHES TABLE
-- Allows users to save frequent search/filter combinations
-- =============================================

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  search_config JSONB NOT NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_is_global ON saved_searches(is_global);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

-- Add comments
COMMENT ON TABLE saved_searches IS 'Saved search and filter combinations for team management';
COMMENT ON COLUMN saved_searches.user_id IS 'The user who created this search';
COMMENT ON COLUMN saved_searches.name IS 'Name of the saved search';
COMMENT ON COLUMN saved_searches.description IS 'Optional description';
COMMENT ON COLUMN saved_searches.search_config IS 'JSON object containing search query and filters';
COMMENT ON COLUMN saved_searches.is_global IS 'Whether this search is visible to all users (admin only)';

-- Enable Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved searches
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (user_id = auth.uid() OR is_global = true);

-- Policy: Users can insert their own saved searches
CREATE POLICY "Users can insert their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own saved searches
CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own saved searches
CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Admins can create global saved searches
CREATE POLICY "Admins can create global saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (
    is_global = true AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();
