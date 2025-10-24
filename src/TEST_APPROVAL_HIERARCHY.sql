-- =====================================================
-- TEST: Leave Approval Hierarchy
-- =====================================================
-- Dieses SQL testet die neue Approval-Hierarchie:
-- - Nur SUPERADMIN kann HR/SUPERADMIN-Anträge genehmigen
-- - HR kann alle Anträge genehmigen AUSSER HR/SUPERADMIN
-- - ADMIN kann genehmigen wenn TEAMLEAD, ABER NICHT HR/SUPERADMIN
-- =====================================================

-- =====================================================
-- SCHRITT 1: Zeige alle Benutzer mit ihren Rollen
-- =====================================================
SELECT 
  CONCAT(first_name, ' ', last_name) as name,
  role,
  email
FROM users
ORDER BY 
  CASE role
    WHEN 'SUPERADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'ADMIN' THEN 3
    WHEN 'USER' THEN 4
  END,
  first_name;

-- =====================================================
-- SCHRITT 2: Zeige TEAMLEAD-Zuordnungen
-- =====================================================
SELECT 
  t.name as team_name,
  CONCAT(u.first_name, ' ', u.last_name) as teamlead_name,
  u.role as global_role,
  tm.role as team_role
FROM team_members tm
JOIN users u ON tm.user_id = u.id
JOIN teams t ON tm.team_id = t.id
WHERE tm.role = 'TEAMLEAD'
ORDER BY t.name, u.first_name;

-- =====================================================
-- SCHRITT 3: Zeige alle ausstehenden Urlaubsanträge
-- =====================================================
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as antragsteller,
  u.role as rolle,
  lr.leave_type as typ,
  lr.start_date as von,
  lr.end_date as bis,
  lr.total_days as tage,
  lr.status,
  lr.created_at
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
WHERE lr.status = 'PENDING'
  AND lr.withdrawn_at IS NULL
  AND lr.cancelled_at IS NULL
ORDER BY lr.created_at DESC;

-- =====================================================
-- SCHRITT 4: Simuliere Genehmigungen (ohne zu ändern)
-- =====================================================

-- 4a. Wer kann Tina Test (USER) Anträge genehmigen?
-- Erwartet: SUPERADMIN, HR, ADMIN (als TEAMLEAD in ihrem Team)
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as potenzieller_genehmiger,
  u.role as rolle,
  tm.role as team_rolle,
  CASE 
    WHEN u.role = 'SUPERADMIN' THEN '✅ Kann genehmigen (SUPERADMIN)'
    WHEN u.role = 'HR' THEN '✅ Kann genehmigen (HR)'
    WHEN u.role = 'ADMIN' AND tm.role = 'TEAMLEAD' THEN '✅ Kann genehmigen (TEAMLEAD)'
    WHEN u.role = 'ADMIN' THEN '❌ Kann NICHT genehmigen (kein TEAMLEAD)'
    ELSE '❌ Kann NICHT genehmigen'
  END as genehmigungsstatus
FROM users u
LEFT JOIN team_members tm ON u.id = tm.user_id
WHERE u.first_name != 'Tina'  -- Exclude Tina herself
ORDER BY 
  CASE u.role
    WHEN 'SUPERADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'ADMIN' THEN 3
    WHEN 'USER' THEN 4
  END;

-- 4b. Wer kann Anna Admin (ADMIN) Anträge genehmigen?
-- Erwartet: SUPERADMIN, HR, NICHT andere ADMIN
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as potenzieller_genehmiger,
  u.role as rolle,
  CASE 
    WHEN u.role = 'SUPERADMIN' THEN '✅ Kann genehmigen (SUPERADMIN)'
    WHEN u.role = 'HR' THEN '✅ Kann genehmigen (HR)'
    WHEN u.role = 'ADMIN' THEN '❌ Kann NICHT genehmigen (nur SUPERADMIN/HR für ADMIN)'
    ELSE '❌ Kann NICHT genehmigen'
  END as genehmigungsstatus
FROM users u
WHERE u.first_name != 'Anna'  -- Exclude Anna herself
ORDER BY 
  CASE u.role
    WHEN 'SUPERADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'ADMIN' THEN 3
    WHEN 'USER' THEN 4
  END;

-- 4c. Wer kann HR-Anträge genehmigen?
-- Erwartet: NUR SUPERADMIN, NICHT andere HR
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as potenzieller_genehmiger,
  u.role as rolle,
  CASE 
    WHEN u.role = 'SUPERADMIN' THEN '✅ Kann genehmigen (NUR SUPERADMIN)'
    WHEN u.role = 'HR' THEN '❌ Kann NICHT genehmigen (HR kann nicht HR genehmigen!)'
    ELSE '❌ Kann NICHT genehmigen'
  END as genehmigungsstatus
FROM users u
WHERE u.role IN ('SUPERADMIN', 'HR', 'ADMIN')
ORDER BY 
  CASE u.role
    WHEN 'SUPERADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'ADMIN' THEN 3
  END;

-- 4d. Wer kann SUPERADMIN-Anträge genehmigen?
-- Erwartet: NUR andere SUPERADMIN
SELECT 
  CONCAT(u.first_name, ' ', u.last_name) as potenzieller_genehmiger,
  u.role as rolle,
  CASE 
    WHEN u.role = 'SUPERADMIN' THEN '✅ Kann genehmigen (andere SUPERADMIN)'
    ELSE '❌ Kann NICHT genehmigen (nur SUPERADMIN können SUPERADMIN genehmigen!)'
  END as genehmigungsstatus
FROM users u
WHERE u.role IN ('SUPERADMIN', 'HR', 'ADMIN')
ORDER BY 
  CASE u.role
    WHEN 'SUPERADMIN' THEN 1
    WHEN 'HR' THEN 2
    WHEN 'ADMIN' THEN 3
  END;

-- =====================================================
-- SCHRITT 5: Zusammenfassung der Regeln
-- =====================================================
SELECT 
  'Approval Rules Summary' as info,
  '✅ SUPERADMIN → kann ALLE Anträge genehmigen' as rule_1,
  '✅ HR → kann USER/ADMIN Anträge genehmigen, NICHT HR/SUPERADMIN' as rule_2,
  '✅ ADMIN (TEAMLEAD) → kann USER/ADMIN in ihrem Team genehmigen, NICHT HR/SUPERADMIN' as rule_3,
  '❌ HR → kann KEINE HR-Anträge genehmigen (auch nicht gegenseitig!)' as rule_4,
  '❌ ADMIN → kann KEINE HR/SUPERADMIN-Anträge genehmigen' as rule_5;

-- =====================================================
-- ERWARTETE ERGEBNISSE:
-- =====================================================
-- 
-- Tina Test (USER) Antrag:
-- ✅ Anna Admin (TEAMLEAD in Team 3) → kann genehmigen
-- ✅ Alle HR → können genehmigen
-- ✅ Alle SUPERADMIN → können genehmigen
--
-- Anna Admin (ADMIN) Antrag:
-- ❌ Andere ADMIN → können NICHT genehmigen
-- ✅ Alle HR → können genehmigen
-- ✅ Alle SUPERADMIN → können genehmigen
--
-- HR-Person Antrag:
-- ❌ Andere HR → können NICHT genehmigen
-- ❌ ADMIN → können NICHT genehmigen
-- ✅ Nur SUPERADMIN → können genehmigen
--
-- SUPERADMIN Antrag:
-- ❌ HR → können NICHT genehmigen
-- ❌ ADMIN → können NICHT genehmigen
-- ✅ Nur andere SUPERADMIN → können genehmigen
-- =====================================================
