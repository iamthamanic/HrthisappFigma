-- =====================================================================================
-- SAFE MIGRATION 063: UNIVERSAL AUDIT LOG SYSTEM (MINIMAL VERSION)
-- =====================================================================================
-- Description: Nur die Kern-Infrastruktur OHNE Trigger auf fehlende Tabellen
-- Version: 1.0.0 SAFE
-- Date: 2025-10-17
-- =====================================================================================

-- =====================================================================================
-- 1. ZENTRALE AUDIT_LOGS TABELLE
-- =====================================================================================

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

-- =====================================================================================
-- 2. INDIZES
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_affected_user ON audit_logs(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);

COMMENT ON TABLE audit_logs IS 'Zentrale Tabelle für alle Audit-Logs in HRthis';

-- =====================================================================================
-- 3. HELPER FUNCTION: Get User Display Name
-- =====================================================================================

CREATE OR REPLACE FUNCTION get_user_display_name(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  display_name TEXT;
BEGIN
  SELECT COALESCE(first_name || ' ' || last_name, email)
  INTO display_name
  FROM users
  WHERE id = user_uuid;
  
  RETURN COALESCE(display_name, 'Unbekannt');
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================================
-- 4. TRIGGER FUNCTION: Universal Audit Logger
-- =====================================================================================

CREATE OR REPLACE FUNCTION log_audit_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
  v_affected_user_id UUID;
  v_affected_user_name TEXT;
  v_category TEXT;
  v_description TEXT;
BEGIN
  -- Aktuellen User aus auth.users holen (falls vorhanden)
  BEGIN
    v_user_id := auth.uid();
    SELECT role INTO v_user_role FROM users WHERE id = v_user_id;
    v_user_name := get_user_display_name(v_user_id);
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
    v_user_name := 'System';
    v_user_role := 'system';
  END;

  -- Tabellen-spezifische Logik
  CASE TG_TABLE_NAME
    
    -- ===============================================================
    -- USERS TABLE
    -- ===============================================================
    WHEN 'users' THEN
      v_affected_user_id := COALESCE(NEW.id, OLD.id);
      v_affected_user_name := COALESCE(
        get_user_display_name(NEW.id),
        get_user_display_name(OLD.id)
      );
      
      IF TG_OP = 'INSERT' THEN
        v_category := 'general';
        v_description := 'Neuer Mitarbeiter wurde angelegt: ' || v_affected_user_name;
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'users', NEW.id, 'INSERT', v_category,
          v_description, NOW()
        );
        
      ELSIF TG_OP = 'UPDATE' THEN
        -- Persönliche Daten
        IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            field_name, old_value, new_value,
            description, created_at
          ) VALUES (
            v_user_id, v_user_name, v_user_role,
            v_affected_user_id, v_affected_user_name,
            'users', NEW.id, 'UPDATE', 'personal_data',
            'first_name', OLD.first_name, NEW.first_name,
            v_user_name || ' hat Vorname von "' || COALESCE(OLD.first_name, '-') || '" auf "' || NEW.first_name || '" geändert',
            NOW()
          );
        END IF;
        
        IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            field_name, old_value, new_value,
            description, created_at
          ) VALUES (
            v_user_id, v_user_name, v_user_role,
            v_affected_user_id, v_affected_user_name,
            'users', NEW.id, 'UPDATE', 'personal_data',
            'last_name', OLD.last_name, NEW.last_name,
            v_user_name || ' hat Nachname von "' || COALESCE(OLD.last_name, '-') || '" auf "' || NEW.last_name || '" geändert',
            NOW()
          );
        END IF;
        
        -- Position
        IF OLD.position IS DISTINCT FROM NEW.position THEN
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            field_name, old_value, new_value,
            description, created_at
          ) VALUES (
            v_user_id, v_user_name, v_user_role,
            v_affected_user_id, v_affected_user_name,
            'users', NEW.id, 'UPDATE', 'work_info',
            'position', OLD.position, NEW.position,
            v_user_name || ' hat Position von "' || COALESCE(OLD.position, '-') || '" auf "' || NEW.position || '" geändert',
            NOW()
          );
        END IF;
        
        -- Role
        IF OLD.role IS DISTINCT FROM NEW.role THEN
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            field_name, old_value, new_value,
            description, created_at
          ) VALUES (
            v_user_id, v_user_name, v_user_role,
            v_affected_user_id, v_affected_user_name,
            'users', NEW.id, 'UPDATE', 'permissions',
            'role', OLD.role, NEW.role,
            v_user_name || ' hat Rolle von "' || OLD.role || '" auf "' || NEW.role || '" geändert',
            NOW()
          );
        END IF;
        
      ELSIF TG_OP = 'DELETE' THEN
        v_category := 'general';
        v_description := 'Mitarbeiter wurde gelöscht: ' || v_affected_user_name;
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'users', OLD.id, 'DELETE', v_category,
          v_description, NOW()
        );
      END IF;
    
    -- ===============================================================
    -- WEEKLY_HOURS_HISTORY
    -- ===============================================================
    WHEN 'weekly_hours_history' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' AND (NEW.change_reason IS NULL OR NEW.change_reason NOT LIKE 'Migration:%') THEN
        v_description := v_user_name || ' hat Wochenstunden von ' || 
          v_affected_user_name || ' auf ' || NEW.weekly_hours || 'h geändert (gültig ab ' || 
          TO_CHAR(NEW.valid_from, 'DD.MM.YYYY') || ')';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          field_name, new_value,
          description, change_reason, valid_from, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'weekly_hours_history', NEW.id, 'INSERT', 'work_info',
          'weekly_hours', NEW.weekly_hours::TEXT || 'h',
          v_description, NEW.change_reason, NEW.valid_from, NOW()
        );
      END IF;
    
    -- ===============================================================
    -- DOCUMENTS
    -- ===============================================================
    WHEN 'documents' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        v_description := v_user_name || ' hat Dokument "' || NEW.title || '" hochgeladen';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          field_name, new_value,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'documents', NEW.id, 'INSERT', 'documents',
          'document_upload', NEW.title,
          v_description, NOW()
        );
        
      ELSIF TG_OP = 'DELETE' THEN
        v_description := v_user_name || ' hat Dokument "' || OLD.title || '" gelöscht';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          field_name, old_value,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'documents', OLD.id, 'DELETE', 'documents',
          'document_delete', OLD.title,
          v_description, NOW()
        );
      END IF;
  END CASE;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 5. TRIGGER INSTALLATION (NUR FÜR EXISTIERENDE TABELLEN)
-- =====================================================================================

-- Users Table
DROP TRIGGER IF EXISTS audit_users_changes ON users;
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Weekly Hours History
DROP TRIGGER IF EXISTS audit_weekly_hours_changes ON weekly_hours_history;
CREATE TRIGGER audit_weekly_hours_changes
  AFTER INSERT ON weekly_hours_history
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Documents
DROP TRIGGER IF EXISTS audit_documents_changes ON documents;
CREATE TRIGGER audit_documents_changes
  AFTER INSERT OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- =====================================================================================
-- 6. RLS POLICIES
-- =====================================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins/HR können ALLE Logs sehen
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
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
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (affected_user_id = auth.uid());

-- Teamleads können Logs ihrer Team-Mitglieder sehen
DROP POLICY IF EXISTS "Teamleads can view their team members audit logs" ON audit_logs;
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

-- =====================================================================================
-- 7. GRANT PERMISSIONS
-- =====================================================================================

GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_display_name(UUID) TO authenticated;

-- =====================================================================================
-- ✅ MIGRATION 063 COMPLETE (SAFE VERSION)
-- =====================================================================================

COMMENT ON TABLE audit_logs IS 'v1.0.0 SAFE - Universal Audit Log System (Nur Kern-Tabellen)';
