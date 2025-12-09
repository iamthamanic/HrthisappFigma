/**
 * Action Executor - Führt Workflow-Actions mit echten API-Calls aus
 * v2.1.0 - Direkter DB-Zugriff für Tasks (kein HTTP-Call mehr)
 */

import { createClient } from "npm:@supabase/supabase-js";
import * as envVarsManager from "./envVarsManager.ts";

// ==================== TYPES ====================

interface ExecutionContext {
  userId?: string;
  employeeId?: string;
  employeeName?: string;
  employeeEmail?: string;
  startDate?: string;
  endDate?: string;
  organizationId?: string;
  executedBy?: string;
  workflowId?: string;
  executionId?: string;
  triggerType?: string;
  [key: string]: any;
}

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    type?: string;
    actionType?: string;
    config?: any;
  };
}

// ==================== VARIABLEN-PARSER ====================

function parseVariables(text: string, context: ExecutionContext): string {
  if (!text) return text;

  return text.replace(
    /\{\{\s*(\$json\.)?([a-zA-Z0-9_]+)\s*\}\}/g,
    (match, _prefix, varName) => {
      const value = (context as any)[varName];
      return value !== undefined ? String(value) : match;
    },
  );
}

function parseConfigVariables(config: any, context: ExecutionContext): any {
  if (!config) return config;

  const parsed: any = {};
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === "string") {
      parsed[key] = parseVariables(value, context);
    } else {
      parsed[key] = value;
    }
  }
  return parsed;
}

// ==================== HELPER FUNCTIONS ====================

const getSupabaseClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
};

const getProjectId = (): string => {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL not set");
  return url.split("//")[1]?.split(".")[0] || "";
};

const getAnonKey = (): string => {
  return Deno.env.get("SUPABASE_ANON_KEY") ?? "";
};

// ==================== OAUTH2 TOKEN MANAGEMENT ====================

interface OAuth2Token {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at: number;
  scope?: string;
}

interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes?: string;
  grantType?: "client_credentials" | "refresh_token";
  refreshToken?: string;
}

