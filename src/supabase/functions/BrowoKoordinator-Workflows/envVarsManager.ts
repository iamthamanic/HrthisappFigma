/**
 * Environment Variables Manager
 * Handles CRUD operations for secure environment variable storage
 */

import * as kv from './kv_store.tsx';
import type { EnvironmentVariable, EnvironmentVariableInput } from './types.ts';

const ENV_VAR_PREFIX = 'env_var:';

/**
 * Simple encryption (Base64 encoding)
 * NOTE: In production, use proper encryption with a secret key
 */
function encrypt(value: string): string {
  try {
    return btoa(value);
  } catch (error) {
    console.error('Encryption error:', error);
    return value;
  }
}

/**
 * Simple decryption (Base64 decoding)
 */
function decrypt(value: string): string {
  try {
    return atob(value);
  } catch (error) {
    console.error('Decryption error:', error);
    return value;
  }
}

/**
 * Get all environment variables for an organization
 */
export async function getAllEnvVars(organizationId: string): Promise<EnvironmentVariable[]> {
  const prefix = `${ENV_VAR_PREFIX}${organizationId}:`;
  const results = await kv.getByPrefix(prefix); // Returns Array<EnvironmentVariable> directly
  
  // results is already an array of EnvironmentVariable objects
  return (results as EnvironmentVariable[]).map((variable) => ({
    ...variable,
    value: decrypt(variable.value)
  }));
}

/**
 * Get a specific environment variable
 */
export async function getEnvVar(
  organizationId: string,
  id: string
): Promise<EnvironmentVariable | null> {
  const key = `${ENV_VAR_PREFIX}${organizationId}:${id}`;
  const result = await kv.get(key);
  
  if (!result) {
    return null;
  }
  
  const variable = result as EnvironmentVariable;
  return {
    ...variable,
    value: decrypt(variable.value)
  };
}

/**
 * Create a new environment variable
 */
export async function createEnvVar(
  organizationId: string,
  input: EnvironmentVariableInput
): Promise<EnvironmentVariable> {
  // Validate key format
  if (!/^[A-Z0-9_]+$/.test(input.key)) {
    throw new Error('Key must contain only uppercase letters, numbers, and underscores');
  }
  
  // Check if key already exists
  const existing = await getAllEnvVars(organizationId);
  if (existing.some(v => v.key === input.key)) {
    throw new Error(`Environment variable with key "${input.key}" already exists`);
  }
  
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const variable: EnvironmentVariable = {
    id,
    organizationId,
    key: input.key,
    value: encrypt(input.value), // Encrypt before storage
    description: input.description,
    createdAt: now,
    updatedAt: now
  };
  
  const storageKey = `${ENV_VAR_PREFIX}${organizationId}:${id}`;
  await kv.set(storageKey, variable);
  
  // Return with decrypted value
  return {
    ...variable,
    value: input.value
  };
}

/**
 * Update an environment variable
 */
export async function updateEnvVar(
  organizationId: string,
  id: string,
  input: Partial<EnvironmentVariableInput>
): Promise<EnvironmentVariable> {
  const existing = await getEnvVar(organizationId, id);
  
  if (!existing) {
    throw new Error('Environment variable not found');
  }
  
  // If updating key, validate format and uniqueness
  if (input.key && input.key !== existing.key) {
    if (!/^[A-Z0-9_]+$/.test(input.key)) {
      throw new Error('Key must contain only uppercase letters, numbers, and underscores');
    }
    
    const allVars = await getAllEnvVars(organizationId);
    if (allVars.some(v => v.id !== id && v.key === input.key)) {
      throw new Error(`Environment variable with key "${input.key}" already exists`);
    }
  }
  
  const updated: EnvironmentVariable = {
    ...existing,
    key: input.key ?? existing.key,
    value: input.value ? encrypt(input.value) : existing.value,
    description: input.description !== undefined ? input.description : existing.description,
    updatedAt: new Date().toISOString()
  };
  
  const storageKey = `${ENV_VAR_PREFIX}${organizationId}:${id}`;
  await kv.set(storageKey, updated);
  
  // Return with decrypted value
  return {
    ...updated,
    value: decrypt(updated.value)
  };
}

/**
 * Delete an environment variable
 */
export async function deleteEnvVar(
  organizationId: string,
  id: string
): Promise<void> {
  const storageKey = `${ENV_VAR_PREFIX}${organizationId}:${id}`;
  await kv.del(storageKey);
}

/**
 * Resolve environment variables in a string
 * Replaces {{ env.VAR_NAME }} with actual values
 */
export async function resolveEnvVars(
  organizationId: string,
  input: string
): Promise<string> {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  // Find all {{ env.VAR_NAME }} patterns
  const envVarPattern = /\{\{\s*env\.([A-Z0-9_]+)\s*\}\}/g;
  const matches = Array.from(input.matchAll(envVarPattern));
  
  if (matches.length === 0) {
    return input;
  }
  
  // Get all env vars once
  const allVars = await getAllEnvVars(organizationId);
  const varMap = new Map(allVars.map(v => [v.key, v.value]));
  
  // Replace all occurrences
  let result = input;
  for (const match of matches) {
    const fullMatch = match[0]; // {{ env.VAR_NAME }}
    const varName = match[1]; // VAR_NAME
    const value = varMap.get(varName);
    
    if (value !== undefined) {
      result = result.replace(fullMatch, value);
    } else {
      console.warn(`Environment variable not found: ${varName}`);
      // Keep the placeholder if variable not found
    }
  }
  
  return result;
}

/**
 * Resolve environment variables in an object recursively
 */
export async function resolveEnvVarsInObject(
  organizationId: string,
  obj: any
): Promise<any> {
  if (typeof obj === 'string') {
    return await resolveEnvVars(organizationId, obj);
  }
  
  if (Array.isArray(obj)) {
    return await Promise.all(
      obj.map(item => resolveEnvVarsInObject(organizationId, item))
    );
  }
  
  if (obj && typeof obj === 'object') {
    const resolved: any = {};
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = await resolveEnvVarsInObject(organizationId, value);
    }
    return resolved;
  }
  
  return obj;
}