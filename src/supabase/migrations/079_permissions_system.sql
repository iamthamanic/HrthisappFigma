-- =====================================================
-- Migration 079: Granular Permissions System
-- =====================================================
-- This migration introduces a database-backed permission system
-- with role-based defaults and per-user GRANT/REVOKE overrides.
--
-- Architecture:
-- - permissions: All available permissions in the system
-- - role_permissions: Default permissions for each role
-- - user_permissions: Individual GRANT/REVOKE overrides per user
-- - effective_user_permissions: View that calculates final permissions
-- =====================================================

-- =====================================================
-- 1. PERMISSIONS TABLE
-- =====================================================
-- Defines all permissions available in the system
CREATE TABLE IF NOT EXISTS public.permissions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT
);

COMMENT ON TABLE public.permissions IS 'All available permissions in the BrowoKoordinator system';
COMMENT ON COLUMN public.permissions.key IS 'Unique permission identifier (e.g., "manage_employees")';
COMMENT ON COLUMN public.permissions.category IS 'Category for UI grouping (e.g., "Team Management")';

-- =====================================================
-- 2. ROLE_PERMISSIONS TABLE
-- =====================================================
-- Maps roles to their default permissions
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role TEXT NOT NULL CHECK (role IN ('USER', 'TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN', 'EXTERN')),
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_key)
);

COMMENT ON TABLE public.role_permissions IS 'Default permission bundles for each role';

-- Create index for faster role-based permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);

-- =====================================================
-- 3. USER_PERMISSIONS TABLE
-- =====================================================
-- Individual permission overrides per user
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('GRANT', 'REVOKE')),
  granted_by UUID REFERENCES public.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, permission_key)
);

COMMENT ON TABLE public.user_permissions IS 'Individual permission overrides (GRANT additional rights or REVOKE inherited rights)';
COMMENT ON COLUMN public.user_permissions.mode IS 'GRANT = add permission, REVOKE = remove inherited permission';

-- Create indexes for faster user permission lookups
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_mode ON public.user_permissions(mode);

-- =====================================================
-- 4. EFFECTIVE_USER_PERMISSIONS VIEW
-- =====================================================
-- Calculates the final effective permissions for each user
-- Logic:
-- 1. Start with all permissions from role_permissions for user's role
-- 2. Add all explicitly GRANTed permissions from user_permissions
-- 3. Remove all explicitly REVOKEd permissions from user_permissions
CREATE OR REPLACE VIEW public.effective_user_permissions AS
SELECT
  u.id AS user_id,
  rp.permission_key
FROM public.users u
JOIN public.role_permissions rp
  ON rp.role = u.role

UNION

SELECT
  up.user_id,
  up.permission_key
FROM public.user_permissions up
WHERE up.mode = 'GRANT'

EXCEPT

SELECT
  up.user_id,
  up.permission_key
FROM public.user_permissions up
WHERE up.mode = 'REVOKE';

COMMENT ON VIEW public.effective_user_permissions IS 'Final calculated permissions for each user (role defaults + GRANTs - REVOKEs)';

-- =====================================================
-- 5. INSERT ALL PERMISSIONS
-- =====================================================
-- Define all available permissions in the system
-- Based on current usePermissions hook

-- Dashboard & Profile
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('view_dashboard', 'Dashboard anzeigen', 'Dashboard & Profil', 'Zugriff auf das persönliche Dashboard'),
  ('edit_own_profile', 'Eigenes Profil bearbeiten', 'Dashboard & Profil', 'Persönliche Daten und Einstellungen ändern'),
  ('upload_profile_picture', 'Profilbild hochladen', 'Dashboard & Profil', 'Eigenes Profilbild hochladen und ändern'),
  ('customize_avatar', 'Avatar anpassen', 'Dashboard & Profil', 'Emoji-Avatar auswählen und personalisieren')
ON CONFLICT (key) DO NOTHING;

-- Time & Leave
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('track_time', 'Zeit erfassen', 'Zeit & Urlaub', 'Check-in/Check-out und Pausen erfassen'),
  ('submit_leave_request', 'Urlaubsanträge stellen', 'Zeit & Urlaub', 'Neue Urlaubsanträge erstellen'),
  ('approve_leave_requests', 'Urlaubsanträge genehmigen', 'Zeit & Urlaub', 'Urlaubsanträge von Kollegen genehmigen/ablehnen')
