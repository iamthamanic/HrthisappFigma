-- =====================================================
-- DIAGNOSE: Announcements "Failed to fetch" Error
-- =====================================================
-- Führe diese Queries in Supabase SQL Editor aus
-- um das Problem zu finden!

-- ============================================
-- SCHRITT 1: Prüfe ob Tabelle existiert
-- ============================================

SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name = 'dashboard_announcements';

-- ERWARTETES ERGEBNIS:
-- table_name: dashboard_announcements
-- table_type: BASE TABLE

-- Wenn KEINE Zeile erscheint → Tabelle fehlt!
-- Wenn Zeile erscheint → Tabelle existiert ✅


-- ============================================
-- SCHRITT 2: Prüfe aktuelle Announcements
-- ============================================

SELECT 
  id,
  title,
  is_live,
  created_at,
  organization_id
FROM dashboard_announcements
ORDER BY created_at DESC;

-- ERWARTETES ERGEBNIS:
-- Wenn Fehler "permission denied" → RLS Problem
-- Wenn leer → Keine Announcements vorhanden
-- Wenn Zeilen → Announcements existieren


-- ============================================
-- SCHRITT 3: Prüfe deine User-Rolle
-- ============================================

SELECT 
  id,
  email,
  role,
  organization_id,
  first_name,
  last_name
FROM users 
WHERE id = auth.uid();

-- ERWARTETES ERGEBNIS:
-- Du solltest DEINE User-Daten sehen
-- role sollte sein: HR, ADMIN, oder SUPERADMIN

-- Wenn KEINE Zeile → Du bist NICHT eingeloggt! ❌
-- Wenn role = 'USER' → Du hast KEINE Admin-Rechte! ❌


-- ============================================
-- SCHRITT 4: Prüfe RLS Policies
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'dashboard_announcements';

-- ERWARTETES ERGEBNIS:
-- Du solltest 4 Policies sehen:
-- 1. "Users can view live announcements in their org" (SELECT)
-- 2. "HR/Admin can insert announcements" (INSERT)
-- 3. "HR/Admin can update announcements" (UPDATE)
-- 4. "HR/Admin can delete announcements" (DELETE)


-- ============================================
-- SCHRITT 5: Test ob RLS dich blockiert
-- ============================================

-- Versuche direkt eine Announcement zu erstellen
-- (nur wenn du HR/ADMIN/SUPERADMIN bist)

INSERT INTO dashboard_announcements (
  title,
  content,
  organization_id,
  created_by,
  updated_by
)
VALUES (
  'Test Mitteilung',
  '{"blocks": [{"type": "richtext", "html": "<p>Test</p>"}]}'::jsonb,
  (SELECT organization_id FROM users WHERE id = auth.uid()),
  auth.uid(),
  auth.uid()
)
RETURNING id, title, is_live;

-- ERWARTETES ERGEBNIS:
-- Wenn ERFOLG → Du siehst: id, title="Test Mitteilung", is_live=false
-- Wenn FEHLER "permission denied" → RLS blockiert dich
-- Wenn FEHLER "organization_id cannot be null" → Du hast keine Organization


-- ============================================
-- SCHRITT 6: Prüfe ob Supabase läuft
-- ============================================

-- Einfacher Test Query
SELECT now() as current_time, version() as postgres_version;

-- ERWARTETES ERGEBNIS:
-- current_time: 2025-01-12 XX:XX:XX
-- postgres_version: PostgreSQL 15.x...

-- Wenn FEHLER → Supabase Projekt ist pausiert oder offline! ❌


-- ============================================
-- SCHRITT 7: Lösche Test-Announcement
-- ============================================

-- Lösche die Test-Announcement die wir in Schritt 5 erstellt haben
DELETE FROM dashboard_announcements 
WHERE title = 'Test Mitteilung'
AND created_by = auth.uid();

-- ERWARTETES ERGEBNIS:
-- DELETE 1 (wenn erfolgreich gelöscht)


-- ============================================
-- ZUSAMMENFASSUNG
-- ============================================

-- ✅ SCHRITT 1 ERFOLGREICH → Tabelle existiert
-- ✅ SCHRITT 2 ERFOLGREICH → RLS funktioniert
-- ✅ SCHRITT 3 ERFOLGREICH → Du bist eingeloggt mit korrekter Rolle
-- ✅ SCHRITT 4 ERFOLGREICH → Policies existieren
-- ✅ SCHRITT 5 ERFOLGREICH → Du kannst Announcements erstellen
-- ✅ SCHRITT 6 ERFOLGREICH → Supabase läuft
-- ✅ SCHRITT 7 ERFOLGREICH → Cleanup erfolgreich

-- Wenn ALLE Schritte erfolgreich:
-- → Problem ist im FRONTEND (nicht im Backend!)
-- → Checke Console Logs im Browser
-- → Checke Supabase URL & API Keys

-- ============================================
-- QUICK FIX: Falls RLS Problem
-- ============================================

-- Wenn Schritt 5 "permission denied" wirft:
-- Prüfe ob du als HR/ADMIN/SUPERADMIN eingeloggt bist:

SELECT role FROM users WHERE id = auth.uid();

-- Wenn role = 'USER' → Du brauchst Admin-Rechte!
-- Führe aus (NUR FÜR TEST!):

UPDATE users 
SET role = 'ADMIN' 
WHERE id = auth.uid();

-- ACHTUNG: Nur für Test! Danach wieder auf USER setzen!
