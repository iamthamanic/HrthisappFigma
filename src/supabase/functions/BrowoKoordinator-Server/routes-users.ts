// File: supabase/functions/BrowoKoordinator-Server/routes-users.ts
import type { Hono } from "npm:hono";
import { supabase } from "./core-supabaseClient.ts";
import { PermissionKey } from "./permissions.ts";
import { ForbiddenError } from "./errors.ts";
import {
  TRIGGER_TYPES,
  triggerWorkflows,
} from "./core-workflows.ts";

export function registerUserRoutes(app: Hono) {
  // GET /time-account/:userId/:month/:year
  app.get("/time-account/:userId/:month/:year", async (c) => {
    const auth = c.get("auth");
    const requestedUserId = c.req.param("userId");
    const month = parseInt(c.req.param("month"));
    const year = parseInt(c.req.param("year"));

    // User darf nur eigene Daten sehen (außer Admin/HR)
    if (requestedUserId !== auth.user.id && !auth.isAdmin) {
      throw new ForbiddenError("Cannot view other users' time accounts");
    }

    const { data, error } = await supabase
      .from("time_accounts")
      .select("*")
      .eq("user_id", requestedUserId)
      .eq("month", month)
      .eq("year", year)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return c.json({ timeAccount: data });
  });

  // POST /users/create
  app.post("/users/create", async (c) => {
    const auth = c.get("auth");
    
    console.log("👤 Creating new user...");

    // Check permission to create users
    if (!auth.hasPermission(PermissionKey.ADD_EMPLOYEES)) {
      throw new ForbiddenError("Missing permission to create users");
    }

    const body = await c.req.json();
    const { email, password, userData } = body;

    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: userData?.first_name || "",
          last_name: userData?.last_name || "",
        },
      });

    if (authError) {
      console.error("❌ Auth creation error:", authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error(
        "Failed to create auth user - no user returned",
      );
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Trigger wartet kurz auf DB-Trigger
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: profileData, error: updateError } =
      await supabase
        .from("users")
        .update({
          ...userData,
          email,
        })
        .eq("id", userId)
        .select()
        .single();

    if (updateError) {
      console.error("❌ Profile update error:", updateError);
      throw updateError;
    }

    console.log(`✅ User profile updated: ${userId}`);

    // Workflows triggern
    console.log(
      `🔔 Triggering EMPLOYEE_CREATED workflows for user ${userId}...`,
    );

    try {
      const authHeader =
        c.req.header("Authorization") ||
        `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`;

      await triggerWorkflows(
        TRIGGER_TYPES.EMPLOYEE_CREATED,
        {
          userId: profileData.id,
          employeeId: profileData.id,
          employeeName: `${profileData.first_name} ${profileData.last_name}`,
          employeeEmail: profileData.email,
          department: profileData.department || "Unbekannt",
          organizationId: profileData.organization_id,
        },
        authHeader,
      );

      console.log(
        `✅ Workflows triggered successfully for ${profileData.email}`,
      );
    } catch (triggerError) {
      console.error(
        "⚠️ Failed to trigger workflows (non-fatal):",
        triggerError,
      );
    }

    return c.json({
      success: true,
      user: profileData,
      message: "User created successfully",
    });
  });
}