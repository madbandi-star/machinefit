import {
  Role,
  assertServiceKindContentAllowed,
  getPushConsentCategoryForKind,
  hasMinRole,
  isRoleCode,
  type NotificationType,
  type PushAudiencePreview,
  type PushComposeCapabilities,
  type PushConsentCategory,
  type PushKind,
  type PushSendInput,
  type PushSendResult,
  type RoleCode,
} from '@machinefit/shared';
import { findDevUserById } from '../data/dev-users.js';
import { AppError } from '../middlewares/error.middleware.js';
import {
  pushNotificationRepository,
  type CreatePushDeliveryLogInput,
} from '../repositories/push-notification.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { getPool } from '../config/database.js';
import {
  getPushComposeMeta,
  pushAudienceService,
} from './push-audience.service.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { userLoginIdFromUser } from '../utils/user-login-id.util.js';
import { logger } from '../utils/logger.js';

const KIND_TO_NOTIFICATION_TYPE: Record<PushKind, NotificationType> = {
  general: 'push_general',
  notice: 'push_notice',
  workout: 'push_workout',
  schedule: 'push_schedule',
  trade: 'push_trade',
  event: 'push_event',
};

interface PushSenderProfile {
  id: string;
  roleCode: RoleCode;
  displayName: string;
  loginId: string;
}

interface ConsentFilterResult<T extends { id: string }> {
  recipients: T[];
  consentExcluded: number;
  consentCategory: PushConsentCategory;
}

async function loadSender(
  senderId: string,
  fallbackRole?: RoleCode
): Promise<PushSenderProfile> {
  const pool = getPool();
  if (pool) {
    const user = await userRepository.findById(senderId);
    if (!user || !user.isActive) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    return {
      id: user.id,
      roleCode: isRoleCode(user.roleCode) ? user.roleCode : Role.MEMBER,
      displayName: user.displayName,
      loginId: userLoginIdFromUser(user),
    };
  }

  const dev = findDevUserById(senderId);
  if (dev) {
    if (!dev.isActive) throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    return {
      id: dev.id,
      roleCode: isRoleCode(dev.roleCode) ? dev.roleCode : Role.MEMBER,
      displayName: dev.displayName,
      loginId: userLoginIdFromUser(dev),
    };
  }

  if (fallbackRole && isRoleCode(fallbackRole)) {
    return {
      id: senderId,
      roleCode: fallbackRole,
      displayName: senderId.slice(0, 8),
      loginId: senderId.slice(0, 8),
    };
  }

  throw new AppError(404, 'NOT_FOUND', 'User not found');
}

function audienceFilterPayload(
  audience: PushSendInput['audience'],
  consentCategory: PushConsentCategory
): Record<string, unknown> {
  return {
    type: audience.type,
    roleCode: audience.roleCode ?? null,
    gymId: audience.gymId ?? null,
    countryCode: audience.countryCode ?? null,
    stateId: audience.stateId ?? null,
    cityId: audience.cityId ?? null,
    districtId: audience.districtId ?? null,
    userIds: audience.userIds ?? null,
    query: audience.query ?? null,
    consentCategory,
    consentGate: 'live_at_send',
  };
}

/**
 * Final consent gate — always uses current DB flags (never cached audience lists).
 * No audience-type exemption (including member_exact / admin picks).
 */
export async function filterRecipientsByPushConsent<T extends { id: string }>(
  recipients: T[],
  category: PushConsentCategory
): Promise<ConsentFilterResult<T>> {
  if (recipients.length === 0) {
    return { recipients: [], consentExcluded: 0, consentCategory: category };
  }

  const ids = recipients.map((r) => r.id);
  const allowed =
    category === 'marketing'
      ? await userRepository.listMarketingOptInUserIds(ids)
      : category === 'event'
        ? await userRepository.listEventOptInUserIds(ids)
        : await userRepository.listPushServiceOptInUserIds(ids);

  const kept = recipients.filter((r) => allowed.has(r.id));
  const consentExcluded = recipients.length - kept.length;

  if (consentExcluded > 0) {
    logger.info('push.consent_filtered', {
      category,
      resolved: recipients.length,
      eligible: kept.length,
      excluded: consentExcluded,
      // No PII — counts only
    });
  }

  return { recipients: kept, consentExcluded, consentCategory: category };
}

