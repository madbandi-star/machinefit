import type {
  AdminBrandMachineImageMeta,
  AdminStandardMachineImageMeta,
  AdminStandardMachineListQuery,
  AdminStandardMachineUpsertInput,
  BrandMachineGalleryImage,
  PaginatedResponse,
  StandardMachineImage,
  StandardMachineType,
} from '@machinefit/shared';
import { adminStandardMachineRepository } from '../repositories/admin-standard-machine.repository.js';
import { processMachineCoverSquareImage } from './muscle-group-image-process.service.js';
import {
  adminCoverImageLimits,
  isAllowedAdminCoverImage,
} from '../config/admin-cover-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { publicApiBase } from '../utils/public-api-base.js';
import { machineService } from './machine.service.js';
import { brandService } from './brand.service.js';

type UploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function assertImageFile(file: UploadFile) {
  const limits = adminCoverImageLimits();
  if (!isAllowedAdminCoverImage(file.originalname || 'image', file.mimetype)) {
    throw new AppError(
      400,
      'UNSUPPORTED_FILE_TYPE',
      `Unsupported file type. Allowed: ${limits.allowedExtensions.join(', ').toUpperCase()}`
    );
  }
  if (file.size > limits.maxBytes) {
    throw new AppError(400, 'FILE_TOO_LARGE', `Max file size is ${limits.maxBytes} bytes`);
  }
}

function invalidatePublicMachineCaches(): void {
  machineService.invalidateCatalogCache();
  brandService.invalidateMachinesCache();
}

