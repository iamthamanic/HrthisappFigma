-- ============================================
-- DEBUG: Check User Break Settings
-- COPY THIS INTO SUPABASE SQL EDITOR
-- ============================================

-- This will show you the current break settings for all users

SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  break_auto,
  break_manual,
  break_minutes,
  CASE 
    WHEN break_auto IS NULL AND break_manual IS NULL AND break_minutes IS NULL THEN '❌ All NULL'
    WHEN break_auto IS NULL THEN '⚠️ break_auto is NULL'
    WHEN break_manual IS NULL THEN '⚠️ break_manual is NULL'
    WHEN break_minutes IS NULL THEN '⚠️ break_minutes is NULL'
    WHEN break_auto = true THEN '✅ Auto Breaks Enabled'
    WHEN break_manual = true THEN '✅ Manual Breaks Enabled'
    ELSE '⚠️ No breaks enabled'
  END as status
FROM public.users
ORDER BY created_at DESC;

-- If you see NULL values, run this to fix them:
-- UPDATE public.users 
-- SET 
--   break_auto = COALESCE(break_auto, false),
--   break_manual = COALESCE(break_manual, false),
--   break_minutes = COALESCE(break_minutes, 30)
-- WHERE break_auto IS NULL OR break_manual IS NULL OR break_minutes IS NULL;
