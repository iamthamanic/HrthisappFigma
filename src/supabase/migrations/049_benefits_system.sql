-- ============================================
-- MIGRATION 049: BENEFITS SYSTEM
-- ============================================
-- Version: 3.7.0
-- Date: 2025-01-12
-- Description: Complete Benefits System with Request/Approval Workflow
-- ============================================

-- ============================================
-- CLEANUP: Drop existing tables if they exist (safe drop)
-- ============================================
DROP TABLE IF EXISTS user_benefits CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;

-- ============================================
-- 1. BENEFITS TABLE
-- ============================================
CREATE TABLE benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,           -- Lange Beschreibung für Detail-View
  short_description TEXT NOT NULL,     -- Kurzbeschreibung für Card-View
  
  -- Kategorisierung
  category TEXT NOT NULL CHECK (category IN ('Health', 'Mobility', 'Finance', 'Food', 'Learning', 'Lifestyle', 'Work-Life')),
  icon TEXT NOT NULL,                  -- Lucide Icon Name (z.B. 'Heart', 'Car', 'DollarSign')
  
  -- Limits & Verfügbarkeit
  max_users INTEGER,                   -- NULL = unbegrenzt verfügbar
  current_users INTEGER DEFAULT 0,     -- Aktuelle Anzahl Nutzer
  is_active BOOLEAN DEFAULT true,      -- Kann aktiviert/deaktiviert werden
  
  -- Optional: Voraussetzungen
  value DECIMAL(10,2),                 -- Optional: EUR-Wert des Benefits
  eligibility_months INTEGER DEFAULT 0, -- Mindest-Betriebszugehörigkeit in Monaten
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes für Performance
CREATE INDEX idx_benefits_organization ON benefits(organization_id);
CREATE INDEX idx_benefits_category ON benefits(category);
CREATE INDEX idx_benefits_is_active ON benefits(is_active);

-- ============================================
-- 2. USER_BENEFITS TABLE (Relationship)
-- ============================================
CREATE TABLE user_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  benefit_id UUID NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'CANCELLED')),
  
  -- Approval Workflow
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  
  -- Notizen
  notes TEXT,                          -- User-Notizen bei Request
  admin_notes TEXT,                    -- Admin-Notizen bei Genehmigung
  
  -- Gültigkeit
  valid_from DATE,
  valid_until DATE,
  
  -- Unique Constraint: Ein User kann ein Benefit nur einmal haben (aktiv)
  UNIQUE(user_id, benefit_id)
);

-- Indexes für Performance
CREATE INDEX idx_user_benefits_user ON user_benefits(user_id);
CREATE INDEX idx_user_benefits_benefit ON user_benefits(benefit_id);
CREATE INDEX idx_user_benefits_status ON user_benefits(status);

-- ============================================
-- 3. AUTO-UPDATE CURRENT_USERS COUNTER
-- ============================================
-- Trigger: Erhöhe current_users wenn Status = APPROVED
CREATE OR REPLACE FUNCTION update_benefit_current_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    UPDATE benefits 
    SET current_users = current_users + 1 
    WHERE id = NEW.benefit_id;
  ELSIF OLD.status = 'APPROVED' AND NEW.status != 'APPROVED' THEN
    UPDATE benefits 
    SET current_users = GREATEST(0, current_users - 1)
    WHERE id = NEW.benefit_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_benefit_current_users
AFTER INSERT OR UPDATE OF status ON user_benefits
FOR EACH ROW
EXECUTE FUNCTION update_benefit_current_users();

-- ============================================
-- 4. AUTO-UPDATE TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_benefits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_benefits_timestamp
BEFORE UPDATE ON benefits
FOR EACH ROW
EXECUTE FUNCTION update_benefits_updated_at();

-- ============================================
-- 5. RLS POLICIES - BENEFITS TABLE
-- ============================================
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;

-- Policy: Alle können Benefits ihrer Organisation sehen
CREATE POLICY "Users can view benefits in their organization"
ON benefits FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
  AND is_active = true
);

