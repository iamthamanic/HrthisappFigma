/**
 * NOTIFICATION TRIGGERS (v4.0.0)
 * Helper functions to trigger notifications across the app
 */

import { notificationService } from '../../services/HRTHIS_notificationService';
import type { NotificationType } from '../../types/notifications';

/**
 * Trigger: Leave Request Created
 */
export async function notifyLeaveRequestPending(
  approverIds: string[],
  requesterName: string,
  leaveRequestId: string
): Promise<void> {
  if (approverIds.length === 0) return;

  await notificationService.createBulk(approverIds, {
    type: 'LEAVE_REQUEST_PENDING',
    title: 'Neuer Urlaubsantrag',
    message: `${requesterName} hat einen Urlaubsantrag gestellt`,
    data: { leave_request_id: leaveRequestId },
    link: '/time-and-leave',
    related_id: leaveRequestId,
  });
}

/**
 * Trigger: Leave Request Approved
 */
export async function notifyLeaveRequestApproved(
  requesterId: string,
  approverName: string,
  leaveRequestId: string
): Promise<void> {
  await notificationService.create({
    user_id: requesterId,
    type: 'LEAVE_REQUEST_APPROVED',
    title: 'Urlaubsantrag genehmigt',
    message: `Dein Urlaubsantrag wurde von ${approverName} genehmigt`,
    data: { leave_request_id: leaveRequestId },
    link: '/time-and-leave',
    related_id: leaveRequestId,
  });
}

/**
 * Trigger: Leave Request Rejected
 */
export async function notifyLeaveRequestRejected(
  requesterId: string,
  approverName: string,
  leaveRequestId: string,
  reason?: string
): Promise<void> {
  await notificationService.create({
    user_id: requesterId,
    type: 'LEAVE_REQUEST_REJECTED',
    title: 'Urlaubsantrag abgelehnt',
    message: reason
      ? `Dein Urlaubsantrag wurde abgelehnt: ${reason}`
      : `Dein Urlaubsantrag wurde von ${approverName} abgelehnt`,
    data: { leave_request_id: leaveRequestId, reason },
    link: '/time-and-leave',
    related_id: leaveRequestId,
  });
}

/**
 * Trigger: Document Uploaded
 */
export async function notifyDocumentUploaded(
  userIds: string[],
  documentTitle: string,
  documentId: string,
  uploadedByName: string
): Promise<void> {
  if (userIds.length === 0) return;

  await notificationService.createBulk(userIds, {
    type: 'DOCUMENT_UPLOADED',
    title: 'Neues Dokument',
    message: `${uploadedByName} hat ein neues Dokument hochgeladen: ${documentTitle}`,
    data: { document_id: documentId },
    link: '/documents',
    related_id: documentId,
  });
}

/**
 * Trigger: Benefit Approved
 */
export async function notifyBenefitApproved(
  userId: string,
  benefitTitle: string,
  benefitId: string
): Promise<void> {
  await notificationService.create({
    user_id: userId,
    type: 'BENEFIT_APPROVED',
    title: 'Benefit genehmigt',
    message: `Dein Benefit "${benefitTitle}" wurde genehmigt`,
    data: { benefit_id: benefitId },
    link: `/benefits/${benefitId}`,
    related_id: benefitId,
  });
}

/**
 * Trigger: Benefit Rejected
 */
export async function notifyBenefitRejected(
  userId: string,
  benefitTitle: string,
  benefitId: string,
  reason?: string
): Promise<void> {
  await notificationService.create({
    user_id: userId,
    type: 'BENEFIT_REJECTED',
    title: 'Benefit abgelehnt',
    message: reason
      ? `Dein Benefit "${benefitTitle}" wurde abgelehnt: ${reason}`
      : `Dein Benefit "${benefitTitle}" wurde abgelehnt`,
    data: { benefit_id: benefitId, reason },
    link: `/benefits/${benefitId}`,
    related_id: benefitId,
  });
}

/**
 * Trigger: Coins Awarded
 */
export async function notifyCoinsAwarded(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  await notificationService.create({
    user_id: userId,
    type: 'COINS_AWARDED',
    title: 'Coins erhalten',
    message: `Du hast ${amount} Coins erhalten: ${reason}`,
    data: { amount, reason },
    link: '/achievements',
  });
}

/**
 * Trigger: Achievement Unlocked
 */
export async function notifyAchievementUnlocked(
  userId: string,
  achievementTitle: string,
  achievementId: string,
  coinsAwarded: number
): Promise<void> {
  await notificationService.create({
    user_id: userId,
    type: 'ACHIEVEMENT_UNLOCKED',
    title: 'Achievement freigeschaltet',
    message: `🎉 Achievement "${achievementTitle}" freigeschaltet! +${coinsAwarded} Coins`,
    data: { achievement_id: achievementId, coins: coinsAwarded },
    link: '/achievements',
    related_id: achievementId,
  });
}

/**
 * Trigger: Video Added
 */
export async function notifyVideoAdded(
  userIds: string[],
  videoTitle: string,
  videoId: string
): Promise<void> {
  if (userIds.length === 0) return;

  await notificationService.createBulk(userIds, {
    type: 'VIDEO_ADDED',
    title: 'Neues Lernvideo',
    message: `Ein neues Video wurde hinzugefügt: ${videoTitle}`,
    data: { video_id: videoId },
    link: `/learning/video/${videoId}`,
    related_id: videoId,
  });
}

/**
 * Trigger: Announcement Created
 */
export async function notifyAnnouncementCreated(
  userIds: string[],
  announcementTitle: string,
  announcementId: string
): Promise<void> {
  if (userIds.length === 0) return;

  await notificationService.createBulk(userIds, {
    type: 'ANNOUNCEMENT_CREATED',
    title: 'Neue Mitteilung',
    message: `Neue Dashboard-Mitteilung: ${announcementTitle}`,
    data: { announcement_id: announcementId },
    link: '/dashboard',
    related_id: announcementId,
  });
}

/**
 * Trigger: Organigram Updated
 */
export async function notifyOrganigramUpdated(
  userIds: string[],
  updatedByName: string
): Promise<void> {
  if (userIds.length === 0) return;

  await notificationService.createBulk(userIds, {
    type: 'ORGANIGRAM_UPDATED',
    title: 'Organigram aktualisiert',
    message: `Das Organigram wurde von ${updatedByName} aktualisiert`,
    data: {},
    link: '/organigram',
  });
}
