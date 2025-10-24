-- =====================================================================================
-- QUICK FIX: Work Sessions Audit Trigger
-- =====================================================================================
-- Problem: Audit System referenziert veraltete "time_sessions" Tabelle
-- Lösung:  Update auf "work_sessions" Tabelle
-- Version: v4.10.18
-- =====================================================================================

-- 1. Drop alter Trigger (falls vorhanden)
DROP TRIGGER IF EXISTS audit_time_sessions_changes ON time_sessions;
DROP TRIGGER IF EXISTS audit_work_sessions_changes ON work_sessions;

-- 2. Erstelle neuen Trigger für work_sessions
CREATE TRIGGER audit_work_sessions_changes
  AFTER INSERT OR UPDATE OR DELETE ON work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- 3. Verify Trigger wurde erstellt
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  CASE tgtype::integer & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as trigger_type,
  CASE tgtype::integer & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    ELSE 'MULTIPLE'
  END as trigger_event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'audit_work_sessions_changes';

-- 4. Test: Zeige alle Audit-Trigger
SELECT 
  '✅ Audit Trigger auf work_sessions erstellt' as status
WHERE EXISTS (
  SELECT 1 
  FROM pg_trigger 
  WHERE tgname = 'audit_work_sessions_changes'
);

-- =====================================================================================
-- INFO: Was wurde gefixt?
-- =====================================================================================
-- 
-- VORHER:
-- ❌ Trigger auf "time_sessions" Tabelle (existiert nicht mehr)
-- ❌ Frontend Hook verwendet "time_sessions"
-- ❌ Migration verwendet "time_sessions"
--
-- NACHHER:
-- ✅ Trigger auf "work_sessions" Tabelle
-- ✅ Frontend Hook verwendet "work_sessions"
-- ✅ Migration aktualisiert
--
-- CHANGED FILES:
-- - /hooks/HRTHIS_useTeamMemberDetails.ts
-- - /supabase/migrations/063_universal_audit_log_system.sql
-- =====================================================================================