ON CONFLICT (key) DO NOTHING;

-- Learning
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('view_courses', 'Kurse ansehen', 'Learning Center', 'Zugriff auf verfügbare Lernvideos und Kurse'),
  ('take_courses', 'Kurse absolvieren', 'Learning Center', 'An Kursen teilnehmen'),
  ('take_quizzes', 'Quizzes absolvieren', 'Learning Center', 'An Quizzes teilnehmen und XP/Coins verdienen'),
  ('use_learning_shop', 'Learning Shop nutzen', 'Learning Center', 'Inhalte mit Coins freischalten'),
  ('create_courses', 'Kurse erstellen', 'Learning Center', 'Neue Lernvideos und Quizzes erstellen'),
  ('edit_courses', 'Kurse bearbeiten', 'Learning Center', 'Lernvideos und Quizzes bearbeiten'),
  ('delete_courses', 'Kurse löschen', 'Learning Center', 'Lernvideos und Quizzes entfernen')
ON CONFLICT (key) DO NOTHING;

-- Gamification
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('earn_xp', 'XP sammeln', 'Gamification', 'Erfahrungspunkte durch Aktivitäten sammeln'),
  ('earn_coins', 'Coins verdienen', 'Gamification', 'Coins durch Kurse und Aktivitäten verdienen'),
  ('unlock_achievements', 'Achievements freischalten', 'Gamification', 'Erfolge und Badges sammeln'),
  ('level_up', 'Level aufsteigen', 'Gamification', 'Durch XP in Levels aufsteigen (1-100)')
ON CONFLICT (key) DO NOTHING;

-- Benefits & Documents
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('view_benefits', 'Benefits einsehen', 'Benefits & Dokumente', 'Verfügbare Unternehmens-Benefits anzeigen'),
  ('request_benefits', 'Benefit-Anfragen stellen', 'Benefits & Dokumente', 'Benefits beantragen'),
  ('upload_documents', 'Dokumente hochladen', 'Benefits & Dokumente', 'Eigene Dokumente hochladen und verwalten'),
  ('view_own_documents', 'Dokumente einsehen', 'Benefits & Dokumente', 'Zugriff auf eigene und geteilte Dokumente'),
  ('manage_benefits', 'Benefits verwalten', 'Benefits & Dokumente', 'Benefits erstellen, bearbeiten und löschen')
ON CONFLICT (key) DO NOTHING;

-- Team & Organization
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('view_team_members', 'Team-Mitglieder anzeigen', 'Team & Organisation', 'Liste aller Kollegen im Team sehen'),
  ('view_organigram', 'Organigram anzeigen', 'Team & Organisation', 'Organisationsstruktur einsehen'),
  ('add_employees', 'Mitarbeiter hinzufügen', 'Team & Organisation', 'Neue Mitarbeiter anlegen'),
  ('edit_employees', 'Mitarbeiter bearbeiten', 'Team & Organisation', 'Mitarbeiterdaten ändern'),
  ('deactivate_employees', 'Mitarbeiter deaktivieren', 'Team & Organisation', 'Mitarbeiter-Accounts deaktivieren'),
  ('delete_employees', 'Mitarbeiter löschen', 'Team & Organisation', 'Mitarbeiter permanent löschen'),
  ('assign_roles', 'Rollen zuweisen', 'Team & Organisation', 'Berechtigungen von bestehenden Mitarbeitern ändern'),
  ('create_user', 'USER erstellen', 'Team & Organisation', 'Neue Mitarbeiter mit Standard-Berechtigungen anlegen'),
  ('create_admin', 'ADMIN erstellen', 'Team & Organisation', 'Neue Administratoren anlegen'),
  ('create_hr', 'HR erstellen', 'Team & Organisation', 'Neue HR-Mitarbeiter anlegen'),
  ('create_superadmin', 'SUPERADMIN erstellen', 'Team & Organisation', 'Neue Super Administratoren anlegen'),
  ('create_extern', 'EXTERN erstellen', 'Team & Organisation', 'Neue externe Mitarbeiter anlegen'),
  ('manage_teams', 'Teams verwalten', 'Team & Organisation', 'Teams erstellen, bearbeiten und löschen')
ON CONFLICT (key) DO NOTHING;

