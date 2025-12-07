// File: supabase/functions/BrowoKoordinator-Server/routes-workflows.ts
import type { Hono } from "npm:hono";
import { kv } from "./core-kv.ts";
import { PermissionKey } from "./permissions.ts";
import { ForbiddenError } from "./errors.ts";
import { TRIGGER_TYPES, triggerWorkflows, executeWorkflowGraph } from "./core-workflows.ts";

export function registerWorkflowRoutes(app: Hono) {
  // Save Workflow
  app.post("/workflows", async (c) => {
    const auth = c.get("auth");

    // Check permission to manage workflows
    if (!auth.hasPermission(PermissionKey.MANAGE_WORKFLOWS)) {
      throw new ForbiddenError("Missing permission to manage workflows");
    }

    const body = await c.req.json();
    const { id, ...workflowData } = body;

    if (!id) {
      throw new Error("ID required");
    }

    console.log(`💾 Saving workflow: ${id}`);
    await kv.set(`workflow:${id}`, { id, ...workflowData });
    return c.json({ success: true });
  });

  // Get All Workflows
  app.get("/workflows", async (c) => {
    const auth = c.get("auth");

    // Check permission to view workflows
    if (!auth.hasPermission(PermissionKey.MANAGE_WORKFLOWS)) {
      throw new ForbiddenError("Missing permission to view workflows");
    }

    const workflows = await kv.getByPrefix("workflow:");
    return c.json({ workflows });
  });

  // Get Single Workflow
  app.get("/workflows/:id", async (c) => {
    const auth = c.get("auth");

    // Check permission to view workflows
    if (!auth.hasPermission(PermissionKey.MANAGE_WORKFLOWS)) {
      throw new ForbiddenError("Missing permission to view workflows");
    }

    const id = c.req.param("id");
    const workflow = await kv.get(`workflow:${id}`);
    
    if (!workflow) {
      throw new Error("Workflow not found");
    }
    
    return c.json({ workflow });
  });

  // Delete Workflow
  app.delete("/workflows/:id", async (c) => {
    const auth = c.get("auth");

    // Check permission to manage workflows
    if (!auth.hasPermission(PermissionKey.MANAGE_WORKFLOWS)) {
      throw new ForbiddenError("Missing permission to delete workflows");
    }

    const id = c.req.param("id");
    await kv.del(`workflow:${id}`);
    return c.json({ success: true });
  });

  // Execute Workflow (Skeleton Engine)
  app.post("/workflows/execute", async (c) => {
    const auth = c.get("auth");

    // Check permission to execute workflows
    if (!auth.hasPermission(PermissionKey.MANAGE_WORKFLOWS)) {
      throw new ForbiddenError("Missing permission to execute workflows");
    }

    const { workflowId, context } = await c.req.json();
    console.log(`🚀 Executing Workflow Request: ${workflowId}`);

    const workflow = await kv.get(`workflow:${workflowId}`);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const result = await executeWorkflowGraph(
      workflow,
      context || {},
    );

    const executionId = `exec_${Date.now()}`;
    await kv.set(`execution:${executionId}`, {
      id: executionId,
      workflowId,
      status: "COMPLETED",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      logs: result.logs,
      context,
    });

    return c.json({
      success: true,
      message: "Workflow execution completed",
      executionId,
      logs: result.logs,
    });
  });

  // Trigger Workflows
  app.post("/workflows/trigger", async (c) => {
    const auth = c.get("auth");

    // Check permission to trigger workflows
    if (!auth.hasPermission(PermissionKey.MANAGE_WORKFLOWS)) {
      throw new ForbiddenError("Missing permission to trigger workflows");
    }

    const { triggerType, context } = await c.req.json();
    console.log(`🚀 Triggering Workflows: ${triggerType}`);

    if (
      !triggerType ||
      !Object.values(TRIGGER_TYPES).includes(triggerType)
    ) {
      throw new Error("Invalid trigger type");
    }

    const authHeader =
      c.req.header("Authorization") ||
      `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`;
    
    await triggerWorkflows(
      triggerType,
      context || {},
      authHeader,
    );

    return c.json({
      success: true,
      message: "Workflows triggered successfully",
    });
  });
}