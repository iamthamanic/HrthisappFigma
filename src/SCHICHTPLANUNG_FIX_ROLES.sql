-- =====================================================
-- SCHICHTPLANUNG: RLS POLICY FIX
-- =====================================================
-- Korrigiert die Rollen für Schichterstellung
-- Nur SUPERADMIN, ADMIN und HR können Schichten erstellen
-- =====================================================

-- Policy: Only SUPERADMIN, ADMIN and HR can create shifts
DROP POLICY IF EXISTS "HR and Teamleads can create shifts" ON public.shifts;
CREATE POLICY "SUPERADMIN, ADMIN and HR can create shifts"
  ON public.shifts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- Policy: SUPERADMIN, ADMIN, HR, and shift creator can update shifts
DROP POLICY IF EXISTS "HR, Teamleads, and creator can update shifts" ON public.shifts;
CREATE POLICY "SUPERADMIN, ADMIN, HR, and creator can update shifts"
  ON public.shifts
  FOR UPDATE
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- Policy: SUPERADMIN, ADMIN, HR, and shift creator can delete shifts
DROP POLICY IF EXISTS "HR, Teamleads, and creator can delete shifts" ON public.shifts;
CREATE POLICY "SUPERADMIN, ADMIN, HR, and creator can delete shifts"
  ON public.shifts
  FOR DELETE
  USING (
    auth.uid() = created_by
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('SUPERADMIN', 'ADMIN', 'HR')
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'shifts'
ORDER BY policyname;

DO $$ 
BEGIN
  RAISE NOTICE '✅ RLS Policies für Schichten aktualisiert!';
  RAISE NOTICE 'Berechtigung: SUPERADMIN, ADMIN, HR';
END $$;
