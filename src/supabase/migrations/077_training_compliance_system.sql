/**
 * @migration 077_training_compliance_system
 * @description Training Compliance Dashboard - External Trainings System
 * @version v4.13.3
 * @date 2025-11-06
 */

-- =====================================================
-- EXTERNAL TRAININGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS external_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  category TEXT, -- Frei wählbar (z.B. "Erste Hilfe", "Gabelstapler", "Brandschutz")
  provider TEXT, -- Anbieter (z.B. "DRK", "TÜV", "Feuerwehr")
  completed_at DATE NOT NULL,
  expires_at DATE, -- Ablaufdatum für wiederkehrende Schulungen
  certificate_url TEXT, -- Supabase Storage URL
  notes TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_external_trainings_user_id ON external_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_external_trainings_organization_id ON external_trainings(organization_id);
CREATE INDEX IF NOT EXISTS idx_external_trainings_category ON external_trainings(category);
CREATE INDEX IF NOT EXISTS idx_external_trainings_completed_at ON external_trainings(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_trainings_expires_at ON external_trainings(expires_at);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE external_trainings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own external trainings
CREATE POLICY "Users can view own external trainings"
  ON external_trainings
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    -- Admins/HR/Teamleads can view all in their org
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = external_trainings.organization_id
      AND users.role IN ('SUPERADMIN', 'ADMIN', 'HR', 'TEAMLEAD')
    )
  );

-- Policy: Only admins/HR can insert external trainings
CREATE POLICY "Admins can insert external trainings"
  ON external_trainings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = external_trainings.organization_id
      AND users.role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- Policy: Only admins/HR can update external trainings
CREATE POLICY "Admins can update external trainings"
  ON external_trainings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = external_trainings.organization_id
      AND users.role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- Policy: Only admins/HR can delete external trainings
CREATE POLICY "Admins can delete external trainings"
  ON external_trainings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.organization_id = external_trainings.organization_id
      AND users.role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_external_trainings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER external_trainings_updated_at
  BEFORE UPDATE ON external_trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_external_trainings_updated_at();

-- =====================================================
-- STORAGE BUCKET FOR CERTIFICATES
-- =====================================================

-- Create certificates bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('make-f659121d-certificates', 'make-f659121d-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Users can upload/view certificates
CREATE POLICY IF NOT EXISTS "Users can upload certificates"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'make-f659121d-certificates'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY IF NOT EXISTS "Users can view certificates in their org"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'make-f659121d-certificates'
    AND (
      -- User owns the file
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Admin/HR can view all
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('SUPERADMIN', 'ADMIN', 'HR')
      )
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can delete certificates"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'make-f659121d-certificates'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE external_trainings IS 'Externe Schulungen (DRK Erste Hilfe, TÜV Gabelstapler etc.)';
COMMENT ON COLUMN external_trainings.category IS 'Frei wählbar (Erste Hilfe, Gabelstapler, Brandschutz etc.)';
COMMENT ON COLUMN external_trainings.expires_at IS 'Ablaufdatum für wiederkehrende Schulungen';
COMMENT ON COLUMN external_trainings.certificate_url IS 'Supabase Storage URL zum Zertifikat';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 077: Training Compliance System komplett installiert!';
  RAISE NOTICE '📊 Tabelle: external_trainings';
  RAISE NOTICE '🔒 RLS Policies: 4 policies';
  RAISE NOTICE '📦 Storage Bucket: make-f659121d-certificates';
END $$;
