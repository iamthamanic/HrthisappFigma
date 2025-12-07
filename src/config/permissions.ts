/**
 * PERMISSION CONFIGURATION
 * ========================
 * Central definition of all permissions and role mappings
 * This replaces the hardcoded logic in usePermissions hook
 * and serves as the source of truth for both frontend and backend
 */

export type UserRole = 'USER' | 'TEAMLEAD' | 'HR' | 'ADMIN' | 'SUPERADMIN' | 'EXTERN';

/**
 * All available permission keys in the system
 * These match the 'key' column in the permissions table
 */
export type PermissionKey =
  // Dashboard & Profile
  | 'view_dashboard'
  | 'edit_own_profile'
  | 'upload_profile_picture'
  | 'customize_avatar'
  // Time & Leave
  | 'track_time'
  | 'submit_leave_request'
  | 'approve_leave_requests'
  // Learning
  | 'view_courses'
  | 'take_courses'
  | 'take_quizzes'
  | 'use_learning_shop'
  | 'create_courses'
  | 'edit_courses'
  | 'delete_courses'
  // Gamification
  | 'earn_xp'
  | 'earn_coins'
  | 'unlock_achievements'
  | 'level_up'
  // Benefits & Documents
  | 'view_benefits'
  | 'request_benefits'
  | 'upload_documents'
  | 'view_own_documents'
  | 'manage_benefits'
  // Team & Organization
  | 'view_team_members'
  | 'view_organigram'
  | 'add_employees'
  | 'edit_employees'
  | 'deactivate_employees'
  | 'delete_employees'
  | 'assign_roles'
  | 'create_user'
  | 'create_admin'
  | 'create_hr'
  | 'create_superadmin'
  | 'create_extern'
  | 'manage_teams'
  // Administration
  | 'access_admin_area'
  | 'edit_company_settings'
  | 'manage_locations'
  | 'manage_dashboard_info'
  | 'manage_avatar_system'
  | 'access_system_settings'
  | 'manage_workflows'
  | 'manage_field';

/**
 * ROLE PERMISSION MATRIX
 * ======================
 * Defines which permissions each role has by default
 */
export const ROLE_PERMISSION_MATRIX: Record<UserRole, PermissionKey[]> = {
  USER: [
    'view_dashboard',
    'edit_own_profile',
    'upload_profile_picture',
    'customize_avatar',
    'track_time',
    'submit_leave_request',
    'view_courses',
    'take_courses',
    'take_quizzes',
    'use_learning_shop',
    'earn_xp',
    'earn_coins',
    'unlock_achievements',
    'level_up',
    'view_benefits',
    'request_benefits',
    'upload_documents',
    'view_own_documents',
    'view_team_members',
    'view_organigram',
  ],

  EXTERN: [
    'view_dashboard',
    'edit_own_profile',
    'upload_profile_picture',
    'view_courses',
    'take_courses',
    'view_team_members',
  ],

  TEAMLEAD: [
    // All USER permissions
    'view_dashboard',
    'edit_own_profile',
    'upload_profile_picture',
    'customize_avatar',
    'track_time',
    'submit_leave_request',
    'view_courses',
    'take_courses',
    'take_quizzes',
    'use_learning_shop',
    'earn_xp',
    'earn_coins',
    'unlock_achievements',
    'level_up',
    'view_benefits',
    'request_benefits',
    'upload_documents',
    'view_own_documents',
    'view_team_members',
    'view_organigram',
    // Additional TEAMLEAD permissions
    'approve_leave_requests',
    'add_employees',
    'edit_employees',
    'create_user',
  ],

  HR: [
    // All USER permissions
    'view_dashboard',
    'edit_own_profile',
    'upload_profile_picture',
    'customize_avatar',
    'track_time',
    'submit_leave_request',
    'view_courses',
    'take_courses',
    'take_quizzes',
    'use_learning_shop',
    'earn_xp',
    'earn_coins',
    'unlock_achievements',
    'level_up',
    'view_benefits',
    'request_benefits',
    'upload_documents',
    'view_own_documents',
    'view_team_members',
    'view_organigram',
    // Additional HR permissions
    'approve_leave_requests',
    'create_courses',
    'edit_courses',
    'delete_courses',
    'manage_benefits',
    'add_employees',
    'edit_employees',
    'deactivate_employees',
    'delete_employees',
    'assign_roles',
    'create_user',
    'create_extern',
    'manage_teams',
    'access_admin_area',
    'manage_locations',
    'manage_dashboard_info',
  ],

  ADMIN: [
    // All USER permissions
    'view_dashboard',
    'edit_own_profile',
    'upload_profile_picture',
    'customize_avatar',
    'track_time',
    'submit_leave_request',
    'view_courses',
    'take_courses',
    'take_quizzes',
    'use_learning_shop',
    'earn_xp',
    'earn_coins',
    'unlock_achievements',
    'level_up',
    'view_benefits',
    'request_benefits',
    'upload_documents',
    'view_own_documents',
    'view_team_members',
    'view_organigram',
    // Additional ADMIN permissions
    'approve_leave_requests',
    'create_courses',
    'edit_courses',
    'delete_courses',
    'manage_benefits',
    'add_employees',
    'edit_employees',
    'deactivate_employees',
    'delete_employees',
    'assign_roles',
    'create_user',
    'create_admin',
    'create_hr',
    'create_extern',
    'manage_teams',
    'access_admin_area',
    'edit_company_settings',
    'manage_locations',
    'manage_dashboard_info',
    'manage_avatar_system',
    'manage_workflows',
    'manage_field',
  ],

  SUPERADMIN: [
    // All permissions
    'view_dashboard',
    'edit_own_profile',
    'upload_profile_picture',
    'customize_avatar',
    'track_time',
    'submit_leave_request',
    'approve_leave_requests',
    'view_courses',
    'take_courses',
    'take_quizzes',
    'use_learning_shop',
    'create_courses',
    'edit_courses',
    'delete_courses',
    'earn_xp',
    'earn_coins',
    'unlock_achievements',
    'level_up',
    'view_benefits',
    'request_benefits',
    'upload_documents',
    'view_own_documents',
    'manage_benefits',
    'view_team_members',
    'view_organigram',
    'add_employees',
    'edit_employees',
    'deactivate_employees',
    'delete_employees',
    'assign_roles',
    'create_user',
    'create_admin',
    'create_hr',
    'create_superadmin',
    'create_extern',
    'manage_teams',
    'access_admin_area',
    'edit_company_settings',
    'manage_locations',
    'manage_dashboard_info',
    'manage_avatar_system',
    'access_system_settings',
    'manage_workflows',
    'manage_field',
  ],
};

