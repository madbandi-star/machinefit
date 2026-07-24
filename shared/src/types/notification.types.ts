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
  | 'photo_report_result'
  | 'trade_like'
  | 'trade_report_result'
  /** Role-based human/campaign push kinds (inbox). */
  | 'push_general'
  | 'push_notice'
  | 'push_workout'
  | 'push_schedule'
  | 'push_trade'
  | 'push_event';

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
