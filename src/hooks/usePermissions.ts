import { useMemo } from 'react';

export type UserRole = 'USER' | 'EMPLOYEE' | 'HR' | 'TEAMLEAD' | 'ADMIN' | 'SUPERADMIN' | 'EXTERN';

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
 * Hook to check and manage permissions based on user role
 * Can be used throughout the app for authorization checks
 */
export function usePermissions(role: UserRole | undefined) {
  const normalizedRole = (role || 'USER') as UserRole;
  
  // EXTERN role has very limited permissions
  const isExtern = normalizedRole === 'EXTERN';
  const isAdmin = normalizedRole === 'HR' || normalizedRole === 'TEAMLEAD' || normalizedRole === 'ADMIN' || normalizedRole === 'SUPERADMIN';

  // Permission checks
  const can = useMemo(() => ({
    // Dashboard & Profile
    viewDashboard: true, // Everyone can see dashboard
    editOwnProfile: !isExtern, // EXTERN cannot edit profile
    uploadProfilePicture: !isExtern,
    customizeAvatar: !isExtern,

    // Leave
    submitLeaveRequest: !isExtern,
    approveLeaveRequests: isAdmin,

    // Learning
    viewCourses: !isExtern, // EXTERN cannot access learning
    takeCourses: !isExtern,
    takeQuizzes: !isExtern,
    useLearningShop: !isExtern,
    createCourses: isAdmin,
    editCourses: isAdmin,
    deleteCourses: isAdmin,

    // Gamification
    earnXP: !isExtern, // EXTERN cannot earn XP
    earnCoins: !isExtern,
    unlockAchievements: !isExtern,
    levelUp: !isExtern,

    // Benefits & Documents
    viewBenefits: !isExtern, // EXTERN cannot access benefits
    requestBenefits: !isExtern,
    uploadDocuments: true, // EXTERN CAN upload documents
    viewOwnDocuments: true, // EXTERN CAN view documents
    manageBenefits: isAdmin,

    // Team Management
    viewTeamMembers: !isExtern,
    viewOrganigram: !isExtern,
    addEmployees: isAdmin,
    editEmployees: isAdmin,
    deactivateEmployees: isAdmin,
    assignRoles: normalizedRole === 'SUPERADMIN',
    deleteEmployees: normalizedRole === 'SUPERADMIN',
    
    // ✅ UPDATED: Granular Role Creation Permissions (2025-01-14 - v4.0.6)
    createUser: normalizedRole === 'HR' || normalizedRole === 'ADMIN' || normalizedRole === 'SUPERADMIN',
    createAdmin: normalizedRole === 'HR' || normalizedRole === 'SUPERADMIN',
    createHR: normalizedRole === 'SUPERADMIN',
    createSuperadmin: normalizedRole === 'SUPERADMIN',
    createExtern: normalizedRole === 'HR' || normalizedRole === 'ADMIN' || normalizedRole === 'SUPERADMIN',

    // Administration
    accessAdminArea: isAdmin,
    editCompanySettings: isAdmin,
    manageLocations: isAdmin,
    manageDashboardInfo: isAdmin,
    manageAvatarSystem: isAdmin,
    accessSystemSettings: normalizedRole === 'SUPERADMIN',
  }), [normalizedRole, isExtern, isAdmin]);

  // Get all permissions with details
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
      case 'EMPLOYEE':
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
    getAllPermissions,
    roleInfo: getRoleInfo,
  };
}