-- Policy: Nur ADMIN/HR/SUPERADMIN können Benefits erstellen
CREATE POLICY "Only admins can create benefits"
ON benefits FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND organization_id = benefits.organization_id
    AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
  )
);

-- Policy: Nur ADMIN/HR/SUPERADMIN können Benefits bearbeiten
CREATE POLICY "Only admins can update benefits"
ON benefits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND organization_id = benefits.organization_id
    AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
  )
);

-- Policy: Nur ADMIN/HR/SUPERADMIN können Benefits löschen
CREATE POLICY "Only admins can delete benefits"
ON benefits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND organization_id = benefits.organization_id
    AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
  )
);

-- ============================================
-- 6. RLS POLICIES - USER_BENEFITS TABLE
-- ============================================
ALTER TABLE user_benefits ENABLE ROW LEVEL SECURITY;

-- Policy: User sieht eigene Benefits
CREATE POLICY "Users can view their own benefits"
ON user_benefits FOR SELECT
USING (user_id = auth.uid());

-- Policy: ADMIN/HR/SUPERADMIN sehen alle Benefits ihrer Org
CREATE POLICY "Admins can view all benefits in their org"
ON user_benefits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = user_benefits.user_id
    )
  )
);

-- Policy: User kann eigene Benefits anfordern
CREATE POLICY "Users can request benefits"
ON user_benefits FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy: User kann eigene Benefits stornieren (nur PENDING)
CREATE POLICY "Users can cancel their pending benefits"
ON user_benefits FOR UPDATE
USING (user_id = auth.uid() AND status = 'PENDING');

-- Policy: ADMIN/HR/SUPERADMIN können Benefits genehmigen/ablehnen
CREATE POLICY "Admins can approve/reject benefits"
ON user_benefits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = user_benefits.user_id
    )
  )
);

-- Policy: ADMIN/HR/SUPERADMIN können Benefits löschen
CREATE POLICY "Admins can delete benefits"
ON user_benefits FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'HR', 'SUPERADMIN')
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = user_benefits.user_id
    )
  )
);

-- ============================================
-- 7. EXAMPLE DATA (Optional - auskommentiert)
-- ============================================
/*
-- Beispiel-Benefits erstellen (nur für Testing)
INSERT INTO benefits (organization_id, title, short_description, description, category, icon, max_users, value, eligibility_months, created_by)
VALUES 
(
  (SELECT id FROM organizations WHERE is_default = true LIMIT 1),
  'Firmenwagen',
  'Elektrofahrzeug zur privaten Nutzung',
  'Ein moderner Elektro-Firmenwagen zur dienstlichen und privaten Nutzung. Inklusive Versicherung, Wartung und Ladekarte für öffentliche Ladesäulen.',
  'Mobility',
  'Car',
  10,
  500.00,
  6,
  (SELECT id FROM users WHERE role = 'SUPERADMIN' LIMIT 1)
),
(
  (SELECT id FROM organizations WHERE is_default = true LIMIT 1),
  'Fitnessstudio-Mitgliedschaft',
  'Zugang zu Premium-Fitnessstudios',
  'Mitgliedschaft in Premium-Fitnessstudio-Ketten deutschlandweit. Inklusive Sauna, Wellness-Bereich und Personal Training (1x/Monat).',
  'Health',
  'Heart',
  20,
  79.90,
  3,
  (SELECT id FROM users WHERE role = 'SUPERADMIN' LIMIT 1)
),
(
  (SELECT id FROM organizations WHERE is_default = true LIMIT 1),
  'Essenszuschuss',
  'Täglicher Essenszuschuss von 8€',
  'Täglich 8€ Zuschuss für Mittagessen in der Kantine oder in umliegenden Restaurants. Auszahlung über digitale Essensgutscheine.',
  'Food',
  'UtensilsCrossed',
  NULL,
  8.00,
  0,
  (SELECT id FROM users WHERE role = 'SUPERADMIN' LIMIT 1)
);
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next Steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create TypeScript types in /types/schemas/HRTHIS_benefitSchemas.ts
-- 3. Create service in /services/HRTHIS_benefitsService.ts
-- 4. Implement UI in BenefitsScreen.tsx
-- ============================================
