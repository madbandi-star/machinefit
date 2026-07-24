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
  | 'online_pt_question_received'
  | 'online_pt_answer_ready'
  | 'online_pt_followup'
  | 'online_pt_refund'
  | 'online_pt_closed'
  | 'online_pt_new_question'
  | 'online_pt_deadline_soon'
  | 'online_pt_review'
  | 'online_pt_payout';

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