/**
 * PERMISSION TO CAN MAP
 * =====================
 * Maps permission keys to can object properties
 */
export const PERMISSION_TO_CAN_MAP: Record<PermissionKey, string> = {
  view_dashboard: 'viewDashboard',
  edit_own_profile: 'editOwnProfile',
  upload_profile_picture: 'uploadProfilePicture',
  customize_avatar: 'customizeAvatar',
  track_time: 'trackTime',
  submit_leave_request: 'submitLeaveRequest',
  approve_leave_requests: 'approveLeaveRequests',
  view_courses: 'viewCourses',
  take_courses: 'takeCourses',
  take_quizzes: 'takeQuizzes',
  use_learning_shop: 'useLearningShop',
  create_courses: 'createCourses',
  edit_courses: 'editCourses',
  delete_courses: 'deleteCourses',
  earn_xp: 'earnXP',
  earn_coins: 'earnCoins',
  unlock_achievements: 'unlockAchievements',
  level_up: 'levelUp',
  view_benefits: 'viewBenefits',
  request_benefits: 'requestBenefits',
  upload_documents: 'uploadDocuments',
  view_own_documents: 'viewOwnDocuments',
  manage_benefits: 'manageBenefits',
  view_team_members: 'viewTeamMembers',
  view_organigram: 'viewOrganigram',
  add_employees: 'addEmployees',
  edit_employees: 'editEmployees',
  deactivate_employees: 'deactivateEmployees',
  delete_employees: 'deleteEmployees',
  assign_roles: 'assignRoles',
  create_user: 'createUser',
  create_admin: 'createAdmin',
  create_hr: 'createHR',
  create_superadmin: 'createSuperadmin',
  create_extern: 'createExtern',
  manage_teams: 'manageTeams',
  access_admin_area: 'accessAdminArea',
  edit_company_settings: 'editCompanySettings',
  manage_locations: 'manageLocations',
  manage_dashboard_info: 'manageDashboardInfo',
  manage_avatar_system: 'manageAvatarSystem',
  access_system_settings: 'accessSystemSettings',
  manage_workflows: 'manageWorkflows',
  manage_field: 'manageField',
};