export const adminStandardMachineService = {
  list(query: AdminStandardMachineListQuery): Promise<PaginatedResponse<StandardMachineType>> {
    return adminStandardMachineRepository.list(query);
  },

  get(id: string): Promise<StandardMachineType | null> {
    return adminStandardMachineRepository.get(id);
  },

  async create(input: AdminStandardMachineUpsertInput): Promise<StandardMachineType> {
    const created = await adminStandardMachineRepository.create(input);
    invalidatePublicMachineCaches();
    return created;
  },

  async update(id: string, input: AdminStandardMachineUpsertInput): Promise<StandardMachineType> {
    const updated = await adminStandardMachineRepository.update(id, input);
    invalidatePublicMachineCaches();
    return updated;
  },

  async setActive(id: string, isActive: boolean): Promise<StandardMachineType> {
    const updated = await adminStandardMachineRepository.setActive(id, isActive);
    invalidatePublicMachineCaches();
    return updated;
  },

  async delete(id: string): Promise<{ deleted: boolean; deactivated: boolean }> {
    const result = await adminStandardMachineRepository.delete(id);
    invalidatePublicMachineCaches();
    return result;
  },

  listOptions(activeOnly = true) {
    return adminStandardMachineRepository.listOptions(activeOnly);
  },

  listImages(id: string): Promise<StandardMachineImage[]> {
    return adminStandardMachineRepository.listImages(id);
  },

  async uploadImage(
    standardTypeId: string,
    file: UploadFile,
    meta?: AdminStandardMachineImageMeta
  ): Promise<StandardMachineImage> {
    assertImageFile(file);
    const processed = await processMachineCoverSquareImage(file.buffer);
    const existing = await adminStandardMachineRepository.listImages(standardTypeId);
    const isPrimary = meta?.isPrimary ?? existing.length === 0;

    // Placeholder URL; repository rewrites to durable media route after insert.
    const placeholder = `${publicApiBase()}/media/standard-machine-images/pending/main`;

    const saved = await adminStandardMachineRepository.insertImage({
      standardTypeId,
      imageUrl: placeholder,
      thumbnailUrl: placeholder,
      imageType: meta?.imageType ?? 'other',
      isPrimary,
      displayOrder: meta?.displayOrder ?? existing.length * 10,
      sourceType: meta?.sourceType ?? 'uploaded',
      sourceUrl: meta?.sourceUrl || null,
      copyrightNote: meta?.copyrightNote || null,
      licenseNote: meta?.licenseNote || null,
      originalFilename: file.originalname,
      mimeType: processed.main.mimeType,
      fileSizeBytes: processed.main.fileSizeBytes,
      width: processed.main.width,
      height: processed.main.height,
      imageData: processed.main.buffer,
      thumbnailData: processed.thumbnail.buffer,
    });
    invalidatePublicMachineCaches();
    return saved;
  },

  async updateImageMeta(
    imageId: string,
    meta: AdminStandardMachineImageMeta
  ): Promise<StandardMachineImage> {
    const updated = await adminStandardMachineRepository.updateImageMeta(imageId, meta);
    invalidatePublicMachineCaches();
    return updated;
  },

  async reorderImages(standardTypeId: string, orderedIds: string[]): Promise<StandardMachineImage[]> {
    const items = await adminStandardMachineRepository.reorderImages(standardTypeId, orderedIds);
    invalidatePublicMachineCaches();
    return items;
  },

  async deleteImage(imageId: string): Promise<{ deleted: true }> {
    const result = await adminStandardMachineRepository.deleteImage(imageId);
    invalidatePublicMachineCaches();
    return result;
  },

  getImageBlob(imageId: string, kind: 'main' | 'thumb') {
    return adminStandardMachineRepository.getImageBlob(imageId, kind);
  },

  listBrandMachineImages(machineId: string): Promise<BrandMachineGalleryImage[]> {
    return adminStandardMachineRepository.listBrandMachineImages(machineId);
  },

  async uploadBrandMachineImage(
    machineId: string,
    file: UploadFile,
    meta?: AdminBrandMachineImageMeta
  ): Promise<BrandMachineGalleryImage> {
    assertImageFile(file);
    const processed = await processMachineCoverSquareImage(file.buffer);
    const existing = await adminStandardMachineRepository.listBrandMachineImages(machineId);
    const isPrimary = meta?.isPrimary ?? existing.length === 0;
    const placeholder = `${publicApiBase()}/media/machine-images/pending/main`;

    const saved = await adminStandardMachineRepository.insertBrandMachineImage({
      machineId,
      imageUrl: placeholder,
      imageType: meta?.imageType ?? 'other',
      isPrimary,
      sortOrder: meta?.sortOrder ?? existing.length * 10,
      sourceType: meta?.sourceType ?? 'uploaded',
      sourceUrl: meta?.sourceUrl || null,
      copyrightNote: meta?.copyrightNote || null,
      licenseNote: meta?.licenseNote || null,
      originalFilename: file.originalname,
      mimeType: processed.main.mimeType,
      fileSizeBytes: processed.main.fileSizeBytes,
      width: processed.main.width,
      height: processed.main.height,
      imageData: processed.main.buffer,
      thumbnailData: processed.thumbnail.buffer,
    });
    invalidatePublicMachineCaches();
    return saved;
  },

  async updateBrandMachineImageMeta(
    imageId: string,
    meta: AdminBrandMachineImageMeta
  ): Promise<BrandMachineGalleryImage> {
    const updated = await adminStandardMachineRepository.updateBrandMachineImageMeta(imageId, meta);
    invalidatePublicMachineCaches();
    return updated;
  },

  async reorderBrandMachineImages(
    machineId: string,
    orderedIds: string[]
  ): Promise<BrandMachineGalleryImage[]> {
    const items = await adminStandardMachineRepository.reorderBrandMachineImages(
      machineId,
      orderedIds
    );
    invalidatePublicMachineCaches();
    return items;
  },

  async deleteBrandMachineImage(imageId: string): Promise<{ deleted: true }> {
    const result = await adminStandardMachineRepository.deleteBrandMachineImage(imageId);
    invalidatePublicMachineCaches();
    return result;
  },

  getBrandMachineImageBlob(imageId: string, kind: 'main' | 'thumb') {
    return adminStandardMachineRepository.getBrandMachineImageBlob(imageId, kind);
  },
};
