-- ========================================
-- DIAGNOSTIC: Check for Duplicate/Missing IDs
-- ========================================

-- Check for duplicate department IDs
SELECT 
  'DUPLICATE DEPARTMENT IDS' as issue,
  id,
  COUNT(*) as count
FROM departments
GROUP BY id
HAVING COUNT(*) > 1;

-- Check for NULL department IDs
SELECT 
  'NULL DEPARTMENT IDS' as issue,
  COUNT(*) as count
FROM departments
WHERE id IS NULL;

-- Check for duplicate location IDs
SELECT 
  'DUPLICATE LOCATION IDS' as issue,
  id,
  COUNT(*) as count
FROM locations
GROUP BY id
HAVING COUNT(*) > 1;

-- Check for NULL location IDs
SELECT 
  'NULL LOCATION IDS' as issue,
  COUNT(*) as count
FROM locations
WHERE id IS NULL;

-- List all departments
SELECT 'ALL DEPARTMENTS' as info, id, name FROM departments ORDER BY name;

-- List all locations
SELECT 'ALL LOCATIONS' as info, id, name FROM locations ORDER BY name;
