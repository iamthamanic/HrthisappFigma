/**
 * Types for BrowoKoordinator-Workflows Edge Function
 */

export interface EnvironmentVariable {
  id: string;
  organizationId: string;
  key: string;
  value: string;              // verschlüsselt gespeichert
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentVariableInput {
  key: string;
  value: string;
  description?: string | null;
}
