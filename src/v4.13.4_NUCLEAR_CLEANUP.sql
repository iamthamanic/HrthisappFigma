-- ═══════════════════════════════════════════════════════════════
-- v4.13.4: NUCLEAR CLEANUP - Alle Assignments löschen
-- ═══════════════════════════════════════════════════════════════
-- 
-- ⚠️ ACHTUNG: Dies löscht ALLE Video Assignments!
-- ⚠️ Führe dies NUR aus wenn du ALLE Tests gelöscht hast!
--
-- ═══════════════════════════════════════════════════════════════

-- SCHRITT 1: Prüfe WAS gelöscht wird
SELECT 
  '⚠️ DIESE ASSIGNMENTS WERDEN GELÖSCHT:' as warnung,
  COUNT(*) as anzahl
FROM test_video_assignments;

SELECT 
  tva.id,
  tva.video_id,
  tva.test_id,
  v.title as video_title,
  CASE 
    WHEN t.id IS NULL THEN '❌ Test existiert NICHT (orphaned)'
    ELSE '✅ Test existiert'
  END as status
FROM test_video_assignments tva
LEFT JOIN video_content v ON tva.video_id = v.id
LEFT JOIN tests t ON tva.test_id = t.id;


-- SCHRITT 2: NUCLEAR DELETE - Alle Assignments löschen
DELETE FROM test_video_assignments;

-- Verify: Sollte 0 sein!
SELECT 
  '✅ NACH CLEANUP - Verbleibende Assignments:' as info,
  COUNT(*) as anzahl
FROM test_video_assignments;


-- ═══════════════════════════════════════════════════════════════
-- ERWARTETES ERGEBNIS:
-- ═══════════════════════════════════════════════════════════════
-- 
-- Verbleibende Assignments: 0
--
-- ═══════════════════════════════════════════════════════════════
