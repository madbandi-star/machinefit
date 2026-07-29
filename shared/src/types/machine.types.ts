import type { ExperienceLevel, Gender, LocalizedString } from './api.types.js';

export interface Brand {
  id: string;
  code: string;
  name: LocalizedString;
  /** Short brand intro (localized). */
  description?: LocalizedString;
  logoUrl?: string;
  /** Hero / representative image. */
  imageUrl?: string;
  websiteUrl?: string;
  countryId?: string;
  /** ISO country code when joined from countries. */
  countryCode?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Admin: linked machine count. */
  machineCount?: number;
}

export interface Machine {
  id: string;
  brandId: string;
  code: string;
  name: LocalizedString;
  /** Populated when machines are joined with brands (list/search). */
  brandName?: LocalizedString;
  brandCode?: string;
  muscleGroup: string;
  machineType: string;
  description?: LocalizedString;
  /** Usage steps for coaching / TTS (localized arrays). */
  howTo?: Record<string, string[]>;
  warnings?: Record<string, string[]>;
  tips?: Record<string, string[]>;
  beginnerTips?: Record<string, string[]>;
  /** Reserved for future UI — not displayed yet. */
  intermediateTips?: Record<string, string[]>;
  /** Reserved for future UI — not displayed yet. */
  advancedTips?: Record<string, string[]>;
  /** Reserved for future UI — not displayed yet. */
  proTips?: Record<string, string[]>;
  recommendedExperience?: ExperienceLevel | string;
  hasSeat: boolean;
  hasBackPad: boolean;
  hasFootPlate: boolean;
  hasHandle: boolean;
  romType?: string;
  sortOrder?: number;
  isActive: boolean;
  primaryImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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
