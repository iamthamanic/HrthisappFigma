// File: supabase/functions/BrowoKoordinator-Server/routes-permissions.ts
/**
 * PERMISSION ROUTES
 * =================
 * API endpoints for managing and querying permissions
 *
 * Endpoints:
 * - GET  /api/me/permissions            → effektive Permissions des eingeloggten Users
 * - GET  /api/users/:userId/permissions → Detail-View für einen User (nur Admin)
 * - PUT  /api/users/:userId/permissions → Overrides (GRANT/REVOKE) speichern (nur Admin)
 * - GET  /api/permissions               → Master-Liste aller Permissions
 * - GET  /api/roles/:role/permissions   → Default-Permissions einer Rolle
 */

import type { Hono } from "npm:hono";
import { supabase } from "./core-supabaseClient.ts";
import { ForbiddenError } from "./errors.ts";

/**
 * Helper: Default-Permissions (Keys) für eine Rolle laden
 */
async function getRolePermissionKeys(
  role: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("role_permissions")
    // FK: role_permissions.permission_id → permissions.id
    // Supabase erstellt dafür standardmäßig die Relation "permissions"
    .select("permission:permissions(key)")
    .eq("role", role);

  if (error) {
    console.error(
      "Error loading role_permissions for role",
      role,
      error,
    );
    throw new Error("failed_to_load_role_permissions");
  }

  const keys = (data ?? [])
    .map((row: any) => row.permission?.key as string | null)
    .filter((k: string | null) => !!k) as string[];

  return keys;
}

