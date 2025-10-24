-- =====================================================
-- ULTRA SIMPLE CHECK (Kopiere ALLES und führe aus!)
-- =====================================================

-- 1️⃣ Existiert die Tabelle?
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'dashboard_announcements';
-- ERWARTET: 1 (Tabelle existiert) oder 0 (Tabelle fehlt)

-- 2️⃣ Wie viele Announcements gibt es?
SELECT COUNT(*) as total_announcements 
FROM dashboard_announcements;
-- ERWARTET: 0 (noch keine) oder Zahl (schon welche da)

-- 3️⃣ Gibt es Admin-User?
SELECT COUNT(*) as admin_users 
FROM users 
WHERE role IN ('ADMIN', 'HR', 'SUPERADMIN');
-- ERWARTET: Mindestens 1

-- 4️⃣ Welcher User bin ICH in der Frontend-App?
SELECT email, role 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
-- Siehst du DEINE Email? Welche Rolle hast du?

-- ✅ KOPIERE MIR DIE 4 ERGEBNISSE!
