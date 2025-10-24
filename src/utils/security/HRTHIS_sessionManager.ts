/**
 * @file HRTHIS_sessionManager.ts
 * @domain Security - Session Management
 * @description Secure session handling with timeout, refresh, and multi-session support
 * @namespace HRTHIS_
 * @created Phase 4 Priority 3 - Authentication Security
 */

import { supabase } from '../supabase/client';

// ========================================
// SESSION CONFIGURATION
// ========================================

const SESSION_CONFIG = {
  // Session timeout: 8 hours (work day)
  SESSION_TIMEOUT_MS: 8 * 60 * 60 * 1000,
  
  // Idle timeout: 30 minutes
  IDLE_TIMEOUT_MS: 30 * 60 * 1000,
  
  // Token refresh interval: 50 minutes (before 60min expiry)
  TOKEN_REFRESH_INTERVAL_MS: 50 * 60 * 1000,
  
  // Warning before logout: 5 minutes
  WARNING_BEFORE_LOGOUT_MS: 5 * 60 * 1000,
  
  // Activity events to track
  ACTIVITY_EVENTS: ['mousedown', 'keydown', 'scroll', 'touchstart'],
  
  // LocalStorage keys
  STORAGE_KEYS: {
    LAST_ACTIVITY: 'hrthis_last_activity',
    SESSION_START: 'hrthis_session_start',
    WARNED: 'hrthis_session_warned',
  },
} as const;

// ========================================
// SESSION MANAGER CLASS
// ========================================

