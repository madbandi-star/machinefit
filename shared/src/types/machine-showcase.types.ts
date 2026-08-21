import type { RoleCode } from './api.types.js';
import type { MachineRarityGrade } from '../utils/machine-rarity.js';

export type MachineShowcaseSort = 'latest' | 'popular';
export type MachineShowcaseTab = 'popular' | 'latest' | 'myGym' | 'nearby';
export type MachineShowcaseReportReason =
  | 'inappropriate'
  | 'spam'
  | 'duplicate'
  | 'wrong_machine'
  | 'personal_info'
  | 'other';

export interface MachineRarityPublic {
  machineId: string;
  machineCode: string;
  grade: MachineRarityGrade;
  score: number;
  gymHoldingCount: number;
  postCount: number;
  discoveryCount: number;
}

export interface MachineRarityAdmin extends MachineRarityPublic {
  autoGrade: MachineRarityGrade;
  userGymHoldingCount: number;
  adminWeight: number;
  uniqueFlag: boolean;
  gradeOverride: MachineRarityGrade | null;
  firstDiscovererName?: string | null;
  firstDiscoveredAt?: string | null;
  calculatedAt: string;
}

export interface MachineShowcaseImageMeta {
  id: string;
  postId: string;
  sortOrder: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbUrl: string;
  mainUrl: string;
}

export interface MachineShowcasePost {
  id: string;
  userId: string;
  authorName?: string;
  authorRoleCode?: RoleCode;
  machineId: string;
  machineCode: string;
  machineName: string;
  brandCode?: string;
  brandName?: string;
  muscleGroup?: string;
  userGymId?: string;
  userGymName?: string;
  gymId?: string;
  gymName?: string;
  gymCity?: string;
  caption: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  coverImage?: MachineShowcaseImageMeta;
  images?: MachineShowcaseImageMeta[];
  rarity: MachineRarityPublic;
  discoveryRank?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MachineShowcaseComment {
  id: string;
  postId: string;
  userId: string;
  parentId?: string;
  content: string;
  authorName?: string;
  authorRoleCode?: RoleCode;
  createdAt: string;
  updatedAt: string;
}

export interface MachineShowcasePostDetail {
  post: MachineShowcasePost;
  comments: MachineShowcaseComment[];
  discovery?: {
    rank: number | null;
    discoveredAt: string;
  } | null;
}

export interface MachineShowcaseCreateResult {
  post: MachineShowcasePost;
  discovery: {
    isNew: boolean;
    rank: number | null;
    grade: MachineRarityGrade;
    gymHoldingCount: number;
  };
  newlyUnlockedAchievementIds: string[];
}

export interface MachineShowcaseReport {
  id: string;
  reporterId: string;
  postId?: string;
  commentId?: string;
  reason: string;
  description?: string;
  status: string;
  reporterName?: string;
  createdAt: string;
}

export interface MachineGymHolding {
  gymId: string;
  gymName: string;
  city?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  verified: boolean;
}

export interface MachineGymsResponse {
  machineCode: string;
  rarity: MachineRarityPublic;
  totalGyms: number;
  byRegion: Array<{ region: string; count: number }>;
  items: MachineGymHolding[];
}

export interface MachineDexEntry {
  machineId: string;
  machineCode: string;
  machineName: string;
  brandCode?: string;
  brandName?: string;
  grade: MachineRarityGrade;
  score: number;
  discoveryRank: number | null;
  discoveredAt: string;
  gymHoldingCount: number;
  coverThumbUrl?: string;
}

export interface MachineDexSummary {
  discovered: number;
  catalogTotal: number;
  byGrade: Record<MachineRarityGrade, number>;
  items: MachineDexEntry[];
}

export interface UserGymHoldingsSummary {
  userGymId: string;
  userGymName: string;
  total: number;
  byMuscle: Array<{ muscleGroup: string; count: number }>;
  recent: Array<{
    machineCode: string;
    machineName: string;
    brandName?: string;
    createdAt: string;
  }>;
}
