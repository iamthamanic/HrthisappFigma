/**
 * SERVICES INDEX
 * ==============
 * Central export point for all services
 * 
 * Usage:
 * ```typescript
 * import { AuthService, createServices } from '../services';
 * 
 * const services = createServices(supabase);
 * const user = await services.auth.signIn(email, password);
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Base exports
export * from './base/ApiError';
export * from './base/ApiService';

// Domain service exports
export { AuthService } from './HRTHIS_authService';
export { UserService } from './HRTHIS_userService';
export { TeamService } from './HRTHIS_teamService';
export { LeaveService } from './HRTHIS_leaveService';
export { LearningService } from './HRTHIS_learningService';
export { OrganigramService } from './HRTHIS_organigramService';
export { DocumentService } from './HRTHIS_documentService';
export { DocumentAuditService } from './HRTHIS_documentAuditService';
export { AnnouncementService } from './HRTHIS_announcementService';
export { RealtimeService } from './HRTHIS_realtimeService';

// Services container type
export interface Services {
  auth: import('./HRTHIS_authService').AuthService;
  user: import('./HRTHIS_userService').UserService;
  team: import('./HRTHIS_teamService').TeamService;
  leave: import('./HRTHIS_leaveService').LeaveService;
  learning: import('./HRTHIS_learningService').LearningService;
  organigram: import('./HRTHIS_organigramService').OrganigramService;
  document: import('./HRTHIS_documentService').DocumentService;
  documentAudit: import('./HRTHIS_documentAuditService').DocumentAuditService;
  announcement: import('./HRTHIS_announcementService').AnnouncementService;
  realtime: import('./HRTHIS_realtimeService').RealtimeService;
}

/**
 * CREATE SERVICES
 * ===============
 * Factory function to create all services with a Supabase client
 * 
 * This ensures all services share the same Supabase client instance.
 */
export function createServices(supabase: SupabaseClient): Services {
  const { AuthService } = require('./HRTHIS_authService');
  const { UserService } = require('./HRTHIS_userService');
  const { TeamService } = require('./HRTHIS_teamService');
  const { LeaveService } = require('./HRTHIS_leaveService');
  const { LearningService } = require('./HRTHIS_learningService');
  const { OrganigramService } = require('./HRTHIS_organigramService');
  const { DocumentService } = require('./HRTHIS_documentService');
  const { DocumentAuditService } = require('./HRTHIS_documentAuditService');
  const { AnnouncementService } = require('./HRTHIS_announcementService');
  const { RealtimeService } = require('./HRTHIS_realtimeService');
  
  return {
    auth: new AuthService(supabase),
    user: new UserService(supabase),
    team: new TeamService(supabase),
    leave: new LeaveService(supabase),
    learning: new LearningService(supabase),
    organigram: new OrganigramService(supabase),
    document: new DocumentService(supabase),
    documentAudit: new DocumentAuditService(supabase),
    announcement: new AnnouncementService(supabase),
    realtime: new RealtimeService(supabase),
  };
}

/**
 * SINGLETON SERVICES INSTANCE
 * ===========================
 * Create services once and reuse
 * 
 * Usage:
 * ```typescript
 * import { getServices } from '../services';
 * 
 * const services = getServices();
 * await services.auth.signIn(email, password);
 * ```
 */
let servicesInstance: Services | null = null;
let supabaseClient: SupabaseClient | null = null;

export function getServices(): Services {
  if (!servicesInstance) {
    console.log('[getServices] 🔄 Initializing services...');
    
    // Lazy load the supabase client to avoid circular dependencies
    if (!supabaseClient) {
      console.log('[getServices] 📦 Loading Supabase client...');
      try {
        const clientModule = require('../utils/supabase/client');
        supabaseClient = clientModule.supabase;
        console.log('[getServices] ✅ Client loaded:', {
          hasClient: !!supabaseClient,
          hasFrom: typeof supabaseClient?.from === 'function',
        });
      } catch (error) {
        console.error('[getServices] ❌ Failed to load client:', error);
        throw new Error('Failed to load Supabase client');
      }
    }
    
    if (!supabaseClient) {
      console.error('[getServices] ❌ FATAL: Supabase client is undefined!');
      throw new Error('Supabase client initialization failed - client is undefined');
    }
    
    if (typeof supabaseClient.from !== 'function') {
      console.error('[getServices] ❌ FATAL: Supabase client is invalid!', supabaseClient);
      throw new Error('Supabase client initialization failed - missing required methods');
    }
    
    console.log('[getServices] ✅ Creating services with validated client...');
    servicesInstance = createServices(supabaseClient);
    console.log('[getServices] ✅ Services created successfully!');
  }
  return servicesInstance;
}

/**
 * RESET SERVICES
 * ==============
 * Reset the singleton instance (useful for testing)
 */
export function resetServices(): void {
  servicesInstance = null;
}
