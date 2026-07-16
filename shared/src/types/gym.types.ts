import type { LocalizedString } from './api.types.js';

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

export interface GymMachine {
  id: string;
  gymId: string;
  machineId: string;
  machineCode?: string;
  machineName?: string;
  muscleGroup?: string;
  quantity: number;
  notes?: string;
  isAvailable: boolean;
  instanceLabel?: string;
  floorZone?: string;
}

export interface GymPhoto {
  id: string;
  gymId: string;
  photoUrl: string;
  sortOrder: number;
}
