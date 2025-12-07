// File: supabase/functions/BrowoKoordinator-Server/routes-entities.ts
import type { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";

// ------------------------------------------------------
// Supabase Admin-Client (liest direkt aus Postgres)
// ------------------------------------------------------
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
)!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlen",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function registerEntityRoutes(app: Hono) {
  // ----------------------------------------------------
  // DEV / BACKWARD COMPAT: Seed-Endpoint (macht nichts mehr)
  // ----------------------------------------------------
  app.post("/api/seed-entities", async (c) => {
    console.log(
      "ℹ️ /api/seed-entities aufgerufen – macht nichts mehr. " +
        "Entities kommen jetzt direkt aus Postgres.",
    );
    return c.json({
      success: true,
      message:
        "No-op: Entities werden direkt aus den Tabellen departments/locations/users geladen.",
    });
  });

  // ----------------------------------------------------
  // Departments aus public.departments
  // These are public/read-only for all authenticated users
  // ----------------------------------------------------
  app.get("/api/departments", async (c) => {
    const auth = c.get("auth"); // Verify auth but allow all authenticated users

    const { data, error } = await supabase
      .from("departments")
      .select("id, name, is_active")
      .order("name", { ascending: true });

    if (error) {
      console.error(`❌ Error loading departments: ${error.message}`);
      throw new Error(`Error loading departments: ${error.message}`);
    }

    const departments =
      data
        ?.filter((row: any) => row.is_active !== false)
        .map((row: any) => ({
          id: row.id,
          name: row.name ?? "Ohne Namen",
        })) ?? [];

    return c.json({ departments });
  });

  // ----------------------------------------------------
  // Locations aus public.locations
  // These are public/read-only for all authenticated users
  // ----------------------------------------------------
  app.get("/api/locations", async (c) => {
    const auth = c.get("auth"); // Verify auth but allow all authenticated users

    const { data, error } = await supabase
      .from("locations")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error(`❌ Error loading locations: ${error.message}`);
      throw new Error(`Error loading locations: ${error.message}`);
    }

    const locations =
      data?.map((row: any) => ({
        id: row.id,
        name: row.name ?? "Ohne Namen",
      })) ?? [];

    return c.json({ locations });
  });

  // ----------------------------------------------------
  // Globale Rollen aus public.users.role (distinct)
  // USER / ADMIN / HR / SUPERADMIN / EXTERN etc.
  // These are public/read-only for all authenticated users
  // ----------------------------------------------------
  app.get("/api/roles", async (c) => {
    const auth = c.get("auth"); // Verify auth but allow all authenticated users

    const { data, error } = await supabase
      .from("users")
      .select("role");

    if (error) {
      console.error(`❌ Error loading roles: ${error.message}`);
      throw new Error(`Error loading roles: ${error.message}`);
    }

    const uniqueRoles = Array.from(
      new Set(
        (data ?? [])
          .map((row: any) => (row.role ?? "").trim())
          .filter((r: string) => r.length > 0),
      ),
    );

    const roles = uniqueRoles.map((role) => ({
      id: role, // technisch: der Wert in der DB
      name: role, // Anzeige im UI; wenn du später Labels brauchst, hier mappen
    }));

    return c.json({ roles });
  });
}
