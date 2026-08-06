import { EventEmitter } from 'node:events';

export type NoticePublishedEvent = {
  noticeId: string;
  category: string;
  isImportant: boolean;
  isBanner: boolean;
  isPopup: boolean;
  publishAt: string | null;
  titles: Partial<Record<'ko' | 'en' | 'ja' | 'zh', string>>;
};

/**
 * Extension point for Push / in-app notification fan-out.
 * Listeners: `noticeEvents.on('notice_published', handler)`.
 */
class NoticeEventBus extends EventEmitter {
  emitPublished(payload: NoticePublishedEvent): void {
    this.emit('notice_published', payload);
  }
}

export const noticeEvents = new NoticeEventBus();
