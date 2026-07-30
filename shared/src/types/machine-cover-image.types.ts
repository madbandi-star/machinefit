import type { LocalizedString } from './api.types.js';
import type { TargetMuscleGroup } from '../constants/workout-goals.js';

export interface MachineCoverImageVariant {
  targetMuscleGroup: TargetMuscleGroup;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
  hasCustomImage: boolean;
}

export interface MachineCoverImageAsset {
  machineId: string;
  machineCode: string;
  machineName: LocalizedString;
  brandCode: string;
  brandName: LocalizedString;
  /** Catalog default muscle label on the machine row (not the cover variant). */
  muscleGroup: string;
  /** NULL/omitted = default cover for this machine. */
  targetMuscleGroup?: TargetMuscleGroup | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  originalFilename: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  version: number;
  createdAt: string | null;
  updatedAt: string | null;
  hasCustomImage: boolean;
  /** Free-weight only: per-muscle cover slots for admin UI. */
  muscleVariants?: MachineCoverImageVariant[];
  supportsMuscleVariants?: boolean;
}

export interface MachineCoverImagesPage {
  items: MachineCoverImageAsset[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MachineCoverBrandOption {
  code: string;
  name: LocalizedString;
}