export class SessionManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private warningCallback: (() => void) | null = null;
  private logoutCallback: (() => void) | null = null;
  private lastActivity: number = Date.now();
  
  /**
   * Initialize session management
   */
  public initialize(options?: {
    onWarning?: () => void;
    onLogout?: () => void;
  }) {
    console.log('🔐 SessionManager: Initializing...');
    
    this.warningCallback = options?.onWarning || null;
    this.logoutCallback = options?.onLogout || null;
    
    // Set session start time
    this.setSessionStart();
    
    // Update last activity
    this.updateActivity();
    
    // Start token refresh timer
    this.startTokenRefresh();
    
    // Start activity monitoring
    this.startActivityMonitoring();
    
    // Listen for storage events (multi-tab sync)
    this.setupStorageListener();
    
    console.log('✅ SessionManager: Initialized');
  }
  
  /**
   * Cleanup on logout/unmount
   */
  public cleanup() {
    console.log('🧹 SessionManager: Cleaning up...');
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
    
    this.removeActivityListeners();
    this.clearSessionData();
  }
  
  /**
   * Start automatic token refresh
   */
  private startTokenRefresh() {
    console.log('🔄 SessionManager: Starting token refresh timer...');
    
    this.refreshTimer = setInterval(async () => {
      try {
        console.log('🔄 SessionManager: Refreshing token...');
        
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('❌ SessionManager: Token refresh failed:', error);
          this.handleSessionExpired();
          return;
        }
        
        if (data?.session) {
          console.log('✅ SessionManager: Token refreshed successfully');
        }
      } catch (error) {
        console.error('❌ SessionManager: Token refresh error:', error);
      }
    }, SESSION_CONFIG.TOKEN_REFRESH_INTERVAL_MS);
  }
  
  /**
   * Start activity monitoring for idle timeout
   */
  private startActivityMonitoring() {
    console.log('👀 SessionManager: Starting activity monitoring...');
    
    // Add event listeners
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, this.handleActivity, { passive: true });
    });
    
    // Check activity every minute
    this.activityTimer = setInterval(() => {
      this.checkIdleTimeout();
    }, 60 * 1000); // Check every 1 minute
  }
  
  /**
   * Handle user activity
   */
  private handleActivity = () => {
    this.updateActivity();
    
    // Reset warning if user became active again
    const warned = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.WARNED);
    if (warned === 'true') {
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.WARNED);
    }
  };
  
  /**
   * Update last activity timestamp
   */
  private updateActivity() {
    this.lastActivity = Date.now();
    localStorage.setItem(
      SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY,
      this.lastActivity.toString()
    );
  }
  
  /**
   * Check for idle timeout
   */
  private checkIdleTimeout() {
    const now = Date.now();
    const lastActivity = parseInt(
      localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY) || '0'
    );
    
    if (!lastActivity) return;
    
    const idleTime = now - lastActivity;
    const timeUntilTimeout = SESSION_CONFIG.IDLE_TIMEOUT_MS - idleTime;
    
    // Warn user 5 minutes before logout
    if (
      timeUntilTimeout <= SESSION_CONFIG.WARNING_BEFORE_LOGOUT_MS &&
      timeUntilTimeout > 0
    ) {
      const warned = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.WARNED);
      if (warned !== 'true') {
        console.log('⚠️ SessionManager: Idle timeout warning');
        localStorage.setItem(SESSION_CONFIG.STORAGE_KEYS.WARNED, 'true');
        this.warningCallback?.();
      }
    }
    
    // Logout if idle timeout exceeded
    if (idleTime >= SESSION_CONFIG.IDLE_TIMEOUT_MS) {
      console.log('⏱️ SessionManager: Idle timeout - logging out');
      this.handleSessionExpired();
    }
  }
  
  /**
   * Check for absolute session timeout
   */
  private checkSessionTimeout() {
    const sessionStart = parseInt(
      localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_START) || '0'
    );
    
    if (!sessionStart) return false;
    
    const sessionDuration = Date.now() - sessionStart;
    
    if (sessionDuration >= SESSION_CONFIG.SESSION_TIMEOUT_MS) {
      console.log('⏱️ SessionManager: Session timeout exceeded');
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle session expired
   */
  private handleSessionExpired() {
    console.log('🚪 SessionManager: Session expired - logging out');
    this.cleanup();
    this.logoutCallback?.();
  }
  
  /**
   * Setup storage event listener for multi-tab sync
   */
  private setupStorageListener() {
    window.addEventListener('storage', (e) => {
      // Detect logout in another tab
      if (e.key === 'supabase.auth.token' && e.newValue === null) {
        console.log('🔓 SessionManager: Logout detected in another tab');
        this.handleSessionExpired();
      }
    });
  }
  
  /**
   * Remove activity listeners
   */
  private removeActivityListeners() {
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, this.handleActivity);
    });
  }
  
  /**
   * Set session start time
   */
  private setSessionStart() {
    const existing = localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_START);
    if (!existing) {
      localStorage.setItem(
        SESSION_CONFIG.STORAGE_KEYS.SESSION_START,
        Date.now().toString()
      );
    }
  }
  
  /**
   * Clear session data
   */
  private clearSessionData() {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY);
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_START);
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.WARNED);
  }
  
  /**
   * Extend session (on user action)
   */
  public extendSession() {
    console.log('⏱️ SessionManager: Extending session');
    this.updateActivity();
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEYS.WARNED);
  }
  
  /**
   * Get session info
   */
  public getSessionInfo() {
    const sessionStart = parseInt(
      localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.SESSION_START) || '0'
    );
    const lastActivity = parseInt(
      localStorage.getItem(SESSION_CONFIG.STORAGE_KEYS.LAST_ACTIVITY) || '0'
    );
    
    const now = Date.now();
    
    return {
      sessionDuration: sessionStart ? now - sessionStart : 0,
      idleTime: lastActivity ? now - lastActivity : 0,
      timeUntilIdleTimeout: lastActivity 
        ? Math.max(0, SESSION_CONFIG.IDLE_TIMEOUT_MS - (now - lastActivity))
        : 0,
      timeUntilSessionTimeout: sessionStart
        ? Math.max(0, SESSION_CONFIG.SESSION_TIMEOUT_MS - (now - sessionStart))
        : 0,
    };
  }
  
  /**
   * Logout all sessions (current user)
   */
  public async logoutAllSessions() {
    console.log('🚪 SessionManager: Logging out all sessions...');
    
    try {
      // Sign out from Supabase (invalidates all tokens)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ SessionManager: Logout all failed:', error);
        throw error;
      }
      
      this.cleanup();
      console.log('✅ SessionManager: All sessions logged out');
    } catch (error) {
      console.error('❌ SessionManager: Logout all error:', error);
      throw error;
    }
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

export const sessionManager = new SessionManager();

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m`;
}

/**
 * Check if session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ========================================
// EXPORTS
// ========================================

export default sessionManager;
export { SESSION_CONFIG };
