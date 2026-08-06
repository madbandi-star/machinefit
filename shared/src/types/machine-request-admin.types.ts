import type { RequestStatus } from './api.types.js';
import type {
  MachineRequestGymChoiceMode,
  MachineRequestImage,
  MachineRequestPriority,
} from './community.types.js';

export type AdminMachineRequestStatus = RequestStatus;

export interface AdminMachineRequestGymStat {
  gymName: string;
  requestCount: number;
}

export interface AdminMachineRequestStats {
  total: number;
  pending: number;
  reviewing: number;
  added: number;
  rejected: number;
  thisMonthRequests: number;
  thisMonthAdded: number;
  topGyms?: AdminMachineRequestGymStat[];
}

export interface AdminMachineRequestPopularItem {
  groupKey: string;
  brandName: string;
  machineName: string;
  requestCount: number;
  voteCount?: number;
}

export interface AdminMachineRequestCommentPreview {
  id: string;
  requestId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface AdminMachineRequestRequester {
  requestId: string;
  userId: string;
  authorName: string;
  description: string;
  gymChoiceMode?: MachineRequestGymChoiceMode;
  gymName?: string | null;
  commercialUseConsent?: boolean;
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;
  voteCount?: number;
  priority?: MachineRequestPriority;
  assigneeUserId?: string | null;
  assigneeName?: string | null;
  isHidden?: boolean;
  primaryImageUrl?: string;
  /** Full gallery for admin download / register reuse. */
  images?: MachineRequestImage[];
  recentComments?: AdminMachineRequestCommentPreview[];
  createdAt: string;
  status: AdminMachineRequestStatus;
}

export interface AdminMachineRequestGroup {
  groupKey: string;
  brandName: string;
  machineName: string;
  requestCount: number;
  /** Highest-priority status among members for list badge */
  status: AdminMachineRequestStatus;
  firstRequestedAt: string;
  lastRequestedAt: string;
  adminNote?: string | null;
  rejectReason?: string | null;
  linkedMachineId?: string | null;
  linkedMachineCode?: string | null;
  sampleDescription?: string | null;
  primaryImageUrl?: string | null;
  voteCount?: number;
  priority?: MachineRequestPriority;
  assigneeUserId?: string | null;
  assigneeName?: string | null;
}

export interface AdminMachineRequestGroupDetail extends AdminMachineRequestGroup {
  requesters: AdminMachineRequestRequester[];
  recentComments?: AdminMachineRequestCommentPreview[];
  existingMachineId?: string | null;
  existingMachineCode?: string | null;
  /** Heuristic catalog registration suggestions */
  registerSuggest?: AdminMachineRequestRegisterSuggest;
}

export interface AdminMachineRequestRegisterSuggest {
  code: string;
  nameKo: string;
  nameEn: string;
  muscleGroup: string;
  machineType: string;
  descriptionKo: string;
  descriptionEn: string;
  matchedBrandId?: string | null;
}

export interface AdminMachineRequestMergeInput {
  fromBrandName: string;
  fromMachineName: string;
  toBrandName: string;
  toMachineName: string;
}
