/**
 * TYPE GUARDS
 * ===========
 * Runtime type checking utilities
 * 
 * Usage:
 * ```typescript
 * import { isUser, isLeaveRequest } from '../types/guards';
 * 
 * if (isUser(data)) {
 *   // TypeScript knows data is User
 *   console.log(data.email);
 * }
 * ```
 */

import type { User } from '../database';
import type { LeaveRequest } from '../database';
import type { Team, TeamMember } from '../database';
import type { Video, Quiz, QuizAttempt, LearningProgress } from '../database';
import type { Document } from '../database';

/**
 * USER TYPE GUARDS
 */
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'first_name' in value &&
    'last_name' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).email === 'string'
  );
}

export function isUserRole(value: unknown): value is 'USER' | 'ADMIN' | 'HR' | 'SUPERADMIN' {
  return (
    value === 'USER' ||
    value === 'ADMIN' ||
    value === 'HR' ||
    value === 'SUPERADMIN'
  );
}

/**
 * LEAVE REQUEST TYPE GUARDS
 */
export function isLeaveRequest(value: unknown): value is LeaveRequest {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'user_id' in value &&
    'type' in value &&
    'start_date' in value &&
    'end_date' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).user_id === 'string'
  );
}

export function isLeaveType(value: unknown): value is 'VACATION' | 'SICK' | 'PERSONAL' | 'UNPAID' {
  return (
    value === 'VACATION' ||
    value === 'SICK' ||
    value === 'PERSONAL' ||
    value === 'UNPAID'
  );
}

export function isLeaveStatus(value: unknown): value is 'PENDING' | 'APPROVED' | 'REJECTED' {
  return (
    value === 'PENDING' ||
    value === 'APPROVED' ||
    value === 'REJECTED'
  );
}

/**
 * TEAM TYPE GUARDS
 */
export function isTeam(value: unknown): value is Team {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string'
  );
}

export function isTeamMember(value: unknown): value is TeamMember {
  return (
    typeof value === 'object' &&
    value !== null &&
    'user_id' in value &&
    'team_id' in value &&
    typeof (value as any).user_id === 'string' &&
    typeof (value as any).team_id === 'string'
  );
}

export function isTeamMemberRole(value: unknown): value is 'TEAMLEAD' | 'MEMBER' {
  return value === 'TEAMLEAD' || value === 'MEMBER';
}

export function isPriorityTag(value: unknown): value is 'PRIMARY' | 'BACKUP' | 'BACKUP_BACKUP' {
  return (
    value === 'PRIMARY' ||
    value === 'BACKUP' ||
    value === 'BACKUP_BACKUP'
  );
}

/**
 * LEARNING TYPE GUARDS
 */
export function isVideo(value: unknown): value is Video {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'youtube_url' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).title === 'string'
  );
}

export function isQuiz(value: unknown): value is Quiz {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'questions' in value &&
    typeof (value as any).id === 'string' &&
    Array.isArray((value as any).questions)
  );
}

export function isQuizAttempt(value: unknown): value is QuizAttempt {
  return (
    typeof value === 'object' &&
    value !== null &&
    'quiz_id' in value &&
    'user_id' in value &&
    'score' in value &&
    typeof (value as any).quiz_id === 'string' &&
    typeof (value as any).user_id === 'string' &&
    typeof (value as any).score === 'number'
  );
}

export function isLearningProgress(value: unknown): value is LearningProgress {
  return (
    typeof value === 'object' &&
    value !== null &&
    'user_id' in value &&
    'video_id' in value &&
    'progress' in value &&
    typeof (value as any).user_id === 'string' &&
    typeof (value as any).video_id === 'string' &&
    typeof (value as any).progress === 'number'
  );
}

/**
 * DOCUMENT TYPE GUARDS
 */
export function isDocument(value: unknown): value is Document {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'file_name' in value &&
    'file_url' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).title === 'string'
  );
}

/**
 * ARRAY TYPE GUARDS
 */
export function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}

export function isLeaveRequestArray(value: unknown): value is LeaveRequest[] {
  return Array.isArray(value) && value.every(isLeaveRequest);
}

export function isTeamArray(value: unknown): value is Team[] {
  return Array.isArray(value) && value.every(isTeam);
}

export function isVideoArray(value: unknown): value is Video[] {
  return Array.isArray(value) && value.every(isVideo);
}

export function isDocumentArray(value: unknown): value is Document[] {
  return Array.isArray(value) && value.every(isDocument);
}

/**
 * UUID TYPE GUARD
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * EMAIL TYPE GUARD
 */
export function isEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * DATE STRING TYPE GUARD
 */
export function isDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * NON-EMPTY STRING TYPE GUARD
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * POSITIVE NUMBER TYPE GUARD
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0;
}

/**
 * NON-NEGATIVE NUMBER TYPE GUARD
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0;
}

/**
 * ASSERTION HELPERS
 * Throw error if type guard fails
 */
export function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error('Value is not a valid User');
  }
}

export function assertLeaveRequest(value: unknown): asserts value is LeaveRequest {
  if (!isLeaveRequest(value)) {
    throw new Error('Value is not a valid LeaveRequest');
  }
}

export function assertTeam(value: unknown): asserts value is Team {
  if (!isTeam(value)) {
    throw new Error('Value is not a valid Team');
  }
}

export function assertUUID(value: unknown): asserts value is string {
  if (!isUUID(value)) {
    throw new Error('Value is not a valid UUID');
  }
}

export function assertEmail(value: unknown): asserts value is string {
  if (!isEmail(value)) {
    throw new Error('Value is not a valid email');
  }
}

/**
 * SAFE ASSERTION HELPERS
 * Returns boolean instead of throwing
 */
export function safeAssertUser(value: unknown): value is User {
  try {
    assertUser(value);
    return true;
  } catch {
    return false;
  }
}

export function safeAssertUUID(value: unknown): value is string {
  try {
    assertUUID(value);
    return true;
  } catch {
    return false;
  }
}

export function safeAssertEmail(value: unknown): value is string {
  try {
    assertEmail(value);
    return true;
  } catch {
    return false;
  }
}
