-- ============================================================================
-- v4.11.1 - AUTOMATION API KEY FIXES
-- ============================================================================
-- Fixes:
-- 1. Foreign Key zeigt jetzt auf public.users statt auth.users
-- 2. API Keys haben jetzt browoko- Präfix
-- 3. Edge Function hat besseres Error Handling
-- ============================================================================

-- ============================================================================
-- FIX: Foreign Key von auth.users zu public.users ändern
-- ============================================================================

-- Schritt 1: Bestehenden Foreign Key entfernen
ALTER TABLE automation_api_keys 
  DROP CONSTRAINT IF EXISTS automation_api_keys_created_by_fkey;

-- Schritt 2: Neuen Foreign Key auf public.users erstellen
ALTER TABLE automation_api_keys 
  ADD CONSTRAINT automation_api_keys_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ AUTOMATION API KEY FIXES COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '  1. Foreign Key zeigt jetzt auf public.users';
  RAISE NOTICE '  2. API Keys haben jetzt browoko- Präfix';
  RAISE NOTICE '  3. Edge Function hat Try-Catch Error Handling';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Redeploy Edge Function:';
  RAISE NOTICE '     supabase functions deploy BrowoKoordinator-Automation';
  RAISE NOTICE '  2. Test API Key Generation im Admin Panel';
  RAISE NOTICE '========================================';
END $$;
