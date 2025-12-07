// File: supabase/functions/BrowoKoordinator-Server/permissions.ts
/**
 * BrowoKoordinator - Permission Keys
 * ===================================
 * Central definition of all permission keys used across the system.
 * These must match the keys in /config/permissions.ts (frontend)
 * and the permissions table in the database.
 */

export type UserRole = 'USER' | 'TEAMLEAD' | 'HR' | 'ADMIN' | 'SUPERADMIN' | 'EXTERN';

/**
 * All available permission keys
 * These match the 'key' column in the permissions table
 */
export const PermissionKey = {
  // Dashboard & Profile
  VIEW_DASHBOARD: 'view_dashboard',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  UPLOAD_PROFILE_PICTURE: 'upload_profile_picture',
  CUSTOMIZE_AVATAR: 'customize_avatar',

  // Time & Leave
  TRACK_TIME: 'track_time',
  SUBMIT_LEAVE_REQUEST: 'submit_leave_request',
  APPROVE_LEAVE_REQUESTS: 'approve_leave_requests',
  VIEW_ALL_TIME_ACCOUNTS: 'view_all_time_accounts',

  // Learning
  VIEW_COURSES: 'view_courses',
  TAKE_COURSES: 'take_courses',
  TAKE_QUIZZES: 'take_quizzes',
  USE_LEARNING_SHOP: 'use_learning_shop',
  CREATE_COURSES: 'create_courses',
  EDIT_COURSES: 'edit_courses',
  DELETE_COURSES: 'delete_courses',

  // Gamification
  EARN_XP: 'earn_xp',
  EARN_COINS: 'earn_coins',
  UNLOCK_ACHIEVEMENTS: 'unlock_achievements',
  LEVEL_UP: 'level_up',

  // Benefits & Documents
  VIEW_BENEFITS: 'view_benefits',
  REQUEST_BENEFITS: 'request_benefits',
  UPLOAD_DOCUMENTS: 'upload_documents',
  VIEW_OWN_DOCUMENTS: 'view_own_documents',
  MANAGE_BENEFITS: 'manage_benefits',

  // Team & Organization
  VIEW_TEAM_MEMBERS: 'view_team_members',
  VIEW_ORGANIGRAM: 'view_organigram',
  ADD_EMPLOYEES: 'add_employees',
  EDIT_EMPLOYEES: 'edit_employees',
  DEACTIVATE_EMPLOYEES: 'deactivate_employees',
  DELETE_EMPLOYEES: 'delete_employees',
  ASSIGN_ROLES: 'assign_roles',
  CREATE_USER: 'create_user',
  CREATE_ADMIN: 'create_admin',
  CREATE_HR: 'create_hr',
  CREATE_SUPERADMIN: 'create_superadmin',
  CREATE_EXTERN: 'create_extern',
  MANAGE_TEAMS: 'manage_teams',
  MANAGE_EMPLOYEES: 'manage_employees',

  // Administration
  ACCESS_ADMIN_AREA: 'access_admin_area',
  EDIT_COMPANY_SETTINGS: 'edit_company_settings',
  MANAGE_LOCATIONS: 'manage_locations',
  MANAGE_DASHBOARD_INFO: 'manage_dashboard_info',
  MANAGE_AVATAR_SYSTEM: 'manage_avatar_system',
  ACCESS_SYSTEM_SETTINGS: 'access_system_settings',
  MANAGE_WORKFLOWS: 'manage_workflows',
  MANAGE_FIELD: 'manage_field',
} as const;

export type PermissionKeyType = typeof PermissionKey[keyof typeof PermissionKey];

/**
 * Helper: Check if a role has admin-level privileges
 */
export function isAdminRole(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['HR', 'ADMIN', 'SUPERADMIN'].includes(role);
}

/**
 * Helper: Check if a role has team lead privileges
 */
export function isTeamLeadRole(role: UserRole | undefined): boolean {
  if (!role) return false;
  return ['TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN'].includes(role);
}
