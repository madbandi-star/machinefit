import type { LocalizedString } from './api.types.js';

/** Catalog image kind for brand / standard machine galleries. */
export type CatalogImageType =
  | 'front'
  | 'side'
  | 'rear'
  | 'detail'
  | 'setting'
  | 'other';

export type CatalogImageSourceType =
  | 'official'
  | 'uploaded'
  | 'licensed'
  | 'generated'
  | 'other';

export interface StandardMachineType {
  id: string;
  code: string;
  name: LocalizedString;
  description?: LocalizedString;
  primaryMuscleGroup: string;
  /** All linked muscle groups (primary first when available). */
  muscleGroups?: string[];
  aliases?: string[];
  sortOrder: number;
  isActive: boolean;
  /** Primary representative image URL (cache-busted when versioned). */
  primaryImageUrl?: string;
  machineCount?: number;
  /** Brand IDs already linked via machines.standard_type_id (detail/get only). */
  linkedBrandIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StandardMachineImage {
  id: string;
  standardTypeId: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  imageType: CatalogImageType | string;
  displayOrder: number;
  isPrimary: boolean;
  altText?: LocalizedString;
  sourceType?: CatalogImageSourceType | string | null;
  sourceUrl?: string | null;
  copyrightNote?: string | null;
  licenseNote?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Brand machine gallery row (`machine_images`). */
export interface BrandMachineGalleryImage {
  id: string;
  machineId: string;
  imageUrl: string;
  imageType: CatalogImageType | string;
  sortOrder: number;
  isPrimary: boolean;
  altText?: LocalizedString;
  sourceType?: CatalogImageSourceType | string | null;
  sourceUrl?: string | null;
  copyrightNote?: string | null;
  licenseNote?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
}
