-- =====================================================================================
-- MIGRATION 063: UNIVERSAL AUDIT LOG SYSTEM
-- =====================================================================================
-- Description: Zentrale Audit-Log Infrastruktur für vollständige Nachvollziehbarkeit
-- Version: 1.0.0
-- Author: HRthis Development Team
-- Date: 2025-10-17
-- =====================================================================================

-- =====================================================================================
-- 1. ZENTRALE AUDIT_LOGS TABELLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Wer hat die Änderung vorgenommen?
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_by_name TEXT, -- Gespeichert für Historie, falls User gelöscht wird
  changed_by_role TEXT, -- Admin, HR, Teamlead, User
  
  -- Welcher Mitarbeiter ist betroffen?
  affected_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  affected_user_name TEXT, -- Gespeichert für Historie
  
  -- Was wurde geändert?
  table_name TEXT NOT NULL, -- z.B. 'users', 'documents', 'coin_transactions'
  record_id UUID, -- ID des geänderten Datensatzes (falls relevant)
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  
  -- Kategorie für UI-Gruppierung
  category TEXT NOT NULL, -- 'personal_data', 'work_info', 'time_tracking', 'benefits', 'documents', etc.
  
  -- Detaillierte Änderungs-Informationen
  field_name TEXT, -- Welches Feld wurde geändert? (bei UPDATE)
  old_value TEXT, -- Alter Wert (als Text gespeichert)
  new_value TEXT, -- Neuer Wert (als Text gespeichert)
  
  -- Human-readable Beschreibung
  description TEXT NOT NULL, -- z.B. "Admin Albert Admin hat Wochenstunden von 30h auf 40h geändert"
  change_reason TEXT, -- Optional: Grund für die Änderung
  
  -- Metadaten
  valid_from DATE, -- Gültig ab (für zeitbasierte Änderungen wie weekly_hours)
  ip_address INET, -- IP-Adresse des Users
  user_agent TEXT, -- Browser/Device Info
  
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

-- Indizes für Performance
CREATE INDEX idx_audit_logs_affected_user ON audit_logs(affected_user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(category);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);

COMMENT ON TABLE audit_logs IS 'Zentrale Tabelle für alle Audit-Logs in HRthis';
COMMENT ON COLUMN audit_logs.category IS 'Kategorie für UI-Gruppierung: personal_data, work_info, time_tracking, time_account, absences, documents, benefits, coins, achievements, learning, permissions, general';

