-- =====================================================
-- DIAGNOSE: WELCHE TABELLEN EXISTIEREN?
-- =====================================================

-- 1. Alle Tabellen in public schema anzeigen
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Zähle Tabellen
SELECT COUNT(*) as total_tables 
FROM pg_tables 
WHERE schemaname = 'public';

-- 3. Prüfe spezifisch wichtige Tabellen
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') 
    THEN '✅ users EXISTS' 
    ELSE '❌ users MISSING' 
  END as users_check,
  
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'time_records') 
    THEN '✅ time_records EXISTS' 
    ELSE '❌ time_records MISSING' 
  END as time_records_check,
  
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'time_accounts') 
    THEN '✅ time_accounts EXISTS' 
    ELSE '❌ time_accounts MISSING' 
  END as time_accounts_check,
  
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'leave_requests') 
    THEN '✅ leave_requests EXISTS' 
    ELSE '❌ leave_requests MISSING' 
  END as leave_requests_check,
  
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'documents') 
    THEN '✅ documents EXISTS' 
    ELSE '❌ documents MISSING' 
  END as documents_check;

-- 4. Zeige User-Count (falls users existiert)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    RAISE NOTICE 'users table exists, counting rows...';
    PERFORM * FROM users LIMIT 1;
  ELSE
    RAISE NOTICE '❌ users table does NOT exist!';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error checking users: %', SQLERRM;
END $$;
