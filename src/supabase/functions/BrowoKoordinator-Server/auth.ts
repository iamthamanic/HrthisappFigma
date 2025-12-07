// File: supabase/functions/BrowoKoordinator-Server/auth.ts
import type { SupabaseClient } from "npm:@supabase/supabase-js";
import type { PermissionKeyType } from "./permissions.ts";
import { UnauthorizedError } from "./errors.ts";

export interface AuthContext {
  user: {
    id: string;
    role: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  permissions: Set<string>;
  hasPermission: (key: string) => boolean;
  isAdmin: boolean;
  isTeamLead: boolean;
}

/**
 * AUTHORIZE: Complete authentication and permission loading
 * =========================================================
 * Main function for all routes in this Edge Function.
 * 
 * Usage in routes:
 * ```typescript
 * const auth = c.get("auth");
 * 
 * // Check permission
 * if (auth.hasPermission('manage_employees')) {
 *   // Do something
 * }
 * 
 * // Check admin status
 * if (auth.isAdmin) {
 *   // Admin-only logic
 * }
 * ```
 * 
 * @throws UnauthorizedError if authentication fails
 */
export async function authorize(
  authHeader: string | null,
  supabase: SupabaseClient,
): Promise<AuthContext> {
  // 1) Header prüfen
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }

  const token = authHeader.replace("Bearer ", "").trim();

  // 2) JWT Token verifizieren
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authUser) {
    console.error("Auth error:", authError);
    throw new UnauthorizedError("Invalid or expired token");
  }

  // 3) User-Profil aus DB laden
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, email, role, first_name, last_name")
    .eq("id", authUser.id)
    .single();

  if (profileError || !profile) {
    console.error("Failed to load user profile:", profileError);
    throw new UnauthorizedError("User profile not found");
  }

  // 4) Effektive Permissions aus DB laden
  const { data: permissionsData, error: permissionsError } = await supabase
    .from("effective_user_permissions")
    .select("permission_key")
    .eq("user_id", authUser.id);

  if (permissionsError) {
    console.error("Failed to load user permissions:", permissionsError);
    // Don't throw - fall back to role-based permissions
  }

  // 5) Permission Set erstellen
  const permissions = new Set<string>(
    permissionsData?.map((p) => p.permission_key) || []
  );

  // 6) Admin/TeamLead Status bestimmen
  const role = profile.role || "USER";
  const isAdmin = ["HR", "ADMIN", "SUPERADMIN"].includes(role);
  const isTeamLead = ["TEAMLEAD", "HR", "ADMIN", "SUPERADMIN"].includes(role);

  // 7) AuthContext zurückgeben
  return {
    user: {
      id: profile.id,
      email: profile.email,
      role: role,
      first_name: profile.first_name,
      last_name: profile.last_name,
    },
    permissions,
    hasPermission: (permissionKey: string): boolean => {
      return permissions.has(permissionKey);
    },
    isAdmin,
    isTeamLead,
  };
}
