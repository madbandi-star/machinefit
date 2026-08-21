import type { BoardType, ReportStatus, RoleCode } from './api.types.js';

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
  authorRoleCode?: RoleCode;
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
  authorRoleCode?: RoleCode;
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

export interface MachineRequestImage {
  id: string;
  thumbUrl: string;
  imageUrl: string;
  sortOrder: number;
}

export type MachineRequestGymChoiceMode = 'profile' | 'custom' | 'unknown';

export type MachineRequestPriority = 'low' | 'normal' | 'high';

export interface MachineRequestComment {
  id: string;
  requestId: string;
  userId: string;
  parentId?: string;
  content: string;
  isHidden: boolean;
  authorName?: string;
  authorRoleCode?: RoleCode;
  createdAt: string;
  updatedAt: string;
}

export interface MachineRequest {
  id: string;
  userId: string;
  brandName: string;
  machineName: string;
  description: string;
  status: string;
  adminNote?: string | null;
  rejectReason?: string | null;
  linkedMachineId?: string;
  linkedMachineCode?: string | null;
  authorName?: string;
  authorRoleCode?: RoleCode;
  commercialUseConsent?: boolean;
  gymChoiceMode?: MachineRequestGymChoiceMode;
  gymName?: string | null;
  images?: MachineRequestImage[];
  primaryImageUrl?: string;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  /** Number of users who also want this request. */
  voteCount?: number;
  likedByMe?: boolean;
  /** Whether the current viewer has voted "나도 원함". */
  votedByMe?: boolean;
  /** Whether the current viewer owns this request. */
  isMine?: boolean;
  isHidden?: boolean;
  priority?: MachineRequestPriority;
  imageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MachineRequestDetail {
  request: MachineRequest;
  comments: MachineRequestComment[];
}

export interface MachineRequestSimilarGroup {
  brandName: string;
  machineName: string;
  requestCount: number;
  voteCount: number;
  sampleRequestId: string;
  primaryImageUrl?: string;
}
