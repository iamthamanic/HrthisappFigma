/**
 * @file BrowoKo_bruteForceProtection.ts
 * @domain Security - Brute-Force Protection
 * @description Protection against brute-force login attacks with progressive delays and lockout
 * @namespace BrowoKo_
 * @created Phase 4 Priority 3 - Authentication Security
 */

// ========================================
// BRUTE-FORCE CONFIGURATION
// ========================================

const BRUTE_FORCE_CONFIG = {
  // Maximum login attempts before lockout
  MAX_ATTEMPTS: 5,
  
  // Lockout duration in milliseconds (15 minutes)
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  
  // Progressive delay multiplier (seconds)
  DELAY_BASE_SECONDS: 2,
  
  // Time window for tracking attempts (1 hour)
  ATTEMPT_WINDOW_MS: 60 * 60 * 1000,
  
  // Storage key prefix
  STORAGE_PREFIX: 'browoko_login_',
} as const;

// ========================================
// TYPES
// ========================================

interface LoginAttempt {
  timestamp: number;
  email: string;
}

interface LockoutInfo {
  lockedUntil: number;
  attempts: number;
  email: string;
}

interface BruteForceStatus {
  isLocked: boolean;
  attemptsRemaining: number;
  lockoutEndsAt: number | null;
  nextDelay: number;
}

// ========================================
// BRUTE-FORCE PROTECTION CLASS
// ========================================

export class BruteForceProtection {
  /**
   * Record a login attempt
   */
  public recordAttempt(email: string): void {
    const normalizedEmail = this.normalizeEmail(email);
    const key = this.getStorageKey(normalizedEmail);
    
    // Get existing attempts
    const attempts = this.getAttempts(normalizedEmail);
    
    // Add new attempt
    attempts.push({
      timestamp: Date.now(),
      email: normalizedEmail,
    });
    
    // Clean old attempts (outside time window)
    const validAttempts = this.cleanOldAttempts(attempts);
    
    // Save to storage
    localStorage.setItem(key, JSON.stringify(validAttempts));
    
    console.log(`🔒 BruteForce: Recorded attempt for ${normalizedEmail} (${validAttempts.length}/${BRUTE_FORCE_CONFIG.MAX_ATTEMPTS})`);
    
    // Check if should lock
    if (validAttempts.length >= BRUTE_FORCE_CONFIG.MAX_ATTEMPTS) {
      this.lockAccount(normalizedEmail, validAttempts.length);
    }
  }
  
  /**
   * Clear attempts on successful login
   */
  public clearAttempts(email: string): void {
    const normalizedEmail = this.normalizeEmail(email);
    const attemptKey = this.getStorageKey(normalizedEmail);
    const lockoutKey = this.getLockoutKey(normalizedEmail);
    
    localStorage.removeItem(attemptKey);
    localStorage.removeItem(lockoutKey);
    
    console.log(`✅ BruteForce: Cleared attempts for ${normalizedEmail}`);
  }
  
  /**
   * Check if account is locked
   */
  public isLocked(email: string): boolean {
    const normalizedEmail = this.normalizeEmail(email);
    const lockoutInfo = this.getLockoutInfo(normalizedEmail);
    
    if (!lockoutInfo) return false;
    
    // Check if lockout has expired
    if (Date.now() >= lockoutInfo.lockedUntil) {
      this.unlockAccount(normalizedEmail);
      return false;
    }
    
    return true;
  }
  
  /**
   * Get brute-force status for an email
   */
  public getStatus(email: string): BruteForceStatus {
    const normalizedEmail = this.normalizeEmail(email);
    const attempts = this.getAttempts(normalizedEmail);
    const validAttempts = this.cleanOldAttempts(attempts);
    const lockoutInfo = this.getLockoutInfo(normalizedEmail);
    
    // Check if locked
    const isLocked = this.isLocked(normalizedEmail);
    
    return {
      isLocked,
      attemptsRemaining: Math.max(0, BRUTE_FORCE_CONFIG.MAX_ATTEMPTS - validAttempts.length),
      lockoutEndsAt: lockoutInfo?.lockedUntil || null,
      nextDelay: this.calculateDelay(validAttempts.length),
    };
  }
  
  /**
   * Get progressive delay for next attempt
   */
  public getDelay(email: string): number {
    const normalizedEmail = this.normalizeEmail(email);
    const attempts = this.getAttempts(normalizedEmail);
    const validAttempts = this.cleanOldAttempts(attempts);
    
    return this.calculateDelay(validAttempts.length);
  }
  
  /**
   * Calculate progressive delay based on attempts
   */
  private calculateDelay(attemptCount: number): number {
    if (attemptCount === 0) return 0;
    
    // Progressive delay: 2s, 4s, 8s, 16s, 32s
    return Math.min(
      BRUTE_FORCE_CONFIG.DELAY_BASE_SECONDS * Math.pow(2, attemptCount - 1),
      60 // Max 60 seconds
    ) * 1000;
  }
  
