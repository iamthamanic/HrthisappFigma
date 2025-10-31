/**
 * BrowoKoordinator - Shared Types
 * 
 * Common types used across Edge Functions
 */

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  function: string;
  timestamp: string;
  version: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type UserRole = 'USER' | 'TEAMLEAD' | 'HR' | 'ADMIN' | 'SUPERADMIN' | 'EXTERN';

export interface RequestContext {
  userId: string;
  userRole?: UserRole;
  organizationId?: string;
}
