/**
 * DOCUMENT SCHEMAS
 * ================
 * Zod schemas for document-related types
 * Provides runtime validation for document data
 */

import { z } from 'zod';

/**
 * BASE DOCUMENT SCHEMA
 */
export const BaseDocumentSchema = z.object({
  id: z.string().uuid('Document ID muss eine gültige UUID sein'),
  title: z.string().min(1, 'Titel ist erforderlich').max(300, 'Titel zu lang'),
  description: z.string().max(2000, 'Beschreibung zu lang').nullable().optional(),
  category: z.string().min(1, 'Kategorie ist erforderlich').max(100, 'Kategorie zu lang'),
  file_name: z.string().min(1, 'Dateiname ist erforderlich').max(500),
  file_size: z.number().int().min(0, 'Dateigröße muss positiv sein'),
  file_type: z.string().min(1, 'Dateityp ist erforderlich').max(100),
  file_url: z.string().min(1, 'Datei URL ist erforderlich'),
  organization_id: z.string().uuid().nullable().optional(),
  uploaded_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Document = z.infer<typeof BaseDocumentSchema>;

/**
 * CREATE DOCUMENT SCHEMA
 */
export const CreateDocumentSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(300, 'Titel zu lang'),
  description: z.string().max(2000, 'Beschreibung zu lang').optional(),
  category: z.string().min(1, 'Kategorie ist erforderlich').max(100, 'Kategorie zu lang'),
  file_name: z.string().min(1, 'Dateiname ist erforderlich').max(500),
  file_size: z.number().int().min(0, 'Dateigröße muss positiv sein').max(1024 * 1024 * 100, 'Datei zu groß (max 100MB)'),
  file_type: z.string().min(1, 'Dateityp ist erforderlich').max(100),
  file_url: z.string().min(1, 'Datei URL ist erforderlich'),
  organization_id: z.string().uuid().optional(),
  uploaded_by: z.string().uuid().optional(),
});

export type CreateDocumentData = z.infer<typeof CreateDocumentSchema>;

/**
 * UPDATE DOCUMENT SCHEMA
 */
export const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).max(100).optional(),
});

export type UpdateDocumentData = z.infer<typeof UpdateDocumentSchema>;

/**
 * DOCUMENT FILTERS SCHEMA
 */
export const DocumentFiltersSchema = z.object({
  category: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  search: z.string().min(2, 'Suchbegriff zu kurz').optional(),
  uploaded_by: z.string().uuid().optional(),
}).optional();

export type DocumentFilters = z.infer<typeof DocumentFiltersSchema>;

/**
 * DOCUMENT STATS SCHEMA
 */
export const DocumentStatsSchema = z.object({
  total: z.number().int().min(0),
  by_category: z.record(z.string(), z.number().int().min(0)),
  total_size_mb: z.number().min(0),
});

export type DocumentStats = z.infer<typeof DocumentStatsSchema>;

/**
 * COMMON FILE TYPES
 */
export const CommonFileTypes = {
  PDF: 'application/pdf',
  WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  TEXT: 'text/plain',
} as const;

/**
 * FILE TYPE VALIDATOR
 */
export const validateFileType = (fileType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(fileType);
};

/**
 * FILE SIZE VALIDATOR (in bytes)
 */
export const validateFileSize = (fileSize: number, maxSizeMB: number = 100): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

/**
 * VALIDATION HELPERS
 */
export const validateDocument = (data: unknown) => BaseDocumentSchema.parse(data);
export const validateCreateDocument = (data: unknown) => CreateDocumentSchema.parse(data);
export const validateUpdateDocument = (data: unknown) => UpdateDocumentSchema.parse(data);
export const validateDocumentFilters = (data: unknown) => DocumentFiltersSchema.parse(data);
export const validateDocumentStats = (data: unknown) => DocumentStatsSchema.parse(data);

/**
 * SAFE VALIDATION
 */
export const safeValidateDocument = (data: unknown) => BaseDocumentSchema.safeParse(data);
export const safeValidateCreateDocument = (data: unknown) => CreateDocumentSchema.safeParse(data);
export const safeValidateUpdateDocument = (data: unknown) => UpdateDocumentSchema.safeParse(data);
