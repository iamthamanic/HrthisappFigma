-- Migration 070: Specializations Master Table
-- Zentrale Verwaltung von Spezialisierungen in Firmeneinstellungen
-- Created: 2025-11-03

-- Create specializations table
CREATE TABLE IF NOT EXISTS specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, organization_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_specializations_org ON specializations(organization_id);
CREATE INDEX IF NOT EXISTS idx_specializations_name ON specializations(name);

-- Enable RLS
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view specializations of their organization"
  ON specializations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert specializations"
  ON specializations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = specializations.organization_id
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "Admins can update specializations"
  ON specializations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = specializations.organization_id
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "Admins can delete specializations"
  ON specializations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND organization_id = specializations.organization_id
      AND role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_specializations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER specializations_updated_at
  BEFORE UPDATE ON specializations
  FOR EACH ROW
  EXECUTE FUNCTION update_specializations_updated_at();

-- Add comment
COMMENT ON TABLE specializations IS 'Zentrale Verwaltung von Spezialisierungen für die Organisation';
