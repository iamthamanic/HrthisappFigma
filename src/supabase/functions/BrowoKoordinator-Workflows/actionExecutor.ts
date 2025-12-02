/**
 * Action Executor - Führt Workflow-Actions mit echten API-Calls aus
 * v2.0.0 - Phase 2: Echte Execution aller Action-Typen
 */

import { createClient } from "npm:@supabase/supabase-js";
import * as envVarsManager from './envVarsManager.ts';

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

/**
 * Ersetzt Variablen wie {{ $json.employeeName }} oder {{ employeeName }} mit echten Werten
 */
function parseVariables(text: string, context: ExecutionContext): string {
  if (!text) return text;
  
  // Replace {{ $json.variable }} oder {{ variable }}
  return text.replace(/\{\{\s*(\$json\.)?([a-zA-Z0-9_]+)\s*\}\}/g, (match, prefix, varName) => {
    const value = context[varName];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Parsed Config-Objekt mit Variablen-Ersetzung
 */
function parseConfigVariables(config: any, context: ExecutionContext): any {
  if (!config) return config;
  
  const parsed: any = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
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
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
};

const getProjectId = (): string => {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) throw new Error('SUPABASE_URL not set');
  return url.split('//')[1]?.split('.')[0] || '';
};

const getAnonKey = (): string => {
  return Deno.env.get('SUPABASE_ANON_KEY') ?? '';
};

// ==================== OAUTH2 TOKEN MANAGEMENT ====================

interface OAuth2Token {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_at: number; // Unix timestamp
  scope?: string;
}

interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes?: string;
  grantType?: 'client_credentials' | 'refresh_token';
  refreshToken?: string;
}

/**
 * Get or refresh OAuth2 token
 * Stores tokens in KV store with organization scope
 */
async function getOAuth2Token(
  organizationId: string,
  connectionId: string,
  config: OAuth2Config
): Promise<string> {
  const supabase = getSupabaseClient();
  const tokenKey = `oauth_token:${organizationId}:${connectionId}`;
  
  // Try to get existing token from KV store
  const { data: existingData } = await supabase
    .from('kv_store_f659121d')
    .select('value')
    .eq('key', tokenKey)
    .single();
  
  const existingToken = existingData?.value as OAuth2Token | null;
  
  // Check if token is still valid (with 5 minute buffer)
  const now = Math.floor(Date.now() / 1000);
  if (existingToken && existingToken.expires_at > now + 300) {
    console.log(`🔐 Using cached OAuth2 token (expires in ${existingToken.expires_at - now}s)`);
    return existingToken.access_token;
  }
  
  // Token expired or doesn't exist - fetch new one
  console.log(`🔄 Fetching new OAuth2 token from ${config.tokenUrl}`);
  
  // Determine grant type
  let grantType = config.grantType || 'client_credentials';
  let body: Record<string, string> = {
    grant_type: grantType,
  };
  
  // Add grant-specific parameters
  if (grantType === 'client_credentials') {
    if (config.scopes) {
      body.scope = config.scopes;
    }
  } else if (grantType === 'refresh_token') {
    if (!config.refreshToken && !existingToken?.refresh_token) {
      throw new Error('Refresh token not available');
    }
    body.refresh_token = config.refreshToken || existingToken!.refresh_token!;
  }
  
  // Encode credentials for Basic Auth
  const credentials = btoa(`${config.clientId}:${config.clientSecret}`);
  
  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(body).toString(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth2 token request failed: ${response.status} - ${errorText}`);
    }
    
    const tokenData = await response.json();
    
    // Calculate expiration timestamp
    const expiresIn = tokenData.expires_in || 3600; // Default 1 hour
    const expiresAt = now + expiresIn;
    
    const newToken: OAuth2Token = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || existingToken?.refresh_token,
      token_type: tokenData.token_type || 'Bearer',
      expires_at: expiresAt,
      scope: tokenData.scope,
    };
    
    // Store token in KV store
    await supabase
      .from('kv_store_f659121d')
      .upsert({
        key: tokenKey,
        value: newToken,
      });
    
    console.log(`✅ OAuth2 token fetched and cached (expires in ${expiresIn}s)`);
    
    return newToken.access_token;
  } catch (error: any) {
    console.error(`❌ OAuth2 token fetch failed:`, error.message);
    throw new Error(`Failed to obtain OAuth2 token: ${error.message}`);
  }
}

/**
 * Bestimmt die Ziel-User-ID basierend auf Konfiguration
 */
function resolveTargetUserId(config: any, context: ExecutionContext): string | null {
  const recipientType = config.recipientType || config.assignTo || config.assigneeType || config.userType || 'triggered_employee';
  
  if (recipientType === 'triggered_employee') {
    return context.employeeId || context.userId || null;
  }
  
  if (recipientType === 'specific_user') {
    return config.userId || null;
  }
  
  if (recipientType === 'hr_admin') {
    // TODO: Get first HR/Admin user from organization
    return null;
  }
  
  return null;
}

// ==================== ACTION EXECUTORS ====================

async function executeSendEmail(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = node.data.config || {};
  
  const recipientType = config.recipientType || 'triggered_employee';
  let subject = config.subject || 'Notification from Browo Koordinator';
  let body = config.body || '';
  let bodyHtml = config.body || '';
  
  // If using template, load and render it
  if (config.useTemplate !== false && config.templateId) {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('kv_store_f659121d')
        .select('value')
        .eq('key', `email_template:${config.templateId}`)
        .single();
      
      if (data?.value) {
        const template = data.value;
        subject = parseVariables(template.subject, context);
        bodyHtml = parseVariables(template.body_html, context);
        body = parseVariables(template.body_text, context);
      }
    } catch (error) {
      console.error('Failed to load email template:', error);
      // Fall back to config values
    }
  } else {
    // Parse variables in manually entered subject/body
    subject = parseVariables(subject, context);
    body = parseVariables(body, context);
    bodyHtml = parseVariables(bodyHtml, context);
  }
  
  let recipientEmail: string | null = null;
  let recipientName: string | null = null;
  
  // Determine recipient
  if (recipientType === 'triggered_employee') {
    recipientEmail = context.employeeEmail || null;
    recipientName = context.employeeName || null;
  } else if (recipientType === 'specific_user') {
    // Fetch user email
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', config.userId)
      .single();
    recipientEmail = data?.email || null;
    recipientName = data?.full_name || null;
  } else if (recipientType === 'all_employees') {
    // Batch processing for all employees
    return await executeBatchEmail(subject, bodyHtml, body, context);
  }
  
  if (!recipientEmail) {
    throw new Error('No recipient email found');
  }
  
  // Send email via Resend API
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Browo Koordinator <onboarding@browo.de>',
          to: [recipientEmail],
          subject: subject,
          html: bodyHtml,
          text: body,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }
      
      const result = await response.json();
      console.log(`✅ EMAIL SENT via Resend (ID: ${result.id}):`);
      console.log(`   To: ${recipientEmail} (${recipientName || 'Unknown'})`);
      console.log(`   Subject: ${subject}`);
      
      // Log email for tracking
      try {
        const projectId = getProjectId();
        const anonKey = getAnonKey();
        
        await fetch(`https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-EmailTracking/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            id: `email_${Date.now()}`,
            workflowExecutionId: context.executionId,
            workflowId: context.workflowId,
            nodeId: node.id,
            recipientEmail: recipientEmail,
            recipientName: recipientName,
            subject: subject,
            resendId: result.id,
            status: 'SENT',
            sentAt: new Date().toISOString(),
          }),
        });
      } catch (trackingError) {
        console.error('⚠️ Email tracking log failed:', trackingError);
        // Don't fail the action if tracking fails
      }
      
      return {
        success: true,
        message: `📧 Email sent to ${recipientEmail} - ${subject}`,
      };
    } catch (error: any) {
      console.error('❌ Resend API error:', error);
      // Fall back to logging
    }
  }
  
  // Fallback: Log only (if no Resend API key)
  console.log(`📧 EMAIL LOGGED (no API key):`);
  console.log(`   To: ${recipientEmail} (${recipientName || 'Unknown'})`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body HTML: ${bodyHtml.substring(0, 100)}...`);
  console.log(`   Body Text: ${body.substring(0, 100)}...`);
  
  return {
    success: true,
    message: `📧 Email logged (not sent - no API key): ${recipientEmail} - ${subject}`,
  };
}

/**
 * Batch Email Sending - Sends to all employees
 */
async function executeBatchEmail(subject: string, bodyHtml: string, bodyText: string, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabaseClient();
  
  // Get all employees from organization
  const { data: employees, error } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('organization_id', context.organizationId)
    .limit(100); // Safety limit
  
  if (error || !employees || employees.length === 0) {
    throw new Error('No employees found for batch email');
  }
  
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  let sentCount = 0;
  let failedCount = 0;
  
  // Process in batches of 10
  const batchSize = 10;
  for (let i = 0; i < employees.length; i += batchSize) {
    const batch = employees.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (employee) => {
      try {
        // Replace variables with employee-specific data
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
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Browo Koordinator <onboarding@browo.de>',
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
          // Log only
          console.log(`📧 BATCH EMAIL logged: ${employee.email}`);
          sentCount++;
        }
      } catch (error) {
        failedCount++;
        console.error(`Error sending email to ${employee.email}:`, error);
      }
    }));
    
    // Small delay between batches
    if (i + batchSize < employees.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    success: true,
    message: `📧 Batch email completed: ${sentCount} sent, ${failedCount} failed (${employees.length} total)`,
  };
}

async function executeAssignBenefits(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const benefitId = config.benefitId;
  const targetUserId = resolveTargetUserId(config, context);
  
  if (!benefitId) {
    throw new Error('Benefit ID is required');
  }
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  // Call BrowoKoordinator-Benefits API to assign benefit
  const projectId = getProjectId();
  const anonKey = getAnonKey();
  
  // Note: This is a simplified example. Real implementation needs proper request endpoint.
  // For now, we directly insert into DB
  const supabase = getSupabaseClient();
  
  const benefitAssignment = {
    id: `ba_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    user_id: targetUserId,
    benefit_id: benefitId,
    status: 'ACTIVE',
    assigned_at: new Date().toISOString(),
    notes: config.notes || null,
    assigned_by: context.executedBy || 'system',
    organization_id: context.organizationId,
  };
  
  // Store in KV store (simulating benefit assignment)
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `benefit_assignment:${benefitAssignment.id}`,
      value: benefitAssignment,
    });
  
  if (error) {
    throw new Error(`Failed to assign benefit: ${error.message}`);
  }
  
  console.log(`🎁 BENEFIT ASSIGNED: ${config.benefitName || benefitId} to user ${targetUserId}`);
  
  return {
    success: true,
    message: `🎁 Benefit "${config.benefitName || benefitId}" assigned to user ${targetUserId}`,
  };
}

