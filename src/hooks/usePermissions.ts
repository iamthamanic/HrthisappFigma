/**
 * USE PERMISSIONS HOOK V2
 * =======================
 * Enhanced permission system with database-backed permissions
 * 
 * Features:
 * - Role-based default permissions (from ROLE_PERMISSION_MATRIX)
 * - Individual GRANT/REVOKE overrides (from effective_user_permissions)
 * - Backward compatible with old 'can' object API
 * - Automatic fallback to role-based permissions if DB permissions unavailable
 * 
 * Usage:
 * ```typescript
 * const { can, hasPermission } = usePermissions(profile?.role);
 * 
 * if (can.createUser) {
 *   // Show create user button
 * }
 * 
 * if (hasPermission('manage_employees')) {
 *   // Show employee management
 * }
 * ```
 */

import { useMemo } from 'react';
import { useAuthStore } from '../stores/BrowoKo_authStore';
import { 
  ROLE_PERMISSION_MATRIX, 
  PERMISSION_TO_CAN_MAP,
  type UserRole,
  type PermissionKey 
} from '../config/permissions';

export type { UserRole, PermissionKey };

export interface Permission {
  name: string;
  description: string;
  allowed: boolean;
}

export interface PermissionCategory {
  category: string;
  permissions: Permission[];
}

/**
 * Permission Can Object
 * This maintains backward compatibility with the old usePermissions API
 */
export interface PermissionCan {
  // Dashboard & Profile
  viewDashboard: boolean;
  editOwnProfile: boolean;
  uploadProfilePicture: boolean;
  customizeAvatar: boolean;
  
  // Time & Leave
  trackTime: boolean;
  submitLeaveRequest: boolean;
  approveLeaveRequests: boolean;
  
  // Learning
  viewCourses: boolean;
  takeCourses: boolean;
  takeQuizzes: boolean;
  useLearningShop: boolean;
  createCourses: boolean;
  editCourses: boolean;
  deleteCourses: boolean;
  
  // Gamification
  earnXP: boolean;
  earnCoins: boolean;
  unlockAchievements: boolean;
  levelUp: boolean;
  
  // Benefits & Documents
  viewBenefits: boolean;
  requestBenefits: boolean;
  uploadDocuments: boolean;
  viewOwnDocuments: boolean;
  manageBenefits: boolean;
  
  // Team & Organization
  viewTeamMembers: boolean;
  viewOrganigram: boolean;
  addEmployees: boolean;
  editEmployees: boolean;
  deactivateEmployees: boolean;
  deleteEmployees: boolean;
  assignRoles: boolean;
  createUser: boolean;
  createAdmin: boolean;
  createHR: boolean;
  createSuperadmin: boolean;
  createExtern: boolean;
  
  // Administration
  accessAdminArea: boolean;
  editCompanySettings: boolean;
  manageLocations: boolean;
  manageDashboardInfo: boolean;
  manageAvatarSystem: boolean;
  accessSystemSettings: boolean;
}

/**
 * Hook to check and manage permissions based on user role and DB overrides
 */
