import type { RoleCode } from './api.types.js';
import type { WorkoutCardTemplateItem } from './workout-card.types.js';
import type {
  TemplateShareCategory,
  TemplateShareDifficulty,
  TemplateShareReportReason,
  TemplateShareReportStatus,
  TemplateShareSort,
  TemplateShareStatus,
} from '../constants/template-share.js';

export interface TemplateShareBadge {
  key: 'popular' | 'top10' | 'rising' | 'most_used' | 'new';
  label: string;
}

export interface TemplateShareListItem {
  id: string;
  title: string;
  description: string;
  category: TemplateShareCategory;
  difficulty: TemplateShareDifficulty;
  tags: string[];
  thumbnailUrl?: string | null;
  youtubeUrl?: string | null;
  youtubeChannelName?: string | null;
  instagramId?: string | null;
  authorUserId: string;
  authorName: string;
  authorRoleCode?: RoleCode;
  status: TemplateShareStatus;
  viewCount: number;
  downloadCount: number;
  useCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  likedByMe?: boolean;
  favoritedByMe?: boolean;
  downloadedByMe?: boolean;
  itemCount: number;
  badges?: TemplateShareBadge[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateShareDetail extends TemplateShareListItem {
  sourceTemplateId?: string | null;
  items: WorkoutCardTemplateItem[];
  canDownload: boolean;
  sharePath: string;
}

export interface TemplateShareListResponse {
  items: TemplateShareListItem[];
  total: number;
  page: number;
  pageSize: number;
  sort: TemplateShareSort;
}

export interface TemplateShareComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorRoleCode?: RoleCode;
  content: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface TemplateShareDownloadResult {
  templateId: string;
  postId: string;
  alreadyOwned: boolean;
}

export interface TemplateShareAdminStats {
  totalPublished: number;
  totalHidden: number;
  totalDownloads: number;
  totalUses: number;
  totalLikes: number;
  totalComments: number;
  openReports: number;
}

export interface TemplateShareReport {
  id: string;
  postId?: string | null;
  commentId?: string | null;
  postTitle?: string;
  reason: TemplateShareReportReason | string;
  description: string;
  status: TemplateShareReportStatus;
  reporterUserId: string;
  createdAt: string;
}

/** Extended private template fields for My Templates / share eligibility. */
export interface WorkoutCardTemplateOrigin {
  isOriginal: boolean;
  canShare: boolean;
  originalTemplateId?: string | null;
  sourceTemplateId?: string | null;
  sourceSharePostId?: string | null;
  originAuthorName?: string | null;
  originTitle?: string | null;
  sharePostId?: string | null;
  sharePostStatus?: TemplateShareStatus | null;
}