/**
 * Helper: Calculate effective permissions with overrides
 * @param rolePermissions - Base permissions from role
 * @param grants - Additional permissions explicitly granted
 * @param revokes - Permissions explicitly revoked
 */
export function calculateEffectivePermissions(
  rolePermissions: PermissionKey[],
  grants: PermissionKey[] = [],
  revokes: PermissionKey[] = []
): PermissionKey[] {
  const effectiveSet = new Set<PermissionKey>(rolePermissions);
  
  // Add grants
  grants.forEach(p => effectiveSet.add(p));
  
  // Remove revokes
  revokes.forEach(p => effectiveSet.delete(p));
  
  return Array.from(effectiveSet);
}

/**
 * PERMISSION METADATA
 * ===================
 * Human-readable labels and descriptions for each permission
 * Used by PermissionsEditor and other UI components
 */
export interface PermissionMetadata {
  key: PermissionKey;
  label: string;
  description: string;
  category: string;
}

export const ALL_PERMISSIONS_METADATA: PermissionMetadata[] = [
  // Dashboard & Profile
  { key: 'view_dashboard', label: 'Dashboard anzeigen', description: 'Zugriff auf das persönliche Dashboard', category: 'Dashboard & Profil' },
  { key: 'edit_own_profile', label: 'Eigenes Profil bearbeiten', description: 'Persönliche Daten und Einstellungen ändern', category: 'Dashboard & Profil' },
  { key: 'upload_profile_picture', label: 'Profilbild hochladen', description: 'Eigenes Profilbild hochladen und ändern', category: 'Dashboard & Profil' },
  { key: 'customize_avatar', label: 'Avatar anpassen', description: 'Emoji-Avatar auswählen und personalisieren', category: 'Dashboard & Profil' },
  
  // Time & Leave
  { key: 'track_time', label: 'Zeit erfassen', description: 'Check-in/Check-out und Pausen erfassen', category: 'Zeit & Urlaub' },
  { key: 'submit_leave_request', label: 'Urlaubsanträge stellen', description: 'Neue Urlaubsanträge erstellen', category: 'Zeit & Urlaub' },
  { key: 'approve_leave_requests', label: 'Urlaubsanträge genehmigen', description: 'Urlaubsanträge von Kollegen genehmigen/ablehnen', category: 'Zeit & Urlaub' },
  
  // Learning
  { key: 'view_courses', label: 'Kurse ansehen', description: 'Zugriff auf verfügbare Lernvideos und Kurse', category: 'Learning Center' },
  { key: 'take_courses', label: 'Kurse absolvieren', description: 'An Kursen teilnehmen', category: 'Learning Center' },
  { key: 'take_quizzes', label: 'Quizzes absolvieren', description: 'An Quizzes teilnehmen und XP/Coins verdienen', category: 'Learning Center' },
  { key: 'use_learning_shop', label: 'Learning Shop nutzen', description: 'Inhalte mit Coins freischalten', category: 'Learning Center' },
  { key: 'create_courses', label: 'Kurse erstellen', description: 'Neue Lernvideos und Quizzes erstellen', category: 'Learning Center' },
  { key: 'edit_courses', label: 'Kurse bearbeiten', description: 'Lernvideos und Quizzes bearbeiten', category: 'Learning Center' },
  { key: 'delete_courses', label: 'Kurse löschen', description: 'Lernvideos und Quizzes entfernen', category: 'Learning Center' },
  
  // Gamification
  { key: 'earn_xp', label: 'XP sammeln', description: 'Erfahrungspunkte durch Aktivitäten sammeln', category: 'Gamification' },
  { key: 'earn_coins', label: 'Coins verdienen', description: 'Coins durch Kurse und Aktivitäten verdienen', category: 'Gamification' },
  { key: 'unlock_achievements', label: 'Achievements freischalten', description: 'Erfolge und Badges sammeln', category: 'Gamification' },
  { key: 'level_up', label: 'Level aufsteigen', description: 'Durch XP in Levels aufsteigen (1-100)', category: 'Gamification' },
  
  // Benefits & Documents
  { key: 'view_benefits', label: 'Benefits einsehen', description: 'Verfügbare Unternehmens-Benefits anzeigen', category: 'Benefits & Dokumente' },
  { key: 'request_benefits', label: 'Benefit-Anfragen stellen', description: 'Benefits beantragen', category: 'Benefits & Dokumente' },
  { key: 'upload_documents', label: 'Dokumente hochladen', description: 'Eigene Dokumente hochladen und verwalten', category: 'Benefits & Dokumente' },
  { key: 'view_own_documents', label: 'Dokumente einsehen', description: 'Zugriff auf eigene und geteilte Dokumente', category: 'Benefits & Dokumente' },
  { key: 'manage_benefits', label: 'Benefits verwalten', description: 'Benefits erstellen, bearbeiten und löschen', category: 'Benefits & Dokumente' },
  
  // Team & Organization
  { key: 'view_team_members', label: 'Team-Mitglieder anzeigen', description: 'Liste aller Kollegen im Team sehen', category: 'Team & Organisation' },
  { key: 'view_organigram', label: 'Organigram anzeigen', description: 'Organisationsstruktur einsehen', category: 'Team & Organisation' },
  { key: 'add_employees', label: 'Mitarbeiter hinzufügen', description: 'Neue Mitarbeiter anlegen', category: 'Team & Organisation' },
  { key: 'edit_employees', label: 'Mitarbeiter bearbeiten', description: 'Mitarbeiterdaten ändern', category: 'Team & Organisation' },
  { key: 'deactivate_employees', label: 'Mitarbeiter deaktivieren', description: 'Mitarbeiter-Accounts deaktivieren', category: 'Team & Organisation' },
  { key: 'delete_employees', label: 'Mitarbeiter löschen', description: 'Mitarbeiter permanent löschen', category: 'Team & Organisation' },
  { key: 'assign_roles', label: 'Rollen zuweisen', description: 'Berechtigungen von bestehenden Mitarbeitern ändern', category: 'Team & Organisation' },
  { key: 'create_user', label: 'USER erstellen', description: 'Neue Mitarbeiter mit Standard-Berechtigungen anlegen', category: 'Team & Organisation' },
  { key: 'create_admin', label: 'ADMIN erstellen', description: 'Neue Administratoren anlegen', category: 'Team & Organisation' },
  { key: 'create_hr', label: 'HR erstellen', description: 'Neue HR-Mitarbeiter anlegen', category: 'Team & Organisation' },
  { key: 'create_superadmin', label: 'SUPERADMIN erstellen', description: 'Neue Super Administratoren anlegen', category: 'Team & Organisation' },
  { key: 'create_extern', label: 'EXTERN erstellen', description: 'Neue externe Mitarbeiter anlegen', category: 'Team & Organisation' },
  { key: 'manage_teams', label: 'Teams verwalten', description: 'Teams erstellen, bearbeiten und löschen', category: 'Team & Organisation' },
  
  // Administration
  { key: 'access_admin_area', label: 'Admin-Bereich zugreifen', description: 'Zugriff auf den Admin-Bereich', category: 'Administration' },
  { key: 'edit_company_settings', label: 'Firmeneinstellungen ändern', description: 'Company Logo, Name, etc. bearbeiten', category: 'Administration' },
  { key: 'manage_locations', label: 'Standorte verwalten', description: 'Standorte/Locations erstellen und bearbeiten', category: 'Administration' },
  { key: 'manage_dashboard_info', label: 'Dashboard-Infos verwalten', description: 'Dashboard-Karten und Statistiken konfigurieren', category: 'Administration' },
  { key: 'manage_avatar_system', label: 'Avatar-System verwalten', description: 'Avatar-Items und Emojis verwalten', category: 'Administration' },
  { key: 'access_system_settings', label: 'System-Einstellungen', description: 'Erweiterte System- und Sicherheitseinstellungen', category: 'Administration' },
  { key: 'manage_workflows', label: 'Workflows verwalten', description: 'Workflow-Automatisierungen erstellen und bearbeiten', category: 'Administration' },
  { key: 'manage_field', label: 'Field-Management', description: 'Field-Einsätze und Außendienst verwalten', category: 'Administration' },
];

/**
 * Helper: Get permission metadata by key
 */
export function getPermissionMetadata(key: PermissionKey): PermissionMetadata | undefined {
  return ALL_PERMISSIONS_METADATA.find(p => p.key === key);
}

/**
 * Helper: Get all permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, PermissionMetadata[]> {
  const grouped: Record<string, PermissionMetadata[]> = {};
  
  ALL_PERMISSIONS_METADATA.forEach(perm => {
    if (!grouped[perm.category]) {
      grouped[perm.category] = [];
    }
    grouped[perm.category].push(perm);
  });
  
  return grouped;
}
