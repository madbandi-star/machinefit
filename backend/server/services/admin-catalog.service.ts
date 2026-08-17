import type {
  AdminBrandListQuery,
  AdminBrandUpsertInput,
  AdminMachineListQuery,
  AdminMachineTipsUpdateInput,
  AdminMachineUpsertInput,
  Brand,
  Machine,
  PaginatedResponse,
} from '@machinefit/shared';
import { adminCatalogRepository } from '../repositories/admin-catalog.repository.js';
import { brandAssetRepository } from '../repositories/brand-asset.repository.js';
import {
  adminCoverImageLimits,
  isAllowedAdminCoverImage,
} from '../config/admin-cover-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { processMuscleGroupImage } from './muscle-group-image-process.service.js';
import { brandAssetMediaUrl } from '../utils/public-api-base.js';
import { withCacheBust } from '../utils/cache-bust-url.js';
import { brandService } from './brand.service.js';
import { machineCoverImageService } from './machine-cover-image.service.js';
import { machineService } from './machine.service.js';

type UploadFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function assertImageFile(file: UploadFile): void {
  const limits = adminCoverImageLimits();
  const originalName = file.originalname || 'image';
  if (!isAllowedAdminCoverImage(originalName, file.mimetype)) {
    throw new AppError(
      400,
      'UNSUPPORTED_FILE_TYPE',
      `Unsupported file type. Allowed: ${limits.allowedExtensions.join(', ').toUpperCase()}`
    );
  }
  if (file.size > limits.maxBytes) {
    throw new AppError(
      400,
      'FILE_TOO_LARGE',
      `File is too large. Max size is ${Math.round(limits.maxBytes / (1024 * 1024))}MB.`
    );
  }
}

function invalidatePublicMachineCaches(): void {
  machineService.invalidateCatalogCache();
  brandService.invalidateMachinesCache();
}