-- Administration
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('access_admin_area', 'Admin-Bereich zugreifen', 'Administration', 'Zugriff auf den Admin-Bereich'),
  ('edit_company_settings', 'Firmeneinstellungen ändern', 'Administration', 'Company Logo, Name, etc. bearbeiten'),
  ('manage_locations', 'Standorte verwalten', 'Administration', 'Standorte/Locations erstellen und bearbeiten'),
  ('manage_dashboard_info', 'Dashboard-Infos verwalten', 'Administration', 'Dashboard-Karten und Statistiken konfigurieren'),
  ('manage_avatar_system', 'Avatar-System verwalten', 'Administration', 'Avatar-Items und Emojis verwalten'),
  ('access_system_settings', 'System-Einstellungen', 'Administration', 'Erweiterte System- und Sicherheitseinstellungen'),
  ('manage_workflows', 'Workflows verwalten', 'Administration', 'Workflow-Automatisierungen erstellen und bearbeiten'),
  ('manage_field', 'Field-Management', 'Administration', 'Field-Einsätze und Außendienst verwalten')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 6. INSERT ROLE PERMISSIONS (Current Matrix)
-- =====================================================
-- Map current usePermissions logic to database

-- EXTERN role (very limited)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('EXTERN', 'view_dashboard'),
  ('EXTERN', 'upload_documents'),
  ('EXTERN', 'view_own_documents')
ON CONFLICT DO NOTHING;

-- USER role (standard employee)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('USER', 'view_dashboard'),
  ('USER', 'edit_own_profile'),
  ('USER', 'upload_profile_picture'),
  ('USER', 'customize_avatar'),
  ('USER', 'track_time'),
  ('USER', 'submit_leave_request'),
  ('USER', 'view_courses'),
  ('USER', 'take_courses'),
  ('USER', 'take_quizzes'),
  ('USER', 'use_learning_shop'),
  ('USER', 'earn_xp'),
  ('USER', 'earn_coins'),
  ('USER', 'unlock_achievements'),
  ('USER', 'level_up'),
  ('USER', 'view_benefits'),
  ('USER', 'request_benefits'),
  ('USER', 'upload_documents'),
  ('USER', 'view_own_documents'),
  ('USER', 'view_team_members'),
  ('USER', 'view_organigram')
ON CONFLICT DO NOTHING;

-- TEAMLEAD role (USER + admin features)
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'TEAMLEAD', permission_key FROM public.role_permissions WHERE role = 'USER'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('TEAMLEAD', 'approve_leave_requests'),
  ('TEAMLEAD', 'create_courses'),
  ('TEAMLEAD', 'edit_courses'),
  ('TEAMLEAD', 'delete_courses'),
  ('TEAMLEAD', 'manage_benefits'),
  ('TEAMLEAD', 'add_employees'),
  ('TEAMLEAD', 'edit_employees'),
  ('TEAMLEAD', 'deactivate_employees'),
  ('TEAMLEAD', 'access_admin_area'),
  ('TEAMLEAD', 'edit_company_settings'),
  ('TEAMLEAD', 'manage_locations'),
  ('TEAMLEAD', 'manage_dashboard_info'),
  ('TEAMLEAD', 'manage_avatar_system')
ON CONFLICT DO NOTHING;

-- ADMIN role (TEAMLEAD + more management)
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'ADMIN', permission_key FROM public.role_permissions WHERE role = 'TEAMLEAD'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('ADMIN', 'create_user'),
  ('ADMIN', 'create_extern'),
  ('ADMIN', 'manage_teams'),
  ('ADMIN', 'manage_workflows'),
  ('ADMIN', 'manage_field')
ON CONFLICT DO NOTHING;

-- HR role (ADMIN + HR-specific)
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'HR', permission_key FROM public.role_permissions WHERE role = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('HR', 'create_admin')
ON CONFLICT DO NOTHING;

-- SUPERADMIN role (all permissions)
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'SUPERADMIN', key FROM public.permissions
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT SELECT ON public.effective_user_permissions TO authenticated;

-- Only admins can modify permissions
-- (Additional RLS policies can be added later)

-- =====================================================
-- 8. MIGRATION COMPLETE
-- =====================================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration 079: Permissions System erfolgreich erstellt!';
  RAISE NOTICE 'ℹ️  Tabellen: permissions, role_permissions, user_permissions';
  RAISE NOTICE 'ℹ️  View: effective_user_permissions';
  RAISE NOTICE 'ℹ️  Alle aktuellen Rollen-Mappings wurden übernommen';
END $$;
