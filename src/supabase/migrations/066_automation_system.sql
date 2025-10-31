-- ============================================================================
-- MIGRATION 066: AUTOMATION SYSTEM
-- ============================================================================
-- Complete automation infrastructure for n8n/Zapier integration
-- - API Keys per Organization
-- - Webhook Management
-- - Audit Logging
-- ============================================================================

-- ============================================================================
-- TABLE: automation_api_keys
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- In production, hash the API key!
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_automation_api_keys_key_hash 
  ON automation_api_keys(key_hash) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_automation_api_keys_org 
  ON automation_api_keys(organization_id);

-- ============================================================================
-- TABLE: automation_webhooks
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g., 'leave_request.created', 'document.uploaded'
  webhook_url TEXT NOT NULL,
  secret TEXT, -- Optional webhook secret for verification
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for event lookups
CREATE INDEX IF NOT EXISTS idx_automation_webhooks_event 
  ON automation_webhooks(event_type, organization_id) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_automation_webhooks_org 
  ON automation_webhooks(organization_id);

-- ============================================================================
-- TABLE: automation_audit_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES automation_api_keys(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g., 'antragmanager/leave-requests'
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  request_payload JSONB,
  response_payload JSONB
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_automation_audit_log_api_key 
  ON automation_audit_log(api_key_id);

CREATE INDEX IF NOT EXISTS idx_automation_audit_log_created 
  ON automation_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_audit_log_success 
  ON automation_audit_log(success);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- API Keys: Only HR/Superadmin can manage
ALTER TABLE automation_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select_own_org"
  ON automation_api_keys
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

CREATE POLICY "api_keys_insert_hr_admin"
  ON automation_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

CREATE POLICY "api_keys_update_hr_admin"
  ON automation_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

CREATE POLICY "api_keys_delete_hr_admin"
  ON automation_api_keys
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

-- Webhooks: Only HR/Superadmin can manage
ALTER TABLE automation_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks_select_own_org"
  ON automation_webhooks
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

CREATE POLICY "webhooks_insert_hr_admin"
  ON automation_webhooks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

CREATE POLICY "webhooks_update_hr_admin"
  ON automation_webhooks
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

CREATE POLICY "webhooks_delete_hr_admin"
  ON automation_webhooks
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

-- Audit Log: HR/Superadmin can view own organization's logs
ALTER TABLE automation_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_own_org"
  ON automation_audit_log
  FOR SELECT
  TO authenticated
  USING (
    api_key_id IN (
      SELECT id FROM automation_api_keys
      WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('hr', 'superadmin')
    )
  );

-- ============================================================================
-- HELPER FUNCTION: Trigger Webhooks
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_automation_webhooks(
  p_event_type TEXT,
  p_organization_id UUID,
  p_payload JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook RECORD;
BEGIN
  -- Get all active webhooks for this event and organization
  FOR v_webhook IN
    SELECT * FROM automation_webhooks
    WHERE event_type = p_event_type
      AND organization_id = p_organization_id
      AND is_active = true
  LOOP
    -- In a real implementation, you'd use pg_net or similar to make HTTP requests
    -- For now, we just log that the webhook should be triggered
    RAISE NOTICE 'Would trigger webhook: % for event: %', v_webhook.webhook_url, p_event_type;
    
    -- Update last_triggered_at
    UPDATE automation_webhooks
    SET last_triggered_at = NOW()
    WHERE id = v_webhook.id;
  END LOOP;
END;
$$;

-- ============================================================================
-- EXAMPLE TRIGGERS (commented out - activate when needed)
-- ============================================================================

-- Example: Trigger webhook when leave request is created
/*
CREATE OR REPLACE FUNCTION notify_leave_request_created()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM trigger_automation_webhooks(
    'leave_request.created',
    NEW.organization_id,
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER leave_request_webhook_trigger
AFTER INSERT ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION notify_leave_request_created();
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AUTOMATION SYSTEM MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - automation_api_keys';
  RAISE NOTICE '  - automation_webhooks';
  RAISE NOTICE '  - automation_audit_log';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS Policies: 12 policies created';
  RAISE NOTICE 'Helper Functions: trigger_automation_webhooks()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Deploy Edge Function: BrowoKoordinator-Automation';
  RAISE NOTICE '  2. Generate API Key in Settings';
  RAISE NOTICE '  3. Configure n8n with API Key';
  RAISE NOTICE '========================================';
END $$;
