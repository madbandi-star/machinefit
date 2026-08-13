import type { QaCategory, QaFeedbackValue, QaPriority } from '../constants/qa.js';

export interface QaArticleListItem {
  id: string;
  category: QaCategory;
  priority: QaPriority;
  title: string;
  /** Short preview for list cards (plain text). */
  excerpt: string;
  keywords: string[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  displayOrder: number;
  isPublished: boolean;
  needsImplReview: boolean;
  isPopular?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QaArticleDetail extends QaArticleListItem {
  answer: string;
  slug: string | null;
  /** Current user's vote when authenticated. */
  myFeedback?: QaFeedbackValue | null;
}

export interface QaListResponse {
  items: QaArticleListItem[];
  total: number;
  page: number;
  pageSize: number;
  popular: QaArticleListItem[];
}

export interface QaAdminStats {
  total: number;
  published: number;
  unpublished: number;
  totalViews: number;
  totalHelpful: number;
  totalNotHelpful: number;
  byCategory: { category: QaCategory; count: number }[];
  topViewed: { id: string; title: string; viewCount: number }[];
  topHelpful: { id: string; title: string; helpfulCount: number; notHelpfulCount: number }[];
}

export interface QaCategoryMeta {
  category: QaCategory;
  count: number;
}
