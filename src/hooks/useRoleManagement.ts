import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { UserRole } from './usePermissions';

export interface RoleChangeResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing user roles
 * Provides functions to assign and change roles with proper authorization
 */
export function useRoleManagement() {
  const [isChangingRole, setIsChangingRole] = useState(false);

  /**
   * Change a user's role
   * @param userId - The ID of the user whose role to change
   * @param newRole - The new role to assign
   * @param currentUserRole - The role of the user making the change
   * @returns Result object with success status
   */
  const changeUserRole = async (
    userId: string,
    newRole: UserRole,
    currentUserRole: UserRole | undefined
  ): Promise<RoleChangeResult> => {
    // Authorization check - only SUPERADMIN can change roles
    if (currentUserRole !== 'SUPERADMIN') {
      const errorMsg = 'Nur Super-Administratoren können Rollen zuweisen';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsChangingRole(true);

    try {
      // Update user role in database
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Rolle erfolgreich zu ${getRoleDisplayName(newRole)} geändert`);
      return { success: true };
    } catch (error: any) {
      console.error('Error changing role:', error);
      const errorMsg = error.message || 'Fehler beim Ändern der Rolle';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsChangingRole(false);
    }
  };

  /**
   * Bulk role assignment
   * @param userIds - Array of user IDs
   * @param newRole - The new role to assign to all users
   * @param currentUserRole - The role of the user making the change
   */
  const bulkChangeRoles = async (
    userIds: string[],
    newRole: UserRole,
    currentUserRole: UserRole | undefined
  ): Promise<RoleChangeResult> => {
    if (currentUserRole !== 'SUPERADMIN') {
      const errorMsg = 'Nur Super-Administratoren können Rollen zuweisen';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    setIsChangingRole(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .in('id', userIds);

      if (error) throw error;

      toast.success(`${userIds.length} Rollen erfolgreich geändert`);
      return { success: true };
    } catch (error: any) {
      console.error('Error bulk changing roles:', error);
      const errorMsg = error.message || 'Fehler beim Massenändern der Rollen';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsChangingRole(false);
    }
  };

  /**
   * Check if current user can assign a specific role
   * @param currentUserRole - The role of the current user
   * @param targetRole - The role they want to assign
   */
  const canAssignRole = (
    currentUserRole: UserRole | undefined,
    targetRole: UserRole
  ): boolean => {
    // Only SUPERADMIN can assign roles
    if (currentUserRole !== 'SUPERADMIN') {
      return false;
    }

    // SUPERADMIN can assign any role
    return true;
  };

  /**
   * Get available roles that the current user can assign
   * @param currentUserRole - The role of the current user
   */
  const getAvailableRoles = (currentUserRole: UserRole | undefined): UserRole[] => {
    if (currentUserRole === 'SUPERADMIN') {
      return ['USER', 'EMPLOYEE', 'HR', 'TEAMLEAD', 'ADMIN', 'SUPERADMIN', 'EXTERN'];
    }

    // Non-superadmins cannot assign any roles
    return [];
  };

  /**
   * Get role display name in German
   */
  const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
      case 'SUPERADMIN':
        return 'Super Administrator';
      case 'ADMIN':
        return 'Administrator';
      case 'HR':
        return 'HR';
      case 'TEAMLEAD':
        return 'Team Lead';
      case 'USER':
      case 'EMPLOYEE':
        return 'Mitarbeiter';
      case 'EXTERN':
        return 'Extern';
      default:
        return role;
    }
  };

  /**
   * Get role description
   */
  const getRoleDescription = (role: UserRole): string => {
    switch (role) {
      case 'SUPERADMIN':
        return 'Vollzugriff auf alle Funktionen, kann Rollen zuweisen';
      case 'ADMIN':
        return 'Erweiterte Berechtigungen für Team und Mitarbeiterverwaltung';
      case 'HR':
        return 'Personalabteilung - Vollzugriff auf Team- und Personalverwaltung';
      case 'TEAMLEAD':
        return 'Teamleitung - Vollzugriff auf Team- und Personalverwaltung';
      case 'EMPLOYEE':
        return 'Standard-Berechtigungen für Mitarbeiter';
      default:
        return '';
    }
  };

  /**
   * Get role color for UI
   */
  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'SUPERADMIN':
        return 'purple';
      case 'ADMIN':
        return 'blue';
      case 'HR':
        return 'green';
      case 'TEAMLEAD':
        return 'orange';
      case 'EMPLOYEE':
        return 'gray';
      default:
        return 'gray';
    }
  };

  return {
    changeUserRole,
    bulkChangeRoles,
    canAssignRole,
    getAvailableRoles,
    getRoleDisplayName,
    getRoleDescription,
    getRoleColor,
    isChangingRole,
  };
}
