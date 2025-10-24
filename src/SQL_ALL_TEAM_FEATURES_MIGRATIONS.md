-- =============================================
-- MIGRATION 026: USER NOTES TABLE
-- =============================================

-- Create user_notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_author_id ON user_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_created_at ON user_notes(created_at DESC);

-- Add comments
COMMENT ON TABLE user_notes IS 'Admin notes and comments for user profiles';
COMMENT ON COLUMN user_notes.user_id IS 'The user this note is about';
COMMENT ON COLUMN user_notes.author_id IS 'The admin who created the note';
COMMENT ON COLUMN user_notes.note_text IS 'The note content';
COMMENT ON COLUMN user_notes.is_private IS 'Whether the note is only visible to admins';

-- Enable Row Level Security
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all notes (idempotent)
DROP POLICY IF EXISTS "Admins can view all notes" ON user_notes;
CREATE POLICY "Admins can view all notes"
  ON user_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Policy: Admins can create notes (idempotent)
DROP POLICY IF EXISTS "Admins can create notes" ON user_notes;
CREATE POLICY "Admins can create notes"
  ON user_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Policy: Admins can update their own notes (idempotent)
DROP POLICY IF EXISTS "Admins can update their own notes" ON user_notes;
CREATE POLICY "Admins can update their own notes"
  ON user_notes FOR UPDATE
  USING (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Policy: Admins can delete their own notes (idempotent)
DROP POLICY IF EXISTS "Admins can delete their own notes" ON user_notes;
CREATE POLICY "Admins can delete their own notes"
  ON user_notes FOR DELETE
  USING (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Update trigger for updated_at (idempotent)
CREATE OR REPLACE FUNCTION update_user_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_notes_updated_at ON user_notes;
CREATE TRIGGER user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notes_updated_at();

-- =============================================
-- MIGRATION 027: SAVED SEARCHES TABLE
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

-- Policy: Users can view their own saved searches (idempotent)
DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (user_id = auth.uid() OR is_global = true);

-- Policy: Users can insert their own saved searches (idempotent)
DROP POLICY IF EXISTS "Users can insert their own saved searches" ON saved_searches;
CREATE POLICY "Users can insert their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own saved searches (idempotent)
DROP POLICY IF EXISTS "Users can update their own saved searches" ON saved_searches;
CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own saved searches (idempotent)
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON saved_searches;
CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (user_id = auth.uid());

-- Policy: Admins can create global saved searches (idempotent)
DROP POLICY IF EXISTS "Admins can create global saved searches" ON saved_searches;
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

-- Update trigger for updated_at (idempotent)
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS saved_searches_updated_at ON saved_searches;
CREATE TRIGGER saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();
