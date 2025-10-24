-- =====================================================
-- CANVA-STYLE DRAGGABLE ORGANIGRAM SYSTEM - MIGRATION 031
-- =====================================================
-- 
-- ⚠️  WICHTIG: Diese Migration MUSS ausgeführt werden, bevor der
--     Canvas Organigram Editor verwendet werden kann!
--
-- 📋 Schnellanleitung:
--     1. Öffne Supabase Dashboard → SQL Editor
--     2. Klicke "New Query"
--     3. Kopiere diesen KOMPLETTEN SQL-Code
--     4. Füge ihn ein und klicke "Run" (Cmd/Ctrl + Enter)
--     5. Warte auf: "Success. No rows returned"
--     6. Lade die Canvas-Seite neu
--
-- ✨ Features:
--    - Multiple node types (Location, Executive, Department, Specialization)
--    - Free-draggable nodes (like Canva)
--    - Connection pin points (4 per node: top, right, bottom, left)
--    - Manual connections between pin points
--    - Curved and orthogonal line styles
--    - Auto-sync with departments table
--
-- =====================================================

-- =====================================================
-- 1. NODE TYPES (Kachel-Typen)
-- =====================================================
CREATE TABLE IF NOT EXISTS node_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'location', 'executive', 'department', 'specialization'
  display_name TEXT NOT NULL, -- 'Standort', 'Geschäftsführer', 'Abteilung', 'Spezialisierung'
  icon TEXT NOT NULL, -- Lucide icon name: 'MapPin', 'UserCog', 'Building2', 'Layers'
  color TEXT NOT NULL, -- Hex color: '#3B82F6', '#8B5CF6', '#6B7280', '#10B981'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default node types
INSERT INTO node_types (name, display_name, icon, color) VALUES
  ('location', 'Standort', 'MapPin', '#3B82F6'),
  ('executive', 'Geschäftsführer', 'UserCog', '#8B5CF6'),
  ('department', 'Abteilung', 'Building2', '#6B7280'),
  ('specialization', 'Spezialisierung', 'Layers', '#10B981')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 2. ORG NODES (Draggable Nodes)
-- =====================================================
CREATE TABLE IF NOT EXISTS org_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL REFERENCES node_types(name),
  
  -- Node content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Position on canvas (pixels)
  position_x NUMERIC DEFAULT 0,
  position_y NUMERIC DEFAULT 0,
  
  -- Size (for future flexibility)
  width NUMERIC DEFAULT 280,
  height NUMERIC DEFAULT 180,
  
  -- Additional data
  metadata JSONB DEFAULT '{}', -- For custom fields per node type
  
  -- Department reference (optional - if node represents a department)
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT org_nodes_organization_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_org_nodes_organization ON org_nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_nodes_type ON org_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_org_nodes_department ON org_nodes(department_id);

-- =====================================================
-- 3. NODE CONNECTIONS (Pin Point Connections)
-- =====================================================
CREATE TABLE IF NOT EXISTS node_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Source node & pin position
  source_node_id UUID NOT NULL REFERENCES org_nodes(id) ON DELETE CASCADE,
  source_position TEXT NOT NULL CHECK (source_position IN ('top', 'right', 'bottom', 'left')),
  
  -- Target node & pin position
  target_node_id UUID NOT NULL REFERENCES org_nodes(id) ON DELETE CASCADE,
  target_position TEXT NOT NULL CHECK (target_position IN ('top', 'right', 'bottom', 'left')),
  
  -- Connection style
  line_style TEXT DEFAULT 'curved' CHECK (line_style IN ('curved', 'orthogonal', 'straight')),
  
  -- Visual properties
  color TEXT DEFAULT '#6B7280',
  stroke_width NUMERIC DEFAULT 2,
  
  -- Metadata
  label TEXT, -- Optional label on connection
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Prevent duplicate connections between same pins
  CONSTRAINT unique_connection UNIQUE (source_node_id, source_position, target_node_id, target_position),
  
  -- Prevent self-connections
  CONSTRAINT no_self_connection CHECK (source_node_id != target_node_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_node_connections_organization ON node_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_node_connections_source ON node_connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_node_connections_target ON node_connections(target_node_id);

-- =====================================================
-- 4. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_org_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_org_nodes_updated_at
  BEFORE UPDATE ON org_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_org_nodes_updated_at();

CREATE OR REPLACE FUNCTION update_node_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_node_connections_updated_at
  BEFORE UPDATE ON node_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_node_connections_updated_at();

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- org_nodes policies
ALTER TABLE org_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org_nodes in their organization"
  ON org_nodes FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create org_nodes in their organization"
  ON org_nodes FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update org_nodes in their organization"
  ON org_nodes FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete org_nodes in their organization"
  ON org_nodes FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- node_connections policies
ALTER TABLE node_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view node_connections in their organization"
  ON node_connections FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create node_connections in their organization"
  ON node_connections FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update node_connections in their organization"
  ON node_connections FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete node_connections in their organization"
  ON node_connections FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- node_types is public (no RLS needed)

-- =====================================================
-- 6. EXAMPLE DATA (Optional - for testing)
-- =====================================================

-- This will be inserted via the UI, but here's an example:
/*
INSERT INTO org_nodes (organization_id, node_type, title, description, position_x, position_y) VALUES
  ((SELECT id FROM organizations WHERE is_default = true LIMIT 1), 'executive', 'CEO', 'Max Mustermann', 400, 50),
  ((SELECT id FROM organizations WHERE is_default = true LIMIT 1), 'department', 'HR', 'Personalabteilung', 200, 250),
  ((SELECT id FROM organizations WHERE is_default = true LIMIT 1), 'department', 'IT', 'IT-Abteilung', 600, 250),
  ((SELECT id FROM organizations WHERE is_default = true LIMIT 1), 'location', 'Berlin', 'Hauptsitz', 50, 450),
  ((SELECT id FROM organizations WHERE is_default = true LIMIT 1), 'specialization', 'Development', 'Software Development', 750, 450);

-- Example connections
INSERT INTO node_connections (
  organization_id, 
  source_node_id, 
  source_position, 
  target_node_id, 
  target_position,
  line_style
) VALUES
  (
    (SELECT id FROM organizations WHERE is_default = true LIMIT 1),
    (SELECT id FROM org_nodes WHERE title = 'CEO' LIMIT 1),
    'bottom',
    (SELECT id FROM org_nodes WHERE title = 'HR' LIMIT 1),
    'top',
    'curved'
  );
*/

-- =====================================================
-- MIGRATION COMPLETE ✅
-- =====================================================
-- Next steps:
-- 1. Run this migration in Supabase
-- 2. Create Components: OrgNode, ConnectionPoint, ConnectionLine
-- 3. Create CanvasOrgChart component
-- 4. Update OrganigramScreen
-- =====================================================