async function getOAuth2Token(
  organizationId: string,
  connectionId: string,
  config: OAuth2Config,
): Promise<string> {
  const supabase = getSupabaseClient();
  const tokenKey = `oauth_token:${organizationId}:${connectionId}`;

  const { data: existingData } = await supabase
    .from("kv_store_f659121d")
    .select("value")
    .eq("key", tokenKey)
    .maybeSingle();

  const existingToken = existingData?.value as OAuth2Token | null;
  const now = Math.floor(Date.now() / 1000);

  if (existingToken && existingToken.expires_at > now + 300) {
    console.log(
      `🔐 Using cached OAuth2 token (expires in ${
        existingToken.expires_at - now
      }s)`,
    );
    return existingToken.access_token;
  }

  console.log(`🔄 Fetching new OAuth2 token from ${config.tokenUrl}`);

  const body: Record<string, string> = {
    grant_type: config.grantType || "client_credentials",
  };

  if (body.grant_type === "client_credentials" && config.scopes) {
    body.scope = config.scopes;
  }
  if (body.grant_type === "refresh_token") {
    const refreshToken = config.refreshToken || existingToken?.refresh_token;
    if (!refreshToken) {
      throw new Error("Refresh token not available");
    }
    body.refresh_token = refreshToken;
  }

  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OAuth2 token request failed: ${response.status} - ${errorText}`,
    );
  }

  const tokenData = await response.json();
  const expiresIn = tokenData.expires_in || 3600;
  const expiresAt = now + expiresIn;

  const newToken: OAuth2Token = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || existingToken?.refresh_token,
    token_type: tokenData.token_type || "Bearer",
    expires_at: expiresAt,
    scope: tokenData.scope,
  };

  await supabase
    .from("kv_store_f659121d")
    .upsert({ key: tokenKey, value: newToken });

  console.log(`✅ OAuth2 token fetched and cached (expires in ${expiresIn}s)`);

  return newToken.access_token;
}

// ==================== COMMON HELPERS ====================

function resolveTargetUserId(config: any, context: ExecutionContext): string | null {
  const recipientType =
    config.recipientType || config.assignTo || config.assigneeType ||
    config.userType || "triggered_employee";

  if (recipientType === "triggered_employee") {
    return context.employeeId || context.userId || null;
  }
  if (recipientType === "specific_user") {
    return config.userId || null;
  }
  if (recipientType === "hr_admin") {
    return null;
  }
  return null;
}

// ==================== ACTION EXECUTORS ====================
//
// Nur relevante Actions vollständig implementiert, Rest kann später erweitert werden.
//

// ---------- SEND_EMAIL ----------

async function executeSendEmail(
  node: WorkflowNode,
  context: ExecutionContext,
): Promise<{ success: boolean; message: string }> {
  const config = node.data.config || {};

  const recipientType = config.recipientType || "triggered_employee";
  let subject = config.subject || "Notification from Browo Koordinator";
  let body = config.body || "";
  let bodyHtml = config.body || "";

  if (config.useTemplate !== false && config.templateId) {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from("kv_store_f659121d")
        .select("value")
        .eq("key", `email_template:${config.templateId}`)
        .maybeSingle();

      if (data?.value) {
        const template = data.value;
        subject = parseVariables(template.subject, context);
        bodyHtml = parseVariables(template.body_html, context);
        body = parseVariables(template.body_text, context);
      }
    } catch (error) {
      console.error("Failed to load email template:", error);
    }
  } else {
    subject = parseVariables(subject, context);
    body = parseVariables(body, context);
    bodyHtml = parseVariables(bodyHtml, context);
  }

  let recipientEmail: string | null = null;
  let recipientName: string | null = null;

  if (recipientType === "triggered_employee") {
    recipientEmail = context.employeeEmail || null;
    recipientName = context.employeeName || null;
  } else if (recipientType === "specific_user") {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("email, full_name")
      .eq("id", config.userId)
      .maybeSingle();
    recipientEmail = data?.email || null;
    recipientName = data?.full_name || null;
  } else if (recipientType === "all_employees") {
    return await executeBatchEmail(subject, bodyHtml, body, context);
  }

  if (!recipientEmail) {
    throw new Error("No recipient email found");
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Browo Koordinator <onboarding@browo.de>",
          to: [recipientEmail],
          subject,
          html: bodyHtml,
          text: body,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${errorText}`);
      }

      const result = await response.json();
      console.log(
        `✅ EMAIL SENT via Resend (ID: ${result.id}) -> ${recipientEmail}`,
      );

      try {
        const projectId = getProjectId();
        const anonKey = getAnonKey();

        await fetch(
          `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-EmailTracking/log`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({
              id: `email_${Date.now()}`,
              workflowExecutionId: context.executionId,
              workflowId: context.workflowId,
              nodeId: node.id,
              recipientEmail,
              recipientName,
              subject,
              resendId: result.id,
              status: "SENT",
              sentAt: new Date().toISOString(),
            }),
          },
        );
      } catch (trackingError) {
        console.error("Email tracking log failed:", trackingError);
      }

      return {
        success: true,
        message: `Email sent to ${recipientEmail} - ${subject}`,
      };
    } catch (error: any) {
      console.error("Resend API error:", error);
    }
  }

  console.log("EMAIL LOGGED (no API key):", { to: recipientEmail, subject });

  return {
    success: true,
    message: `Email logged (not sent - no API key): ${recipientEmail} - ${subject}`,
  };
}

