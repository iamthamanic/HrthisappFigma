/**
 * BrowoKoordinator - Shared Authentication Utilities
 * 
 * Provides auth middleware and user verification with permission checking
 */

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { UnauthorizedError, ForbiddenError } from './errors.ts';
import type { UserRole, PermissionKeyType } from './permissions.ts';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Enhanced auth context with permission checking
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    role: UserRole;
    first_name?: string;
    last_name?: string;
  };
  permissions: Set<string>;
  hasPermission: (permissionKey: string) => boolean;
  requirePermission: (permissionKey: string, errorMessage?: string) => void;
  isAdmin: boolean;
  isTeamLead: boolean;
}

/**
 * Verify JWT token and return user
 */
export async function verifyAuth(authHeader: string | null): Promise<AuthUser | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role,
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

/**
 * AUTHORIZE: Complete authentication and permission loading
 * =========================================================
 * This is the main function to use in all Edge Functions.
 * 
 * It:
 * 1. Verifies the JWT token
 * 2. Loads the user profile from the database
 * 3. Loads the effective permissions (role defaults + user overrides)
 * 4. Returns an AuthContext with permission checking helpers
 * 
 * Usage:
 * ```typescript
 * const auth = await authorize(req.headers.get('Authorization'), supabase);
 * 
 * // Check permission
 * if (auth.hasPermission('manage_employees')) {
 *   // Do something
 * }
 * 
 * // Require permission (throws ForbiddenError if not granted)
 * auth.requirePermission('manage_employees');
 * ```
 * 
 * @throws UnauthorizedError if authentication fails
 */
export async function authorize(
  authHeader: string | null,
  supabase: SupabaseClient
): Promise<AuthContext> {
  // 1. Verify JWT token
  const authUser = await verifyAuth(authHeader);
  if (!authUser) {
    throw new UnauthorizedError('Authentication required - invalid or missing token');
  }

  // 2. Load user profile from database
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, role, first_name, last_name')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    console.error('Failed to load user profile:', profileError);
    throw new UnauthorizedError('User profile not found');
  }

  // 3. Load effective permissions from database
  const { data: permissionsData, error: permissionsError } = await supabase
    .from('effective_user_permissions')
    .select('permission_key')
    .eq('user_id', authUser.id);

  if (permissionsError) {
    console.error('Failed to load user permissions:', permissionsError);
    // Don't throw - fall back to role-based permissions
  }

  // Create permission set
  const permissions = new Set<string>(
    permissionsData?.map(p => p.permission_key) || []
  );

  // 4. Build AuthContext
  const isAdmin = ['HR', 'ADMIN', 'SUPERADMIN'].includes(profile.role);
  const isTeamLead = ['TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN'].includes(profile.role);

  return {
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      first_name: profile.first_name,
      last_name: profile.last_name,
    },
    permissions,
    hasPermission: (permissionKey: string): boolean => {
      return permissions.has(permissionKey);
    },
    requirePermission: (permissionKey: string, errorMessage?: string): void => {
      if (!permissions.has(permissionKey)) {
        throw new ForbiddenError(
          errorMessage || `Missing required permission: ${permissionKey}`,
          { 
            required_permission: permissionKey,
            user_id: profile.id,
            user_role: profile.role 
          }
        );
      }
    },
    isAdmin,
    isTeamLead,
  };
}

/**
 * AUTHORIZE OPTIONAL: Same as authorize() but returns null instead of throwing
 * =============================================================================
 * Use this when authentication is optional (e.g., public endpoints with different
 * behavior for authenticated users)
 * 
 * @returns AuthContext if authenticated, null if not
 */
export async function authorizeOptional(
  authHeader: string | null,
  supabase: SupabaseClient
): Promise<AuthContext | null> {
  try {
    return await authorize(authHeader, supabase);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return null;
    }
    throw error; // Re-throw other errors
  }
}

/**
 * Check if user has admin privileges
 * @deprecated Use auth.isAdmin from authorize() instead
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  return ['HR', 'ADMIN', 'SUPERADMIN'].includes(user.role);
}

/**
 * Check if user has teamlead privileges
 * @deprecated Use auth.isTeamLead from authorize() instead
 */
export function isTeamLead(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  return ['TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN'].includes(user.role);
}

/**
 * Unauthorized response
 * @deprecated Use UnauthorizedError from errors.ts instead
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}