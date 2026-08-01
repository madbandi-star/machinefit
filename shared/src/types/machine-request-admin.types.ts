import type { RequestStatus } from './api.types.js';
import type { MachineRequestGymChoiceMode, MachineRequestImage } from './community.types.js';

export type AdminMachineRequestStatus = RequestStatus;

export interface AdminMachineRequestStats {
  total: number;
  pending: number;
  reviewing: number;
  added: number;
  rejected: number;
  thisMonthRequests: number;
  thisMonthAdded: number;
}

export interface AdminMachineRequestPopularItem {
  groupKey: string;
  brandName: string;
  machineName: string;
  requestCount: number;
}

export interface AdminMachineRequestRequester {
  requestId: string;
  userId: string;
  authorName: string;
  description: string;
  gymChoiceMode?: MachineRequestGymChoiceMode;
  gymName?: string | null;
  primaryImageUrl?: string;
  /** Full gallery for admin download / register reuse. */
  images?: MachineRequestImage[];
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
}

export interface AdminMachineRequestGroupDetail extends AdminMachineRequestGroup {
  requesters: AdminMachineRequestRequester[];
  existingMachineId?: string | null;
  existingMachineCode?: string | null;
}
