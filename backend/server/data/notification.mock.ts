import type { Notification, NotificationType } from '@machinefit/shared';
import type { LocalizedString } from '@machinefit/shared';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'system',
    title: { en: 'Welcome to MachineFit!', ko: 'MachineFit에 오신 것을 환영합니다!' },
    body: { en: 'Get personalized machine settings for your body.', ko: '체형에 맞는 기구 설정을 받아보세요.' },
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function createMockNotification(
  userId: string,
  type: NotificationType,
  title: LocalizedString,
  body?: LocalizedString,
  payload?: Record<string, unknown>
): Notification {
  const now = new Date().toISOString();
  const notification: Notification = {
    id: crypto.randomUUID(),
    userId,
    type,
    title,
    body,
    payload,
    isRead: false,
    createdAt: now,
    updatedAt: now,
  };
  mockNotifications.unshift(notification);
  return notification;
}

export function getUserNotifications(userId: string): Notification[] {
  return mockNotifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadCount(userId: string): number {
  return mockNotifications.filter((n) => n.userId === userId && !n.isRead).length;
}
