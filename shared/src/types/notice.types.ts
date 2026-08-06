import type { NoticeCategory, NoticeLanguage, NoticeStatus } from '../constants/notice.js';

export interface NoticeTranslation {
  language: NoticeLanguage;
  title: string;
  content: string;
}

export interface NoticeAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  publicUrl?: string;
  sortOrder: number;
  isInlineImage: boolean;
  createdAt: string;
}

export interface NoticeListItem {
  id: string;
  category: NoticeCategory;
  status: NoticeStatus;
  isPinned: boolean;
  isImportant: boolean;
  isBanner: boolean;
  isPopup: boolean;
  publishAt?: string;
  viewCount: number;
  title: string;
  /** Plain excerpt for list search snippets (optional). */
  excerpt?: string;
  isNew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeDetail extends NoticeListItem {
  content: string;
  translations?: NoticeTranslation[];
  attachments: NoticeAttachment[];
  createdBy?: string;
  prevId?: string | null;
  nextId?: string | null;
  viewsLast30Days?: number;
}

export interface NoticeAdminStats {
  totalPublished: number;
  totalViews: number;
  viewsLast30Days: number;
  popular: { id: string; title: string; viewCount: number }[];
}

export interface NoticeListResponse {
  items: NoticeListItem[];
  total: number;
  page: number;
  pageSize: number;
}
