import type { Notification, NotificationType, RoleCode } from '@machinefit/shared';
import {
  Role,
  getPushConsentCategoryForNotificationType,
  isRoleCode,
} from '@machinefit/shared';
import { findDevUserById } from '../data/dev-users.js';
import { getPool } from '../config/database.js';
import { notificationRepository } from '../repositories/notification.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { userLoginIdFromEmail } from '../utils/user-login-id.util.js';
import { logger } from '../utils/logger.js';

const PUSH_NOTIFICATION_TYPES = new Set<NotificationType>([
  'push_general',
  'push_notice',
  'push_workout',
  'push_schedule',
  'push_trade',
  'push_event',
]);

interface SenderSnapshot {
  loginId: string;
  displayName: string;
  roleCode: RoleCode;
}

function isPushNotification(type: NotificationType): boolean {
  return PUSH_NOTIFICATION_TYPES.has(type);
}

async function loadSenderSnapshot(senderId: string): Promise<SenderSnapshot | null> {
  const pool = getPool();
  if (pool) {
    const user = await userRepository.findById(senderId);
    if (!user) return null;
    return {
      loginId: userLoginIdFromEmail(user.email),
      displayName: user.displayName,
      roleCode: isRoleCode(user.roleCode) ? user.roleCode : Role.MEMBER,
    };
  }

  const dev = findDevUserById(senderId);
  if (!dev) return null;
  return {
    loginId: userLoginIdFromEmail(dev.email),
    displayName: dev.displayName,
    roleCode: isRoleCode(dev.roleCode) ? dev.roleCode : Role.MEMBER,
  };
}

async function enrichPushSenders(items: Notification[]): Promise<Notification[]> {
  const senderIds = [
    ...new Set(
      items
        .filter(
          (n) =>
            isPushNotification(n.type) &&
            typeof n.payload?.senderId === 'string' &&
            !n.payload.senderLoginId
        )
        .map((n) => n.payload!.senderId as string)
    ),
  ];

  if (senderIds.length === 0) return items;

  const snapshots = new Map<string, SenderSnapshot>();
  await Promise.all(
    senderIds.map(async (id) => {
      const snapshot = await loadSenderSnapshot(id);
      if (snapshot) snapshots.set(id, snapshot);
    })
  );

  return items.map((n) => {
    if (!isPushNotification(n.type) || typeof n.payload?.senderId !== 'string') {
      return n;
    }
    if (n.payload.senderLoginId) return n;

    const snapshot = snapshots.get(n.payload.senderId);
    if (!snapshot) return n;

    return {
      ...n,
      payload: {
        ...n.payload,
        senderLoginId: snapshot.loginId,
        senderDisplayName: snapshot.displayName,
        senderRole: snapshot.roleCode,
      },
    };
  });
}

export const notificationService = {
  async list(userId: string, page = 1, limit = 20) {
    const result = await notificationRepository.list(userId, page, limit);
    return {
      items: await enrichPushSenders(result.items),
      meta: result.meta,
    };
  },

  unreadCount(userId: string) {
    return notificationRepository.unreadCount(userId);
  },

  markRead(userId: string, notificationId: string) {
    return notificationRepository.markRead(userId, notificationId);
  },

  markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },

  async notify(
    userId: string,
    type: Parameters<typeof notificationRepository.create>[1],
    title: Parameters<typeof notificationRepository.create>[2],
    body?: Parameters<typeof notificationRepository.create>[3],
    payload?: Parameters<typeof notificationRepository.create>[4]
  ) {
    const category = getPushConsentCategoryForNotificationType(type);
    if (category) {
      const ok = await userRepository.userHasPushConsent(userId, category);
      if (!ok) {
        logger.info('notification.consent_blocked', {
          type,
          category,
          // no user PII
        });
        return null;
      }
    }
    return notificationRepository.create(userId, type, title, body, payload);
  },
};
