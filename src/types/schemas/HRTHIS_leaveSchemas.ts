/**
 * LEAVE SCHEMAS
 * =============
 * Zod schemas for leave request types
 * Provides runtime validation for leave data
 */

import { z } from 'zod';

/**
 * LEAVE TYPE ENUM
 */
export const LeaveTypeSchema = z.enum(['VACATION', 'SICK', 'PERSONAL', 'UNPAID']);
export type LeaveType = z.infer<typeof LeaveTypeSchema>;

/**
 * LEAVE STATUS ENUM
 */
export const LeaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type LeaveStatus = z.infer<typeof LeaveStatusSchema>;

/**
 * BASE LEAVE REQUEST SCHEMA
 */
export const BaseLeaveRequestSchema = z.object({
  id: z.string().uuid('Leave Request ID muss eine gültige UUID sein'),
  user_id: z.string().uuid('User ID muss eine gültige UUID sein'),
  type: LeaveTypeSchema,
  start_date: z.string().date('Ungültiges Startdatum'),
  end_date: z.string().date('Ungültiges Enddatum'),
  days: z.number().positive('Tage müssen positiv sein'),
  status: LeaveStatusSchema.default('PENDING'),
  reason: z.string().max(500, 'Begründung zu lang').nullable().optional(),
  half_day: z.boolean().default(false),
  approved_by: z.string().uuid().nullable().optional(),
  approved_at: z.string().datetime().nullable().optional(),
  rejection_reason: z.string().max(500).nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type LeaveRequest = z.infer<typeof BaseLeaveRequestSchema>;

/**
 * CREATE LEAVE REQUEST SCHEMA
 */
export const CreateLeaveRequestSchema = z.object({
  user_id: z.string().uuid('User ID muss eine gültige UUID sein'),
  type: LeaveTypeSchema,
  start_date: z.string().date('Ungültiges Startdatum'),
  end_date: z.string().date('Ungültiges Enddatum'),
  days: z.number().positive('Tage müssen positiv sein').max(365, 'Maximal 365 Tage'),
  reason: z.string().max(500, 'Begründung zu lang').optional(),
  half_day: z.boolean().default(false).optional(),
}).refine(
  (data) => {
    // Validate that start_date is before end_date
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return start <= end;
  },
  {
    message: 'Startdatum muss vor oder gleich dem Enddatum sein',
    path: ['start_date'],
  }
);

export type CreateLeaveRequestData = z.infer<typeof CreateLeaveRequestSchema>;

/**
 * UPDATE LEAVE REQUEST SCHEMA
 */
export const UpdateLeaveRequestSchema = z.object({
  type: LeaveTypeSchema.optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  days: z.number().positive().max(365).optional(),
  reason: z.string().max(500).optional(),
  half_day: z.boolean().optional(),
}).refine(
  (data) => {
    // Only validate if both dates are provided
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return start <= end;
    }
    return true;
  },
  {
    message: 'Startdatum muss vor oder gleich dem Enddatum sein',
    path: ['start_date'],
  }
);

export type UpdateLeaveRequestData = z.infer<typeof UpdateLeaveRequestSchema>;

/**
 * LEAVE REQUEST FILTERS SCHEMA
 */
export const LeaveRequestFiltersSchema = z.object({
  user_id: z.string().uuid().optional(),
  status: LeaveStatusSchema.optional(),
  type: LeaveTypeSchema.optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
}).optional();

export type LeaveRequestFilters = z.infer<typeof LeaveRequestFiltersSchema>;

/**
 * LEAVE BALANCE SCHEMA
 */
export const LeaveBalanceSchema = z.object({
  user_id: z.string().uuid(),
  total_days: z.number().int().min(0),
  used_days: z.number().int().min(0),
  remaining_days: z.number().int(),
  pending_days: z.number().int().min(0),
});

export type LeaveBalance = z.infer<typeof LeaveBalanceSchema>;

/**
 * VALIDATION HELPERS
 */
export const validateLeaveRequest = (data: unknown) => BaseLeaveRequestSchema.parse(data);
export const validateCreateLeaveRequest = (data: unknown) => CreateLeaveRequestSchema.parse(data);
export const validateUpdateLeaveRequest = (data: unknown) => UpdateLeaveRequestSchema.parse(data);
export const validateLeaveFilters = (data: unknown) => LeaveRequestFiltersSchema.parse(data);
export const validateLeaveBalance = (data: unknown) => LeaveBalanceSchema.parse(data);

/**
 * SAFE VALIDATION
 */
export const safeValidateLeaveRequest = (data: unknown) => BaseLeaveRequestSchema.safeParse(data);
export const safeValidateCreateLeaveRequest = (data: unknown) => CreateLeaveRequestSchema.safeParse(data);
export const safeValidateUpdateLeaveRequest = (data: unknown) => UpdateLeaveRequestSchema.safeParse(data);
