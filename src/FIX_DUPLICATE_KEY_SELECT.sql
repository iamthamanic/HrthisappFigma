-- =====================================================
-- FIX: Duplicate Key in Select Elements
-- =====================================================
-- Error: "Encountered two children with the same key, test"
-- 
-- Ursache: Departments oder Locations haben duplizierte Namen
-- Lösung: Finde und behebe Duplikate
-- =====================================================

-- STEP 1: Prüfe Departments auf Duplikate
SELECT 
  '=== DEPARTMENTS DUPLIKATE ===' as check_type,
  name,
  COUNT(*) as count,
  array_agg(id) as ids
FROM departments
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 2: Prüfe Locations auf Duplikate
SELECT 
  '=== LOCATIONS DUPLIKATE ===' as check_type,
  name,
  COUNT(*) as count,
  array_agg(id) as ids
FROM locations
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 3: Zeige alle Departments
SELECT 
  '=== ALLE DEPARTMENTS ===' as info,
  id,
  name,
  created_at
FROM departments
ORDER BY name;

-- STEP 4: Zeige alle Locations
SELECT 
  '=== ALLE LOCATIONS ===' as info,
  id,
  name,
  city,
  country,
  created_at
FROM locations
ORDER BY name;

-- =====================================================
-- LÖSUNG: Entferne Duplikate
-- =====================================================

-- OPTION 1: Lösche Department-Duplikate (behalte ältesten)
-- Falls Duplikate gefunden werden, auskommentieren und anpassen:

/*
DELETE FROM departments
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      name,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
    FROM departments
  ) sub
  WHERE rn > 1
);
*/

-- OPTION 2: Lösche Location-Duplikate (behalte ältesten)
-- Falls Duplikate gefunden werden, auskommentieren und anpassen:

/*
DELETE FROM locations
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      name,
      ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
    FROM locations
  ) sub
  WHERE rn > 1
);
*/

-- OPTION 3: Prüfe ob "test" Department existiert
SELECT 
  '=== TEST DEPARTMENT ===' as info,
  *
FROM departments
WHERE LOWER(name) LIKE '%test%';

-- OPTION 4: Prüfe ob "test" Location existiert
SELECT 
  '=== TEST LOCATION ===' as info,
  *
FROM locations
WHERE LOWER(name) LIKE '%test%';

-- =====================================================
-- AFTER FIX: Verify No Duplicates
-- =====================================================

DO $$
DECLARE
  v_dept_dupes INTEGER;
  v_loc_dupes INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Count department duplicates
  SELECT COUNT(*) INTO v_dept_dupes
  FROM (
    SELECT name, COUNT(*) as c
    FROM departments
    GROUP BY name
    HAVING COUNT(*) > 1
  ) sub;
  
  -- Count location duplicates
  SELECT COUNT(*) INTO v_loc_dupes
  FROM (
    SELECT name, COUNT(*) as c
    FROM locations
    GROUP BY name
    HAVING COUNT(*) > 1
  ) sub;
  
  IF v_dept_dupes > 0 THEN
    RAISE NOTICE '❌ DEPARTMENTS: % duplizierte Namen gefunden!', v_dept_dupes;
  ELSE
    RAISE NOTICE '✅ DEPARTMENTS: Keine Duplikate';
  END IF;
  
  IF v_loc_dupes > 0 THEN
    RAISE NOTICE '❌ LOCATIONS: % duplizierte Namen gefunden!', v_loc_dupes;
  ELSE
    RAISE NOTICE '✅ LOCATIONS: Keine Duplikate';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  
END $$;

-- =====================================================
-- EXPECTED RESULT:
-- =====================================================
-- ✅ DEPARTMENTS: Keine Duplikate
-- ✅ LOCATIONS: Keine Duplikate
-- 
-- Falls Duplikate gefunden:
-- → Lösche mit OPTION 1 oder OPTION 2
-- → Re-run Verification
-- =====================================================
