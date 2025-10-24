-- =====================================================
-- Migration 047: Dashboard Announcements System
-- VERSION: SKIP IF EXISTS (für bereits teilweise ausgeführte Migration)
-- =====================================================
-- Created: 2025-01-12
-- Purpose: Dashboard announcements mit Skip-If-Exists Logic

-- ============================================
-- WICHTIG: Diese Version skippt bereits existierende Objekte!
-- Nutze diese, wenn du den "already exists" Error bekommen hast
-- ============================================

-- Create dashboard_announcements table (SKIP IF EXISTS)
CREATE TABLE IF NOT EXISTS dashboard_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{" blocks": []}'::jsonb,
  
  -- Live status
  is_live BOOLEAN NOT NULL DEFAULT false,
  pushed_live_at TIMESTAMPTZ,
  removed_from_live_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit trail
  live_history JSONB DEFAULT '[]'::jsonb
);

-- Create indexes (SKIP IF EXISTS)
CREATE INDEX IF NOT EXISTS idx_dashboard_announcements_org 
  ON dashboard_announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_announcements_is_live 
  ON dashboard_announcements(organization_id, is_live) 
  WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_announcements_created_at 
  ON dashboard_announcements(created_at DESC);

-- Ensure only ONE announcement is live per organization (SKIP IF EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_live_announcement_per_org 
  ON dashboard_announcements(organization_id) 
  WHERE is_live = true;

-- Function: Updated_at trigger (REPLACE IF EXISTS)
CREATE OR REPLACE FUNCTION update_dashboard_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_dashboard_announcements_updated_at ON dashboard_announcements;
CREATE TRIGGER trigger_dashboard_announcements_updated_at
  BEFORE UPDATE ON dashboard_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_announcements_updated_at();

-- Function: Auto-track live history (REPLACE IF EXISTS)
CREATE OR REPLACE FUNCTION track_announcement_live_history()
RETURNS TRIGGER AS $$
BEGIN
  -- If announcement is being pushed live
  IF NEW.is_live = true AND (OLD IS NULL OR OLD.is_live = false) THEN
    NEW.pushed_live_at = now();
    NEW.removed_from_live_at = NULL;
    
    -- Add to live history
    NEW.live_history = COALESCE(NEW.live_history, '[]'::jsonb) || 
      jsonb_build_object(
        'action', 'pushed_live',
        'timestamp', now(),
        'by_user_id', NEW.updated_by
      );
  END IF;
  
  -- If announcement is being removed from live
  IF NEW.is_live = false AND OLD IS NOT NULL AND OLD.is_live = true THEN
    NEW.removed_from_live_at = now();
    
    -- Add to live history
    NEW.live_history = COALESCE(NEW.live_history, '[]'::jsonb) || 
      jsonb_build_object(
        'action', 'removed_from_live',
        'timestamp', now(),
        'by_user_id', NEW.updated_by
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_track_announcement_live_history ON dashboard_announcements;
CREATE TRIGGER trigger_track_announcement_live_history
  BEFORE INSERT OR UPDATE ON dashboard_announcements
  FOR EACH ROW
  EXECUTE FUNCTION track_announcement_live_history();

-- Function: Auto-unpublish other announcements when one goes live (REPLACE IF EXISTS)
CREATE OR REPLACE FUNCTION ensure_one_live_announcement()
RETURNS TRIGGER AS $$
BEGIN
  -- If this announcement is being pushed live
  IF NEW.is_live = true THEN
    -- Remove all other live announcements for this organization
    UPDATE dashboard_announcements
    SET 
      is_live = false,
      removed_from_live_at = now(),
      updated_by = NEW.updated_by,
      updated_at = now()
    WHERE 
      organization_id = NEW.organization_id 
      AND id != NEW.id 
      AND is_live = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_ensure_one_live_announcement ON dashboard_announcements;
CREATE TRIGGER trigger_ensure_one_live_announcement
  BEFORE INSERT OR UPDATE ON dashboard_announcements
  FOR EACH ROW
  WHEN (NEW.is_live = true)
  EXECUTE FUNCTION ensure_one_live_announcement();

-- RLS Policies
ALTER TABLE dashboard_announcements ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view live announcements in their org" ON dashboard_announcements;
DROP POLICY IF EXISTS "HR/Admin can insert announcements" ON dashboard_announcements;
DROP POLICY IF EXISTS "HR/Admin can update announcements" ON dashboard_announcements;
DROP POLICY IF EXISTS "HR/Admin can delete announcements" ON dashboard_announcements;

-- Policy: Everyone can view live announcements in their organization
CREATE POLICY "Users can view live announcements in their org"
  ON dashboard_announcements
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Only HR/ADMIN/SUPERADMIN can insert announcements
CREATE POLICY "HR/Admin can insert announcements"
  ON dashboard_announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = dashboard_announcements.organization_id
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

-- Policy: Only HR/ADMIN/SUPERADMIN can update announcements
CREATE POLICY "HR/Admin can update announcements"
  ON dashboard_announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = dashboard_announcements.organization_id
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

-- Policy: Only HR/ADMIN/SUPERADMIN can delete announcements
CREATE POLICY "HR/Admin can delete announcements"
  ON dashboard_announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = dashboard_announcements.organization_id
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

-- Grant permissions
GRANT ALL ON dashboard_announcements TO authenticated;

-- ✅ Migration complete (SKIP IF EXISTS Version)!
SELECT '✅ Migration 047 erfolgreich ausgeführt (mit SKIP IF EXISTS)!' as status;
