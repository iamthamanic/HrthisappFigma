-- =============================================
-- USER NOTES TABLE
-- Allows admins to add notes/comments to user profiles
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
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_notes_updated_at ON user_notes;
CREATE TRIGGER user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notes_updated_at();
