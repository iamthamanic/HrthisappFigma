/**
 * INPUT SANITIZATION
 * ==================
 * Sanitize user inputs to prevent XSS attacks
 * 
 * Part of Phase 4 - Priority 2
 * 
 * Features:
 * - HTML sanitization with DOMPurify
 * - URL validation
 * - Email validation
 * - Filename sanitization
 * - Deep object sanitization
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content (allows limited tags)
 * Use this for rich text fields that need formatting
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize plain text (strips ALL HTML)
 * Use this for most user inputs (names, descriptions, etc.)
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Strip all HTML tags
  const cleaned = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  
  // Trim whitespace
  return cleaned.trim();
}

/**
 * Sanitize multiline text (keeps line breaks)
 */
export function sanitizeMultilineText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Strip HTML but keep structure
  const cleaned = DOMPurify.sanitize(text, { ALLOWED_TAGS: ['br'] });
  
  return cleaned.trim();
}

/**
 * Sanitize URL
 * Only allows http/https protocols
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn('Blocked non-HTTP(S) URL:', url);
      return '';
    }
    
    return parsed.toString();
  } catch (error) {
    console.warn('Invalid URL:', url);
    return '';
  }
}

/**
 * Sanitize email
 * Validates format and normalizes
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const trimmed = email.trim();
  
  if (!emailRegex.test(trimmed)) {
    console.warn('Invalid email format:', email);
    return '';
  }
  
  // Normalize to lowercase
  return trimmed.toLowerCase();
}

/**
 * Sanitize filename
 * Removes dangerous characters and path traversal attempts
 */
export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename) return '';
  
  // Remove path traversal attempts
  let cleaned = filename.replace(/[\/\\]/g, '');
  
  // Remove dangerous characters
  cleaned = cleaned.replace(/[<>:"|?*\x00-\x1f]/g, '');
  
  // Remove leading/trailing dots and spaces
  cleaned = cleaned.replace(/^[\s.]+|[\s.]+$/g, '');
  
  // Limit length
  if (cleaned.length > 255) {
    const ext = cleaned.split('.').pop();
    const name = cleaned.substring(0, 255 - (ext ? ext.length + 1 : 0));
    cleaned = ext ? `${name}.${ext}` : name;
  }
  
  return cleaned || 'unnamed';
}

/**
 * Sanitize phone number
 * Removes non-numeric characters (keeps + for country code)
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Keep only digits, spaces, hyphens, parentheses, and plus
  return phone.replace(/[^\d\s\-()+ ]/g, '').trim();
}

/**
 * Sanitize number input
 * Returns sanitized number or empty string if invalid
 */
export function sanitizeNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value).trim();
  
  // Check if valid number
  if (!/^-?\d*\.?\d+$/.test(str)) {
    return '';
  }
  
  return str;
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value).trim();
  
  // Check if valid integer
  if (!/^-?\d+$/.test(str)) {
    return '';
  }
  
  return str;
}

/**
 * Sanitize date string
 * Validates ISO date format
 */
export function sanitizeDate(date: string | null | undefined): string {
  if (!date) return '';
  
  const trimmed = date.trim();
  
  // Check if valid date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    console.warn('Invalid date format:', date);
    return '';
  }
  
  // Validate date is real
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) {
    console.warn('Invalid date:', date);
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitize object (deep)
 * Recursively sanitizes all string values in an object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options?: {
    allowHtml?: boolean;
    maxDepth?: number;
  }
): T {
  const { allowHtml = false, maxDepth = 10 } = options || {};
  
  function sanitizeValue(value: any, depth: number): any {
    // Prevent infinite recursion
    if (depth > maxDepth) {
      console.warn('Max depth reached in sanitizeObject');
      return value;
    }
    
    // Null/undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // String - sanitize
    if (typeof value === 'string') {
      return allowHtml ? sanitizeHtml(value) : sanitizeText(value);
    }
    
    // Array - recurse
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item, depth + 1));
    }
    
    // Object - recurse
    if (typeof value === 'object') {
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val, depth + 1);
      }
      return sanitized;
    }
    
    // Other types (number, boolean, etc.) - return as-is
    return value;
  }
  
  return sanitizeValue(obj, 0);
}

/**
 * Sanitize form data
 * Specialized for form submissions
 */
export function sanitizeFormData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip if null/undefined
    if (value === null || value === undefined) {
      sanitized[key] = value;
      continue;
    }
    
    // Handle different field types based on key name
    if (key.toLowerCase().includes('email')) {
      sanitized[key] = sanitizeEmail(value);
    } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
      sanitized[key] = sanitizeUrl(value);
    } else if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) {
      sanitized[key] = sanitizePhone(value);
    } else if (key.toLowerCase().includes('date')) {
      sanitized[key] = sanitizeDate(value);
    } else if (key.toLowerCase().includes('notes') || key.toLowerCase().includes('description')) {
      sanitized[key] = sanitizeMultilineText(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize file upload
 */
export function sanitizeFileUpload(file: File, options?: {
  allowedTypes?: string[];
  maxSize?: number; // in bytes
}): { valid: boolean; error?: string; sanitizedName: string } {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    maxSize = 5 * 1024 * 1024, // 5MB default
  } = options || {};
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Dateityp nicht erlaubt. Erlaubt: ${allowedTypes.join(', ')}`,
      sanitizedName: sanitizeFilename(file.name),
    };
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return {
      valid: false,
      error: `Datei zu groß. Maximum: ${maxMB}MB`,
      sanitizedName: sanitizeFilename(file.name),
    };
  }
  
  return {
    valid: true,
    sanitizedName: sanitizeFilename(file.name),
  };
}

/**
 * Check for common XSS patterns
 * Returns true if suspicious content detected
 */
export function containsXSS(input: string): boolean {
  if (!input) return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onload=, onclick=, etc.
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize search query
 * Prevents SQL injection and XSS in search
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return '';
  
  // Remove HTML
  let cleaned = sanitizeText(query);
  
  // Remove SQL injection patterns
  cleaned = cleaned.replace(/[';"\-\-]/g, '');
  
  // Limit length
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 100);
  }
  
  return cleaned.trim();
}

/**
 * Sanitize SQL LIKE pattern
 * Escapes special characters for LIKE queries
 */
export function sanitizeLikePattern(pattern: string | null | undefined): string {
  if (!pattern) return '';
  
  // Escape special LIKE characters
  return pattern
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .trim();
}

/**
 * Safe JSON parse
 * Returns null if invalid JSON
 */
export function safeParse<T = any>(json: string | null | undefined): T | null {
  if (!json) return null;
  
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn('Invalid JSON:', error);
    return null;
  }
}

/**
 * Export all sanitization functions
 */
export default {
  html: sanitizeHtml,
  text: sanitizeText,
  multiline: sanitizeMultilineText,
  url: sanitizeUrl,
  email: sanitizeEmail,
  filename: sanitizeFilename,
  phone: sanitizePhone,
  number: sanitizeNumber,
  integer: sanitizeInteger,
  date: sanitizeDate,
  object: sanitizeObject,
  formData: sanitizeFormData,
  fileUpload: sanitizeFileUpload,
  searchQuery: sanitizeSearchQuery,
  likePattern: sanitizeLikePattern,
  containsXSS,
  safeParse,
};
