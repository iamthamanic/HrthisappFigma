/**
 * TEAM SCHEMAS
 * ============
 * Zod schemas for team-related types
 * Provides runtime validation for team data
 */

import { z } from 'zod';

/**
 * TEAM MEMBER ROLE ENUM
 */
export const TeamMemberRoleSchema = z.enum(['TEAMLEAD', 'MEMBER']);
export type TeamMemberRole = z.infer<typeof TeamMemberRoleSchema>;

/**
 * TEAM MEMBER PRIORITY TAG ENUM
 */
export const PriorityTagSchema = z.enum(['PRIMARY', 'BACKUP', 'BACKUP_BACKUP']);
export type PriorityTag = z.infer<typeof PriorityTagSchema>;

/**
 * BASE TEAM SCHEMA
 */
export const BaseTeamSchema = z.object({
  id: z.string().uuid('Team ID muss eine gültige UUID sein'),
  name: z.string().min(1, 'Teamname ist erforderlich').max(200, 'Teamname zu lang'),
  description: z.string().max(1000, 'Beschreibung zu lang').nullable().optional(),
  organization_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Team = z.infer<typeof BaseTeamSchema>;

/**
 * CREATE TEAM SCHEMA
 */
export const CreateTeamSchema = z.object({
  name: z.string().min(1, 'Teamname ist erforderlich').max(200, 'Teamname zu lang'),
  description: z.string().max(1000, 'Beschreibung zu lang').optional(),
  organization_id: z.string().uuid().optional(),
});

export type CreateTeamData = z.infer<typeof CreateTeamSchema>;

/**
 * UPDATE TEAM SCHEMA
 */
export const UpdateTeamSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
});

export type UpdateTeamData = z.infer<typeof UpdateTeamSchema>;

/**
 * TEAM MEMBER SCHEMA
 */
export const TeamMemberSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid('User ID muss eine gültige UUID sein'),
  team_id: z.string().uuid('Team ID muss eine gültige UUID sein'),
  role: TeamMemberRoleSchema.default('MEMBER'),
  priority_tag: PriorityTagSchema.nullable().optional(),
  joined_at: z.string().datetime().optional(),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

/**
 * ADD TEAM MEMBER SCHEMA
 */
export const AddTeamMemberSchema = z.object({
  user_id: z.string().uuid('User ID muss eine gültige UUID sein'),
  team_id: z.string().uuid('Team ID muss eine gültige UUID sein'),
  role: TeamMemberRoleSchema.default('MEMBER'),
  priority_tag: PriorityTagSchema.optional(),
});

export type AddTeamMemberData = z.infer<typeof AddTeamMemberSchema>;

/**
 * UPDATE TEAM MEMBER ROLE SCHEMA
 */
export const UpdateTeamMemberRoleSchema = z.object({
  role: TeamMemberRoleSchema,
  priority_tag: PriorityTagSchema.nullable().optional(),
});

export type UpdateTeamMemberRoleData = z.infer<typeof UpdateTeamMemberRoleSchema>;

/**
 * TEAM WITH MEMBERS SCHEMA
 */
export const TeamWithMembersSchema = BaseTeamSchema.extend({
  members: z.array(TeamMemberSchema).optional(),
  member_count: z.number().int().min(0).optional(),
});

export type TeamWithMembers = z.infer<typeof TeamWithMembersSchema>;

/**
 * VALIDATION HELPERS
 */
export const validateTeam = (data: unknown) => BaseTeamSchema.parse(data);
export const validateCreateTeam = (data: unknown) => CreateTeamSchema.parse(data);
export const validateUpdateTeam = (data: unknown) => UpdateTeamSchema.parse(data);
export const validateTeamMember = (data: unknown) => TeamMemberSchema.parse(data);
export const validateAddTeamMember = (data: unknown) => AddTeamMemberSchema.parse(data);
export const validateUpdateTeamMemberRole = (data: unknown) => UpdateTeamMemberRoleSchema.parse(data);

/**
 * SAFE VALIDATION
 */
export const safeValidateTeam = (data: unknown) => BaseTeamSchema.safeParse(data);
export const safeValidateCreateTeam = (data: unknown) => CreateTeamSchema.safeParse(data);
export const safeValidateUpdateTeam = (data: unknown) => UpdateTeamSchema.safeParse(data);
export const safeValidateTeamMember = (data: unknown) => TeamMemberSchema.safeParse(data);
export const safeValidateAddTeamMember = (data: unknown) => AddTeamMemberSchema.safeParse(data);
