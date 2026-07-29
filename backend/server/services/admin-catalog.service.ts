import type {
  AdminBrandListQuery,
  AdminBrandUpsertInput,
  AdminMachineListQuery,
  AdminMachineUpsertInput,
  Brand,
  Machine,
  PaginatedResponse,
} from '@machinefit/shared';
import { adminCatalogRepository } from '../repositories/admin-catalog.repository.js';
import {
  adminCoverImageLimits,
  isAllowedAdminCoverImage,
} from '../config/admin-cover-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { env } from '../config/env.js';
import { processMuscleGroupImage } from './muscle-group-image-process.service.js';
import { machineCoverImageService } from './machine-cover-image.service.js';
import { storageService } from './storage.service.js';

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

async function storeBrandAsset(params: {
  brandCode: string;
  kind: 'logo' | 'hero';
  file: UploadFile;
  version: number;
}): Promise<string> {
  assertImageFile(params.file);
  const processed = await processMuscleGroupImage(params.file.buffer);
  const folder = `brand-${params.brandCode.toLowerCase()}-${params.kind}`;

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const stored = await storageService.saveMuscleGroupImage({
        muscleGroup: folder,
        kind: 'main',
        extension: processed.main.extension,
        mimeType: processed.main.mimeType,
        buffer: processed.main.buffer,
        version: params.version,
      });
      return stored.publicUrl;
    } catch {
      // Fall through to local storage.
    }
  }

  const stored = await storageService.saveMuscleGroupImage({
    muscleGroup: folder,
    kind: 'main',
    extension: processed.main.extension,
    mimeType: processed.main.mimeType,
    buffer: processed.main.buffer,
    version: params.version,
  });
  return stored.publicUrl;
}

export const adminCatalogService = {
  listBrands(query: AdminBrandListQuery): Promise<PaginatedResponse<Brand>> {
    return adminCatalogRepository.listBrands(query);
  },

  getBrand(id: string): Promise<Brand | null> {
    return adminCatalogRepository.getBrand(id);
  },

  createBrand(input: AdminBrandUpsertInput): Promise<Brand> {
    return adminCatalogRepository.createBrand(input);
  },

  updateBrand(id: string, input: AdminBrandUpsertInput): Promise<Brand> {
    return adminCatalogRepository.updateBrand(id, input);
  },

  setBrandActive(id: string, isActive: boolean): Promise<Brand> {
    return adminCatalogRepository.setBrandActive(id, isActive);
  },

  deleteBrand(id: string): Promise<{ deleted: true }> {
    return adminCatalogRepository.deleteBrand(id);
  },

  async uploadBrandLogo(id: string, file: UploadFile): Promise<Brand> {
    const brand = await adminCatalogRepository.getBrand(id);
    if (!brand) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    const version = Date.now();
    const publicUrl = await storeBrandAsset({
      brandCode: brand.code,
      kind: 'logo',
      file,
      version,
    });
    return adminCatalogRepository.updateBrandImageFields(brand.id, { logoUrl: publicUrl });
  },

  async uploadBrandImage(id: string, file: UploadFile): Promise<Brand> {
    const brand = await adminCatalogRepository.getBrand(id);
    if (!brand) throw new AppError(404, 'NOT_FOUND', 'Brand not found');
    const version = Date.now();
    const publicUrl = await storeBrandAsset({
      brandCode: brand.code,
      kind: 'hero',
      file,
      version,
    });
    return adminCatalogRepository.updateBrandImageFields(brand.id, { imageUrl: publicUrl });
  },

  async clearBrandLogo(id: string): Promise<Brand> {
    return adminCatalogRepository.updateBrandImageFields(id, { logoUrl: null });
  },

  async clearBrandImage(id: string): Promise<Brand> {
    return adminCatalogRepository.updateBrandImageFields(id, { imageUrl: null });
  },

  listMachines(query: AdminMachineListQuery): Promise<PaginatedResponse<Machine>> {
    return adminCatalogRepository.listMachines(query);
  },

  getMachine(id: string): Promise<Machine | null> {
    return adminCatalogRepository.getMachine(id);
  },

  createMachine(input: AdminMachineUpsertInput): Promise<Machine> {
    return adminCatalogRepository.createMachine(input);
  },

  updateMachine(id: string, input: AdminMachineUpsertInput): Promise<Machine> {
    return adminCatalogRepository.updateMachine(id, input);
  },

  setMachineActive(id: string, isActive: boolean): Promise<Machine> {
    return adminCatalogRepository.setMachineActive(id, isActive);
  },

  deleteMachine(id: string): Promise<{ deleted: boolean; deactivated: boolean }> {
    return adminCatalogRepository.deleteMachine(id);
  },

  async uploadMachineImage(id: string, file: UploadFile): Promise<Machine> {
    const machine = await adminCatalogRepository.getMachine(id);
    if (!machine) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    await machineCoverImageService.upload({ machineCode: machine.code, file });
    const refreshed = await adminCatalogRepository.getMachine(machine.id);
    if (!refreshed) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    return refreshed;
  },

  async clearMachineImage(id: string): Promise<Machine> {
    const machine = await adminCatalogRepository.getMachine(id);
    if (!machine) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    await machineCoverImageService.remove(machine.code);
    const refreshed = await adminCatalogRepository.getMachine(machine.id);
    if (!refreshed) throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    return refreshed;
  },
};
