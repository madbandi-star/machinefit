import type { LocalizedString } from './api.types.js';

export type NotificationType =
  | 'machine_request'
  | 'owner_application'
  | 'gym_verified'
  | 'announcement'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: LocalizedString;
  body?: LocalizedString;
  payload?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
