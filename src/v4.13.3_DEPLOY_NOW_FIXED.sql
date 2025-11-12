/**
 * 🚀 TRAINING COMPLIANCE SYSTEM - QUICK DEPLOY (FIXED)
 * Version: v4.13.3 - CORRECTED
 * Date: 07.11.2025
 * 
 * FIX: team_lead_id existiert nicht in teams table
 * LÖSUNG: Use team_members table with is_lead flag
 * 
 * ANLEITUNG:
 * 1. Kopiere dieses komplette File
 * 2. Öffne Supabase SQL Editor
 * 3. Paste & Execute
 * 4. Deploy Edge Function: supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt
 * 5. Fertig! 🎉
 */

-- ==================== TABLE: external_trainings ====================

CREATE TABLE IF NOT EXISTS external_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  category TEXT,
  provider TEXT,
  completed_at DATE NOT NULL,
  expires_at DATE,
  certificate_url TEXT,
  notes TEXT,
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "external_trainings_admin_all" ON external_trainings;
DROP POLICY IF EXISTS "external_trainings_user_own" ON external_trainings;
DROP POLICY IF EXISTS "external_trainings_teamlead_read" ON external_trainings;

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
-- FIXED: teams table has no team_lead_id column
-- Solution: Check team_members table where is_lead = true
CREATE POLICY "external_trainings_teamlead_read" ON external_trainings
  FOR SELECT
  USING (
    user_id IN (
      SELECT tm.user_id 
      FROM team_members tm
      WHERE tm.team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_lead = true
      )
    )
  );

-- ==================== STORAGE BUCKET ====================

-- Create bucket for training certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-certificates',
  'training-certificates',
  false,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ==================== STORAGE RLS POLICIES ====================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "training_certificates_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "training_certificates_admin_read" ON storage.objects;
DROP POLICY IF EXISTS "training_certificates_admin_delete" ON storage.objects;
DROP POLICY IF EXISTS "training_certificates_user_own" ON storage.objects;

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

DROP TRIGGER IF EXISTS external_trainings_updated_at ON external_trainings;

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
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TRAINING COMPLIANCE SYSTEM - DEPLOYMENT SUCCESS! 🎉';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tabelle erstellt: external_trainings';
  RAISE NOTICE '📁 Storage Bucket erstellt: training-certificates';
  RAISE NOTICE '🔒 RLS Policies aktiviert: 7 policies';
  RAISE NOTICE '📊 View erstellt: expiring_certificates';
  RAISE NOTICE '🔧 Trigger erstellt: auto-update updated_at';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 BUGFIX APPLIED:';
  RAISE NOTICE '   - Fixed team_lead_id column error';
  RAISE NOTICE '   - Now using team_members.is_lead = true';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 NÄCHSTE SCHRITTE:';
  RAISE NOTICE '1. Deploy Edge Function:';
  RAISE NOTICE '   supabase functions deploy BrowoKoordinator-Lernen --no-verify-jwt';
  RAISE NOTICE '';
  RAISE NOTICE '2. Test in Frontend:';
  RAISE NOTICE '   - Gehe zu Admin → Lernverwaltung → Übersicht Tab';
  RAISE NOTICE '   - Wähle "Videos", "Tests" oder "Sonstige" Sub-Tab';
  RAISE NOTICE '   - Füge externe Schulung hinzu';
  RAISE NOTICE '';
  RAISE NOTICE '3. Verify:';
  RAISE NOTICE '   - Training Progress lädt korrekt';
  RAISE NOTICE '   - CSV Export funktioniert';
  RAISE NOTICE '   - Zertifikat Upload funktioniert';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
