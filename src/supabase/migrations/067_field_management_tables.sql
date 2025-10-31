-- =====================================================
-- FIELD MANAGEMENT SYSTEM - MIGRATION 067
-- =====================================================
-- Creates tables for field management: vehicles, equipment, assignments
-- =====================================================

-- =====================================================
-- 1. VEHICLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  kennzeichen TEXT NOT NULL,
  modell TEXT NOT NULL,
  fahrzeugtyp TEXT NOT NULL,
  ladekapazitaet NUMERIC DEFAULT 0,
  
  -- Dates
  dienst_start DATE,
  letzte_wartung DATE,
  
  -- Status & Condition
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'out_of_service')),
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  
  -- Media & Documents
  images JSONB DEFAULT '[]', -- Array of image URLs
  documents JSONB DEFAULT '[]', -- Array of {name, url}
  thumbnail TEXT,
  
  -- Maintenance & Incidents
  wartungen JSONB DEFAULT '[]', -- Array of {date, description, cost}
  unfaelle JSONB DEFAULT '[]', -- Array of {date, description, damage}
  
  -- Additional Fields
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT vehicles_organization_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_organization ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_kennzeichen ON vehicles(kennzeichen);

-- Update trigger
CREATE OR REPLACE FUNCTION update_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicles_updated_at();

-- =====================================================
-- 2. EQUIPMENT TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  serial_number TEXT,
  
  -- Dates
  purchase_date DATE,
  
  -- Status & Condition
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'out_of_service')),
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  
  -- Additional Fields
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT equipment_organization_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_organization ON equipment(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);

-- Update trigger
CREATE OR REPLACE FUNCTION update_equipment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_updated_at();

-- =====================================================
-- 3. FIELD ASSIGNMENTS TABLE (Checkout/Checkin)
-- =====================================================

CREATE TABLE IF NOT EXISTS field_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Item Info
  item_type TEXT NOT NULL CHECK (item_type IN ('vehicle', 'equipment')),
  item_id UUID NOT NULL, -- References vehicles.id or equipment.id
  
  -- Assignment Info
  assigned_to UUID NOT NULL REFERENCES users(id),
  checked_out_by UUID NOT NULL REFERENCES users(id),
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Checkin Info
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES users(id),
  condition_on_return TEXT CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  
  -- Notes
  notes TEXT, -- Checkout notes
  checkin_notes TEXT, -- Checkin notes
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT field_assignments_organization_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_field_assignments_organization ON field_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_field_assignments_assigned_to ON field_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_field_assignments_item ON field_assignments(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_field_assignments_active ON field_assignments(item_id, item_type, checked_in_at) WHERE checked_in_at IS NULL;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Vehicles policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vehicles in their organization"
  ON vehicles FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "HR/Admin can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "HR/Admin can update vehicles"
  ON vehicles FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "HR/Admin can delete vehicles"
  ON vehicles FOR DELETE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

-- Equipment policies
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view equipment in their organization"
  ON equipment FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "HR/Admin can create equipment"
  ON equipment FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "HR/Admin can update equipment"
  ON equipment FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

CREATE POLICY "HR/Admin can delete equipment"
  ON equipment FOR DELETE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
    )
  );

-- Field Assignments policies
ALTER TABLE field_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments"
  ON field_assignments FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (
      assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
      )
    )
  );

CREATE POLICY "Users can create assignments"
  ON field_assignments FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their assignments"
  ON field_assignments FOR UPDATE
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (
      assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('HR', 'ADMIN', 'SUPERADMIN')
      )
    )
  );

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Next steps:
-- 1. Run this migration in Supabase
-- 2. Deploy BrowoKoordinator-Field Edge Function
-- 3. Test with console test script
-- 4. Update FieldManagementScreen to use Edge Function
-- =====================================================
