/**
 * USER SCHEMAS
 * ============
 * Zod schemas for user-related types
 * Provides runtime validation for user data
 */

import { z } from 'zod';

/**
 * USER ROLE ENUM
 */
export const UserRoleSchema = z.enum(['USER', 'ADMIN', 'HR', 'SUPERADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

/**
 * BASE USER SCHEMA
 * Core user fields
 */
export const BaseUserSchema = z.object({
  id: z.string().uuid('User ID muss eine gültige UUID sein'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100, 'Vorname zu lang'),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100, 'Nachname zu lang'),
  role: UserRoleSchema.default('USER'),
  organization_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  position: z.string().max(200, 'Position zu lang').nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * GAMIFICATION SCHEMA
 * User gamification fields
 */
export const UserGamificationSchema = z.object({
  level: z.number().int().min(1).max(100).default(1),
  xp: z.number().int().min(0).default(0),
  coins: z.number().int().min(0).default(0),
});

/**
 * AVATAR SCHEMA
 * User avatar customization
 */
export const UserAvatarSchema = z.object({
  avatar_body: z.string().max(50).default('body1'),
  avatar_eyes: z.string().max(50).default('eyes1'),
  avatar_mouth: z.string().max(50).default('mouth1'),
  avatar_bg_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Ungültige Hex-Farbe').default('#3b82f6'),
});

/**
 * WORK INFO SCHEMA
 * Employment-related fields
 */
export const UserWorkInfoSchema = z.object({
  vacation_days: z.number().int().min(0).max(365).default(30),
  start_date: z.string().date().nullable().optional(),
  employee_number: z.string().max(50).nullable().optional(),
});

/**
 * COMPLETE USER SCHEMA
 * All user fields combined
 */
export const UserSchema = BaseUserSchema.merge(UserGamificationSchema)
  .merge(UserAvatarSchema)
  .merge(UserWorkInfoSchema);

export type User = z.infer<typeof UserSchema>;

/**
 * CREATE USER SCHEMA
 * For creating new users (subset of fields)
 */
export const CreateUserSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  role: UserRoleSchema.optional(),
  position: z.string().max(200).optional(),
  department_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
});

export type CreateUserData = z.infer<typeof CreateUserSchema>;

/**
 * UPDATE USER SCHEMA
 * For updating existing users (all fields optional)
 */
export const UpdateUserSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: UserRoleSchema.optional(),
  position: z.string().max(200).optional(),
  department_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  avatar_body: z.string().max(50).optional(),
  avatar_eyes: z.string().max(50).optional(),
  avatar_mouth: z.string().max(50).optional(),
  avatar_bg_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  level: z.number().int().min(1).max(100).optional(),
  xp: z.number().int().min(0).optional(),
  coins: z.number().int().min(0).optional(),
  vacation_days: z.number().int().min(0).max(365).optional(),
});

export type UpdateUserData = z.infer<typeof UpdateUserSchema>;

/**
 * USER FILTERS SCHEMA
 * For filtering users in queries
 */
export const UserFiltersSchema = z.object({
  role: UserRoleSchema.optional(),
  department_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  search: z.string().min(2, 'Suchbegriff zu kurz').optional(),
}).optional();

export type UserFilters = z.infer<typeof UserFiltersSchema>;

/**
 * VALIDATION HELPERS
 */
export const validateUser = (data: unknown) => UserSchema.parse(data);
export const validateCreateUser = (data: unknown) => CreateUserSchema.parse(data);
export const validateUpdateUser = (data: unknown) => UpdateUserSchema.parse(data);
export const validateUserFilters = (data: unknown) => UserFiltersSchema.parse(data);

/**
 * SAFE VALIDATION (returns error instead of throwing)
 */
export const safeValidateUser = (data: unknown) => UserSchema.safeParse(data);
export const safeValidateCreateUser = (data: unknown) => CreateUserSchema.safeParse(data);
export const safeValidateUpdateUser = (data: unknown) => UpdateUserSchema.safeParse(data);
