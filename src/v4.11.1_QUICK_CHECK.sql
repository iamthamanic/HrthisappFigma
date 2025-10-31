-- ============================================================================
-- v4.11.1 - QUICK CHECK SCRIPT
-- ============================================================================
-- Kopiere dieses Script in Supabase SQL Editor um zu prüfen ob alles korrekt ist
-- ============================================================================

-- ============================================================================
-- CHECK 1: Foreign Key auf public.users?
-- ============================================================================
SELECT 
  '✅ CHECK 1: Foreign Key' AS check_type,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  CASE 
    WHEN ccu.table_schema = 'public' AND ccu.table_name = 'users' 
    THEN '✅ KORREKT: zeigt auf public.users'
    ELSE '❌ FEHLER: zeigt auf ' || ccu.table_schema || '.' || ccu.table_name
  END AS status,
  ccu.table_schema AS foreign_schema,
  ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'automation_api_keys'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'created_by';

-- ============================================================================
-- CHECK 2: API Keys haben browoko- Präfix?
-- ============================================================================
SELECT 
  '✅ CHECK 2: API Key Format' AS check_type,
  COUNT(*) AS total_keys,
  SUM(CASE WHEN key_hash LIKE 'browoko-%' THEN 1 ELSE 0 END) AS browoko_keys,
  SUM(CASE WHEN key_hash LIKE 'browo_%' THEN 1 ELSE 0 END) AS old_browo_keys,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ Noch keine Keys erstellt'
    WHEN SUM(CASE WHEN key_hash LIKE 'browoko-%' THEN 1 ELSE 0 END) = COUNT(*) 
    THEN '✅ Alle Keys haben korrektes Format'
    ELSE '⚠️ Einige Keys haben noch altes Format'
  END AS status
FROM automation_api_keys
WHERE is_active = true;

-- ============================================================================
-- CHECK 3: Letzte 5 API Keys anzeigen
-- ============================================================================
SELECT 
  '✅ CHECK 3: Letzte API Keys' AS check_type,
  id,
  name,
  LEFT(key_hash, 15) || '...' AS key_preview,
  CASE 
    WHEN key_hash LIKE 'browoko-%' THEN '✅ Neues Format'
    WHEN key_hash LIKE 'browo_%' THEN '⚠️ Altes Format'
    ELSE '❓ Unbekanntes Format'
  END AS format_status,
  created_at,
  is_active
FROM automation_api_keys
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 4: Creator Namen werden korrekt geladen?
-- ============================================================================
SELECT 
  '✅ CHECK 4: Creator Namen' AS check_type,
  ak.id,
  ak.name AS api_key_name,
  ak.created_by,
  u.first_name || ' ' || u.last_name AS creator_name,
  CASE 
    WHEN u.id IS NOT NULL THEN '✅ Creator gefunden'
    WHEN ak.created_by IS NULL THEN '⚠️ Kein Creator (NULL)'
    ELSE '❌ Creator nicht gefunden'
  END AS status
FROM automation_api_keys ak
LEFT JOIN users u ON u.id = ak.created_by
WHERE ak.is_active = true
ORDER BY ak.created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 5: Audit Logs Tabelle existiert?
-- ============================================================================
SELECT 
  '✅ CHECK 5: Audit Log Tabelle' AS check_type,
  COUNT(*) AS total_logs,
  COUNT(CASE WHEN success = true THEN 1 END) AS successful_calls,
  COUNT(CASE WHEN success = false THEN 1 END) AS failed_calls,
  CASE 
    WHEN COUNT(*) = 0 THEN '⚠️ Noch keine Logs (normal bei neuer Installation)'
    ELSE '✅ ' || COUNT(*) || ' Logs vorhanden'
  END AS status
FROM automation_audit_log;

-- ============================================================================
-- CHECK 6: RLS Policies aktiv?
-- ============================================================================
SELECT 
  '✅ CHECK 6: RLS Policies' AS check_type,
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Read'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Update'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    ELSE cmd
  END AS operation
FROM pg_policies
WHERE tablename IN ('automation_api_keys', 'automation_webhooks', 'automation_audit_log')
ORDER BY tablename, cmd;

-- ============================================================================
-- ZUSAMMENFASSUNG
-- ============================================================================
DO $$
DECLARE
  v_fk_correct BOOLEAN;
  v_total_keys INTEGER;
  v_browoko_keys INTEGER;
  v_has_logs BOOLEAN;
BEGIN
  -- Check Foreign Key
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.table_name = 'automation_api_keys'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'created_by'
      AND ccu.table_schema = 'public'
      AND ccu.table_name = 'users'
  ) INTO v_fk_correct;

  -- Check API Keys
  SELECT 
    COUNT(*),
    SUM(CASE WHEN key_hash LIKE 'browoko-%' THEN 1 ELSE 0 END)
  INTO v_total_keys, v_browoko_keys
  FROM automation_api_keys
  WHERE is_active = true;

  -- Check Logs
  SELECT EXISTS (SELECT 1 FROM automation_audit_log LIMIT 1)
  INTO v_has_logs;

  -- Print Summary
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 v4.11.1 QUICK CHECK ZUSAMMENFASSUNG';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  IF v_fk_correct THEN
    RAISE NOTICE '✅ Foreign Key: Korrekt (public.users)';
  ELSE
    RAISE NOTICE '❌ Foreign Key: FEHLER - Migration noch nicht ausgeführt!';
  END IF;

  IF v_total_keys = 0 THEN
    RAISE NOTICE '⚠️ API Keys: Noch keine erstellt';
  ELSIF v_browoko_keys = v_total_keys THEN
    RAISE NOTICE '✅ API Keys: Alle % haben browoko- Format', v_total_keys;
  ELSE
    RAISE NOTICE '⚠️ API Keys: %/% haben browoko- Format', v_browoko_keys, v_total_keys;
  END IF;

  IF v_has_logs THEN
    RAISE NOTICE '✅ Audit Logs: Tabelle funktioniert';
  ELSE
    RAISE NOTICE '⚠️ Audit Logs: Noch keine Einträge (normal bei Neuinstallation)';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
  IF v_fk_correct AND (v_total_keys = 0 OR v_browoko_keys = v_total_keys) THEN
    RAISE NOTICE '🎉 ALLE CHECKS BESTANDEN!';
    RAISE NOTICE 'System ist bereit für Production.';
  ELSIF v_fk_correct THEN
    RAISE NOTICE '✅ Migration erfolgreich!';
    RAISE NOTICE 'Tipp: Alte API Keys neu erstellen für korrektes Format.';
  ELSE
    RAISE NOTICE '❌ MIGRATION ERFORDERLICH!';
    RAISE NOTICE 'Führe v4.11.1_AUTOMATION_API_KEY_FIXES.sql aus.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
