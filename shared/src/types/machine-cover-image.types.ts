import type { LocalizedString } from './api.types.js';

export interface MachineCoverImageAsset {
  machineId: string;
  machineCode: string;
  machineName: LocalizedString;
  brandCode: string;
  brandName: LocalizedString;
  muscleGroup: string;
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
