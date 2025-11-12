/**
 * Migration 078: External Trainings & Training Compliance System
 * Version: v4.13.3
 * 
 * ZWECK:
 * - Externe Schulungen tracken (Erste Hilfe, Gabelstapler, Brandschutz etc.)
 * - Zertifikate hochladen und verwalten
 * - Training Compliance Reporting
 * 
 * FEATURES:
 * - Frei wählbare Kategorien
 * - Ablaufdatum für Zertifikate
 * - Notizen/Kommentare
 * - Multi-Tenant Support
 */

-- ==================== TABLE: external_trainings ====================

CREATE TABLE IF NOT EXISTS external_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  category TEXT, -- Frei wählbar: "Erste Hilfe", "Gabelstapler", "Brandschutz" etc.
  provider TEXT, -- Anbieter: "DRK", "TÜV", "Feuerwehr" etc.
  completed_at DATE NOT NULL,
  expires_at DATE, -- Wichtig für wiederkehrende Schulungen!
  certificate_url TEXT, -- Supabase Storage URL zum Zertifikat
  notes TEXT, -- Freitext-Notizen
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_external_trainings_user_id ON external_trainings(user_id);
CREATE INDEX IF NOT EXISTS idx_external_trainings_organization_id ON external_trainings(organization_id);
CREATE INDEX IF NOT EXISTS idx_external_trainings_category ON external_trainings(category);
CREATE INDEX IF NOT EXISTS idx_external_trainings_expires_at ON external_trainings(expires_at);
CREATE INDEX IF NOT EXISTS idx_external_trainings_completed_at ON external_trainings(completed_at);

-- ==================== RLS POLICIES ====================

ALTER TABLE external_trainings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admins können ALLES in ihrer Organization sehen
CREATE POLICY "external_trainings_admin_all" ON external_trainings
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Policy 2: Users können ihre EIGENEN Schulungen sehen
CREATE POLICY "external_trainings_user_own" ON external_trainings
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy 3: Teamleads können Schulungen ihrer Team-Mitglieder sehen
CREATE POLICY "external_trainings_teamlead_read" ON external_trainings
  FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.team_lead_id = auth.uid()
    )
  );

-- ==================== STORAGE BUCKET ====================

-- Create bucket for training certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-certificates',
  'training-certificates',
  false, -- PRIVATE bucket!
  5242880, -- 5 MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ==================== STORAGE RLS POLICIES ====================

-- Policy 1: Admins können Zertifikate hochladen
CREATE POLICY "training_certificates_admin_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'training-certificates'
    AND auth.uid() IN (
      SELECT id FROM users
      WHERE role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Policy 2: Admins können Zertifikate lesen
CREATE POLICY "training_certificates_admin_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'training-certificates'
    AND auth.uid() IN (
      SELECT id FROM users
      WHERE role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Policy 3: Admins können Zertifikate löschen
CREATE POLICY "training_certificates_admin_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'training-certificates'
    AND auth.uid() IN (
      SELECT id FROM users
      WHERE role IN ('ADMIN', 'SUPERADMIN', 'HR')
    )
  );

-- Policy 4: Users können ihre eigenen Zertifikate lesen
CREATE POLICY "training_certificates_user_own" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'training-certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==================== TRIGGERS ====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_external_trainings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER external_trainings_updated_at
  BEFORE UPDATE ON external_trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_external_trainings_updated_at();

-- ==================== HELPER VIEWS ====================

-- View: Ablaufende Zertifikate (in den nächsten 30 Tagen)
CREATE OR REPLACE VIEW expiring_certificates AS
SELECT 
  et.*,
  u.first_name,
  u.last_name,
  u.email,
  (et.expires_at - CURRENT_DATE) AS days_until_expiry
FROM external_trainings et
JOIN users u ON u.id = et.user_id
WHERE et.expires_at IS NOT NULL
  AND et.expires_at > CURRENT_DATE
  AND et.expires_at <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY et.expires_at ASC;

-- ==================== SUCCESS MESSAGE ====================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 078 erfolgreich: External Trainings System erstellt!';
  RAISE NOTICE '📋 Tabelle: external_trainings';
  RAISE NOTICE '📁 Storage Bucket: training-certificates';
  RAISE NOTICE '🔒 RLS Policies: 7 policies erstellt';
  RAISE NOTICE '📊 View: expiring_certificates';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NÄCHSTE SCHRITTE:';
  RAISE NOTICE '1. Backend API Routes in BrowoKoordinator-Lernen implementieren';
  RAISE NOTICE '2. Frontend Components erstellen';
  RAISE NOTICE '3. In LearningManagementScreen.tsx integrieren';
END $$;
