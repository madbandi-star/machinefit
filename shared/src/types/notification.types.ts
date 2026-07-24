import type { LocalizedString } from './api.types.js';

export type NotificationType =
  | 'machine_request'
  | 'owner_application'
  | 'gym_verified'
  | 'announcement'
  | 'system'
  | 'photo_comment'
  | 'photo_like'
  | 'photo_reply'
  | 'photo_report_result';

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
