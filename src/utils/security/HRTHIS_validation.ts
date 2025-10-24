/**
 * VALIDATION HELPERS
 * ===================
 * Enhanced validation utilities for form inputs
 * Integrates with Zod schemas
 * 
 * Part of Phase 4 - Priority 2
 */

import { z } from 'zod';
import sanitize from './HRTHIS_sanitization';

/**
 * Custom Zod validators with sanitization
 */

/**
 * Email validator with sanitization
 */
export const emailValidator = z
  .string()
  .min(1, 'E-Mail ist erforderlich')
  .transform(val => sanitize.email(val))
  .refine(val => val.length > 0, 'Ungültige E-Mail-Adresse')
  .refine(val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Ungültige E-Mail-Adresse');

/**
 * URL validator with sanitization
 */
export const urlValidator = z
  .string()
  .min(1, 'URL ist erforderlich')
  .transform(val => sanitize.url(val))
  .refine(val => val.length > 0, 'Ungültige URL');

/**
 * Phone validator with sanitization
 */
export const phoneValidator = z
  .string()
  .transform(val => sanitize.phone(val))
  .refine(
    val => !val || /^[\d\s\-()+ ]+$/.test(val),
    'Ungültige Telefonnummer'
  );

/**
 * Text validator with sanitization (no HTML)
 */
export const textValidator = (options?: {
  min?: number;
  max?: number;
  required?: boolean;
}) => {
  const { min = 0, max = 1000, required = false } = options || {};
  
  let validator = z.string().transform(val => sanitize.text(val));
  
  if (required) {
    validator = validator.min(1, 'Dieses Feld ist erforderlich');
  }
  
  if (min > 0) {
    validator = validator.min(min, `Mindestens ${min} Zeichen erforderlich`);
  }
  
  if (max < Infinity) {
    validator = validator.max(max, `Maximum ${max} Zeichen`);
  }
  
  return validator;
};

/**
 * Multiline text validator (allows line breaks)
 */
export const multilineTextValidator = (options?: {
  min?: number;
  max?: number;
  required?: boolean;
}) => {
  const { min = 0, max = 5000, required = false } = options || {};
  
  let validator = z.string().transform(val => sanitize.multiline(val));
  
  if (required) {
    validator = validator.min(1, 'Dieses Feld ist erforderlich');
  }
  
  if (min > 0) {
    validator = validator.min(min, `Mindestens ${min} Zeichen erforderlich`);
  }
  
  if (max < Infinity) {
    validator = validator.max(max, `Maximum ${max} Zeichen`);
  }
  
  return validator;
};

/**
 * Date validator with sanitization
 */
export const dateValidator = z
  .string()
  .min(1, 'Datum ist erforderlich')
  .transform(val => sanitize.date(val))
  .refine(val => val.length > 0, 'Ungültiges Datum')
  .refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Ungültiges Datum');

/**
 * Optional date validator
 */
export const optionalDateValidator = z
  .string()
  .optional()
  .transform(val => val ? sanitize.date(val) : undefined);

/**
 * Number validator
 */
export const numberValidator = (options?: {
  min?: number;
  max?: number;
  required?: boolean;
}) => {
  const { min, max, required = false } = options || {};
  
  let validator = z.number();
  
  if (!required) {
    validator = validator.optional() as any;
  }
  
  if (min !== undefined) {
    validator = validator.min(min, `Mindestens ${min}`);
  }
  
  if (max !== undefined) {
    validator = validator.max(max, `Maximum ${max}`);
  }
  
  return validator;
};

/**
 * Password validator
 */
export const passwordValidator = z
  .string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
  .max(100, 'Passwort zu lang')
  .refine(
    val => /[A-Z]/.test(val),
    'Passwort muss mindestens einen Großbuchstaben enthalten'
  )
  .refine(
    val => /[a-z]/.test(val),
    'Passwort muss mindestens einen Kleinbuchstaben enthalten'
  )
  .refine(
    val => /[0-9]/.test(val),
    'Passwort muss mindestens eine Zahl enthalten'
  );

/**
 * Simple password validator (for creating users)
 */
export const simplePasswordValidator = z
  .string()
  .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
  .max(100, 'Passwort zu lang');

/**
 * Name validator
 */
export const nameValidator = textValidator({ min: 1, max: 100, required: true })
  .refine(
    val => /^[a-zA-ZäöüÄÖÜß\s\-']+$/.test(val),
    'Name darf nur Buchstaben, Leerzeichen und Bindestriche enthalten'
  );

/**
 * Optional name validator
 */
export const optionalNameValidator = z
  .string()
  .optional()
  .transform(val => val ? sanitize.text(val) : undefined)
  .refine(
    val => !val || /^[a-zA-ZäöüÄÖÜß\s\-']+$/.test(val),
    'Name darf nur Buchstaben, Leerzeichen und Bindestriche enthalten'
  );

/**
 * Filename validator
 */
export const filenameValidator = z
  .string()
  .transform(val => sanitize.filename(val))
  .refine(val => val.length > 0, 'Ungültiger Dateiname')
  .refine(val => val !== 'unnamed', 'Dateiname ist erforderlich');

/**
 * Search query validator
 */
export const searchQueryValidator = z
  .string()
  .transform(val => sanitize.searchQuery(val))
  .refine(val => val.length <= 100, 'Suchbegriff zu lang');

/**
 * IBAN validator
 */
export const ibanValidator = z
  .string()
  .transform(val => val.replace(/\s/g, '').toUpperCase())
  .refine(
    val => /^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(val),
    'Ungültige IBAN'
  )
  .refine(
    val => val.length >= 15 && val.length <= 34,
    'IBAN muss zwischen 15 und 34 Zeichen lang sein'
  );

/**
 * BIC validator
 */
export const bicValidator = z
  .string()
  .transform(val => val.replace(/\s/g, '').toUpperCase())
  .refine(
    val => /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(val),
    'Ungültiger BIC'
  );

/**
 * Postleitzahl (German ZIP) validator
 */
export const plzValidator = z
  .string()
  .transform(val => val.replace(/\s/g, ''))
  .refine(
    val => /^\d{5}$/.test(val),
    'Postleitzahl muss 5 Ziffern haben'
  );

/**
 * YouTube URL validator
 */
export const youtubeUrlValidator = z
  .string()
  .min(1, 'YouTube URL ist erforderlich')
  .refine(
    val => {
      const patterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^https?:\/\/youtu\.be\/[\w-]+/,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
      ];
      return patterns.some(pattern => pattern.test(val));
    },
    'Ungültige YouTube URL'
  );

/**
 * Hex color validator
 */
export const hexColorValidator = z
  .string()
  .refine(
    val => /^#[0-9A-Fa-f]{6}$/.test(val),
    'Ungültige Hex-Farbe (Format: #RRGGBB)'
  );

/**
 * Enum validator helper
 */
export function enumValidator<T extends readonly string[]>(
  values: T,
  errorMessage?: string
) {
  return z.enum(values as any, {
    errorMap: () => ({
      message: errorMessage || `Wert muss einer von sein: ${values.join(', ')}`,
    }),
  });
}

/**
 * Validate form data before submission
 */
export async function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: Record<string, string> }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      
      error.errors.forEach(err => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      
      return { success: false, errors };
    }
    
    return {
      success: false,
      errors: { _form: 'Validierung fehlgeschlagen' },
    };
  }
}

/**
 * Check if input contains XSS
 */
export function validateNoXSS(input: string, fieldName: string = 'Input'): {
  valid: boolean;
  error?: string;
} {
  if (sanitize.containsXSS(input)) {
    return {
      valid: false,
      error: `${fieldName} enthält ungültige Zeichen`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options?: {
    allowedTypes?: string[];
    maxSize?: number;
  }
): { valid: boolean; error?: string; sanitizedName: string } {
  return sanitize.fileUpload(file, options);
}

/**
 * Export all validators
 */
export default {
  email: emailValidator,
  url: urlValidator,
  phone: phoneValidator,
  text: textValidator,
  multiline: multilineTextValidator,
  date: dateValidator,
  optionalDate: optionalDateValidator,
  number: numberValidator,
  password: passwordValidator,
  simplePassword: simplePasswordValidator,
  name: nameValidator,
  optionalName: optionalNameValidator,
  filename: filenameValidator,
  searchQuery: searchQueryValidator,
  iban: ibanValidator,
  bic: bicValidator,
  plz: plzValidator,
  youtubeUrl: youtubeUrlValidator,
  hexColor: hexColorValidator,
  enum: enumValidator,
  validateForm,
  validateNoXSS,
  validateFileUpload,
};