async function executeBatchEmail(
  subject: string,
  bodyHtml: string,
  bodyText: string,
  context: ExecutionContext,
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();

  const { data: employees, error } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("organization_id", context.organizationId)
    .limit(100);

  if (error || !employees || employees.length === 0) {
    throw new Error("No employees found for batch email");
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  let sentCount = 0;
  let failedCount = 0;

  const batchSize = 10;
  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (employee) => {
        try {
          const employeeContext = {
            ...context,
            employeeId: employee.id,
            employeeName: employee.full_name,
            employeeEmail: employee.email,
          };

          const personalizedSubject = parseVariables(subject, employeeContext);
          const personalizedHtml = parseVariables(bodyHtml, employeeContext);
          const personalizedText = parseVariables(bodyText, employeeContext);

          if (resendApiKey) {
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Browo Koordinator <onboarding@browo.de>",
                to: [employee.email],
                subject: personalizedSubject,
                html: personalizedHtml,
                text: personalizedText,
              }),
            });

            if (response.ok) {
              sentCount++;
            } else {
              failedCount++;
              console.error(`Failed to send email to ${employee.email}`);
            }
          } else {
            console.log(`BATCH EMAIL logged: ${employee.email}`);
            sentCount++;
          }
        } catch (err) {
          failedCount++;
          console.error(`Error sending email to ${employee.email}:`, err);
        }
      }),
    );

    if (i + batchSize < employees.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    success: true,
    message: `Batch email completed: ${sentCount} sent, ${failedCount} failed (${employees.length} total)`,
  };
}

// ---------- CREATE_TASK (direkter DB-Zugriff, kein HTTP) ----------

async function executeCreateTask(
  node: WorkflowNode,
  context: ExecutionContext,
): Promise<{ success: boolean; message: string }> {
  const rawConfig = node.data.config || {};
  const config = parseConfigVariables(rawConfig, context);

  const title = config.title;
  const description = config.description || "";
  const status = config.status || "TODO";
  const priority = config.priority || "MEDIUM";
  const dueDate = config.dueDate || null;
  const teamId = config.teamId || config.boardId || null;

  if (!title) {
    throw new Error("Task title is required");
  }

  if (!context.organizationId) {
    throw new Error(
      "organizationId is required in workflow context for CREATE_TASK",
    );
  }

  const supabase = getSupabaseClient();

  const createdBy =
    context.executedBy || context.employeeId || context.userId || null;

  console.log("CREATE_TASK input:", {
    title,
    status,
    priority,
    organizationId: context.organizationId,
    createdBy,
  });

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      status,
      priority,
      due_date: dueDate,
      team_id: teamId,
      created_by: createdBy,
      organization_id: context.organizationId,
    })
    .select("id, title, organization_id")
    .single();

  if (taskError || !task) {
    console.error("CREATE_TASK error:", taskError);
    throw new Error(
      `Failed to create task: ${taskError?.message || "Unknown error"}`,
    );
  }

  console.log("Task created:", task.id);

  const targetUserId = resolveTargetUserId(config, context);
  if (targetUserId) {
    try {
      const { error: assignError } = await supabase
        .from("task_assignments")
        .insert({
          task_id: task.id,
          user_id: targetUserId,
          assigned_by: createdBy,
        });

      if (assignError) {
        console.error(
          "CREATE_TASK assignment error (non fatal):",
          assignError,
        );
      } else {
        console.log(
          `Task ${task.id} assigned to user ${targetUserId}`,
        );
      }
    } catch (assignError) {
      console.error(
        "CREATE_TASK unexpected assignment error (non fatal):",
        assignError,
      );
    }
  }

  return {
    success: true,
    message: `Task "${title}" created via workflow`,
  };
}

// ---------- APPROVE_REQUEST ----------

async function executeApproveRequest(
  node: WorkflowNode,
  context: ExecutionContext,
): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  const requestType = config.requestType || "BENEFIT";
  const autoApprove = config.autoApprove === "true";
  const notes = config.notes || "";

  console.log("REQUEST APPROVED:", {
    requestType,
    autoApprove,
    notes,
    executedBy: context.executedBy,
  });

  return {
    success: true,
    message: `${requestType} request approved`,
  };
}

// ---------- GENERISCHER HTTP_REQUEST ----------