export const adminCatalogService = {
  listBrands(query: AdminBrandListQuery): Promise<PaginatedResponse<Brand>> {
    return adminCatalogRepository.listBrands(query);
  },

  getBrand(id: string): Promise<Brand | null> {
    return adminCatalogRepository.getBrand(id);
  },

  createBrand(input: AdminBrandUpsertInput): Promise<Brand> {
    return adminCatalogRepository.createBrand(input).then((brand) => {
      brandService.invalidateListCache();
      return brand;
    });
  },

  updateBrand(id: string, input: AdminBrandUpsertInput): Promise<Brand> {
    return adminCatalogRepository.updateBrand(id, input).then((brand) => {
      brandService.invalidateListCache();
      brandService.invalidateMachinesCache();
      return brand;
    });
  },

  setBrandActive(id: string, isActive: boolean): Promise<Brand> {
    return adminCatalogRepository.setBrandActive(id, isActive).then((brand) => {
      brandService.invalidateListCache();
      brandService.invalidateMachinesCache();
      invalidatePublicMachineCaches();
      return brand;
    });
  },

  setBrandDefaultFavorite(id: string, isDefaultFavorite: boolean): Promise<Brand> {
    return adminCatalogRepository.setBrandDefaultFavorite(id, isDefaultFavorite).then((brand) => {
      brandService.invalidateListCache();
      return brand;
    });
  },

  async moveBrandSort(
    id: string,
    direction: 'up' | 'down' | 'top' | 'bottom'
  ): Promise<Brand> {
    const updated = await adminCatalogRepository.moveBrandSort(id, direction);
    brandService.invalidateListCache();
    return updated;
  },

  deleteBrand(id: string): Promise<{ deleted: true }> {
    return adminCatalogRepository.deleteBrand(id).then((result) => {
      brandService.invalidateListCache();
      brandService.invalidateMachinesCache();
      invalidatePublicMachineCaches();
      return result;
    });
  },

  async uploadBrandLogo(id: string, file: UploadFile): Promise<Brand> {
    const brand = await adminCatalogRepository.getBrand(id);
    if (!brand) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    assertImageFile(file);
    const processed = await processMuscleGroupImage(file.buffer);
    const existing = await brandAssetRepository.getByBrandId(brand.id);
    const version = (existing?.logoVersion ?? 0) + 1;
    const apiUrl = brandAssetMediaUrl(brand.code, 'logo');
    const publicUrl = withCacheBust(apiUrl, version)!;
    await brandAssetRepository.upsertLogo({
      brandId: brand.id,
      brandCode: brand.code,
      logoUrl: apiUrl,
      mimeType: processed.main.mimeType,
      version,
      data: processed.main.buffer,
    });
    const updated = await adminCatalogRepository.updateBrandImageFields(brand.id, {
      logoUrl: publicUrl,
    });
    brandService.invalidateListCache();
    return updated;
  },

  async uploadBrandImage(id: string, file: UploadFile): Promise<Brand> {
    const brand = await adminCatalogRepository.getBrand(id);
    if (!brand) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    assertImageFile(file);
    const processed = await processMuscleGroupImage(file.buffer);
    const existing = await brandAssetRepository.getByBrandId(brand.id);
    const version = (existing?.imageVersion ?? 0) + 1;
    const apiUrl = brandAssetMediaUrl(brand.code, 'hero');
    const publicUrl = withCacheBust(apiUrl, version)!;
    await brandAssetRepository.upsertHero({
      brandId: brand.id,
      brandCode: brand.code,
      imageUrl: apiUrl,
      mimeType: processed.main.mimeType,
      version,
      data: processed.main.buffer,
    });
    const updated = await adminCatalogRepository.updateBrandImageFields(brand.id, {
      imageUrl: publicUrl,
    });
    brandService.invalidateListCache();
    return updated;
  },

  async clearBrandLogo(id: string): Promise<Brand> {
    const brand = await adminCatalogRepository.getBrand(id);
    if (!brand) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    await brandAssetRepository.clearLogo(brand.id);
    const updated = await adminCatalogRepository.updateBrandImageFields(brand.id, { logoUrl: null });
    brandService.invalidateListCache();
    return updated;
  },

  async clearBrandImage(id: string): Promise<Brand> {
    const brand = await adminCatalogRepository.getBrand(id);
    if (!brand) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    await brandAssetRepository.clearHero(brand.id);
    const updated = await adminCatalogRepository.updateBrandImageFields(brand.id, { imageUrl: null });
    brandService.invalidateListCache();
    return updated;
  },

  listMachines(query: AdminMachineListQuery): Promise<PaginatedResponse<Machine>> {
    return adminCatalogRepository.listMachines(query);
  },

  getMachine(id: string): Promise<Machine | null> {
    return adminCatalogRepository.getMachine(id);
  },

  async createMachine(input: AdminMachineUpsertInput): Promise<Machine> {
    const created = await adminCatalogRepository.createMachine(input);
    invalidatePublicMachineCaches();
    return created;
  },

  async updateMachine(id: string, input: AdminMachineUpsertInput): Promise<Machine> {
    const updated = await adminCatalogRepository.updateMachine(id, input);
    invalidatePublicMachineCaches();
    return updated;
  },

  async setMachineActive(id: string, isActive: boolean): Promise<Machine> {
    const updated = await adminCatalogRepository.setMachineActive(id, isActive);
    invalidatePublicMachineCaches();
    return updated;
  },

  async deleteMachine(
    id: string,
    options: { force?: boolean } = {}
  ): Promise<{ deleted: boolean; deactivated: boolean; forcePurged: boolean }> {
    const result = await adminCatalogRepository.deleteMachine(id, options);
    invalidatePublicMachineCaches();
    return result;
  },

  async updateMachineTips(id: string, input: AdminMachineTipsUpdateInput): Promise<Machine> {
    const updated = await adminCatalogRepository.updateMachineTips(id, input);
    invalidatePublicMachineCaches();
    return updated;
  },

  async uploadMachineImage(id: string, file: UploadFile): Promise<Machine> {
    const machine = await adminCatalogRepository.getMachine(id);
    if (!machine) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    await machineCoverImageService.upload({ machineCode: machine.code, file });
    const refreshed = await adminCatalogRepository.getMachine(machine.id);
    if (!refreshed) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    invalidatePublicMachineCaches();
    return refreshed;
  },

  async clearMachineImage(id: string): Promise<Machine> {
    const machine = await adminCatalogRepository.getMachine(id);
    if (!machine) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    await machineCoverImageService.remove(machine.code);
    const refreshed = await adminCatalogRepository.getMachine(machine.id);
    if (!refreshed) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    invalidatePublicMachineCaches();
    return refreshed;
  },
};
