/**
 * QUICK FIX: Weekly Hours History Overlap Error
 * ==============================================
 * 
 * Problem: Exclusion Constraint verwendet '[]' (beide Grenzen inklusive)
 * Lösung: Ändern auf '[)' (Start inklusive, Ende exklusiv)
 * 
 * Fehler: "conflicting key value violates exclusion constraint 
 *          weekly_hours_history_no_overlap"
 * 
 * KOPIERE DIESES SCRIPT UND FÜHRE ES IN SUPABASE AUS!
 */

-- =====================================================
-- SCHRITT 1: Constraint löschen
-- =====================================================

ALTER TABLE weekly_hours_history
DROP CONSTRAINT IF EXISTS weekly_hours_history_no_overlap;

-- =====================================================
-- SCHRITT 2: Neuen Constraint mit '[)' erstellen
-- =====================================================

-- '[)' bedeutet:
-- - valid_from ist INKLUSIVE (Start-Datum gehört dazu)
-- - valid_to ist EXKLUSIV (End-Datum gehört NICHT mehr dazu)
--
-- Beispiel:
-- Alter Eintrag: 2025-10-08 bis 2025-10-17 (gültig BIS 16.10. 23:59:59)
-- Neuer Eintrag: 2025-10-17 bis NULL (gültig AB 17.10. 00:00:00)
-- ✅ KEINE Überlappung!

ALTER TABLE weekly_hours_history
ADD CONSTRAINT weekly_hours_history_no_overlap EXCLUDE USING gist (
  user_id WITH =,
  daterange(valid_from, COALESCE(valid_to, '9999-12-31'::date), '[)') WITH &&
);

-- =====================================================
-- SCHRITT 3: Prüfe, ob Constraint funktioniert
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Constraint erfolgreich aktualisiert!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Daterange-Semantik:';
  RAISE NOTICE '   [) = Start INKLUSIVE, Ende EXKLUSIV';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test:';
  RAISE NOTICE '   Alter Eintrag: 2025-10-01 bis 2025-10-17 (gültig bis 16.10.)';
  RAISE NOTICE '   Neuer Eintrag: 2025-10-17 bis NULL (gültig ab 17.10.)';
  RAISE NOTICE '   ✅ Keine Überlappung!';
  RAISE NOTICE '';
END $$;
