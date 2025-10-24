/**
 * SCHEMAS INDEX
 * =============
 * Central export point for all Zod schemas
 * 
 * Usage:
 * ```typescript
 * import { UserSchema, validateCreateUser } from '../types/schemas';
 * 
 * const result = validateCreateUser(data);
 * ```
 */

// User Schemas
export * from './HRTHIS_userSchemas';

// Leave Schemas
export * from './HRTHIS_leaveSchemas';

// Team Schemas
export * from './HRTHIS_teamSchemas';

// Learning Schemas
export * from './HRTHIS_learningSchemas';

// Document Schemas
export * from './HRTHIS_documentSchemas';

// Benefit Schemas
export * from './HRTHIS_benefitSchemas';

/**
 * VALIDATION HELPER TYPES
 */
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    issues: Array<{
      path: string[];
      message: string;
    }>;
  };
};

/**
 * FORMAT ZOD ERROR
 * Converts Zod error to user-friendly format
 */
export function formatZodError(error: any): {
  message: string;
  issues: Array<{ path: string[]; message: string }>;
} {
  return {
    message: 'Validierung fehlgeschlagen',
    issues: error.errors.map((err: any) => ({
      path: err.path,
      message: err.message,
    })),
  };
}

/**
 * GET VALIDATION ERRORS
 * Extracts validation errors from Zod error
 */
export function getValidationErrors(error: any): Record<string, string> {
  const errors: Record<string, string> = {};
  
  if (error.errors) {
    error.errors.forEach((err: any) => {
      const path = err.path.join('.');
      errors[path] = err.message;
    });
  }
  
  return errors;
}

/**
 * VALIDATION ERROR TO STRING
 * Converts validation error to a single string
 */
export function validationErrorToString(error: any): string {
  if (!error.errors || error.errors.length === 0) {
    return 'Validierung fehlgeschlagen';
  }
  
  return error.errors
    .map((err: any) => `${err.path.join('.')}: ${err.message}`)
    .join(', ');
}
