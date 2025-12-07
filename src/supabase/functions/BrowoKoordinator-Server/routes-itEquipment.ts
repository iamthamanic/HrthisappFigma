// File: supabase/functions/BrowoKoordinator-Server/routes-itEquipment.ts
import type { Hono } from "npm:hono";
import { kv } from "./core-kv.ts";
import { ForbiddenError } from "./errors.ts";

export function registerItEquipmentRoutes(app: Hono) {
  app.post("/it-equipment", async (c) => {
    const auth = c.get("auth");

    // Only admins can create IT equipment
    if (!auth.isAdmin) {
      throw new ForbiddenError("Admin access required to create IT equipment");
    }

    const body = await c.req.json();
    const { id, ...data } = body;
    
    if (!id) {
      throw new Error("ID required");
    }

    await kv.set(`it_equipment:${id}`, { id, ...data });
    return c.json({ success: true });
  });

  app.get("/it-equipment", async (c) => {
    const auth = c.get("auth");

    // Only admins can view IT equipment list
    if (!auth.isAdmin) {
      throw new ForbiddenError("Admin access required to view IT equipment");
    }

    const items = await kv.getByPrefix("it_equipment:");
    return c.json({ items });
  });

  app.delete("/it-equipment/:id", async (c) => {
    const auth = c.get("auth");

    // Only admins can delete IT equipment
    if (!auth.isAdmin) {
      throw new ForbiddenError("Admin access required to delete IT equipment");
    }

    const id = c.req.param("id");
    await kv.del(`it_equipment:${id}`);
    return c.json({ success: true });
  });
}