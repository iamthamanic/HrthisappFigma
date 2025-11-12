-- ═══════════════════════════════════════════════════════════════
-- v4.13.4: CLEANUP ORPHANED VIDEO ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════════
-- Entfernt test_video_assignments die auf nicht-existierende Tests zeigen
-- 
-- WICHTIG: Dieses Script ist OPTIONAL!
-- Die Frontend-Logik ignoriert orphaned assignments automatisch.
-- ═══════════════════════════════════════════════════════════════

-- SCHRITT 1: Orphaned Assignments anzeigen
SELECT 
  tva.id,
  tva.video_id,
  tva.test_id,
  v.title as video_title,
  'Orphaned Assignment - Test existiert nicht!' as problem
FROM test_video_assignments tva
JOIN video_content v ON tva.video_id = v.id
LEFT JOIN tests t ON tva.test_id = t.id
WHERE t.id IS NULL;

-- SCHRITT 2: Orphaned Assignments LÖSCHEN
DELETE FROM test_video_assignments
WHERE test_id NOT IN (SELECT id FROM tests);

-- SCHRITT 3: Verifizieren
SELECT 
  'Nach Cleanup' as status,
  COUNT(*) as remaining_assignments
FROM test_video_assignments;

-- SCHRITT 4: Alle verbleibenden Assignments anzeigen
SELECT 
  tva.id,
  tva.video_id,
  tva.test_id,
  v.title as video_title,
  t.title as test_title
FROM test_video_assignments tva
JOIN video_content v ON tva.video_id = v.id
JOIN tests t ON tva.test_id = t.id
ORDER BY tva.created_at DESC;
