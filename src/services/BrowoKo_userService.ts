/**
 * USER SERVICE
 * ============
 * Handles all user management operations
 * 
 * Replaces direct Supabase calls in stores for:
 * - Getting user profiles
 * - Updating user information
 * - User search and filtering
 * - User roles and permissions
 */

import { ApiService } from './base/ApiService';
import { NotFoundError, ValidationError } from './base/ApiError';
import type { User } from '../types/database';
import sanitize from '../utils/security/BrowoKo_sanitization';

export interface UserFilters {
  role?: 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN';
  department_id?: string;
  location_id?: string;
  organization_id?: string;
  search?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN';
  position?: string;
  department_id?: string;
  location_id?: string;
  avatar_body?: string;
  avatar_eyes?: string;
  avatar_mouth?: string;
  avatar_bg_color?: string;
  level?: number;
  xp?: number;
  coins?: number;
}

/**
 * USER SERVICE
 * ============
 * Manages user profiles, roles, and permissions
 */
export class UserService extends ApiService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    this.logRequest('getUserById', 'UserService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'UserService.getUserById',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new NotFoundError('Benutzer', 'UserService.getUserById', error);
      }

      if (!user) {
        throw new NotFoundError('Benutzer', 'UserService.getUserById');
      }

      this.logResponse('UserService.getUserById', { email: user.email });
      return user as User;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'UserService.getUserById');
    }
  }

  /**
   * Get all users with optional filters
   */
  async getAllUsers(filters?: UserFilters): Promise<User[]> {
    this.logRequest('getAllUsers', 'UserService', { filters });

    try {
      let query = this.supabase.from('users').select('*');

      // Apply filters
      if (filters) {
        if (filters.role) {
          query = query.eq('role', filters.role);
        }
        if (filters.department_id) {
          query = query.eq('department_id', filters.department_id);
        }
        if (filters.location_id) {
          query = query.eq('location_id', filters.location_id);
        }
        if (filters.organization_id) {
          query = query.eq('organization_id', filters.organization_id);
        }
        if (filters.search) {
          // Search in first_name, last_name, and email
          query = query.or(
            `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
          );
        }
      }

      // Order by name
      query = query.order('first_name', { ascending: true });

      const { data: users, error } = await query;

      if (error) {
        this.handleError(error, 'UserService.getAllUsers');
      }

      this.logResponse('UserService.getAllUsers', { count: users?.length || 0 });
      return (users || []) as User[];
    } catch (error: any) {
      this.handleError(error, 'UserService.getAllUsers');
    }
  }

  /**
   * Get users by organization
   */
  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    this.logRequest('getUsersByOrganization', 'UserService', { organizationId });

    if (!organizationId) {
      throw new ValidationError(
        'Organization ID ist erforderlich',
        'UserService.getUsersByOrganization',
        { organizationId: 'Organization ID ist erforderlich' }
      );
    }

    return await this.getAllUsers({ organization_id: organizationId });
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN'): Promise<User[]> {
    this.logRequest('getUsersByRole', 'UserService', { role });

    if (!role) {
      throw new ValidationError(
        'Role ist erforderlich',
        'UserService.getUsersByRole',
        { role: 'Role ist erforderlich' }
      );
    }

    return await this.getAllUsers({ role });
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: UpdateUserData): Promise<User> {
    this.logRequest('updateUser', 'UserService', { userId, updates });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'UserService.updateUser',
        { userId: 'User ID ist erforderlich' }
      );
    }

    // ✅ SANITIZE TEXT FIELDS (Phase 4 - Priority 2)
    const sanitizedUpdates: UpdateUserData = { ...updates };
    
    if (sanitizedUpdates.first_name) {
      sanitizedUpdates.first_name = sanitize.text(sanitizedUpdates.first_name);
    }
    
    if (sanitizedUpdates.last_name) {
      sanitizedUpdates.last_name = sanitize.text(sanitizedUpdates.last_name);
    }
    
    if (sanitizedUpdates.email) {
      const sanitizedEmail = sanitize.email(sanitizedUpdates.email);
      if (!sanitizedEmail) {
        throw new ValidationError(
          'Ungültige E-Mail-Adresse',
          'UserService.updateUser',
          { email: 'Ungültige E-Mail-Adresse' }
        );
      }
      sanitizedUpdates.email = sanitizedEmail;
    }
    
    if (sanitizedUpdates.position) {
      sanitizedUpdates.position = sanitize.text(sanitizedUpdates.position);
    }

    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .update(sanitizedUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        this.handleError(error, 'UserService.updateUser');
      }

      if (!user) {
        throw new NotFoundError('Benutzer', 'UserService.updateUser');
      }

      this.logResponse('UserService.updateUser', { email: user.email });
      return user as User;
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'UserService.updateUser');
    }
  }

  /**
   * Update user avatar
   */
  async updateAvatar(
    userId: string,
    avatar: {
      body?: string;
      eyes?: string;
      mouth?: string;
      bg_color?: string;
    }
  ): Promise<User> {
    this.logRequest('updateAvatar', 'UserService', { userId });

    return await this.updateUser(userId, {
      avatar_body: avatar.body,
      avatar_eyes: avatar.eyes,
      avatar_mouth: avatar.mouth,
      avatar_bg_color: avatar.bg_color,
    });
  }

  /**
   * Update user XP and level
   */
  async updateXP(userId: string, xp: number, level: number): Promise<User> {
    this.logRequest('updateXP', 'UserService', { userId, xp, level });

    return await this.updateUser(userId, { xp, level });
  }

  /**
   * Update user coins
   */
  async updateCoins(userId: string, coins: number): Promise<User> {
    this.logRequest('updateCoins', 'UserService', { userId, coins });

    return await this.updateUser(userId, { coins });
  }

  /**
   * Award coins to user
   */
  async awardCoins(userId: string, amount: number): Promise<User> {
    this.logRequest('awardCoins', 'UserService', { userId, amount });

    if (!userId || amount === undefined) {
      throw new ValidationError(
        'User ID und Amount sind erforderlich',
        'UserService.awardCoins',
        {
          userId: !userId ? 'User ID ist erforderlich' : '',
          amount: amount === undefined ? 'Amount ist erforderlich' : '',
        }
      );
    }

    try {
      // Get current coins
      const user = await this.getUserById(userId);
      const newCoins = (user.coins || 0) + amount;

      // Update coins
      return await this.updateCoins(userId, newCoins);
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, 'UserService.awardCoins');
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<User[]> {
    this.logRequest('searchUsers', 'UserService', { query });

    // ✅ SANITIZE SEARCH QUERY (Phase 4 - Priority 2)
    const sanitizedQuery = sanitize.searchQuery(query);

    if (!sanitizedQuery || sanitizedQuery.length < 2) {
      throw new ValidationError(
        'Suchbegriff muss mindestens 2 Zeichen lang sein',
        'UserService.searchUsers',
        { query: 'Suchbegriff zu kurz' }
      );
    }

    return await this.getAllUsers({ search: sanitizedQuery });
  }

  /**
   * Delete user (soft delete by setting deleted_at)
   */
  async deleteUser(userId: string): Promise<void> {
    this.logRequest('deleteUser', 'UserService', { userId });

    if (!userId) {
      throw new ValidationError(
        'User ID ist erforderlich',
        'UserService.deleteUser',
        { userId: 'User ID ist erforderlich' }
      );
    }

    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        this.handleError(error, 'UserService.deleteUser');
      }

      this.logResponse('UserService.deleteUser', 'Erfolg');
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, 'UserService.deleteUser');
    }
  }

  /**
   * Check if user has role
   */
  async hasRole(
    userId: string,
    role: 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN'
  ): Promise<boolean> {
    this.logRequest('hasRole', 'UserService', { userId, role });

    try {
      const user = await this.getUserById(userId);
      return user.role === role;
    } catch (error: any) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  /**
   * Check if user is admin (ADMIN, HR, or SUPERADMIN)
   */
  async isAdmin(userId: string): Promise<boolean> {
    this.logRequest('isAdmin', 'UserService', { userId });

    try {
      const user = await this.getUserById(userId);
      return (
        user.role === 'ADMIN' ||
        user.role === 'HR' ||
        user.role === 'SUPERADMIN'
      );
    } catch (error: any) {
      console.error('Error checking if user is admin:', error);
      return false;
    }
  }

  /**
   * Get user stats (for dashboard)
   */
  async getUserStats(userId: string): Promise<{
    xp: number;
    level: number;
    coins: number;
    avatar: {
      body: string;
      eyes: string;
      mouth: string;
      bg_color: string;
    };
  }> {
    this.logRequest('getUserStats', 'UserService', { userId });

    try {
      const user = await this.getUserById(userId);

      return {
        xp: user.xp || 0,
        level: user.level || 1,
        coins: user.coins || 0,
        avatar: {
          body: user.avatar_body || 'body1',
          eyes: user.avatar_eyes || 'eyes1',
          mouth: user.avatar_mouth || 'mouth1',
          bg_color: user.avatar_bg_color || '#3b82f6',
        },
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, 'UserService.getUserStats');
    }
  }
}
