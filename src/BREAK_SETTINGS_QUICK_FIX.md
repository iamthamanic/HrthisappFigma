-- ============================================
-- SCHRITT 1: Datenbank-Werte prüfen
-- ============================================
SELECT 
  id,
  email,
  first_name,
  last_name,
  break_auto,
  break_manual,
  break_minutes
FROM public.users
ORDER BY created_at DESC;

-- ============================================
-- SCHRITT 2: NULL Werte mit Defaults füllen
-- (Nur ausführen wenn Schritt 1 NULL zeigt)
-- ============================================
UPDATE public.users
SET 
  break_auto = COALESCE(break_auto, false),
  break_manual = COALESCE(break_manual, false),
  break_minutes = COALESCE(break_minutes, 30)
WHERE 
  break_auto IS NULL 
  OR break_manual IS NULL 
  OR break_minutes IS NULL;

-- Defaults für zukünftige User setzen
ALTER TABLE public.users
ALTER COLUMN break_auto SET DEFAULT false;

ALTER TABLE public.users
ALTER COLUMN break_manual SET DEFAULT false;

ALTER TABLE public.users
ALTER COLUMN break_minutes SET DEFAULT 30;

-- ============================================
-- OPTIONAL: Automatische Pausen für alle
-- ============================================
-- ALTER TABLE public.users
-- ALTER COLUMN break_auto SET DEFAULT true;

-- ============================================
-- TROUBLESHOOTING: Manuell für einen User
-- ============================================
-- UPDATE public.users
-- SET 
--   break_auto = true,
--   break_minutes = 30
-- WHERE email = 'ali@example.com';