-- =====================================================================================
-- 2. HELPER FUNCTION: Get User Display Name
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
-- 3. TRIGGER FUNCTION: Universal Audit Logger
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
  v_field_name TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_valid_from DATE;
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
    -- USERS TABLE: Persönliche Daten & Arbeitsinformationen
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
        
        IF OLD.profile_picture IS DISTINCT FROM NEW.profile_picture THEN
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
            'profile_picture', 
            CASE WHEN OLD.profile_picture IS NOT NULL THEN 'Vorhanden' ELSE 'Kein Bild' END,
            CASE WHEN NEW.profile_picture IS NOT NULL THEN 'Vorhanden' ELSE 'Kein Bild' END,
            v_user_name || ' hat Profilbild ' || 
            CASE 
              WHEN OLD.profile_picture IS NULL AND NEW.profile_picture IS NOT NULL THEN 'hochgeladen'
              WHEN OLD.profile_picture IS NOT NULL AND NEW.profile_picture IS NULL THEN 'entfernt'
              ELSE 'geändert'
            END,
            NOW()
          );
        END IF;
        
        -- Arbeitsinformationen
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
        
        IF OLD.department IS DISTINCT FROM NEW.department THEN
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
            'department', OLD.department, NEW.department,
            v_user_name || ' hat Abteilung von "' || COALESCE(OLD.department, '-') || '" auf "' || NEW.department || '" geändert',
            NOW()
          );
        END IF;
        
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
    -- WEEKLY_HOURS_HISTORY: Arbeitszeitkonto & Arbeitsinformationen
    -- ===============================================================
    WHEN 'weekly_hours_history' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        -- Nur loggen wenn es KEINE Migration ist
        IF NEW.change_reason NOT LIKE 'Migration:%' THEN
          v_description := v_user_name || ' hat Wochenstunden von ' || 
            v_affected_user_name || ' auf ' || NEW.weekly_hours || 'h geändert (gültig ab ' || 
            TO_CHAR(NEW.valid_from, 'DD.MM.YYYY') || ')';
          
          v_valid_from := NEW.valid_from;
          
          -- Log in BEIDE Kategorien: work_info UND time_account
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
            v_description, NEW.change_reason, v_valid_from, NOW()
          );
          
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            field_name, new_value,
            description, change_reason, valid_from, created_at
          ) VALUES (
            v_user_id, v_user_name, v_user_role,
            v_affected_user_id, v_affected_user_name,
            'weekly_hours_history', NEW.id, 'INSERT', 'time_account',
            'weekly_hours', NEW.weekly_hours::TEXT || 'h',
            v_description, NEW.change_reason, v_valid_from, NOW()
          );
        END IF;
      END IF;
    
    -- ===============================================================
    -- DOCUMENTS: Dokumente hinzugefügt/entfernt
    -- ===============================================================
    WHEN 'documents' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        v_description := v_user_name || ' hat Dokument "' || NEW.title || '" (' || NEW.category || ') hochgeladen';
        
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
          'document_upload', NEW.title || ' (' || NEW.category || ')',
          v_description, NOW()
        );
        
      ELSIF TG_OP = 'DELETE' THEN
        v_description := v_user_name || ' hat Dokument "' || OLD.title || '" (' || OLD.category || ') gelöscht';
        
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
          'document_delete', OLD.title || ' (' || OLD.category || ')',
          v_description, NOW()
        );
      END IF;
    
    -- ===============================================================
    -- LEAVE_REQUESTS: Abwesenheiten
    -- ===============================================================
    WHEN 'leave_requests' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        v_description := v_affected_user_name || ' hat ' || 
          COALESCE(NEW.leave_type, 'Abwesenheit') || ' beantragt (' ||
          TO_CHAR(NEW.start_date, 'DD.MM.YYYY') || ' - ' ||
          TO_CHAR(NEW.end_date, 'DD.MM.YYYY') || ')';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          field_name, new_value,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'leave_requests', NEW.id, 'INSERT', 'absences',
          'leave_request', NEW.leave_type,
          v_description, NOW()
        );
        
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          v_description := v_user_name || ' hat Abwesenheitsantrag von ' || 
            v_affected_user_name || ' ' ||
            CASE 
              WHEN NEW.status = 'approved' THEN 'genehmigt'
              WHEN NEW.status = 'rejected' THEN 'abgelehnt'
              ELSE 'auf "' || NEW.status || '" gesetzt'
            END;
          
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            field_name, old_value, new_value,
            description, created_at
          ) VALUES (
            v_user_id, v_user_name, v_user_role,
            v_affected_user_id, v_affected_user_name,
            'leave_requests', NEW.id, 'UPDATE', 'absences',
            'leave_status', OLD.status, NEW.status,
            v_description, NOW()
          );
        END IF;
        
      ELSIF TG_OP = 'DELETE' THEN
        v_description := v_user_name || ' hat Abwesenheitsantrag von ' || 
          v_affected_user_name || ' gelöscht';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'leave_requests', OLD.id, 'DELETE', 'absences',
          v_description, NOW()
        );
      END IF;
    
    -- ===============================================================
    -- COIN_TRANSACTIONS: Coins erhalten/ausgeben
    -- ===============================================================
    WHEN 'coin_transactions' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        v_description := v_affected_user_name || 
          CASE 
            WHEN NEW.amount > 0 THEN ' hat ' || NEW.amount || ' Coins erhalten'
            ELSE ' hat ' || ABS(NEW.amount) || ' Coins ausgegeben'
          END ||
          CASE WHEN NEW.reason IS NOT NULL THEN ' (' || NEW.reason || ')' ELSE '' END;
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          field_name, new_value,
          description, change_reason, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'coin_transactions', NEW.id, 'INSERT', 'coins',
          'coin_transaction', NEW.amount::TEXT,
          v_description, NEW.reason, NOW()
        );
      END IF;
    
    -- ===============================================================
    -- BENEFIT_REQUESTS: Benefits beantragt/genehmigt
    -- ===============================================================
    WHEN 'benefit_requests' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        v_description := v_affected_user_name || ' hat Benefit beantragt';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'benefit_requests', NEW.id, 'INSERT', 'benefits',
          v_description, NOW()
        );
        
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          v_description := v_user_name || ' hat Benefit-Antrag von ' || 
            v_affected_user_name || ' ' ||
            CASE 
              WHEN NEW.status = 'approved' THEN 'genehmigt'
              WHEN NEW.status = 'rejected' THEN 'abgelehnt'
              ELSE 'auf "' || NEW.status || '" gesetzt'
            END;
          
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            field_name, old_value, new_value,
            description, created_at
          ) VALUES (
            v_user_id, v_user_name, v_user_role,
            v_affected_user_id, v_affected_user_name,
            'benefit_requests', NEW.id, 'UPDATE', 'benefits',
            'benefit_status', OLD.status, NEW.status,
            v_description, NOW()
          );
        END IF;
      END IF;
    
    -- ===============================================================
    -- USER_ACHIEVEMENTS: Achievements freigeschaltet
    -- ===============================================================
    WHEN 'user_achievements' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        v_description := v_affected_user_name || ' hat ein Achievement freigeschaltet';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          description, created_at
        ) VALUES (
          v_user_id, v_user_name, v_user_role,
          v_affected_user_id, v_affected_user_name,
          'user_achievements', NEW.id, 'INSERT', 'achievements',
          v_description, NOW()
        );
      END IF;
    
    -- ===============================================================
    -- LEARNING_PROGRESS: Lernfortschritt
    -- ===============================================================
    WHEN 'learning_progress' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'UPDATE' THEN
        IF OLD.completed IS DISTINCT FROM NEW.completed AND NEW.completed = TRUE THEN
          v_description := v_affected_user_name || ' hat ein Lernvideo abgeschlossen';
          
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            description, created_at
          ) VALUES (
            v_affected_user_id, v_affected_user_name, 'user',
            v_affected_user_id, v_affected_user_name,
            'learning_progress', NEW.id, 'UPDATE', 'learning',
            v_description, NOW()
          );
        END IF;
      END IF;
    
    -- ===============================================================
    -- WORK_SESSIONS: Zeiterfassung (ersetzt time_sessions)
    -- ===============================================================
    WHEN 'work_sessions' THEN
      v_affected_user_id := COALESCE(NEW.user_id, OLD.user_id);
      v_affected_user_name := get_user_display_name(v_affected_user_id);
      
      IF TG_OP = 'INSERT' THEN
        v_description := v_affected_user_name || ' hat sich eingestempelt (' ||
          TO_CHAR(NEW.clock_in, 'DD.MM.YYYY HH24:MI') || ')';
        
        INSERT INTO audit_logs (
          user_id, changed_by_name, changed_by_role,
          affected_user_id, affected_user_name,
          table_name, record_id, action, category,
          description, created_at
        ) VALUES (
          v_affected_user_id, v_affected_user_name, 'user',
          v_affected_user_id, v_affected_user_name,
          'work_sessions', NEW.id, 'INSERT', 'time_tracking',
          v_description, NOW()
        );
        
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.clock_out IS NULL AND NEW.clock_out IS NOT NULL THEN
          v_description := v_affected_user_name || ' hat sich ausgestempelt (' ||
            TO_CHAR(NEW.clock_out, 'DD.MM.YYYY HH24:MI') || ')';
          
          INSERT INTO audit_logs (
            user_id, changed_by_name, changed_by_role,
            affected_user_id, affected_user_name,
            table_name, record_id, action, category,
            description, created_at
          ) VALUES (
            v_affected_user_id, v_affected_user_name, 'user',
            v_affected_user_id, v_affected_user_name,
            'work_sessions', NEW.id, 'UPDATE', 'time_tracking',
            v_description, NOW()
          );
        END IF;
      END IF;
    
  END CASE;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- 4. TRIGGER INSTALLATION
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
  AFTER INSERT OR UPDATE OR DELETE ON weekly_hours_history
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Documents
DROP TRIGGER IF EXISTS audit_documents_changes ON documents;
CREATE TRIGGER audit_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Leave Requests
DROP TRIGGER IF EXISTS audit_leave_requests_changes ON leave_requests;
CREATE TRIGGER audit_leave_requests_changes
  AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Coin Transactions
