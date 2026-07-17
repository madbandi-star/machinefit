import type { ExperienceLevel, Gender, LocalizedString } from './api.types.js';

export interface Brand {
  id: string;
  code: string;
  name: LocalizedString;
  logoUrl?: string;
  websiteUrl?: string;
  countryId?: string;
  isActive: boolean;
}

export interface Machine {
  id: string;
  brandId: string;
  code: string;
  name: LocalizedString;
  /** Populated when machines are joined with brands (list/search). */
  brandName?: LocalizedString;
  muscleGroup: string;
  machineType: string;
  description?: LocalizedString;
  hasSeat: boolean;
  hasBackPad: boolean;
  hasFootPlate: boolean;
  hasHandle: boolean;
  romType?: string;
  isActive: boolean;
  primaryImageUrl?: string;
}

export interface MachineImage {
  id: string;
  machineId: string;
  imageUrl: string;
  altText?: LocalizedString;
  sortOrder: number;
  isPrimary: boolean;
}

export interface MachineSettings {
  id: string;
  machineId: string;
  gender: Gender;
  experienceLevel: ExperienceLevel;
  heightMinCm: number;
  heightMaxCm: number;
  weightMinKg?: number;
  weightMaxKg?: number;
  seatPosition?: number;
  backPadPosition?: number;
  footPosition?: number;
  handlePosition?: number;
  romSetting?: string;
  weightKg?: number;
  tips?: LocalizedString;
  warnings?: LocalizedString;
}

export interface YoutubeVideo {
  id: string;
  machineId: string;
  youtubeId: string;
  title?: LocalizedString;
  channelName?: string;
  thumbnailUrl?: string;
  languageCode?: string;
  sortOrder: number;
  isOfficial: boolean;
}
