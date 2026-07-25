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
import { pushNotificationRepository } from '../repositories/push-notification.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { getPool } from '../config/database.js';
import {
  getPushComposeMeta,
  pushAudienceService,
} from './push-audience.service.js';
import { notificationService } from './notification.service.js';

const KIND_TO_NOTIFICATION_TYPE: Record<PushKind, NotificationType> = {
  general: 'push_general',
  notice: 'push_notice',
  workout: 'push_workout',
  schedule: 'push_schedule',
  trade: 'push_trade',
  event: 'push_event',
};

async function loadSenderRole(
  senderId: string,
  fallbackRole?: RoleCode
): Promise<{ id: string; roleCode: RoleCode }> {
  const pool = getPool();
  if (pool) {
    const user = await userRepository.findById(senderId);
    if (!user || !user.isActive) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }
    return {
      id: user.id,
      roleCode: isRoleCode(user.roleCode) ? user.roleCode : Role.MEMBER,
    };
  }

  const dev = findDevUserById(senderId);
  if (dev) {
    if (!dev.isActive) throw new AppError(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    return {
      id: dev.id,
      roleCode: isRoleCode(dev.roleCode) ? dev.roleCode : Role.MEMBER,
    };
  }

  if (fallbackRole && isRoleCode(fallbackRole)) {
    return { id: senderId, roleCode: fallbackRole };
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
    const sender = await loadSenderRole(senderId, fallbackRole);
    return pushAudienceService.getCapabilities(sender.id, sender.roleCode);
  },

  async send(
    senderId: string,
    input: PushSendInput,
    fallbackRole?: RoleCode
  ): Promise<PushSendResult> {
    const sender = await loadSenderRole(senderId, fallbackRole);
    const meta = getPushComposeMeta(sender.roleCode);

    if (!meta.canCompose) {
      throw new AppError(403, 'FORBIDDEN', 'Cannot compose push notifications');
    }

    const { recipients, skipped: resolveSkipped } =
      await pushAudienceService.resolveRecipients(
        sender.id,
        sender.roleCode,
        input.audience
      );

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

    let delivered = 0;
    let failed = 0;
    let skipped = resolveSkipped;

    for (const recipient of recipients) {
      let success = true;
      let errorCode: string | null = null;
      try {
        await notificationService.notify(
          recipient.id,
          notifType,
          localized,
          localizedBody,
          {
            kind: input.kind,
            deepLink: input.deepLink ?? null,
            imageUrl: input.imageUrl ?? null,
            campaignId: campaign.id,
            senderId: sender.id,
          }
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

      await pushNotificationRepository.createDeliveryLog({
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
    const sender = await loadSenderRole(senderId, fallbackRole);
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
    const sender = await loadSenderRole(senderId, fallbackRole);
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