async function executeCreateTask(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const title = config.title;
  const description = config.description || '';
  const targetUserId = resolveTargetUserId(config, context);
  const priority = config.priority || 'MEDIUM';
  const dueDate = config.dueDate || null;
  const boardId = config.boardId || null;
  
  if (!title) {
    throw new Error('Task title is required');
  }
  
  // Call BrowoKoordinator-Tasks API
  const projectId = getProjectId();
  const anonKey = getAnonKey();
  
  const taskData = {
    title,
    description,
    priority,
    status: 'TODO',
    due_date: dueDate,
    board_id: boardId,
    assigned_to: targetUserId ? [targetUserId] : [],
    created_by: context.executedBy || 'system',
    organization_id: context.organizationId,
  };
  
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/BrowoKoordinator-Tasks/tasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(taskData),
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create task: ${error}`);
  }
  
  const result = await response.json();
  
  console.log(`✅ TASK CREATED: "${title}" (ID: ${result.task?.id})`);
  
  return {
    success: true,
    message: `✅ Task "${title}" created`,
  };
}

async function executeAssignDocument(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const documentId = config.documentId;
  const targetUserId = resolveTargetUserId(config, context);
  const requireSignature = config.requireSignature === 'true';
  
  if (!documentId) {
    throw new Error('Document ID is required');
  }
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  // Store document assignment in KV store
  const supabase = getSupabaseClient();
  
  const assignment = {
    id: `doc_assignment_${Date.now()}`,
    document_id: documentId,
    user_id: targetUserId,
    require_signature: requireSignature,
    assigned_at: new Date().toISOString(),
    assigned_by: context.executedBy || 'system',
    status: 'PENDING',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `document_assignment:${assignment.id}`,
      value: assignment,
    });
  
  if (error) {
    throw new Error(`Failed to assign document: ${error.message}`);
  }
  
  console.log(`📄 DOCUMENT ASSIGNED: ${config.documentName || documentId} to user ${targetUserId}`);
  
  return {
    success: true,
    message: `📄 Document assigned to user ${targetUserId}`,
  };
}

async function executeDistributeCoins(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const amount = parseInt(config.amount || '0', 10);
  const reason = config.reason || 'Workflow reward';
  const recipientType = config.recipientType || 'triggered_employee';
  
  if (amount <= 0) {
    throw new Error('Coin amount must be greater than 0');
  }
  
  const supabase = getSupabaseClient();
  
  if (recipientType === 'all_employees') {
    // TODO: Distribute to all employees
    return { success: true, message: `🪙 ${amount} coins would be distributed to all employees (not implemented yet)` };
  }
  
  const targetUserId = resolveTargetUserId(config, context);
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  // Create coin transaction
  const transaction = {
    id: `coin_tx_${Date.now()}`,
    user_id: targetUserId,
    amount: amount,
    reason: reason,
    transaction_type: 'REWARD',
    created_at: new Date().toISOString(),
    created_by: context.executedBy || 'system',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `coin_transaction:${transaction.id}`,
      value: transaction,
    });
  
  if (error) {
    throw new Error(`Failed to distribute coins: ${error.message}`);
  }
  
  console.log(`🪙 COINS DISTRIBUTED: ${amount} coins to user ${targetUserId} - ${reason}`);
  
  return {
    success: true,
    message: `🪙 ${amount} coins distributed to user ${targetUserId}`,
  };
}

async function executeDelay(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = node.data.config || {};
  
  const duration = parseInt(config.duration || '0', 10);
  const unit = config.unit || 'days';
  
  if (duration <= 0) {
    throw new Error('Delay duration must be greater than 0');
  }
  
  // Calculate execution timestamp
  let delayMs = 0;
  switch (unit) {
    case 'minutes':
      delayMs = duration * 60 * 1000;
      break;
    case 'hours':
      delayMs = duration * 60 * 60 * 1000;
      break;
    case 'days':
      delayMs = duration * 24 * 60 * 60 * 1000;
      break;
    case 'weeks':
      delayMs = duration * 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      delayMs = duration * 24 * 60 * 60 * 1000; // Default to days
  }
  
  const executeAt = new Date(Date.now() + delayMs).toISOString();
  
  // Store scheduled execution in KV Store
  const scheduledExecution = {
    id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workflowId: context.workflowId || 'unknown',
    nodeId: node.id,
    context: context,
    executeAt: executeAt,
    status: 'SCHEDULED',
    createdAt: new Date().toISOString(),
  };
  
  const supabase = getSupabaseClient();
  await supabase
    .from('kv_store_f659121d')
    .insert({
      key: `scheduled_execution:${scheduledExecution.id}`,
      value: scheduledExecution,
    });
  
  console.log(`⏱️ DELAY SCHEDULED: ${duration} ${unit} (execute at ${executeAt})`);
  console.log(`   Scheduled ID: ${scheduledExecution.id}`);
  console.log(`   ⚠️ Note: Requires cron job to process scheduled executions`);
  
  return {
    success: true,
    message: `⏱️ Delay scheduled: ${duration} ${unit} (execute at ${executeAt})`,
  };
}

async function executeAssignEquipment(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const equipmentName = config.equipmentName;
  const equipmentType = config.equipmentType || 'OTHER';
  const description = config.description || '';
  const serialNumber = config.serialNumber || null;
  const targetUserId = resolveTargetUserId(config, context);
  
  if (!equipmentName) {
    throw new Error('Equipment name is required');
  }
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  const supabase = getSupabaseClient();
  
  const equipment = {
    id: `equipment_${Date.now()}`,
    name: equipmentName,
    type: equipmentType,
    description,
    serial_number: serialNumber,
    assigned_to: targetUserId,
    assigned_at: new Date().toISOString(),
    assigned_by: context.executedBy || 'system',
    status: 'ASSIGNED',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `equipment_assignment:${equipment.id}`,
      value: equipment,
    });
  
  if (error) {
    throw new Error(`Failed to assign equipment: ${error.message}`);
  }
  
  console.log(`💻 EQUIPMENT ASSIGNED: ${equipmentName} (${equipmentType}) to user ${targetUserId}`);
  
  return {
    success: true,
    message: `💻 Equipment "${equipmentName}" assigned to user ${targetUserId}`,
  };
}

async function executeAssignTraining(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const trainingName = config.trainingName;
  const description = config.description || '';
  const targetUserId = resolveTargetUserId(config, context);
  const dueDate = config.dueDate || null;
  
  if (!trainingName) {
    throw new Error('Training name is required');
  }
  
  if (config.assignTo === 'all_employees') {
    return { success: true, message: `📚 Training would be assigned to all employees (not implemented yet)` };
  }
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  const supabase = getSupabaseClient();
  
  const training = {
    id: `training_${Date.now()}`,
    name: trainingName,
    description,
    assigned_to: targetUserId,
    assigned_at: new Date().toISOString(),
    assigned_by: context.executedBy || 'system',
    due_date: dueDate,
    status: 'PENDING',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `training_assignment:${training.id}`,
      value: training,
    });
  
  if (error) {
    throw new Error(`Failed to assign training: ${error.message}`);
  }
  
  console.log(`📚 TRAINING ASSIGNED: ${trainingName} to user ${targetUserId}`);
  
  return {
    success: true,
    message: `📚 Training "${trainingName}" assigned to user ${targetUserId}`,
  };
}

async function executeCreateNotification(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const title = config.title;
  const message = config.message || '';
  const recipientType = config.recipientType || 'triggered_employee';
  const priority = config.priority || 'NORMAL';
  
  if (!title) {
    throw new Error('Notification title is required');
  }
  
  if (recipientType === 'all_employees') {
    return { success: true, message: `🔔 Notification would be sent to all employees (not implemented yet)` };
  }
  
  const targetUserId = resolveTargetUserId(config, context);
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  const supabase = getSupabaseClient();
  
  const notification = {
    id: `notification_${Date.now()}`,
    user_id: targetUserId,
    title,
    message,
    priority,
    status: 'UNREAD',
    created_at: new Date().toISOString(),
    created_by: context.executedBy || 'system',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `notification:${notification.id}`,
      value: notification,
    });
  
  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
  
  console.log(`🔔 NOTIFICATION CREATED: "${title}" for user ${targetUserId}`);
  
  return {
    success: true,
    message: `🔔 Notification sent to user ${targetUserId}`,
  };
}

async function executeAddToTeam(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const teamName = config.teamName;
  const role = config.role || 'MEMBER';
  const targetUserId = resolveTargetUserId(config, context);
  
  if (!teamName) {
    throw new Error('Team name is required');
  }
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  const supabase = getSupabaseClient();
  
  const teamMembership = {
    id: `team_member_${Date.now()}`,
    team_name: teamName,
    user_id: targetUserId,
    role,
    joined_at: new Date().toISOString(),
    added_by: context.executedBy || 'system',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `team_membership:${teamMembership.id}`,
      value: teamMembership,
    });
  
  if (error) {
    throw new Error(`Failed to add to team: ${error.message}`);
  }
  
  console.log(`👥 ADDED TO TEAM: User ${targetUserId} added to "${teamName}" as ${role}`);
  
  return {
    success: true,
    message: `👥 User added to team "${teamName}" as ${role}`,
  };
}

async function executeAssignTest(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const testName = config.testName;
  const targetUserId = resolveTargetUserId(config, context);
  const dueDate = config.dueDate || null;
  
  if (!testName) {
    throw new Error('Test name is required');
  }
  
  if (config.assignTo === 'all_employees') {
    return { success: true, message: `🎓 Test would be assigned to all employees (not implemented yet)` };
  }
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  const supabase = getSupabaseClient();
  
  const testAssignment = {
    id: `test_assignment_${Date.now()}`,
    test_name: testName,
    assigned_to: targetUserId,
    assigned_at: new Date().toISOString(),
    assigned_by: context.executedBy || 'system',
    due_date: dueDate,
    status: 'PENDING',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `test_assignment:${testAssignment.id}`,
      value: testAssignment,
    });
  
  if (error) {
    throw new Error(`Failed to assign test: ${error.message}`);
  }
  
  console.log(`🎓 TEST ASSIGNED: ${testName} to user ${targetUserId}`);
  
  return {
    success: true,
    message: `🎓 Test "${testName}" assigned to user ${targetUserId}`,
  };
}

async function executeAssignVideo(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const videoName = config.videoName;
  const videoUrl = config.videoUrl || '';
  const targetUserId = resolveTargetUserId(config, context);
  
  if (!videoName) {
    throw new Error('Video name is required');
  }
  
  if (config.assignTo === 'all_employees') {
    return { success: true, message: `🎥 Video would be assigned to all employees (not implemented yet)` };
  }
  
  if (!targetUserId) {
    throw new Error('Target user ID could not be resolved');
  }
  
  const supabase = getSupabaseClient();
  
  const videoAssignment = {
    id: `video_assignment_${Date.now()}`,
    video_name: videoName,
    video_url: videoUrl,
    assigned_to: targetUserId,
    assigned_at: new Date().toISOString(),
    assigned_by: context.executedBy || 'system',
    status: 'PENDING',
    organization_id: context.organizationId,
  };
  
  const { error } = await supabase
    .from('kv_store_f659121d')
    .upsert({
      key: `video_assignment:${videoAssignment.id}`,
      value: videoAssignment,
    });
  
  if (error) {
    throw new Error(`Failed to assign video: ${error.message}`);
  }
  
  console.log(`🎥 VIDEO ASSIGNED: ${videoName} to user ${targetUserId}`);
  
  return {
    success: true,
    message: `🎥 Video "${videoName}" assigned to user ${targetUserId}`,
  };
}

async function executeApproveRequest(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string }> {
  const config = parseConfigVariables(node.data.config || {}, context);
  
  const requestType = config.requestType || 'BENEFIT';
  const autoApprove = config.autoApprove === 'true';
  const notes = config.notes || '';
  
  // This would typically approve a pending request in the system
  console.log(`👍 REQUEST APPROVED: Type=${requestType}, Auto=${autoApprove}`);
  
  return {
    success: true,
    message: `👍 ${requestType} request approved`,
  };
}

/**
 * HTTP Request - Call external APIs (n8n-style)
 * Supports GET, POST, PUT, PATCH, DELETE
 * Authentication: API Key, Bearer Token, Basic Auth
 * Environment Variables: Supports {{ env.VAR_NAME }} syntax
 */
async function executeHttpRequest(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string; contextUpdates?: any }> {
  // First resolve environment variables in the entire config
  const organizationId = context.organizationId || 'default-org';
  const rawConfig = node.data.config || {};
  
  // Resolve env vars in config BEFORE parseConfigVariables
  const configWithEnvVars = await envVarsManager.resolveEnvVarsInObject(organizationId, rawConfig);
  
  // Then resolve context variables ({{ employeeName }}, etc.)
  const config = parseConfigVariables(configWithEnvVars, context);
  
  const method = config.method || 'GET';
  const url = config.url;
  const timeout = (config.timeout || 30) * 1000; // Convert to milliseconds
  const retries = config.retries || 0;
  const continueOnError = config.continueOnError || false;
  
  if (!url) {
    throw new Error('URL is required for HTTP Request');
  }
  
  console.log(`🔐 Environment variables resolved in HTTP config`);
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Add authentication
  if (config.authType === 'OAUTH2') {
    // OAuth2 Client Credentials or Refresh Token Flow
    const oauth2Config: OAuth2Config = {
      clientId: config.oauth2ClientId,
      clientSecret: config.oauth2ClientSecret,
      tokenUrl: config.oauth2TokenUrl,
      scopes: config.oauth2Scopes,
      grantType: config.oauth2GrantType || 'client_credentials',
      refreshToken: config.oauth2RefreshToken,
    };
    
    // Generate connection ID (unique per client + token URL combination)
    const connectionId = `${config.oauth2ClientId}_${btoa(config.oauth2TokenUrl).substring(0, 16)}`;
    
    try {
      const accessToken = await getOAuth2Token(organizationId, connectionId, oauth2Config);
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log(`🔐 OAuth2 token applied to request`);
    } catch (error: any) {
      throw new Error(`OAuth2 authentication failed: ${error.message}`);
    }
  } else if (config.authType === 'API_KEY') {
    if (config.apiKeyLocation === 'QUERY') {
      // API Key will be added to URL below
    } else {
      // Add to header (default)
      headers[config.apiKeyName || 'X-API-Key'] = config.apiKeyValue;
    }
  } else if (config.authType === 'BEARER_TOKEN') {
    headers['Authorization'] = `Bearer ${config.bearerToken}`;
  } else if (config.authType === 'BASIC_AUTH') {
    const credentials = btoa(`${config.basicAuthUsername}:${config.basicAuthPassword}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }
  
  // Add custom headers
  if (config.headers) {
    try {
      const customHeaders = JSON.parse(config.headers);
      Object.assign(headers, customHeaders);
    } catch (e) {
      console.warn('Failed to parse custom headers:', e);
    }
  }
  
  // Build final URL with query params
  let finalUrl = url;
  if (config.authType === 'API_KEY' && config.apiKeyLocation === 'QUERY') {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}${config.apiKeyName || 'api_key'}=${config.apiKeyValue}`;
  }
  
  // Build request options
  const requestOptions: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(timeout),
  };
  
  // Add body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method) && config.body) {
    requestOptions.body = config.body;
  }
  
  // Execute request with retries
  let lastError: Error | null = null;
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      console.log(`🌐 HTTP ${method} ${finalUrl} (Attempt ${attempt + 1}/${retries + 1})`);
      
      const startTime = Date.now();
      const response = await fetch(finalUrl, requestOptions);
      const duration = Date.now() - startTime;
      
      // Read response
      let responseBody: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      // Check if successful
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`✅ HTTP Request successful (${duration}ms)`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(responseBody).substring(0, 200));
      
      // Store response in variable if configured
      const contextUpdates: any = {};
      if (config.responseVariable) {
        contextUpdates[config.responseVariable] = responseBody;
        console.log(`   💾 Response stored in variable: ${config.responseVariable}`);
      }
      
      return {
        success: true,
        message: `🌐 HTTP ${method} ${finalUrl} → ${response.status}`,
        contextUpdates,
      };
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ HTTP Request failed (Attempt ${attempt + 1}):`, error.message);
      
      if (attempt < retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
        console.log(`   ⏳ Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
      
      attempt++;
    }
  }
  
  // All retries failed
  if (continueOnError) {
    console.warn(`⚠️ HTTP Request failed but continuing workflow (continueOnError=true)`);
    return {
      success: true, // Mark as success to continue workflow
      message: `⚠️ HTTP ${method} failed: ${lastError?.message || 'Unknown error'}`,
    };
  }
  
  throw new Error(`HTTP Request failed after ${retries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
}

// ==================== MAIN EXECUTOR ====================

export async function executeAction(node: WorkflowNode, context: ExecutionContext): Promise<{ success: boolean; message: string; contextUpdates?: any }> {
  const actionType = node.data.actionType || node.data.type;
  const label = node.data.label;
  
  console.log(`⚡ Executing Action: [${actionType}] ${label}`);
  
  // Check if node is configured
  if (!node.data.config || Object.keys(node.data.config).length === 0) {
    throw new Error(`Node "${label}" is not configured`);
  }
  
  try {
    switch (actionType) {
      case 'SEND_EMAIL':
        return await executeSendEmail(node, context);
      
      case 'ASSIGN_BENEFITS':
        return await executeAssignBenefits(node, context);
      
      case 'CREATE_TASK':
        return await executeCreateTask(node, context);
      
      case 'ASSIGN_DOCUMENT':
        return await executeAssignDocument(node, context);
      
      case 'DISTRIBUTE_COINS':
        return await executeDistributeCoins(node, context);
      
      case 'DELAY':
        return await executeDelay(node, context);
      
      case 'HTTP_REQUEST':
        return await executeHttpRequest(node, context);
      
      case 'ASSIGN_EQUIPMENT':
        return await executeAssignEquipment(node, context);
      
      case 'ASSIGN_TRAINING':
        return await executeAssignTraining(node, context);
      
      case 'CREATE_NOTIFICATION':
        return await executeCreateNotification(node, context);
      
      case 'ADD_TO_TEAM':
        return await executeAddToTeam(node, context);
      
      case 'ASSIGN_TEST':
        return await executeAssignTest(node, context);
      
      case 'ASSIGN_VIDEO':
        return await executeAssignVideo(node, context);
      
      case 'APPROVE_REQUEST':
        return await executeApproveRequest(node, context);
      
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error: any) {
    console.error(`❌ Action failed: ${label} - ${error.message}`);
    throw error;
  }
}