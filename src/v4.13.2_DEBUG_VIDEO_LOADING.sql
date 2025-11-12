/**
 * v4.13.2: DEBUG VIDEO LOADING
 * ==============================
 * Check warum Videos nicht im Dialog angezeigt werden
 */

-- Step 1: Check dein User-Profil
SELECT 
  id,
  full_name,
  email,
  organization_id,
  role
FROM users
WHERE email LIKE '%deine-email%' -- ERSETZE MIT DEINER EMAIL!
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Check alle Videos
SELECT 
  id,
  title,
  organization_id,
  created_at
FROM video_content
ORDER BY created_at DESC;

-- Step 3: Check ob organization_ids übereinstimmen
SELECT 
  'User Organization' as type,
  organization_id,
  COUNT(*) as count
FROM users
WHERE email LIKE '%deine-email%' -- ERSETZE MIT DEINER EMAIL!
GROUP BY organization_id

UNION ALL

SELECT 
  'Video Organization' as type,
  organization_id,
  COUNT(*) as count
FROM video_content
GROUP BY organization_id;

-- Step 4: Simuliere die getVideos Abfrage
-- ERSETZE 'YOUR_ORG_ID' mit der organization_id aus Step 1!
SELECT 
  id,
  title,
  youtube_url,
  organization_id,
  created_at
FROM video_content
WHERE organization_id = 'YOUR_ORG_ID' -- HIER DEINE ORG_ID EINTRAGEN!
ORDER BY created_at DESC;