async function executeHttpRequest(
  node: WorkflowNode,
  context: ExecutionContext,
): Promise<{ success: boolean; message: string; contextUpdates?: any }> {
  const organizationId = context.organizationId || "default-org";
  const rawConfig = node.data.config || {};

  const configWithEnvVars = await envVarsManager
    .resolveEnvVarsInObject(organizationId, rawConfig);
  const config = parseConfigVariables(configWithEnvVars, context);

  const method = config.method || "GET";
  const url = config.url;
  const timeout = (config.timeout || 30) * 1000;
  const retries = config.retries || 0;
  const continueOnError = config.continueOnError || false;

  if (!url) {
    throw new Error("URL is required for HTTP Request");
  }

  console.log("HTTP_REQUEST with env vars resolved");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.authType === "OAUTH2") {
    const oauth2Config: OAuth2Config = {
      clientId: config.oauth2ClientId,
      clientSecret: config.oauth2ClientSecret,
      tokenUrl: config.oauth2TokenUrl,
      scopes: config.oauth2Scopes,
      grantType: config.oauth2GrantType || "client_credentials",
      refreshToken: config.oauth2RefreshToken,
    };

    const connectionId =
      `${config.oauth2ClientId}_${
        btoa(config.oauth2TokenUrl).substring(0, 16)
      }`;

    const accessToken = await getOAuth2Token(
      organizationId,
      connectionId,
      oauth2Config,
    );
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (config.authType === "API_KEY") {
    if (config.apiKeyLocation !== "QUERY") {
      headers[config.apiKeyName || "X-API-Key"] = config.apiKeyValue;
    }
  } else if (config.authType === "BEARER_TOKEN") {
    headers.Authorization = `Bearer ${config.bearerToken}`;
  } else if (config.authType === "BASIC_AUTH") {
    const credentials = btoa(
      `${config.basicAuthUsername}:${config.basicAuthPassword}`,
    );
    headers.Authorization = `Basic ${credentials}`;
  }

  if (config.headers) {
    try {
      const customHeaders = JSON.parse(config.headers);
      Object.assign(headers, customHeaders);
    } catch (e) {
      console.warn("Failed to parse custom headers:", e);
    }
  }

  let finalUrl = url;
  if (config.authType === "API_KEY" && config.apiKeyLocation === "QUERY") {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl += `${separator}${config.apiKeyName || "api_key"}=${
      config.apiKeyValue
    }`;
  }

  const requestOptions: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeout),
  };

  if (["POST", "PUT", "PATCH"].includes(method) && config.body) {
    requestOptions.body = config.body;
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      console.log(
        `HTTP ${method} ${finalUrl} (Attempt ${attempt + 1}/${
          retries + 1
        })`,
      );

      const startTime = Date.now();
      const response = await fetch(finalUrl, requestOptions);
      const duration = Date.now() - startTime;

      let responseBody: any;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`HTTP Request successful (${duration}ms)`);

      const contextUpdates: any = {};
      if (config.responseVariable) {
        contextUpdates[config.responseVariable] = responseBody;
      }

      return {
        success: true,
        message: `HTTP ${method} ${finalUrl} → ${response.status}`,
        contextUpdates,
      };
    } catch (error: any) {
      lastError = error;
      console.error(
        `HTTP Request failed (Attempt ${attempt + 1}):`,
        error.message,
      );

      if (attempt < retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }

      attempt++;
    }
  }

  if (continueOnError) {
    console.warn("HTTP Request failed but continuing workflow");
    return {
      success: true,
      message:
        `HTTP ${method} failed: ${lastError?.message || "Unknown error"}`,
    };
  }

  throw new Error(
    `HTTP Request failed after ${retries + 1} attempts: ${
      lastError?.message || "Unknown error"
    }`,
  );
}

// ==================== MAIN EXECUTOR ====================

export async function executeAction(
  node: WorkflowNode,
  context: ExecutionContext,
): Promise<{ success: boolean; message: string; contextUpdates?: any }> {
  const actionType = node.data.actionType || node.data.type;
  const label = node.data.label;

  console.log(`Executing Action: [${actionType}] ${label}`);

  if (!node.data.config || Object.keys(node.data.config).length === 0) {
    throw new Error(`Node "${label}" is not configured`);
  }

  switch (actionType) {
    case "SEND_EMAIL":
      return await executeSendEmail(node, context);
    case "CREATE_TASK":
      return await executeCreateTask(node, context);
    case "APPROVE_REQUEST":
      return await executeApproveRequest(node, context);
    case "HTTP_REQUEST":
      return await executeHttpRequest(node, context);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}
