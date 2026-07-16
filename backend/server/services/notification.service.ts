import { notificationRepository } from '../repositories/notification.repository.js';

export const notificationService = {
  list(userId: string, page = 1, limit = 20) {
    return notificationRepository.list(userId, page, limit);
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

  notify(
    userId: string,
    type: Parameters<typeof notificationRepository.create>[1],
    title: Parameters<typeof notificationRepository.create>[2],
    body?: Parameters<typeof notificationRepository.create>[3],
    payload?: Parameters<typeof notificationRepository.create>[4]
  ) {
    return notificationRepository.create(userId, type, title, body, payload);
  },
};
