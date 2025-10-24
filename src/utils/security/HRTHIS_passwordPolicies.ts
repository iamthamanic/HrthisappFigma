/**
 * @file HRTHIS_passwordPolicies.ts
 * @domain Security - Password Policies
 * @description Password strength validation, policy enforcement, and security recommendations
 * @namespace HRTHIS_
 * @created Phase 4 Priority 3 - Authentication Security
 */

// ========================================
// PASSWORD POLICY CONFIGURATION
// ========================================

export const PASSWORD_POLICY = {
  // Minimum length
  MIN_LENGTH: 8,
  
  // Maximum length (prevent DoS)
  MAX_LENGTH: 128,
  
  // Complexity requirements
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_DIGIT: true,
  REQUIRE_SPECIAL: true,
  
  // Special characters allowed
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  
  // Common passwords blacklist (subset)
  COMMON_PASSWORDS: [
    'password', 'password123', '123456', '12345678', 'qwerty',
    'abc123', 'monkey', '1234567', 'letmein', 'trustno1',
    'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
    'ashley', 'bailey', 'passw0rd', 'shadow', '123123',
    'admin', 'admin123', 'root', 'toor', 'test', 'test123',
  ],
  
  // Sequential/repeated character limits
  MAX_SEQUENTIAL_CHARS: 3, // e.g., "abc", "123"
  MAX_REPEATED_CHARS: 3,    // e.g., "aaa", "111"
  
  // Password history (prevent reuse)
  HISTORY_LENGTH: 5,
  
  // Password expiry (days, 0 = no expiry)
  EXPIRY_DAYS: 0, // Disabled for now
  
} as const;

// ========================================
// TYPES
// ========================================

export interface PasswordStrength {
  score: number; // 0-100
  level: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong';
  passed: boolean;
  feedback: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasDigit: boolean;
    hasSpecial: boolean;
    notCommon: boolean;
    noSequential: boolean;
    noRepeated: boolean;
  };
}

export interface PasswordValidationResult {
  valid: boolean;
  strength: PasswordStrength;
  errors: string[];
}

// ========================================
// PASSWORD POLICY CLASS
// ========================================

export class PasswordPolicies {
  /**
   * Validate password against policy
   */
  public validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const strength = this.calculateStrength(password);
    