  /**
   * Lock account
   */
  private lockAccount(email: string, attemptCount: number): void {
    const key = this.getLockoutKey(email);
    const lockedUntil = Date.now() + BRUTE_FORCE_CONFIG.LOCKOUT_DURATION_MS;
    
    const lockoutInfo: LockoutInfo = {
      lockedUntil,
      attempts: attemptCount,
      email,
    };
    
    localStorage.setItem(key, JSON.stringify(lockoutInfo));
    
    console.log(`🔒 BruteForce: Account locked for ${email} until ${new Date(lockedUntil).toLocaleTimeString()}`);
  }
  
  /**
   * Unlock account
   */
  private unlockAccount(email: string): void {
    const attemptKey = this.getStorageKey(email);
    const lockoutKey = this.getLockoutKey(email);
    
    localStorage.removeItem(attemptKey);
    localStorage.removeItem(lockoutKey);
    
    console.log(`🔓 BruteForce: Account unlocked for ${email}`);
  }
  
  /**
   * Get login attempts for email
   */
  private getAttempts(email: string): LoginAttempt[] {
    const key = this.getStorageKey(email);
    const data = localStorage.getItem(key);
    
    if (!data) return [];
    
    try {
      return JSON.parse(data) as LoginAttempt[];
    } catch {
      return [];
    }
  }
  
  /**
   * Get lockout info for email
   */
  private getLockoutInfo(email: string): LockoutInfo | null {
    const key = this.getLockoutKey(email);
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data) as LockoutInfo;
    } catch {
      return null;
    }
  }
  
  /**
   * Clean attempts outside time window
   */
  private cleanOldAttempts(attempts: LoginAttempt[]): LoginAttempt[] {
    const cutoff = Date.now() - BRUTE_FORCE_CONFIG.ATTEMPT_WINDOW_MS;
    return attempts.filter(attempt => attempt.timestamp >= cutoff);
  }
  
  /**
   * Normalize email (lowercase, trim)
   */
  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
  
  /**
   * Get storage key for attempts
   */
  private getStorageKey(email: string): string {
    return `${BRUTE_FORCE_CONFIG.STORAGE_PREFIX}attempts_${email}`;
  }
  
  /**
   * Get storage key for lockout
   */
  private getLockoutKey(email: string): string {
    return `${BRUTE_FORCE_CONFIG.STORAGE_PREFIX}lockout_${email}`;
  }
  
  /**
   * Format lockout time remaining
   */
  public formatLockoutTime(email: string): string {
    const lockoutInfo = this.getLockoutInfo(email);
    
    if (!lockoutInfo) return '';
    
    const remaining = lockoutInfo.lockedUntil - Date.now();
    
    if (remaining <= 0) return '';
    
    const minutes = Math.ceil(remaining / 60000);
    
    if (minutes < 1) return 'weniger als 1 Minute';
    if (minutes === 1) return '1 Minute';
    
    return `${minutes} Minuten`;
  }
  
  /**
   * Clean up all brute-force data (admin function)
   */
  public cleanupAll(): void {
    const keys = Object.keys(localStorage);
    const bruteForceKeys = keys.filter(key => 
      key.startsWith(BRUTE_FORCE_CONFIG.STORAGE_PREFIX)
    );
    
    bruteForceKeys.forEach(key => localStorage.removeItem(key));
    
    console.log(`🧹 BruteForce: Cleaned up ${bruteForceKeys.length} entries`);
  }
  
  /**
   * Get all locked accounts (for monitoring)
   */
  public getLockedAccounts(): Array<{ email: string; lockedUntil: number }> {
    const keys = Object.keys(localStorage);
    const lockoutKeys = keys.filter(key => 
      key.startsWith(BRUTE_FORCE_CONFIG.STORAGE_PREFIX) && 
      key.includes('lockout_')
    );
    
    const locked: Array<{ email: string; lockedUntil: number }> = [];
    
    lockoutKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (!data) return;
      
      try {
        const lockoutInfo = JSON.parse(data) as LockoutInfo;
        
        // Only include if still locked
        if (Date.now() < lockoutInfo.lockedUntil) {
          locked.push({
            email: lockoutInfo.email,
            lockedUntil: lockoutInfo.lockedUntil,
          });
        }
      } catch {
        // Ignore invalid data
      }
    });
    
    return locked;
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

export const bruteForceProtection = new BruteForceProtection();

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format delay in human-readable format
 */
export function formatDelay(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  
  if (seconds < 60) {
    return `${seconds} Sekunde${seconds === 1 ? '' : 'n'}`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} Minute${minutes === 1 ? '' : 'n'}`;
  }
  
  return `${minutes} Minute${minutes === 1 ? '' : 'n'} und ${remainingSeconds} Sekunde${remainingSeconds === 1 ? '' : 'n'}`;
}

/**
 * Wait for progressive delay
 */
export async function waitForDelay(ms: number): Promise<void> {
  if (ms <= 0) return;
  
  console.log(`⏱️ BruteForce: Waiting ${formatDelay(ms)}...`);
  
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// ========================================
// EXPORTS
// ========================================

export default bruteForceProtection;
export { BRUTE_FORCE_CONFIG };
export type { BruteForceStatus, LoginAttempt, LockoutInfo };
