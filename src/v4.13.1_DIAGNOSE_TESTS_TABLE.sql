-- ============================================================================
-- TESTS TABLE DIAGNOSE SCRIPT
-- ============================================================================
-- Prüft ob die tests Tabelle korrekt existiert und funktioniert
-- ============================================================================

-- 1. Prüfe ob tests Tabelle existiert
SELECT 
  'tests table exists' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tests') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING - Run migration!' 
  END as status;

-- 2. Prüfe ob test_blocks Tabelle existiert
SELECT 
  'test_blocks table exists' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_blocks') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING - Run migration!' 
  END as status;

-- 3. Prüfe RLS Status
SELECT 
  'tests RLS enabled' as check_name,
  CASE 
    WHEN relrowsecurity THEN '✅ ENABLED' 
    ELSE '❌ DISABLED' 
  END as status
FROM pg_class
WHERE relname = 'tests';

-- 4. Count Policies auf tests
SELECT 
  'tests policies count' as check_name,
  COUNT(*)::text || ' policies' as status
FROM pg_policies
WHERE tablename = 'tests';

-- 5. Liste alle Policies
SELECT 
  'Policy: ' || policyname as policy_name,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Has USING clause'
    ELSE '⚠️ No USING clause'
  END as status
FROM pg_policies
WHERE tablename = 'tests'
ORDER BY policyname;

-- 6. Prüfe aktuelle User Organization
SELECT 
  'Current user org' as check_name,
  COALESCE(organization_id::text, '❌ NO ORG!') as status
FROM users
WHERE id = auth.uid();

-- 7. Test Query (wie im Frontend)
SELECT 
  'Test query result' as check_name,
  COUNT(*)::text || ' tests found' as status
FROM tests
WHERE is_active = true;

-- ============================================================================
-- INTERPRETATION:
-- ============================================================================
-- 
-- ✅ Alles OK: Alle checks zeigen ✅
-- ❌ Table missing: Führe /v4.13.1_SUPABASE_MIGRATION_SAFE.sql aus
-- ❌ No policies: Policies wurden nicht erstellt
-- ❌ No org: User hat keine organization_id → kann keine Tests sehen
-- 0 tests found: Normal wenn noch keine Tests erstellt wurden
