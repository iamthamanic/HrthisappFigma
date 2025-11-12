-- ============================================================================
-- v4.13.2: QUICK FIX - Videos organization_id NULL → Default Org
-- ============================================================================
-- PROBLEM: Videos haben organization_id = NULL
-- LÖSUNG: Setze organization_id auf default organization
-- ============================================================================

-- SCHRITT 1: Prüfe aktuelle Situation
SELECT 
  'VORHER' as status,
  COUNT(*) as total_videos,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as videos_ohne_org,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as videos_mit_org
FROM video_content;

-- SCHRITT 2: Finde default organization
SELECT 
  id,
  name,
  is_default
FROM organizations
ORDER BY created_at ASC
LIMIT 1;

-- SCHRITT 3: Update Videos mit NULL organization_id
-- ⚠️ WICHTIG: Ersetze 'DEINE_ORG_ID_HIER' mit der ID aus Schritt 2!
UPDATE video_content
SET organization_id = 'DEINE_ORG_ID_HIER'  -- ⚠️ HIER DIE ORG ID EINTRAGEN!
WHERE organization_id IS NULL;

-- SCHRITT 4: Verifiziere das Ergebnis
SELECT 
  'NACHHER' as status,
  COUNT(*) as total_videos,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as videos_ohne_org,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as videos_mit_org
FROM video_content;

-- SCHRITT 5: Zeige alle Videos mit Organization
SELECT 
  v.id,
  v.title,
  v.organization_id,
  o.name as organization_name,
  v.created_at
FROM video_content v
LEFT JOIN organizations o ON v.organization_id = o.id
ORDER BY v.created_at DESC;
