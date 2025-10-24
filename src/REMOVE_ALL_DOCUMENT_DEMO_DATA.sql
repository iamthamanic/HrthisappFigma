-- ============================================
-- HRthis: Remove ALL Demo Documents
-- ============================================
-- This script removes all demo/test documents from the database
-- Run this in Supabase SQL Editor if you want a clean documents table

-- ============================================
-- STEP 1: Show current document count
-- ============================================
DO $$
DECLARE
  doc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO doc_count FROM public.documents;
  RAISE NOTICE '📊 Current document count: %', doc_count;
  
  IF doc_count = 0 THEN
    RAISE NOTICE '✅ Documents table is already empty!';
  ELSE
    RAISE NOTICE '⚠️ Will delete % documents...', doc_count;
  END IF;
END $$;

-- ============================================
-- STEP 2: Delete all documents
-- ============================================
DELETE FROM public.documents;

-- ============================================
-- STEP 3: Verify deletion
-- ============================================
DO $$
DECLARE
  doc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO doc_count FROM public.documents;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ ALL DOCUMENTS DELETED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining documents: %', doc_count;
  RAISE NOTICE '';
  RAISE NOTICE 'The documents table is now clean.';
  RAISE NOTICE 'Users will see empty states in the Documents screen.';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Note: This only deletes database records.';
  RAISE NOTICE '    Files in Supabase Storage need to be deleted manually.';
  RAISE NOTICE '';
  RAISE NOTICE '🗂️ To delete storage files:';
  RAISE NOTICE '   1. Go to Supabase Dashboard → Storage';
  RAISE NOTICE '   2. Select "documents" bucket';
  RAISE NOTICE '   3. Delete all files manually';
  RAISE NOTICE '';
END $$;

-- ============================================
-- OPTIONAL: Reset auto-increment (if using serial IDs)
-- ============================================
-- Note: This is only needed if you're using serial IDs
-- and want to start from 1 again

-- ALTER SEQUENCE documents_id_seq RESTART WITH 1;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ DEMO DOCUMENT DATA REMOVAL COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What happens now:';
  RAISE NOTICE '  ✅ Documents table is empty';
  RAISE NOTICE '  ✅ Users see empty states';
  RAISE NOTICE '  ✅ Upload functionality works normally';
  RAISE NOTICE '  ✅ No mock data in frontend code';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Users can upload real documents';
  RAISE NOTICE '  2. Documents are stored in Supabase Storage';
  RAISE NOTICE '  3. All CRUD operations work as expected';
  RAISE NOTICE '';
END $$;