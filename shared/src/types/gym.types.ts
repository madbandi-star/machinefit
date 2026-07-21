import type { LocalizedString, RoleCode } from './api.types.js';

export interface Gym {
  id: string;
  ownerId: string;
  slug?: string;
  name: string;
  description?: LocalizedString;
  address: string;
  city?: string;
  countryId: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  websiteUrl?: string;
  businessHours?: BusinessHours;
  amenities?: Record<string, boolean>;
  isVerified: boolean;
  isActive: boolean;
  machineCount?: number;
  distanceKm?: number;
}

export interface BusinessHoursDay {
  open: string;
  close: string;
  closed?: boolean;
}

export type BusinessHours = Record<string, BusinessHoursDay>;

export type GymMachineRegistrantRole = 'member' | 'owner' | 'admin';
export type GymMachineStatus = 'active' | 'inactive' | 'deleted';

export interface GymMachine {
  id: string;
  gymId: string;
  machineId: string;
  machineCode?: string;
  machineName?: string;
  brandCode?: string;
  brandName?: string;
  muscleGroup?: string;
  quantity: number;
  notes?: string;
  isAvailable: boolean;
  instanceLabel?: string;
  floorZone?: string;
  registeredBy?: string;
  registeredByRole?: GymMachineRegistrantRole;
  isVerified: boolean;
  status?: GymMachineStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  /** Whether the current user may soft-delete this row (server-computed). */
  canDelete?: boolean;
}

export interface GymPhoto {
  id: string;
  gymId: string;
  photoUrl: string;
  sortOrder: number;
}

export type OwnerApplicationStatus = 'pending' | 'approved' | 'rejected';
export type OwnerPaymentStatus = 'pending' | 'paid' | 'waived';

export interface OwnerApplication {
  id: string;
  userId: string;
  businessName: string;
  applicantName?: string;
  businessEmail?: string;
  businessPhone?: string;
  description?: string;
  evidenceUrl?: string;
  gymId?: string;
  status: OwnerApplicationStatus;
  paymentStatus: OwnerPaymentStatus;
  paymentReference?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Joined display fields for admin list */
  userEmail?: string;
  userDisplayName?: string;
}

export type GymOwnerPermissionRole = 'owner' | 'operator';

export interface GymOwnerPermission {
  id: string;
  gymId: string;
  userId: string;
  permissionRole: GymOwnerPermissionRole;
  status: 'active' | 'revoked';
  grantedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GymInventoryCapabilities {
  canAdd: boolean;
  canManageOfficial: boolean;
  isGymOperator: boolean;
  roleCode?: RoleCode;
}
