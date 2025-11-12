-- ═══════════════════════════════════════════════════════════════
-- v4.13.4: SUPER DEBUG - Was ist in der Datenbank?
-- ═══════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────┐
-- │ SCHRITT 1: Wie viele Tests gibt es?                        │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  '🧪 TESTS IN DATENBANK' as info,
  COUNT(*) as anzahl
FROM tests;

-- Zeige alle Tests
SELECT 
  id,
  title,
  created_at,
  organization_id
FROM tests 
ORDER BY created_at DESC;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ SCHRITT 2: Wie viele Video Assignments gibt es?            │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  '🎬 VIDEO ASSIGNMENTS IN DATENBANK' as info,
  COUNT(*) as anzahl
FROM test_video_assignments;

-- Zeige alle Assignments
SELECT 
  tva.id,
  tva.video_id,
  tva.test_id,
  tva.created_at,
  v.title as video_title
FROM test_video_assignments tva
LEFT JOIN video_content v ON tva.video_id = v.id
ORDER BY tva.created_at DESC;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ SCHRITT 3: Welche Assignments haben KEINE Tests?           │
-- │            (Orphaned Assignments)                           │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  '⚠️ ORPHANED ASSIGNMENTS (Test existiert NICHT)' as info,
  COUNT(*) as anzahl
FROM test_video_assignments tva
LEFT JOIN tests t ON tva.test_id = t.id
WHERE t.id IS NULL;

-- Detaillierte Ansicht
SELECT 
  tva.id as assignment_id,
  tva.video_id,
  tva.test_id as test_id_in_assignment,
  v.title as video_title,
  '❌ Test existiert NICHT!' as status
FROM test_video_assignments tva
LEFT JOIN video_content v ON tva.video_id = v.id
LEFT JOIN tests t ON tva.test_id = t.id
WHERE t.id IS NULL;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ SCHRITT 4: Was würde INNER JOIN zurückgeben?               │
-- │            (Das ist was der Frontend Code macht!)           │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  '✅ INNER JOIN RESULTS (wie Frontend Query)' as info,
  COUNT(*) as anzahl
FROM test_video_assignments tva
INNER JOIN tests t ON tva.test_id = t.id;

-- Detaillierte Ansicht
SELECT 
  tva.id as assignment_id,
  tva.video_id,
  tva.test_id,
  t.title as test_title,
  t.id as test_id_verified,
  v.title as video_title
FROM test_video_assignments tva
INNER JOIN tests t ON tva.test_id = t.id
LEFT JOIN video_content v ON tva.video_id = v.id;


-- ┌─────────────────────────────────────────────────────────────┐
-- │ SCHRITT 5: Zusammenfassung                                 │
-- └─────────────────────────────────────────────────────────────┘

SELECT 
  '📊 ZUSAMMENFASSUNG' as info,
  (SELECT COUNT(*) FROM tests) as total_tests,
  (SELECT COUNT(*) FROM test_video_assignments) as total_assignments,
  (SELECT COUNT(*) 
   FROM test_video_assignments tva 
   LEFT JOIN tests t ON tva.test_id = t.id 
   WHERE t.id IS NULL) as orphaned_assignments,
  (SELECT COUNT(*) 
   FROM test_video_assignments tva 
   INNER JOIN tests t ON tva.test_id = t.id) as valid_assignments;


-- ═══════════════════════════════════════════════════════════════
-- ERWARTETES ERGEBNIS (wenn alle Tests gelöscht wurden):
-- ═══════════════════════════════════════════════════════════════
-- 
-- total_tests:          0
-- total_assignments:    ? (sollte 0 sein nach Cleanup)
-- orphaned_assignments: ? (= total_assignments wenn Tests gelöscht)
-- valid_assignments:    0 (INNER JOIN findet nichts)
--
-- ═══════════════════════════════════════════════════════════════
