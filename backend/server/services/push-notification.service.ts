import {
  Role,
  hasMinRole,
  isRoleCode,
  type NotificationType,
  type PushComposeCapabilities,
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
import { userLoginIdFromEmail } from '../utils/user-login-id.util.js';

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
      loginId: userLoginIdFromEmail(user.email),
    };
  }

  const dev = findDevUserById(senderId);
  if (dev) {
    if (!dev.isActive) throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    return {
      id: dev.id,
      roleCode: isRoleCode(dev.roleCode) ? dev.roleCode : Role.MEMBER,
      displayName: dev.displayName,
      loginId: userLoginIdFromEmail(dev.email),
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

function audienceFilterPayload(audience: PushSendInput['audience']): Record<string, unknown> {
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
  };
}

export const pushNotificationService = {
  async getCapabilities(
    senderId: string,
    fallbackRole?: RoleCode
  ): Promise<PushComposeCapabilities> {
    const sender = await loadSender(senderId, fallbackRole);
    return pushAudienceService.getCapabilities(sender.id, sender.roleCode);
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

    let { recipients, skipped: resolveSkipped } =
      await pushAudienceService.resolveRecipients(
        sender.id,
        sender.roleCode,
        input.audience
      );

    // Marketing-style kinds require marketing_opt_in (compliance P1).
    // Friend-to-friend member_exact is exempt — treated as direct user message.
    const marketingKinds = new Set(['general', 'event']);
    if (
      marketingKinds.has(input.kind) &&
      input.audience.type !== 'member_exact' &&
      recipients.length > 0
    ) {
      const allowed = await userRepository.listMarketingOptInUserIds(
        recipients.map((r) => r.id)
      );
      const before = recipients.length;
      recipients = recipients.filter((r) => allowed.has(r.id));
      resolveSkipped += before - recipients.length;
    }

    if (recipients.length === 0) {
      throw new AppError(400, 'NO_RECIPIENTS', 'No eligible recipients for this audience');
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
      audienceFilter: audienceFilterPayload(input.audience),
      recipientCount: 0,
      successCount: 0,
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
    };

    let delivered = 0;
    let failed = 0;
    const skipped = resolveSkipped;

    // Batch fan-out: N sequential inserts were taking 45–60s for ~120 users and
    // the browser client aborted at 15s ("send appears broken").
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
      // Fall back to per-recipient so partial delivery is still possible.
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

    const updated =
      (await pushNotificationRepository.updateCampaignCounts(
        campaign.id,
        recipients.length,
        delivered
      )) ?? {
        ...campaign,
        recipientCount: recipients.length,
        successCount: delivered,
      };

    return {
      campaign: updated,
      delivered,
      failed,
      skipped,
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
