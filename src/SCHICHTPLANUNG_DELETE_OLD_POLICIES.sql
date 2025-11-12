-- =====================================================
-- SCHICHTPLANUNG: DELETE OLD RLS POLICIES
-- =====================================================
-- Löscht die alten "Anyone authenticated" Policies
-- die parallel zu den neuen existieren
-- =====================================================

-- Delete old permissive policies
DROP POLICY IF EXISTS "Anyone authenticated can create shifts" ON public.shifts;
DROP POLICY IF EXISTS "Anyone authenticated can update shifts" ON public.shifts;
DROP POLICY IF EXISTS "Anyone authenticated can delete shifts" ON public.shifts;
DROP POLICY IF EXISTS "Anyone authenticated can view shifts" ON public.shifts;

-- Verify only the correct policies remain
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'shifts'
ORDER BY cmd, policyname;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Alte RLS Policies gelöscht!';
  RAISE NOTICE 'Nur noch SUPERADMIN, ADMIN, HR haben Zugriff';
END $$;