    // Check minimum length
    if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
      errors.push(`Passwort muss mindestens ${PASSWORD_POLICY.MIN_LENGTH} Zeichen lang sein`);
    }
    
    // Check maximum length (DoS protection)
    if (password.length > PASSWORD_POLICY.MAX_LENGTH) {
      errors.push(`Passwort darf maximal ${PASSWORD_POLICY.MAX_LENGTH} Zeichen lang sein`);
    }
    
    // Check complexity requirements
    if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !strength.requirements.hasUppercase) {
      errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
    }
    
    if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !strength.requirements.hasLowercase) {
      errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }
    
    if (PASSWORD_POLICY.REQUIRE_DIGIT && !strength.requirements.hasDigit) {
      errors.push('Passwort muss mindestens eine Zahl enthalten');
    }
    
    if (PASSWORD_POLICY.REQUIRE_SPECIAL && !strength.requirements.hasSpecial) {
      errors.push('Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*...)');
    }
    
    // Check if password is too common
    if (!strength.requirements.notCommon) {
      errors.push('Dieses Passwort ist zu häufig verwendet. Bitte wähle ein sichereres Passwort');
    }
    
    // Check for sequential characters
    if (!strength.requirements.noSequential) {
      errors.push('Passwort darf keine aufeinanderfolgenden Zeichen enthalten (z.B. "abc", "123")');
    }
    
    // Check for repeated characters
    if (!strength.requirements.noRepeated) {
      errors.push('Passwort darf nicht zu viele gleiche Zeichen hintereinander enthalten');
    }
    
    return {
      valid: errors.length === 0,
      strength,
      errors,
    };
  }
  
  /**
   * Calculate password strength
   */
  public calculateStrength(password: string): PasswordStrength {
    const requirements = {
      minLength: password.length >= PASSWORD_POLICY.MIN_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasDigit: /\d/.test(password),
      hasSpecial: new RegExp(`[${PASSWORD_POLICY.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password),
      notCommon: !this.isCommonPassword(password),
      noSequential: !this.hasSequentialChars(password),
      noRepeated: !this.hasRepeatedChars(password),
    };
    
    // Calculate score (0-100)
    let score = 0;
    const feedback: string[] = [];
    
    // Length score (0-30 points)
    if (password.length >= PASSWORD_POLICY.MIN_LENGTH) {
      score += 10;
    }
    if (password.length >= 12) {
      score += 10;
      feedback.push('Gute Länge');
    }
    if (password.length >= 16) {
      score += 10;
      feedback.push('Sehr gute Länge');
    }
    
    // Complexity score (0-40 points)
    if (requirements.hasUppercase) score += 10;
    if (requirements.hasLowercase) score += 10;
    if (requirements.hasDigit) score += 10;
    if (requirements.hasSpecial) {
      score += 10;
      feedback.push('Enthält Sonderzeichen');
    }
    
    // Security checks (0-30 points)
    if (requirements.notCommon) {
      score += 15;
    } else {
      feedback.push('⚠️ Häufig verwendetes Passwort');
    }
    
    if (requirements.noSequential) {
      score += 10;
    } else {
      feedback.push('⚠️ Enthält aufeinanderfolgende Zeichen');
    }
    
    if (requirements.noRepeated) {
      score += 5;
    } else {
      feedback.push('⚠️ Zu viele gleiche Zeichen');
    }
    
    // Determine level
    let level: PasswordStrength['level'];
    if (score >= 80) {
      level = 'very-strong';
      feedback.push('✅ Sehr sicheres Passwort!');
    } else if (score >= 60) {
      level = 'strong';
      feedback.push('✅ Sicheres Passwort');
    } else if (score >= 40) {
      level = 'medium';
      feedback.push('⚠️ Mittlere Sicherheit');
    } else if (score >= 20) {
      level = 'weak';
      feedback.push('⚠️ Schwaches Passwort');
    } else {
      level = 'very-weak';
      feedback.push('❌ Sehr schwaches Passwort');
    }
    
    // Check if passed minimum requirements
    const passed = Object.values(requirements).every(req => req === true);
    
    return {
      score,
      level,
      passed,
      feedback,
      requirements,
    };
  }
  
  /**
   * Check if password is in common password list
   */
  private isCommonPassword(password: string): boolean {
    const normalized = password.toLowerCase();
    return PASSWORD_POLICY.COMMON_PASSWORDS.some(common => {
      // Exact match
      if (normalized === common) return true;
      
      // Contains common password
      if (normalized.includes(common) && common.length >= 6) return true;
      
      return false;
    });
  }
  
  /**
   * Check for sequential characters (abc, 123, etc.)
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm',
    ];
    
    const lowerPassword = password.toLowerCase();
    
    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - PASSWORD_POLICY.MAX_SEQUENTIAL_CHARS; i++) {
        const substr = sequence.substring(i, i + PASSWORD_POLICY.MAX_SEQUENTIAL_CHARS);
        if (lowerPassword.includes(substr)) {
          return true;
        }
        // Check reverse sequence
        if (lowerPassword.includes(substr.split('').reverse().join(''))) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check for repeated characters (aaa, 111, etc.)
   */
  private hasRepeatedChars(password: string): boolean {
    let count = 1;
    let prevChar = '';
    
    for (const char of password) {
      if (char === prevChar) {
        count++;
        if (count >= PASSWORD_POLICY.MAX_REPEATED_CHARS) {
          return true;
        }
      } else {
        count = 1;
        prevChar = char;
      }
    }
    
    return false;
  }
  
  /**
   * Generate secure password suggestion
   */
  public generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + digits + special;
    
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += digits[Math.floor(Math.random() * digits.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
  
  /**
   * Check password history (prevent reuse)
   */
  public async checkPasswordHistory(
    newPassword: string,
    previousPasswords: string[]
  ): Promise<boolean> {
    // In a real app, you'd hash and compare
    // For now, we'll just check if it's in the list
    const recentPasswords = previousPasswords.slice(0, PASSWORD_POLICY.HISTORY_LENGTH);
    
    // Simple check (in production, compare hashes)
    return !recentPasswords.includes(newPassword);
  }
  
  /**
   * Get password strength color
   */
  public getStrengthColor(level: PasswordStrength['level']): string {
    const colors = {
      'very-weak': '#dc2626',  // red-600
      'weak': '#ea580c',       // orange-600
      'medium': '#ca8a04',     // yellow-600
      'strong': '#16a34a',     // green-600
      'very-strong': '#059669', // emerald-600
    };
    
    return colors[level];
  }
  
  /**
   * Get password strength percentage
   */
  public getStrengthPercentage(score: number): number {
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Format password requirements for display
   */
  public formatRequirements(): string[] {
    const requirements: string[] = [];
    
    requirements.push(`Mindestens ${PASSWORD_POLICY.MIN_LENGTH} Zeichen`);
    
    if (PASSWORD_POLICY.REQUIRE_UPPERCASE) {
      requirements.push('Mindestens ein Großbuchstabe (A-Z)');
    }
    
    if (PASSWORD_POLICY.REQUIRE_LOWERCASE) {
      requirements.push('Mindestens ein Kleinbuchstabe (a-z)');
    }
    
    if (PASSWORD_POLICY.REQUIRE_DIGIT) {
      requirements.push('Mindestens eine Zahl (0-9)');
    }
    
    if (PASSWORD_POLICY.REQUIRE_SPECIAL) {
      requirements.push('Mindestens ein Sonderzeichen (!@#$%^&*...)');
    }
    
    requirements.push('Kein häufig verwendetes Passwort');
    requirements.push('Keine aufeinanderfolgenden Zeichen');
    
    return requirements;
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

export const passwordPolicies = new PasswordPolicies();

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Quick password validation (returns boolean)
 */
export function isPasswordValid(password: string): boolean {
  return passwordPolicies.validate(password).valid;
}

/**
 * Get password strength level
 */
export function getPasswordStrength(password: string): PasswordStrength {
  return passwordPolicies.calculateStrength(password);
}

/**
 * Generate secure password
 */
export function generatePassword(length: number = 16): string {
  return passwordPolicies.generateSecurePassword(length);
}

// ========================================
// EXPORTS
// ========================================

export default passwordPolicies;
export type { PasswordStrength, PasswordValidationResult };
