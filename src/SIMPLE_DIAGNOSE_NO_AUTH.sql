-- =====================================================
-- SIMPLE DIAGNOSE: Ohne auth.uid() (für SQL Editor)
-- =====================================================
-- Diese Version funktioniert im Supabase SQL Editor
-- ohne dass du eingeloggt sein musst!

-- ============================================
-- SCHRITT 1: Prüfe ob Tabelle existiert
-- ============================================

SELECT 
  '✅ SCHRITT 1: Tabelle Check' as step,
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name = 'dashboard_announcements';

-- ERWARTETES ERGEBNIS:
-- ✅ Eine Zeile mit: dashboard_announcements | BASE TABLE
-- ❌ Keine Zeile → Tabelle existiert NICHT!


-- ============================================
-- SCHRITT 2: Prüfe Spalten der Tabelle
-- ============================================

SELECT 
  '✅ SCHRITT 2: Spalten Check' as step,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'dashboard_announcements'
ORDER BY ordinal_position;

-- ERWARTETES ERGEBNIS:
-- ✅ Spalten: id, organization_id, title, content, is_live, etc.
-- ❌ Keine Zeilen → Tabelle existiert nicht oder ist leer


-- ============================================
-- SCHRITT 3: Prüfe existierende Announcements
-- ============================================

SELECT 
  '✅ SCHRITT 3: Announcements Count' as step,
  COUNT(*) as total_announcements,
  COUNT(CASE WHEN is_live = true THEN 1 END) as live_announcements,
  COUNT(CASE WHEN is_live = false THEN 1 END) as draft_announcements
FROM dashboard_announcements;

-- ERWARTETES ERGEBNIS:
-- ✅ total: 0 (noch keine Announcements)
-- ❌ Error → Tabelle existiert nicht oder RLS blockiert


-- ============================================
-- SCHRITT 4: Prüfe RLS Policies
-- ============================================

SELECT 
  '✅ SCHRITT 4: RLS Policies' as step,
  policyname,
  cmd as command,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'dashboard_announcements'
ORDER BY policyname;

-- ERWARTETES ERGEBNIS:
-- ✅ 4 Policies:
--    1. "Users can view live announcements in their org" (SELECT)
--    2. "HR/Admin can insert announcements" (INSERT)
--    3. "HR/Admin can update announcements" (UPDATE)
--    4. "HR/Admin can delete announcements" (DELETE)


-- ============================================
-- SCHRITT 5: Prüfe alle Users (um zu sehen wer Admin ist)
-- ============================================

SELECT 
  '✅ SCHRITT 5: Users Check' as step,
  id,
  email,
  role,
  organization_id,
  first_name,
  last_name
FROM users
ORDER BY role, email;

-- ERWARTETES ERGEBNIS:
-- ✅ Liste aller User mit ihren Rollen
-- ❌ Keine USER mit role = 'ADMIN' / 'HR' / 'SUPERADMIN' → Problem!


-- ============================================
-- SCHRITT 6: Prüfe Organizations
-- ============================================

SELECT 
  '✅ SCHRITT 6: Organizations' as step,
  id,
  name,
  is_default,
  created_at
FROM organizations
ORDER BY created_at;

-- ERWARTETES ERGEBNIS:
-- ✅ Mindestens 1 Organization
-- ❌ Keine Organizations → Riesenproblem!


-- ============================================
-- SCHRITT 7: Test Insert OHNE auth.uid()
-- ============================================

-- ⚠️ ACHTUNG: Dieser Test erstellt eine Test-Announcement
-- mit einem ECHTEN User aus deiner DB!

-- Finde ersten ADMIN/HR/SUPERADMIN User:
SELECT 
  '✅ SCHRITT 7: Admin User für Test' as step,
  id as admin_user_id,
  email,
  role,
  organization_id
FROM users
WHERE role IN ('ADMIN', 'HR', 'SUPERADMIN')
LIMIT 1;

-- Wenn KEIN Admin gefunden wurde → STOP!
-- Wenn Admin gefunden → Kopiere die ID für den nächsten Step!


-- ============================================
-- SCHRITT 8: Test Insert (VORSICHT!)
-- ============================================

-- ⚠️ ERSETZE 'ADMIN_USER_ID_HIER' mit der ID aus SCHRITT 7!
-- ⚠️ ERSETZE 'ORG_ID_HIER' mit der organization_id aus SCHRITT 7!

DO $$
DECLARE
  v_admin_user_id UUID;
  v_org_id UUID;
  v_announcement_id UUID;
BEGIN
  -- Finde ersten Admin
  SELECT id, organization_id INTO v_admin_user_id, v_org_id
  FROM users
  WHERE role IN ('ADMIN', 'HR', 'SUPERADMIN')
  LIMIT 1;

  IF v_admin_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Kein Admin User gefunden!';
  END IF;

  -- Erstelle Test Announcement
  INSERT INTO dashboard_announcements (
    title,
    content,
    organization_id,
    created_by,
    updated_by
  ) VALUES (
    'SQL Test Mitteilung',
    '{"blocks": [{"type": "richtext", "html": "<p>Test aus SQL Editor</p>"}]}'::jsonb,
    v_org_id,
    v_admin_user_id,
    v_admin_user_id
  ) RETURNING id INTO v_announcement_id;

  RAISE NOTICE '✅ SCHRITT 8: Test Announcement erstellt! ID: %', v_announcement_id;
END $$;

-- ERWARTETES ERGEBNIS:
-- ✅ "Test Announcement erstellt! ID: ..."
-- ❌ Error → RLS blockiert oder andere Probleme


-- ============================================
-- SCHRITT 9: Prüfe ob Test Announcement da ist
-- ============================================

SELECT 
  '✅ SCHRITT 9: Test Announcement Check' as step,
  id,
  title,
  is_live,
  created_at
FROM dashboard_announcements
WHERE title = 'SQL Test Mitteilung';

-- ERWARTETES ERGEBNIS:
-- ✅ Eine Zeile mit: "SQL Test Mitteilung"
-- ❌ Keine Zeile → INSERT hat nicht funktioniert


-- ============================================
-- SCHRITT 10: CLEANUP - Lösche Test Announcement
-- ============================================

DELETE FROM dashboard_announcements 
WHERE title = 'SQL Test Mitteilung';

SELECT '✅ SCHRITT 10: Cleanup complete!' as step;


-- ============================================
-- ✅ ZUSAMMENFASSUNG
-- ============================================

-- Führe alle Steps nacheinander aus!
-- Kopiere mir die ERGEBNISSE von ALLEN Steps!

-- Besonders wichtig:
-- - SCHRITT 1: Existiert Tabelle? (JA/NEIN)
-- - SCHRITT 3: Wie viele Announcements? (Zahl)
-- - SCHRITT 5: Gibt es Admin-User? (Liste)
-- - SCHRITT 8: Konnte Test Announcement erstellt werden? (JA/NEIN)
