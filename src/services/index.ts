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
export { AuthService } from './BrowoKo_authService';
export { UserService } from './BrowoKo_userService';
export { TeamService } from './BrowoKo_teamService';
export { LeaveService } from './BrowoKo_leaveService';
export { LearningService } from './BrowoKo_learningService';
export { OrganigramService } from './BrowoKo_organigramService';
export { DocumentService } from './BrowoKo_documentService';
export { DocumentAuditService } from './BrowoKo_documentAuditService';
export { AnnouncementService } from './BrowoKo_announcementService';
export { RealtimeService } from './BrowoKo_realtimeService';

// Services container type
export interface Services {
  auth: import('./BrowoKo_authService').AuthService;
  user: import('./BrowoKo_userService').UserService;
  team: import('./BrowoKo_teamService').TeamService;
  leave: import('./BrowoKo_leaveService').LeaveService;
  learning: import('./BrowoKo_learningService').LearningService;
  organigram: import('./BrowoKo_organigramService').OrganigramService;
  document: import('./BrowoKo_documentService').DocumentService;
  documentAudit: import('./BrowoKo_documentAuditService').DocumentAuditService;
  announcement: import('./BrowoKo_announcementService').AnnouncementService;
  realtime: import('./BrowoKo_realtimeService').RealtimeService;
}

/**
 * CREATE SERVICES
 * ===============
 * Factory function to create all services with a Supabase client
 * 
 * This ensures all services share the same Supabase client instance.
 */
export function createServices(supabase: SupabaseClient): Services {
  const { AuthService } = require('./BrowoKo_authService');
  const { UserService } = require('./BrowoKo_userService');
  const { TeamService } = require('./BrowoKo_teamService');
  const { LeaveService } = require('./BrowoKo_leaveService');
  const { LearningService } = require('./BrowoKo_learningService');
  const { OrganigramService } = require('./BrowoKo_organigramService');
  const { DocumentService } = require('./BrowoKo_documentService');
  const { DocumentAuditService } = require('./BrowoKo_documentAuditService');
  const { AnnouncementService } = require('./BrowoKo_announcementService');
  const { RealtimeService } = require('./BrowoKo_realtimeService');
  
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
