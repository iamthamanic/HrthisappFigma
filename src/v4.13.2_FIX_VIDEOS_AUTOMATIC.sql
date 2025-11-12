-- ============================================================================
-- v4.13.2: AUTOMATISCHER FIX - Videos organization_id setzen
-- ============================================================================
-- Dieser Code findet automatisch die default organization und updated alle Videos!
-- EINFACH COPY-PASTE IN SUPABASE SQL EDITOR!
-- ============================================================================

DO $$
DECLARE
  default_org_id UUID;
  videos_updated INTEGER;
BEGIN
  -- Schritt 1: Finde die default organization
  SELECT id INTO default_org_id
  FROM organizations
  WHERE is_default = true
  LIMIT 1;

  -- Falls keine default org, nimm die erste
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id
    FROM organizations
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Schritt 2: Zeige welche Org wir verwenden
  RAISE NOTICE '✅ Using organization: %', default_org_id;

  -- Schritt 3: Update alle Videos mit NULL organization_id
  IF default_org_id IS NOT NULL THEN
    UPDATE video_content
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS videos_updated = ROW_COUNT;

    RAISE NOTICE '✅ Updated % videos with organization_id!', videos_updated;
  ELSE
    RAISE EXCEPTION '❌ ERROR: No organization found! Please create an organization first.';
  END IF;
END $$;

-- Verifiziere das Ergebnis
SELECT 
  '✅ RESULT' as status,
  COUNT(*) as total_videos,
  COUNT(DISTINCT organization_id) as different_orgs,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as videos_still_null
FROM video_content;

-- Zeige alle Videos
SELECT 
  v.title,
  v.organization_id,
  o.name as organization_name
FROM video_content v
LEFT JOIN organizations o ON v.organization_id = o.id
ORDER BY v.created_at DESC;
