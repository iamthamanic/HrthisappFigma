-- ============================================================================
-- v4.13.2: Video Organization Fix - Update NULL organization_id
-- ============================================================================
-- Problem: Videos have organization_id = NULL, so they don't show in dropdown
-- Solution: Set organization_id for all existing videos to default org
-- ============================================================================

-- Step 1: Find the default organization
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the default organization (or first organization)
  SELECT id INTO default_org_id
  FROM organizations
  WHERE is_default = true
  LIMIT 1;

  -- If no default, use the first organization
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id
    FROM organizations
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- Update all videos without organization_id
  IF default_org_id IS NOT NULL THEN
    UPDATE video_content
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;

    RAISE NOTICE 'Updated % videos with organization_id: %', 
      (SELECT COUNT(*) FROM video_content WHERE organization_id = default_org_id),
      default_org_id;
  ELSE
    RAISE WARNING 'No organization found! Please create an organization first.';
  END IF;
END $$;

-- Step 2: Make organization_id NOT NULL (prevent future issues)
ALTER TABLE video_content 
  ALTER COLUMN organization_id SET NOT NULL;

-- Step 3: Verify the fix
SELECT 
  COUNT(*) as total_videos,
  COUNT(DISTINCT organization_id) as organizations_with_videos
FROM video_content;

-- Step 4: Show all videos with their organization
SELECT 
  v.id,
  v.title,
  v.organization_id,
  o.name as organization_name
FROM video_content v
LEFT JOIN organizations o ON v.organization_id = o.id
ORDER BY v.created_at DESC;
