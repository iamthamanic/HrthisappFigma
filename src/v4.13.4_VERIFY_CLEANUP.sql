-- ═══════════════════════════════════════════════════════════════
-- v4.13.4: VERIFY CLEANUP - Ist alles gelöscht?
-- ═══════════════════════════════════════════════════════════════

-- SCHRITT 1: Wie viele Tests?
SELECT 
  'TESTS' as tabelle,
  COUNT(*) as anzahl
FROM tests;

-- SCHRITT 2: Wie viele Assignments?
SELECT 
  'ASSIGNMENTS' as tabelle,
  COUNT(*) as anzahl
FROM test_video_assignments;

-- SCHRITT 3: Zeig mir die Assignments (falls vorhanden)
SELECT 
  tva.id,
  tva.video_id,
  tva.test_id,
  v.title as video_title,
  t.title as test_title
FROM test_video_assignments tva
LEFT JOIN video_content v ON tva.video_id = v.id
LEFT JOIN tests t ON tva.test_id = t.id;

-- ═══════════════════════════════════════════════════════════════
-- ERWARTETES ERGEBNIS:
-- ═══════════════════════════════════════════════════════════════
-- 
-- tests anzahl:       0
-- assignments anzahl: 0
-- 
-- Wenn NICHT 0: Führe DELETE nochmal aus!
-- ═══════════════════════════════════════════════════════════════
