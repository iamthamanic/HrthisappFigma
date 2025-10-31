/**
 * BrowoKoordinator - Shared Authentication Utilities
 * 
 * Provides auth middleware and user verification
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
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
 * Check if user has admin privileges
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  return ['HR', 'ADMIN', 'SUPERADMIN'].includes(user.role);
}

/**
 * Check if user has teamlead privileges
 */
export function isTeamLead(user: AuthUser | null): boolean {
  if (!user?.role) return false;
  return ['TEAMLEAD', 'HR', 'ADMIN', 'SUPERADMIN'].includes(user.role);
}

/**
 * Unauthorized response
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
