/** Inspection / preventive-maintenance domain types (gym asset ops). */

export const GYM_MACHINE_OPS_STATUSES = [
  'ACTIVE',
  'NEED_INSPECTION',
  'UNDER_REPAIR',
  'OUT_OF_SERVICE',
  'DISPOSED',
] as const;
export type GymMachineOpsStatus = (typeof GYM_MACHINE_OPS_STATUSES)[number];

export const INSPECTION_CYCLES = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTER',
  'HALF_YEAR',
  'YEARLY',
  'CUSTOM',
] as const;
export type InspectionCycle = (typeof INSPECTION_CYCLES)[number];

export const INSPECTION_RESULTS = ['PASS', 'WARNING', 'FAIL'] as const;
export type InspectionResult = (typeof INSPECTION_RESULTS)[number];

export const INSPECTION_ITEM_RESULTS = ['PASS', 'FAIL', 'NA'] as const;
export type InspectionItemResult = (typeof INSPECTION_ITEM_RESULTS)[number];

export const FAULT_SEVERITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'] as const;
export type FaultSeverity = (typeof FAULT_SEVERITIES)[number];

export const FAULT_STATUSES = [
  'OPEN',
  'CHECKING',
  'PART_ORDER',
  'REPAIRING',
  'TESTING',
  'DONE',
] as const;
export type FaultStatus = (typeof FAULT_STATUSES)[number];

export const MEMBER_REPORT_TYPES = [
  'noise',
  'shake',
  'cable',
  'seat',
  'pad',
  'other',
] as const;
export type MemberReportType = (typeof MEMBER_REPORT_TYPES)[number];

export const GYM_MACHINE_PHOTO_TYPES = [
  'INSTALL',
  'CURRENT',
  'REPAIR',
  'REPLACEMENT',
  'INSPECTION',
] as const;
export type GymMachinePhotoType = (typeof GYM_MACHINE_PHOTO_TYPES)[number];

export const PM_CYCLE_TYPES = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTER',
  'HALF_YEAR',
  'YEARLY',
  'USAGE_COUNT',
  'USAGE_VOLUME',
] as const;
export type PmCycleType = (typeof PM_CYCLE_TYPES)[number];

export type HealthScoreBand = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export function healthScoreBand(score: number): HealthScoreBand {
  if (score >= 95) return 'GREEN';
  if (score >= 80) return 'YELLOW';
  if (score >= 60) return 'ORANGE';
  return 'RED';
}

export interface InspectionTemplateItem {
  id: string;
  brandId?: string | null;
  machineCategory?: string | null;
  itemKey: string;
  itemName: Record<string, string>;
  displayOrder: number;
  required: boolean;
  active: boolean;
}

export interface MachineInspectionItemInput {
  templateItemId?: string | null;
  itemKey?: string;
  result: InspectionItemResult;
  score?: number | null;
  note?: string | null;
  photoUrl?: string | null;
  videoUrl?: string | null;
}

export interface MachineInspectionItem extends MachineInspectionItemInput {
  id: string;
  inspectionId: string;
  createdAt: string;
}

export interface MachineInspection {
  id: string;
  gymId: string;
  gymMachineId: string;
  inspectionDate: string;
  inspectorUserId?: string | null;
  inspectionResult: InspectionResult;
  healthScore: number;
  nextInspectionDate?: string | null;
  durationSeconds?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string;
  items?: MachineInspectionItem[];
  /** Joined display */
  machineCode?: string;
  machineName?: string;
  brandName?: string;
  nickname?: string;
  location?: string;
  inspectorName?: string;
}

export interface CreateMachineInspectionInput {
  gymMachineId: string;
  inspectionDate?: string;
  durationSeconds?: number;
  note?: string;
  items: MachineInspectionItemInput[];
}

export interface MachineFault {
  id: string;
  gymId: string;
  gymMachineId: string;
  inspectionId?: string | null;
  reporterUserId?: string | null;
  severity: FaultSeverity;
  symptom: string;
  suspectedCause?: string | null;
  status: FaultStatus;
  assigneeUserId?: string | null;
  createdAt: string;
  updatedAt?: string;
  machineCode?: string;
  machineName?: string;
}

export interface CreateMachineFaultInput {
  gymMachineId: string;
  inspectionId?: string;
  severity?: FaultSeverity;
  symptom: string;
  suspectedCause?: string;
}

export interface MemberMachineReport {
  id: string;
  gymId: string;
  gymMachineId: string;
  memberId: string;
  reportType: MemberReportType;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  status: string;
  createdAt: string;
}

export interface CreateMemberMachineReportInput {
  gymMachineId: string;
  reportType: MemberReportType;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface GymMachineOpsSummary {
  id: string;
  gymId: string;
  machineId: string;
  machineCode?: string;
  machineName?: string;
  brandCode?: string;
  brandName?: string;
  nickname?: string;
  location?: string;
  serialNumber?: string;
  qrCode?: string;
  opsStatus: GymMachineOpsStatus;
  healthScore: number;
  healthBand: HealthScoreBand;
  inspectionCycle: InspectionCycle;
  lastInspectionAt?: string | null;
  nextInspectionAt?: string | null;
  isAvailable: boolean;
}

export interface InspectionDashboardStats {
  gymId: string;
  totalMachines: number;
  active: number;
  needInspection: number;
  underRepair: number;
  outOfService: number;
  avgHealthScore: number;
  inspectionsThisMonth: number;
  openFaults: number;
  overdueInspections: number;
}