export function registerPermissionRoutes(app: Hono) {
  /**
   * GET /api/me/permissions
   * Effektive Permissions des aktuell eingeloggten Users
   */
  app.get("/api/me/permissions", async (c) => {
    const auth = c.get("auth");
    console.log("🔐 GET /api/me/permissions");

    const { data, error } = await supabase
      .from("effective_user_permissions")
      .select("permission_key")
      .eq("user_id", auth.user.id);

    if (error) {
      console.error(
        "Error loading effective_user_permissions:",
        error,
      );
      throw new Error("failed_to_load_permissions");
    }

    const permissions = (data ?? []).map(
      (row: any) => row.permission_key as string,
    );

    console.log(
      "✅ Loaded permissions for current user",
      auth.user.id,
      "count:",
      permissions.length,
    );

    return c.json({ permissions });
  });

  /**
   * GET /api/users/:userId/permissions
   * Detail-View für einen User (nur Admin)
   */
  app.get("/api/users/:userId/permissions", async (c) => {
    const auth = c.get("auth");
    const targetUserId = c.req.param("userId");
    
    console.log(
      "🔐 GET /api/users/:userId/permissions",
      targetUserId,
    );

    // Check if user is admin
    if (!auth.isAdmin) {
      throw new ForbiddenError("Admin access required to view user permissions");
    }

    // Ziel-User laden
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, role")
      .eq("id", targetUserId)
      .single();

    if (userError || !user) {
      console.error(
        "User not found in /api/users/:userId/permissions:",
        userError,
      );
      throw new Error("user_not_found");
    }

    const role = user.role as string;

    // Rollen-Defaults
    const rolePermissions = await getRolePermissionKeys(role);

    // User-Overrides inkl. Permission-Key
    const { data: overridesData, error: overridesError } =
      await supabase
        .from("user_permissions")
        .select(
          "mode, granted_by, granted_at, permission:permissions(key)",
        )
        .eq("user_id", targetUserId);

    if (overridesError) {
      console.error(
        "Error loading user_permissions in /api/users/:userId/permissions:",
        overridesError,
      );
      throw new Error("failed_to_load_user_overrides");
    }

    const userOverrides =
      overridesData
        ?.map((row: any) => ({
          permission_key: row.permission?.key as string,
          mode: row.mode as "GRANT" | "REVOKE",
          granted_by: row.granted_by as string | null,
          granted_at: row.granted_at as string | null,
        }))
        ?.filter((o) => !!o.permission_key) ?? [];

    // Effektive Permissions aus View
    const { data: effectiveData, error: effectiveError } =
      await supabase
        .from("effective_user_permissions")
        .select("permission_key")
        .eq("user_id", targetUserId);

    if (effectiveError) {
      console.error(
        "Error loading effective_user_permissions in /api/users/:userId/permissions:",
        effectiveError,
      );
      throw new Error("failed_to_load_effective_permissions");
    }

    const effectivePermissions = (effectiveData ?? []).map(
      (row: any) => row.permission_key as string,
    );

    console.log(
      "✅ Loaded detailed permissions for user",
      targetUserId,
      "role:",
      role,
      "effective:",
      effectivePermissions.length,
    );

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
        role,
      },
      rolePermissions,
      userOverrides,
      effectivePermissions,
    });
  });

  /**
   * PUT /api/users/:userId/permissions
   * Overrides für einen User setzen (GRANT / REVOKE)
   */
  app.put("/api/users/:userId/permissions", async (c) => {
    const auth = c.get("auth");
    const targetUserId = c.req.param("userId");
    
    console.log(
      "🔐 PUT /api/users/:userId/permissions",
      targetUserId,
    );

    // Check if user is admin
    if (!auth.isAdmin) {
      throw new ForbiddenError("Admin access required to manage user permissions");
    }

    const body = await c.req.json();
    const overrides = body?.overrides;

    if (!Array.isArray(overrides)) {
      throw new Error("invalid_body_format");
    }

    for (const override of overrides) {
      if (!override.permission_key || !override.mode) {
        throw new Error("invalid_override_format");
      }
      if (
        override.mode !== "GRANT" &&
        override.mode !== "REVOKE"
      ) {
        throw new Error("invalid_mode");
      }
    }

    // Alle vorhandenen Overrides des Users löschen
    const { error: deleteError } = await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error(
        "Error deleting old user_permissions:",
        deleteError,
      );
      throw new Error("failed_to_delete_old_overrides");
    }

    if (overrides.length > 0) {
      // Permissions-Tabelle einmal ziehen, um key → id zu mappen
      const keys = overrides.map(
        (o: any) => o.permission_key as string,
      );
      const { data: perms, error: permsError } =
        await supabase
          .from("permissions")
          .select("id, key")
          .in("key", keys);

      if (permsError) {
        console.error(
          "Error loading permissions in PUT override:",
          permsError,
        );
        throw new Error("failed_to_resolve_permission_ids");
      }

      const idByKey = new Map<string, string>();
      (perms ?? []).forEach((p: any) => {
        idByKey.set(p.key as string, p.id as string);
      });

      const inserts = overrides
        .map((o: any) => {
          const permissionId = idByKey.get(
            o.permission_key as string,
          );
          if (!permissionId) return null;
          return {
            user_id: targetUserId,
            permission_id: permissionId,
            mode: o.mode as "GRANT" | "REVOKE",
            granted_by: auth.user.id,
            granted_at: new Date().toISOString(),
          };
        })
        .filter((row: any) => row !== null);

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from("user_permissions")
          .insert(inserts);

        if (insertError) {
          console.error(
            "Error inserting user_permissions:",
            insertError,
          );
          throw new Error("failed_to_insert_overrides");
        }
      }
    }

    console.log(
      "✅ Updated permission overrides for user",
      targetUserId,
      "count:",
      overrides.length,
    );

    return c.json({
      success: true,
      message: "Permissions updated successfully",
      updated: overrides.length,
    });
  });

  /**
   * GET /api/permissions
   * Master-Liste aller Permissions (für UI-Dropdowns etc.)
   * → absichtlich sehr tolerant gegenüber Spaltennamen
   */
  app.get("/api/permissions", async (c) => {
    console.log("📋 GET /api/permissions");

    // keine Auth nötig – rein statische Liste
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      console.error(
        "Error loading permissions master list:",
        error,
      );
      throw new Error("failed_to_load_permissions");
    }

    const permissions = (data ?? []).map((row: any) => ({
      key: row.key as string,
      label:
        (row.name as string | null) ??
        (row.label as string | null) ??
        (row.key as string),
      category:
        (row.category as string | null) ?? "Allgemein",
      description: (row.description as string | null) ?? "",
    }));

    console.log(
      "✅ Loaded permissions master list, count:",
      permissions.length,
    );

    return c.json({ permissions });
  });

  /**
   * GET /api/roles/:role/permissions
   * Default-Permissions für eine bestimmte Rolle (nur Admin)
   */
  app.get("/api/roles/:role/permissions", async (c) => {
    const auth = c.get("auth");
    const role = c.req.param("role");
    
    console.log("📋 GET /api/roles/:role/permissions", role);

    // Check if user is admin
    if (!auth.isAdmin) {
      throw new ForbiddenError("Admin access required to view role permissions");
    }

    const rolePermissions = await getRolePermissionKeys(role);

    return c.json({
      role,
      permissions: rolePermissions,
    });
  });
}