export function usePermissions(role: UserRole | undefined) {
  const normalizedRole = (role || 'USER') as UserRole;
  
  // Get effective permissions from store (loaded from backend)
  const { effectivePermissions } = useAuthStore();
  
  // Determine which permission source to use
  const useDbPermissions = effectivePermissions && effectivePermissions.length > 0;
  
  // Get permissions based on source
  const effectiveKeys: PermissionKey[] = useMemo(() => {
    if (useDbPermissions) {
      // Use DB permissions (includes role defaults + user overrides)
      return effectivePermissions as PermissionKey[];
    } else {
      // Fallback to role-based permissions from matrix
      return ROLE_PERMISSION_MATRIX[normalizedRole] ?? [];
    }
  }, [normalizedRole, effectivePermissions, useDbPermissions]);
  
  // Helper function to check if a permission is granted
  const hasPermission = (permissionKey: PermissionKey): boolean => {
    return effectiveKeys.includes(permissionKey);
  };
  
  // Build 'can' object for backward compatibility
  const can: PermissionCan = useMemo(() => ({
    // Dashboard & Profile
    viewDashboard: hasPermission('view_dashboard'),
    editOwnProfile: hasPermission('edit_own_profile'),
    uploadProfilePicture: hasPermission('upload_profile_picture'),
    customizeAvatar: hasPermission('customize_avatar'),
    
    // Time & Leave
    trackTime: hasPermission('track_time'),
    submitLeaveRequest: hasPermission('submit_leave_request'),
    approveLeaveRequests: hasPermission('approve_leave_requests'),
    
    // Learning
    viewCourses: hasPermission('view_courses'),
    takeCourses: hasPermission('take_courses'),
    takeQuizzes: hasPermission('take_quizzes'),
    useLearningShop: hasPermission('use_learning_shop'),
    createCourses: hasPermission('create_courses'),
    editCourses: hasPermission('edit_courses'),
    deleteCourses: hasPermission('delete_courses'),
    
    // Gamification
    earnXP: hasPermission('earn_xp'),
    earnCoins: hasPermission('earn_coins'),
    unlockAchievements: hasPermission('unlock_achievements'),
    levelUp: hasPermission('level_up'),
    
    // Benefits & Documents
    viewBenefits: hasPermission('view_benefits'),
    requestBenefits: hasPermission('request_benefits'),
    uploadDocuments: hasPermission('upload_documents'),
    viewOwnDocuments: hasPermission('view_own_documents'),
    manageBenefits: hasPermission('manage_benefits'),
    
    // Team & Organization
    viewTeamMembers: hasPermission('view_team_members'),
    viewOrganigram: hasPermission('view_organigram'),
    addEmployees: hasPermission('add_employees'),
    editEmployees: hasPermission('edit_employees'),
    deactivateEmployees: hasPermission('deactivate_employees'),
    deleteEmployees: hasPermission('delete_employees'),
    assignRoles: hasPermission('assign_roles'),
    createUser: hasPermission('create_user'),
    createAdmin: hasPermission('create_admin'),
    createHR: hasPermission('create_hr'),
    createSuperadmin: hasPermission('create_superadmin'),
    createExtern: hasPermission('create_extern'),
    
    // Administration
    accessAdminArea: hasPermission('access_admin_area'),
    editCompanySettings: hasPermission('edit_company_settings'),
    manageLocations: hasPermission('manage_locations'),
    manageDashboardInfo: hasPermission('manage_dashboard_info'),
    manageAvatarSystem: hasPermission('manage_avatar_system'),
    accessSystemSettings: hasPermission('access_system_settings'),
  }), [effectiveKeys]); // Re-compute when permissions change
  
  // Get all permissions with details (for UI display)
  const getAllPermissions = useMemo((): PermissionCategory[] => {
    return [
      {
        category: 'Dashboard & Profil',
        permissions: [
          {
            name: 'Dashboard anzeigen',
            description: 'Zugriff auf das persönliche Dashboard',
            allowed: can.viewDashboard,
          },
          {
            name: 'Eigenes Profil bearbeiten',
            description: 'Persönliche Daten und Einstellungen ändern',
            allowed: can.editOwnProfile,
          },
          {
            name: 'Profilbild hochladen',
            description: 'Eigenes Profilbild hochladen und ändern',
            allowed: can.uploadProfilePicture,
          },
          {
            name: 'Avatar anpassen',
            description: 'Emoji-Avatar auswählen und personalisieren',
            allowed: can.customizeAvatar,
          },
        ],
      },
      {
        category: 'Zeit & Urlaub',
        permissions: [
          {
            name: 'Zeit erfassen',
            description: 'Check-in/Check-out und Pausen erfassen',
            allowed: can.trackTime,
          },
          {
            name: 'Urlaubsanträge stellen',
            description: 'Neue Urlaubsanträge erstellen',
            allowed: can.submitLeaveRequest,
          },
          {
            name: 'Urlaubsanträge anderer genehmigen',
            description: 'Urlaubsanträge von Kollegen genehmigen/ablehnen',
            allowed: can.approveLeaveRequests,
          },
        ],
      },
      {
        category: 'Learning Center',
        permissions: [
          {
            name: 'Kurse ansehen',
            description: 'Zugriff auf verfügbare Lernvideos und Kurse',
            allowed: can.viewCourses,
          },
          {
            name: 'Quizzes absolvieren',
            description: 'An Quizzes teilnehmen und XP/Coins verdienen',
            allowed: can.takeQuizzes,
          },
          {
            name: 'Learning Shop nutzen',
            description: 'Inhalte mit Coins freischalten',
            allowed: can.useLearningShop,
          },
          {
            name: 'Kurse erstellen/bearbeiten',
            description: 'Neue Lernvideos und Quizzes erstellen',
            allowed: can.createCourses,
          },
          {
            name: 'Kurse löschen',
            description: 'Lernvideos und Quizzes entfernen',
            allowed: can.deleteCourses,
          },
        ],
      },
      {
        category: 'Gamification',
        permissions: [
          {
            name: 'XP sammeln',
            description: 'Erfahrungspunkte durch Aktivitäten sammeln',
            allowed: can.earnXP,
          },
          {
            name: 'Coins verdienen',
            description: 'Coins durch Kurse und Aktivitäten verdienen',
            allowed: can.earnCoins,
          },
          {
            name: 'Achievements freischalten',
            description: 'Erfolge und Badges sammeln',
            allowed: can.unlockAchievements,
          },
          {
            name: 'Level aufsteigen',
            description: 'Durch XP in Levels aufsteigen (1-100)',
            allowed: can.levelUp,
          },
        ],
      },
      {
        category: 'Benefits & Dokumente',
        permissions: [
          {
            name: 'Benefits einsehen',
            description: 'Verfügbare Unternehmens-Benefits anzeigen',
            allowed: can.viewBenefits,
          },
          {
            name: 'Benefit-Anfragen stellen',
            description: 'Benefits beantragen',
            allowed: can.requestBenefits,
          },
          {
            name: 'Dokumente hochladen',
            description: 'Eigene Dokumente hochladen und verwalten',
            allowed: can.uploadDocuments,
          },
          {
            name: 'Dokumente einsehen',
            description: 'Zugriff auf eigene und geteilte Dokumente',
            allowed: can.viewOwnDocuments,
          },
          {
            name: 'Benefits verwalten',
            description: 'Benefits erstellen, bearbeiten und löschen',
            allowed: can.manageBenefits,
          },
        ],
      },
      {
        category: 'Team & Organisation',
        permissions: [
          {
            name: 'Team-Mitglieder anzeigen',
            description: 'Liste aller Kollegen im Team sehen',
            allowed: can.viewTeamMembers,
          },
          {
            name: 'Organigram anzeigen',
            description: 'Organisationsstruktur einsehen',
            allowed: can.viewOrganigram,
          },
          {
            name: 'Mitarbeiter hinzufügen',
            description: 'Neue Mitarbeiter anlegen',
            allowed: can.addEmployees,
          },
          {
            name: 'Mitarbeiter bearbeiten',
            description: 'Mitarbeiterdaten ändern',
            allowed: can.editEmployees,
          },
          {
            name: 'Mitarbeiter deaktivieren',
            description: 'Mitarbeiter-Accounts deaktivieren',
            allowed: can.deactivateEmployees,
          },
          {
            name: 'Rollen zuweisen',
            description: 'Berechtigungen von bestehenden Mitarbeitern ändern',
            allowed: can.assignRoles,
          },
          {
            name: 'Mitarbeiter (USER) erstellen',
            description: 'Neue Mitarbeiter mit Standard-Berechtigungen anlegen',
            allowed: can.createUser,
          },
          {
            name: 'Administratoren (ADMIN) erstellen',
            description: 'Neue Administratoren mit erweiterten Berechtigungen anlegen',
            allowed: can.createAdmin,
          },
          {
            name: 'HR-Mitarbeiter erstellen',
            description: 'Neue HR-Mitarbeiter anlegen',
            allowed: can.createHR,
          },
          {
            name: 'Super Admins erstellen',
            description: 'Neue Super Administratoren mit Vollzugriff anlegen',
            allowed: can.createSuperadmin,
          },
        ],
      },
      {
        category: 'Administration',
        permissions: [
          {
            name: 'Admin-Bereich zugreifen',
            description: 'Zugriff auf den Admin-Bereich',
            allowed: can.accessAdminArea,
          },
          {
            name: 'Firmeneinstellungen ändern',
            description: 'Company Logo, Name, etc. bearbeiten',
            allowed: can.editCompanySettings,
          },
          {
            name: 'Standorte verwalten',
            description: 'Standorte/Locations erstellen und bearbeiten',
            allowed: can.manageLocations,
          },
          {
            name: 'Dashboard-Infos verwalten',
            description: 'Dashboard-Karten und Statistiken konfigurieren',
            allowed: can.manageDashboardInfo,
          },
          {
            name: 'Avatar-System verwalten',
            description: 'Avatar-Items und Emojis verwalten',
            allowed: can.manageAvatarSystem,
          },
          {
            name: 'System-Einstellungen',
            description: 'Erweiterte System- und Sicherheitseinstellungen',
            allowed: can.accessSystemSettings,
          },
        ],
      },
    ];
  }, [can]);
  
  // Get role info
  const getRoleInfo = useMemo(() => {
    switch (normalizedRole) {
      case 'SUPERADMIN':
        return {
          name: 'Super Administrator',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          description: 'Vollzugriff auf alle Funktionen und Einstellungen',
        };
      case 'ADMIN':
        return {
          name: 'Administrator',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          description: 'Erweiterte Berechtigungen für Team und Mitarbeiterverwaltung',
        };
      case 'HR':
        return {
          name: 'HR',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          description: 'Personalabteilung - Vollzugriff auf Team- und Personalverwaltung',
        };
      case 'TEAMLEAD':
        return {
          name: 'Team Lead',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          description: 'Teamleitung - Vollzugriff auf Team- und Personalverwaltung',
        };
      case 'EXTERN':
        return {
          name: 'Extern',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          description: 'Externer Mitarbeiter - Eingeschränkter Zugriff',
        };
      case 'USER':
      default:
        return {
          name: 'Mitarbeiter',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          description: 'Standard-Berechtigungen für Mitarbeiter',
        };
    }
  }, [normalizedRole]);
  
  return {
    role: normalizedRole,
    can,
    hasPermission,
    effectiveKeys,
    useDbPermissions,
    getAllPermissions,
    roleInfo: getRoleInfo,
  };
}
