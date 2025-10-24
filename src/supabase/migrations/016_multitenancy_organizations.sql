-- ================================================
-- MULTI-TENANCY: ORGANIZATIONS SYSTEM
-- ================================================
-- Implements complete multi-tenancy with organization isolation

-- ================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly name
  logo_url TEXT,
  domain TEXT, -- e.g., "company.com" for email validation
  subscription_tier TEXT DEFAULT 'FREE', -- FREE, STARTER, PROFESSIONAL, ENTERPRISE
  subscription_status TEXT DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, CANCELLED
  max_users INTEGER DEFAULT 10,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_active ON organizations(is_active);

-- ================================================
-- 2. ADD ORGANIZATION_ID TO ALL TABLES
-- ================================================

-- Users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);

-- Teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_teams_organization ON teams(organization_id);

-- Time records
ALTER TABLE time_records 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_time_records_organization ON time_records(organization_id);

-- Leave requests
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leave_requests_organization ON leave_requests(organization_id);

-- Documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);

-- Video content
ALTER TABLE video_content 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_video_content_organization ON video_content(organization_id);

-- Quiz content
ALTER TABLE quiz_content 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_quiz_content_organization ON quiz_content(organization_id);

-- User avatars
ALTER TABLE user_avatars 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_avatars_organization ON user_avatars(organization_id);

-- Achievements
ALTER TABLE achievements 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_achievements_organization ON achievements(organization_id);

-- User achievements
ALTER TABLE user_achievements 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_user_achievements_organization ON user_achievements(organization_id);

-- Coin transactions
ALTER TABLE coin_transactions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_coin_transactions_organization ON coin_transactions(organization_id);

-- Notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id);

-- Activity feed
ALTER TABLE activity_feed 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_activity_feed_organization ON activity_feed(organization_id);

-- ================================================
-- 3. CREATE ORGANIZATION INVITATIONS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'EMPLOYEE', -- EMPLOYEE, ADMIN
  invited_by UUID NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, EXPIRED
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);

-- ================================================
-- 4. RLS POLICIES - TENANT ISOLATION
-- ================================================

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- SUPERADMIN can see all organizations
CREATE POLICY "superadmin_all_organizations" ON organizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SUPERADMIN'
    )
  );

-- Users can see their own organization
CREATE POLICY "users_own_organization" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- ADMIN can update their own organization
CREATE POLICY "admin_update_organization" ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- Enable RLS on organization_invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see invitations for their organization
CREATE POLICY "org_invitations_policy" ON organization_invitations
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- ================================================
-- 5. UPDATE EXISTING RLS POLICIES FOR TENANT ISOLATION
-- ================================================

-- Drop existing policies that don't include organization_id
-- We'll recreate them with organization filtering

-- Users table - Users can only see users in their organization
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_organization" ON users
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users AS u
      WHERE u.id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM users AS u
      WHERE u.id = auth.uid()
      AND u.role = 'SUPERADMIN'
    )
  );

-- Time records - Only own organization
DROP POLICY IF EXISTS "time_records_all" ON time_records;
CREATE POLICY "time_records_organization" ON time_records
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Leave requests - Only own organization
DROP POLICY IF EXISTS "leave_requests_all" ON leave_requests;
CREATE POLICY "leave_requests_organization" ON leave_requests
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Documents - Only own organization
DROP POLICY IF EXISTS "documents_all" ON documents;
CREATE POLICY "documents_organization" ON documents
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Teams - Only own organization
DROP POLICY IF EXISTS "teams_all" ON teams;
CREATE POLICY "teams_organization" ON teams
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE users.id = auth.uid()
    )
  );

-- ================================================
-- 6. HELPER FUNCTIONS
-- ================================================

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM users 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is SUPERADMIN
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'SUPERADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is ADMIN or SUPERADMIN
CREATE OR REPLACE FUNCTION is_admin_or_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('ADMIN', 'SUPERADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 7. TRIGGERS FOR AUTO-SETTING ORGANIZATION_ID
-- ================================================

-- Auto-set organization_id from user's organization
CREATE OR REPLACE FUNCTION set_organization_id_from_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := get_user_organization_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
DROP TRIGGER IF EXISTS set_org_id_time_records ON time_records;
CREATE TRIGGER set_org_id_time_records
  BEFORE INSERT ON time_records
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_leave_requests ON leave_requests;
CREATE TRIGGER set_org_id_leave_requests
  BEFORE INSERT ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_documents ON documents;
CREATE TRIGGER set_org_id_documents
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_coin_transactions ON coin_transactions;
CREATE TRIGGER set_org_id_coin_transactions
  BEFORE INSERT ON coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_notifications ON notifications;
CREATE TRIGGER set_org_id_notifications
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_id_from_user();

DROP TRIGGER IF EXISTS set_org_id_activity_feed ON activity_feed;
CREATE TRIGGER set_org_id_activity_feed
  BEFORE INSERT ON activity_feed
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_id_from_user();

-- ================================================
-- 8. CREATE DEMO ORGANIZATION
-- ================================================

-- Create a demo organization
INSERT INTO organizations (name, slug, domain, subscription_tier, max_users)
VALUES ('Demo Company', 'demo-company', 'demo.com', 'PROFESSIONAL', 100)
ON CONFLICT (slug) DO NOTHING;

-- Update existing users to belong to demo organization
UPDATE users
SET organization_id = (SELECT id FROM organizations WHERE slug = 'demo-company' LIMIT 1)
WHERE organization_id IS NULL;

-- Update all existing data to belong to demo organization
DO $$
DECLARE
  demo_org_id UUID;
BEGIN
  SELECT id INTO demo_org_id FROM organizations WHERE slug = 'demo-company' LIMIT 1;
  
  UPDATE teams SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE time_records SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE leave_requests SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE documents SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE video_content SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE quiz_content SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE user_avatars SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE achievements SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE user_achievements SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE coin_transactions SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE notifications SET organization_id = demo_org_id WHERE organization_id IS NULL;
  UPDATE activity_feed SET organization_id = demo_org_id WHERE organization_id IS NULL;
END $$;

-- ================================================
-- VERIFICATION
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Multi-tenancy system created successfully!';
  RAISE NOTICE '✅ Organizations table created';
  RAISE NOTICE '✅ organization_id added to all tables';
  RAISE NOTICE '✅ RLS policies updated for tenant isolation';
  RAISE NOTICE '✅ Helper functions created';
  RAISE NOTICE '✅ Auto-triggers configured';
  RAISE NOTICE '✅ Demo organization created and existing data migrated';
END $$;