DROP TRIGGER IF EXISTS audit_coin_transactions_changes ON coin_transactions;
CREATE TRIGGER audit_coin_transactions_changes
  AFTER INSERT OR UPDATE OR DELETE ON coin_transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Benefit Requests
DROP TRIGGER IF EXISTS audit_benefit_requests_changes ON benefit_requests;
CREATE TRIGGER audit_benefit_requests_changes
  AFTER INSERT OR UPDATE OR DELETE ON benefit_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- User Achievements
DROP TRIGGER IF EXISTS audit_user_achievements_changes ON user_achievements;
CREATE TRIGGER audit_user_achievements_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Learning Progress
DROP TRIGGER IF EXISTS audit_learning_progress_changes ON learning_progress;
CREATE TRIGGER audit_learning_progress_changes
  AFTER INSERT OR UPDATE OR DELETE ON learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- Work Sessions (ersetzt time_sessions)
DROP TRIGGER IF EXISTS audit_work_sessions_changes ON work_sessions;
CREATE TRIGGER audit_work_sessions_changes
  AFTER INSERT OR UPDATE OR DELETE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- =====================================================================================
-- 5. RLS POLICIES
-- =====================================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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

-- =====================================================================================
-- 6. GRANT PERMISSIONS
-- =====================================================================================

GRANT SELECT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_display_name(UUID) TO authenticated;

-- =====================================================================================
-- ✅ MIGRATION 063 COMPLETE
-- =====================================================================================

COMMENT ON TABLE audit_logs IS 'v1.0.0 - Universal Audit Log System - Vollständige Nachvollziehbarkeit aller Änderungen';
