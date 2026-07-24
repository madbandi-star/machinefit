import type { ReportStatus } from './api.types.js';

export type PhotoBoardSort = 'latest' | 'popular' | 'views' | 'comments';

export interface PhotoPostImageMeta {
  id: string;
  postId: string;
  sortOrder: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbUrl: string;
  mainUrl: string;
}

export interface PhotoPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isHidden: boolean;
  authorName?: string;
  tags: string[];
  coverImage?: PhotoPostImageMeta;
  images?: PhotoPostImageMeta[];
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoPostComment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  content: string;
  isHidden: boolean;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoPostReport {
  id: string;
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  postTitle?: string;
  reporterName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoUserBlock {
  id: string;
  userId: string;
  reason?: string;
  blockedBy: string;
  userName?: string;
  createdAt: string;
}

export interface PhotoPostDetail {
  post: PhotoPost;
  comments: PhotoPostComment[];
}
