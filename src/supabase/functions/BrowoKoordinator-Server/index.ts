// File: supabase/functions/BrowoKoordinator-Server/index.ts
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { authorize } from "./auth.ts";
import { errorResponse } from "./errors.ts";
import {
  initializeAllBuckets,
  ensureBucketExists,
  DOCUMENTS_BUCKET,
} from "./core-buckets.ts";
import { testSubmissionsApp } from "./routes-tests.ts";
import { registerStorageRoutes } from "./routes-storage.ts";
import { registerUserRoutes } from "./routes-users.ts";
import { registerWorkflowRoutes } from "./routes-workflows.ts";
import { registerItEquipmentRoutes } from "./routes-itEquipment.ts";
import { registerEntityRoutes } from "./routes-entities.ts";
import { registerPermissionRoutes } from "./routes-permissions.ts";

// WICHTIG: basePath = Funktionsname
const app = new Hono({ strict: false }).basePath(
  "/BrowoKoordinator-Server",
);

// Logger
app.use("*", logger(console.log));

// CORS für Figma Make – alles offen
app.use(
  "/*",
  cors({
    origin: "*",
    credentials: true,
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Client-Info",
      "apikey",
    ],
    allowMethods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],
    exposeHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24h
  }),
);

// Buckets einmalig initialisieren
let bucketsInitialized = false;
app.use("*", async (c, next) => {
  if (!bucketsInitialized) {
    console.log("🚀 Initializing storage buckets...");
    try {
      await initializeAllBuckets();
      await ensureBucketExists(DOCUMENTS_BUCKET);
      bucketsInitialized = true;
      console.log("✅ Buckets initialized");
    } catch (error) {
      console.error("❌ Bucket initialization failed:", error);
    }
  }

  await next();
});

// Root: Übersicht aller wichtigen Routen (Public)
app.get("/", (c) => {
  return c.json({
    service: "BrowoKoordinator-Server",
    status: "running",
    version: "1.0.0",
    routes: {
      health: "/health",
      api: {
        departments: "/api/departments",
        locations: "/api/locations",
        roles: "/api/roles",
        seed: "POST /api/seed-entities",
        permissions: "/api/permissions",
        mePermissions: "/api/me/permissions",
        userPermissions: "/api/users/:userId/permissions",
      },
      users: {
        create: "POST /users/create",
      },
      itEquipment: {
        list: "/it-equipment",
        create: "POST /it-equipment",
        delete: "DELETE /it-equipment/:id",
      },
      storage: {
        status: "/storage/status",
        documents: "/documents/upload",
      },
      tests: "/tests/*",
    },
  });
});

// Healthcheck – wird unter
// /functions/v1/BrowoKoordinator-Server/health
// aufgerufen (Public)
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// Globale Auth + Error-Middleware (applies to all routes AFTER this point)
app.use("*", async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");
    
    // Import supabase from core-supabaseClient
    const { supabase } = await import("./core-supabaseClient.ts");
    const auth = await authorize(authHeader, supabase);
    
    c.set("auth", auth);
    await next();
  } catch (error) {
    return errorResponse(error);
  }
});

// Routen registrieren (all require auth now)
app.route("/tests", testSubmissionsApp);
registerStorageRoutes(app);
registerUserRoutes(app);
registerWorkflowRoutes(app);
registerItEquipmentRoutes(app);
registerEntityRoutes(app);
registerPermissionRoutes(app);

console.log("🚀 Starting BrowoKoordinator-Server...");
Deno.serve(app.fetch);