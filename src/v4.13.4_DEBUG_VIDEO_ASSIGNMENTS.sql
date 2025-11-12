-- ═══════════════════════════════════════════════════════════════
-- v4.13.4: DEBUG VIDEO ASSIGNMENTS
-- ═══════════════════════════════════════════════════════════════

-- SCHRITT 1: Alle Tests zeigen
SELECT 
  'ALLE TESTS' as info,
  COUNT(*) as anzahl
FROM tests;

SELECT * FROM tests ORDER BY created_at DESC LIMIT 5;

-- SCHRITT 2: Alle Video Assignments zeigen
SELECT 
  'ALLE VIDEO ASSIGNMENTS' as info,
  COUNT(*) as anzahl
FROM test_video_assignments;

SELECT 
  tva.id,
  tva.video_id,
  tva.test_id,
  tva.created_at,
  v.title as video_title
FROM test_video_assignments tva
LEFT JOIN video_content v ON tva.video_id = v.id
ORDER BY tva.created_at DESC;

-- SCHRITT 3: Orphaned Assignments (Test existiert NICHT)
SELECT 
  'ORPHANED ASSIGNMENTS' as info,
  COUNT(*) as anzahl
FROM test_video_assignments tva
LEFT JOIN tests t ON tva.test_id = t.id
WHERE t.id IS NULL;

SELECT 
  tva.id,
  tva.video_id,
  tva.test_id,
  v.title as video_title,
  'Test existiert NICHT!' as problem
FROM test_video_assignments tva
LEFT JOIN video_content v ON tva.video_id = v.id
LEFT JOIN tests t ON tva.test_id = t.id
WHERE t.id IS NULL;

-- SCHRITT 4: INNER JOIN Test (wie im Frontend)
SELECT 
  'INNER JOIN RESULTS' as info,
  COUNT(*) as anzahl
FROM test_video_assignments tva
INNER JOIN tests t ON tva.test_id = t.id;

SELECT 
  tva.video_id,
  tva.test_id,
  t.title as test_title,
  v.title as video_title
FROM test_video_assignments tva
INNER JOIN tests t ON tva.test_id = t.id
LEFT JOIN video_content v ON tva.video_id = v.id;