function rejectMarketingAsService(kind: PushKind, title: string, body: string): void {
  const check = assertServiceKindContentAllowed(kind, title, body);
  if (!check.ok) {
    throw new AppError(
      400,
      'MARKETING_CONTENT_AS_SERVICE',
      'Marketing/promotional content cannot be sent as a service (non-marketing) notification. Choose an event/promotion kind, or rewrite the message.'
    );
  }
}

export const pushNotificationService = {
  async getCapabilities(
    senderId: string,
    fallbackRole?: RoleCode
  ): Promise<PushComposeCapabilities> {
    const sender = await loadSender(senderId, fallbackRole);
    return pushAudienceService.getCapabilities(sender.id, sender.roleCode);
  },

  async previewAudience(
    senderId: string,
    input: {
      kind: PushKind;
      title?: string;
      body?: string;
      audience: PushSendInput['audience'];
    },
    fallbackRole?: RoleCode
  ): Promise<PushAudiencePreview> {
    const sender = await loadSender(senderId, fallbackRole);
    const meta = getPushComposeMeta(sender.roleCode);
    if (!meta.canCompose) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot compose push notifications');
    }

    const consentCategory = getPushConsentCategoryForKind(input.kind);
    const marketingContentBlocked =
      assertServiceKindContentAllowed(
        input.kind,
        input.title ?? '',
        input.body ?? ''
      ).ok === false;

    const { recipients } = await pushAudienceService.resolveRecipients(
      sender.id,
      sender.roleCode,
      input.audience
    );
    const resolvedCount = recipients.length;
    const filtered = await filterRecipientsByPushConsent(recipients, consentCategory);

    return {
      consentCategory,
      resolvedCount,
      consentEligibleCount: filtered.recipients.length,
      consentExcludedCount: filtered.consentExcluded,
      finalCount: marketingContentBlocked ? 0 : filtered.recipients.length,
      marketingContentBlocked,
    };
  },

  async send(
    senderId: string,
    input: PushSendInput,
    fallbackRole?: RoleCode
  ): Promise<PushSendResult> {
    const sender = await loadSender(senderId, fallbackRole);
    const meta = getPushComposeMeta(sender.roleCode);

    if (!meta.canCompose) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot compose push notifications');
    }

    rejectMarketingAsService(input.kind, input.title, input.body);

    const consentCategory = getPushConsentCategoryForKind(input.kind);

    let { recipients, skipped: resolveSkipped } =
      await pushAudienceService.resolveRecipients(
        sender.id,
        sender.roleCode,
        input.audience
      );
    const resolvedCount = recipients.length;

    // Live consent re-check immediately before delivery (no cached opt-in lists).
    const consentFiltered = await filterRecipientsByPushConsent(
      recipients,
      consentCategory
    );
    recipients = consentFiltered.recipients;
    const consentExcluded = consentFiltered.consentExcluded;
    const skipped = resolveSkipped + consentExcluded;

    if (recipients.length === 0) {
      throw new AppError(
        400,
        'NO_RECIPIENTS',
        consentExcluded > 0
          ? 'No eligible recipients after consent filtering'
          : 'No eligible recipients for this audience'
      );
    }

    if (
      isMemberTierOnly(sender.roleCode) &&
      (recipients.length > 1 || input.audience.type !== 'member_exact')
    ) {
      throw new AppError(403, 'FORBIDDEN', 'Members may only send to one connected user');
    }

    const campaign = await pushNotificationRepository.createCampaign({
      senderId: sender.id,
      senderRole: sender.roleCode,
      kind: input.kind,
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl,
      deepLink: input.deepLink,
      audienceType: input.audience.type,
      audienceFilter: audienceFilterPayload(input.audience, consentCategory),
      recipientCount: 0,
      successCount: 0,
      consentCategory,
      skippedConsentCount: consentExcluded,
      failedCount: 0,
    });

    const notifType = KIND_TO_NOTIFICATION_TYPE[input.kind];
    const localized = { ko: input.title, en: input.title };
    const localizedBody = { ko: input.body, en: input.body };
    const payload = {
      kind: input.kind,
      deepLink: input.deepLink ?? null,
      imageUrl: input.imageUrl ?? null,
      campaignId: campaign.id,
      senderId: sender.id,
      senderRole: sender.roleCode,
      senderDisplayName: sender.displayName,
      senderLoginId: sender.loginId,
      consentCategory,
    };

    let delivered = 0;
    let failed = 0;

    try {
      delivered = await notificationRepository.createMany(
        recipients.map((recipient) => ({
          userId: recipient.id,
          type: notifType,
          title: localized,
          body: localizedBody,
          payload,
        }))
      );
      await pushNotificationRepository.createDeliveryLogs(
        recipients.map((recipient) => ({
          campaignId: campaign.id,
          senderId: sender.id,
          senderRole: sender.roleCode,
          recipientId: recipient.id,
          recipientRole: recipient.roleCode,
          title: input.title,
          body: input.body,
          success: true,
          errorCode: null,
        }))
      );
    } catch {
      delivered = 0;
      failed = 0;
      const logs: CreatePushDeliveryLogInput[] = [];
      for (const recipient of recipients) {
        let success = true;
        let errorCode: string | null = null;
        try {
          await notificationRepository.create(
            recipient.id,
            notifType,
            localized,
            localizedBody,
            payload
          );
          delivered += 1;
        } catch (err) {
          success = false;
          failed += 1;
          errorCode =
            err instanceof Error && 'code' in err
              ? String((err as { code?: string }).code ?? 'DELIVERY_FAILED')
              : 'DELIVERY_FAILED';
        }
        logs.push({
          campaignId: campaign.id,
          senderId: sender.id,
          senderRole: sender.roleCode,
          recipientId: recipient.id,
          recipientRole: recipient.roleCode,
          title: input.title,
          body: input.body,
          success,
          errorCode,
        });
      }
      await pushNotificationRepository.createDeliveryLogs(logs);
    }

    logger.info('push.campaign_sent', {
      campaignId: campaign.id,
      kind: input.kind,
      consentCategory,
      resolvedCount,
      consentExcluded,
      delivered,
      failed,
      audienceType: input.audience.type,
    });

    const updated =
      (await pushNotificationRepository.updateCampaignCounts(
        campaign.id,
        recipients.length,
        delivered,
        { failedCount: failed, skippedConsentCount: consentExcluded }
      )) ?? {
        ...campaign,
        recipientCount: recipients.length,
        successCount: delivered,
        failedCount: failed,
        skippedConsentCount: consentExcluded,
      };

    return {
      campaign: updated,
      delivered,
      failed,
      skipped,
      resolvedCount,
      consentExcluded,
      consentCategory,
    };
  },

  async listCampaigns(
    senderId: string,
    options: { all?: boolean; limit?: number; offset?: number } = {},
    fallbackRole?: RoleCode
  ) {
    const sender = await loadSender(senderId, fallbackRole);
    const wantAll = Boolean(options.all) && hasMinRole(sender.roleCode, Role.ADMIN);
    return pushNotificationRepository.listCampaigns({
      senderId: sender.id,
      all: wantAll,
      limit: options.limit,
      offset: options.offset,
    });
  },

  async listCampaignLogs(
    senderId: string,
    campaignId: string,
    fallbackRole?: RoleCode
  ) {
    const sender = await loadSender(senderId, fallbackRole);
    const isAdmin = hasMinRole(sender.roleCode, Role.ADMIN);
    await pushNotificationRepository.requireCampaignAccess(
      campaignId,
      sender.id,
      isAdmin
    );
    return pushNotificationRepository.listDeliveryLogs(campaignId);
  },
};

function isMemberTierOnly(role: RoleCode): boolean {
  return (
    (role === Role.MEMBER ||
      role === Role.PREMIUM_MEMBER ||
      role === Role.VIP_MEMBER) &&
    !hasMinRole(role, Role.TRAINER)
  );
}
