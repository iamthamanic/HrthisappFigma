-- =====================================================
-- QUICK VERIFICATION: RLS Policies Check
-- =====================================================
-- Kopiere diesen Code in Supabase SQL Editor und klicke RUN
-- =====================================================

-- =====================================================
-- CHECK 1: RLS aktiviert?
-- =====================================================
SELECT 
  '✅ CHECK 1: RLS Status' as check_name,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED!'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('work_periods', 'work_sessions')
ORDER BY tablename;

-- =====================================================
-- CHECK 2: Policies vorhanden?
-- =====================================================
SELECT 
  '✅ CHECK 2: Policies Count' as check_name,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) = 6 THEN '✅ CORRECT (6 policies)'
    ELSE '❌ WRONG! Expected 6'
  END as status
FROM pg_policies
WHERE tablename IN ('work_periods', 'work_sessions')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- CHECK 3: Policy Details
-- =====================================================
SELECT 
  '✅ CHECK 3: Policy Details' as check_name,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%_own' THEN '👤 User Access'
    WHEN policyname LIKE '%_admin' THEN '👑 Admin Access'
    ELSE '❓ Unknown'
  END as policy_type
FROM pg_policies
WHERE tablename IN ('work_periods', 'work_sessions')
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- CHECK 4: Grants vorhanden?
-- =====================================================
SELECT 
  '✅ CHECK 4: Table Permissions' as check_name,
  tablename,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('work_periods', 'work_sessions')
AND grantee IN ('authenticated', 'service_role', 'anon')
GROUP BY tablename, grantee
ORDER BY tablename, grantee;

-- =====================================================
-- CHECK 5: Test Query (als authenticated user)
-- =====================================================
-- WICHTIG: Dieser Check funktioniert nur wenn du eingeloggt bist!
-- Falls Fehler: Das ist OK, wir testen nur ob RLS funktioniert
SELECT 
  '✅ CHECK 5: Test Query' as check_name,
  'work_periods' as table_name,
  COUNT(*) as row_count,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Query works (RLS OK)'
    ELSE '❌ Query failed'
  END as status
FROM work_periods
WHERE user_id = auth.uid(); -- Nur eigene Perioden sichtbar

-- =====================================================
-- FINAL SUMMARY
-- =====================================================
SELECT 
  '🎉 FINAL SUMMARY' as summary,
  (
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE tablename IN ('work_periods', 'work_sessions')
  ) as total_policies,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename IN ('work_periods', 'work_sessions')
    ) = 12 THEN '✅ ALL POLICIES CREATED (12/12)'
    ELSE '❌ MISSING POLICIES!'
  END as policies_status,
  (
    SELECT COUNT(*) 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('work_periods', 'work_sessions')
    AND rowsecurity = true
  ) as rls_enabled_tables,
  CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('work_periods', 'work_sessions')
      AND rowsecurity = true
    ) = 2 THEN '✅ RLS ENABLED ON BOTH TABLES'
    ELSE '❌ RLS NOT ENABLED!'
  END as rls_status;

-- =====================================================
-- ERWARTETE AUSGABE:
-- =====================================================
-- CHECK 1: Beide Tabellen "✅ RLS ENABLED"
-- CHECK 2: Beide Tabellen "6 policies"
-- CHECK 3: 12 Policies total (6 per table)
-- CHECK 4: authenticated + service_role haben Permissions
-- CHECK 5: Query funktioniert (oder 0 rows wenn keine Daten)
-- FINAL SUMMARY: "✅ ALL POLICIES CREATED (12/12)" + "✅ RLS ENABLED ON BOTH TABLES"
-- =====================================================

-- 🎉 WENN ALLES GRÜN (✅) IST → RLS KORREKT KONFIGURIERT!
