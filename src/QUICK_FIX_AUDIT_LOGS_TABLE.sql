-- =====================================================================================
-- QUICK FIX: CREATE AUDIT_LOGS TABLE
-- =====================================================================================
-- Kopiere diesen KOMPLETTEN Code in den Supabase SQL Editor und führe ihn aus!
-- =====================================================================================

-- 1. CREATE AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Wer hat die Änderung vorgenommen?
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_by_role TEXT,
  
  -- Welcher Mitarbeiter ist betroffen?
  affected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  affected_user_name TEXT,
  
  -- Was wurde geändert?
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL,
  
  -- Kategorie für UI-Gruppierung
  category TEXT NOT NULL,
  
  -- Detaillierte Änderungs-Informationen
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  
  -- Human-readable Beschreibung
  description TEXT NOT NULL,
  change_reason TEXT,
  
  -- Metadaten
  valid_from DATE,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  CONSTRAINT valid_category CHECK (category IN (
    'personal_data',
    'work_info',
    'time_tracking',
    'time_account',
    'absences',
    'documents',
    'benefits',
    'coins',
    'achievements',
    'learning',
    'permissions',
    'general'
  ))
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_audit_logs_affected_user ON audit_logs(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

-- 3. ENABLE RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES
-- Admins/HR können ALLE Logs sehen
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('superadmin', 'admin', 'hr')
    )
  );

-- Users können nur IHRE EIGENEN Logs sehen
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (affected_user_id = auth.uid());

-- Teamleads können Logs ihrer Team-Mitglieder sehen
CREATE POLICY "Teamleads can view their team members audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'teamlead'
    )
    AND EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = affected_user_id
      AND t.teamlead_id = auth.uid()
    )
  );

-- 5. GRANT PERMISSIONS
GRANT SELECT ON audit_logs TO authenticated;

-- =====================================================================================
-- ✅ TABELLE ERSTELLT! 
-- =====================================================================================
-- Die audit_logs Tabelle ist jetzt bereit.
-- Jetzt kannst du die Trigger installieren (siehe nächster Schritt)
-- =====================================================================================
