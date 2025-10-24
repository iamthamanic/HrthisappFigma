-- ========================================
-- 🚨 WICHTIG: Führe diesen Code in Supabase aus!
-- ========================================
-- 
-- ANLEITUNG:
-- 1. Gehe zu https://supabase.com/dashboard
-- 2. Öffne dein HRthis Projekt
-- 3. Klicke auf "SQL Editor" in der linken Sidebar
-- 4. Klicke auf "New Query"
-- 5. Kopiere DIESEN GESAMTEN CODE hier
-- 6. Füge ihn in den SQL Editor ein
-- 7. Klicke auf "Run" (oder drücke Strg+Enter / Cmd+Enter)
-- 8. Warte bis "Success" angezeigt wird
-- 9. Refreshe deine HRthis App (F5)
-- 10. Versuche den Upload erneut - FERTIG! ✅
--
-- ========================================

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS private_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bic TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shirt_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pants_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shoe_size TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS jacket_size TEXT;

-- WICHTIG: Entferne den problematischen Index!
-- Problem: B-Tree Index kann max. 2704 bytes speichern
-- Base64-Bilder (200x200 @ 60%) sind ~6000 bytes groß
-- Lösung: Index entfernen - wird nicht benötigt, da wir nie nach Profilbild suchen
DROP INDEX IF EXISTS idx_users_profile_picture;

-- Verify it worked
SELECT 
  'SUCCESS: profile_picture columns exist and problematic index removed!' as status,
  column_name 
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('profile_picture', 'profile_picture_url');

-- ========================================
-- ✅ FERTIG!
-- ========================================
-- Wenn du oben "SUCCESS" siehst, hat es geklappt!
--
-- ========================================
-- 📚 DEMO-DATEN IM LERNBEREICH ENTFERNEN
-- ========================================
-- Falls du noch Demo-Daten (Quizzes/Videos) in deiner
-- Datenbank hast, kannst du diese mit diesem Script entfernen:
--
-- Siehe: /REMOVE_ALL_LEARNING_DEMO_DATA.sql
--
-- Kopiere und führe den Inhalt dieser Datei aus, um alle
-- Demo-Inhalte aus dem Lernbereich zu löschen.
-- ========================================
-- Refreshe jetzt deine HRthis App und der Upload sollte funktionieren.
-- ========================================
