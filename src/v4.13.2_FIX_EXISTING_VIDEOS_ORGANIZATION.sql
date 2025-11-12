/**
 * v4.13.2: FIX EXISTING VIDEOS - ADD ORGANIZATION_ID
 * ====================================================
 * Problem: Videos wurden ohne organization_id erstellt
 * → Können nicht im Test-Dialog geladen werden
 * 
 * Lösung: Füge organization_id zu allen Videos hinzu
 */

-- Step 1: Check current state
SELECT 
  id,
  title,
  organization_id,
  created_at
FROM video_content
ORDER BY created_at DESC;

-- Step 2: Get default organization ID
SELECT id, name FROM organizations WHERE is_default = true;

-- Step 3: Update all videos without organization_id
-- WICHTIG: Ersetze 'YOUR_ORG_ID' mit der ID aus Step 2!
UPDATE video_content
SET organization_id = 'YOUR_ORG_ID'
WHERE organization_id IS NULL;

-- Step 4: Verify fix
SELECT 
  id,
  title,
  organization_id,
  youtube_url,
  created_at
FROM video_content
ORDER BY created_at DESC;

-- Expected result: All videos should now have an organization_id!
