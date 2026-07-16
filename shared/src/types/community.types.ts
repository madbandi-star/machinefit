import type { BoardType, ReportStatus } from './api.types.js';

export interface Post {
  id: string;
  userId: string;
  boardType: BoardType;
  title: string;
  content: string;
  languageCode?: string;
  isPinned: boolean;
  isHidden: boolean;
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
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

export interface Report {
  id: string;
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MachineRequest {
  id: string;
  userId: string;
  brandName?: string;
  machineName: string;
  description?: string;
  status: string;
  adminNote?: string;
  linkedMachineId?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}
