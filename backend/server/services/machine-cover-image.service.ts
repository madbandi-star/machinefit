import type {
  MachineCoverBrandOption,
  MachineCoverImageAsset,
  MachineCoverImagesPage,
  TargetMuscleGroup,
} from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { machineCoverImageRepository } from '../repositories/machine-cover-image.repository.js';
import { processMuscleGroupImage } from './muscle-group-image-process.service.js';
import { storageService } from './storage.service.js';
import {
  adminCoverImageLimits,
  isAllowedAdminCoverImage,
} from '../config/admin-cover-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { machineCoverMediaUrl } from '../utils/public-api-base.js';
import { env } from '../config/env.js';

async function trySupabaseStore(params: {
  machineCode: string;
  kind: 'main' | 'thumb';
  extension: string;
  mimeType: string;
  buffer: Buffer;
  version: number;
  targetMuscle?: string | null;
}): Promise<{ storagePath: string; publicUrl: string } | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const stored = await storageService.saveMachineCoverImage({
      ...params,
      machineCode: params.targetMuscle
        ? `${params.machineCode}__${params.targetMuscle}`
        : params.machineCode,
    });
    return { storagePath: stored.storagePath, publicUrl: stored.publicUrl };
  } catch {
    return null;
  }
}

export const machineCoverImageService = {
  async listBrands(): Promise<MachineCoverBrandOption[]> {
    return machineCoverImageRepository.listBrands();
  },

  async list(filters: {
    q?: string;
    brandCode?: string;
    page: number;
    pageSize: number;
  }): Promise<MachineCoverImagesPage> {
    return machineCoverImageRepository.list(filters);
  },

  async getBlob(machineCode: string, kind: 'main' | 'thumb', targetMuscle?: string | null) {
    return machineCoverImageRepository.getBlob(machineCode, kind, targetMuscle);
  },

  async upload(params: {
    machineCode: string;
    targetMuscle?: TargetMuscleGroup | null;
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    };
  }): Promise<MachineCoverImageAsset> {
    const limits = adminCoverImageLimits();
    const originalName = params.file.originalname || 'image';
    if (!isAllowedAdminCoverImage(originalName, params.file.mimetype)) {
      throw new AppError(
        400,
        'UNSUPPORTED_FILE_TYPE',
        `Unsupported file type. Allowed: ${limits.allowedExtensions.join(', ').toUpperCase()}`
      );
    }
    if (params.file.size > limits.maxBytes) {
      throw new AppError(
        400,
        'FILE_TOO_LARGE',
        `File is too large. Max size is ${Math.round(limits.maxBytes / (1024 * 1024))}MB.`
      );
    }

    const machine = await machineCoverImageRepository.findMachine(params.machineCode);
    if (!machine) {
      throw new AppError(404, 'NOT_FOUND', 'Machine not found');
    }

    const targetMuscle = params.targetMuscle ?? null;
    if (targetMuscle && !isFreeWeightMachineCode(machine.code)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Per-muscle covers are only supported for free-weight machines'
      );
    }

    const existing = await machineCoverImageRepository.getByCode(machine.code, targetMuscle);
    const nextVersion = (existing?.version ?? 0) + 1;
    const processed = await processMuscleGroupImage(params.file.buffer);

    const apiMainUrl = machineCoverMediaUrl(machine.code, 'main', targetMuscle);
    const apiThumbUrl = machineCoverMediaUrl(machine.code, 'thumb', targetMuscle);

    const mainStored = await trySupabaseStore({
      machineCode: machine.code,
      kind: 'main',
      extension: processed.main.extension,
      mimeType: processed.main.mimeType,
      buffer: processed.main.buffer,
      version: nextVersion,
      targetMuscle,
    });
    const thumbStored = await trySupabaseStore({
      machineCode: machine.code,
      kind: 'thumb',
      extension: processed.thumbnail.extension,
      mimeType: processed.thumbnail.mimeType,
      buffer: processed.thumbnail.buffer,
      version: nextVersion,
      targetMuscle,
    });

    const dbKey = targetMuscle ? `${machine.code}/${targetMuscle}` : machine.code;
    const saved = await machineCoverImageRepository.upsert({
      machineId: machine.id,
      machineCode: machine.code,
      targetMuscleGroup: targetMuscle,
      imageUrl: mainStored?.publicUrl ?? apiMainUrl,
      thumbnailUrl: thumbStored?.publicUrl ?? apiThumbUrl,
      storagePath: mainStored?.storagePath ?? `db:${dbKey}/main`,
      thumbnailStoragePath: thumbStored?.storagePath ?? `db:${dbKey}/thumb`,
      originalFilename: originalName,
      mimeType: processed.main.mimeType,
      fileSizeBytes: processed.main.fileSizeBytes,
      width: processed.main.width,
      height: processed.main.height,
      version: nextVersion,
      imageData: processed.main.buffer,
      thumbnailData: processed.thumbnail.buffer,
    });

    if (existing?.storagePath && !existing.storagePath.startsWith('db:')) {
      await storageService.deleteMachineCoverImage(existing.storagePath);
    }
    if (existing?.thumbnailStoragePath && !existing.thumbnailStoragePath.startsWith('db:')) {
      await storageService.deleteMachineCoverImage(existing.thumbnailStoragePath);
    }

    return saved;
  },

  async remove(
    machineCode: string,
    targetMuscle?: TargetMuscleGroup | null
  ): Promise<{ machineCode: string; targetMuscle: string | null; deleted: boolean }> {
    const removed = await machineCoverImageRepository.remove(machineCode, targetMuscle ?? null);
    if (removed) {
      if (removed.storagePath && !removed.storagePath.startsWith('db:')) {
        await storageService.deleteMachineCoverImage(removed.storagePath);
      }
      if (removed.thumbnailStoragePath && !removed.thumbnailStoragePath.startsWith('db:')) {
        await storageService.deleteMachineCoverImage(removed.thumbnailStoragePath);
      }
    }
    return {
      machineCode,
      targetMuscle: targetMuscle ?? null,
      deleted: Boolean(removed),
    };
  },
};
