import type { MuscleGroupImageAsset, MuscleGroupImageKey } from '@machinefit/shared';
import { muscleGroupImageRepository } from '../repositories/muscle-group-image.repository.js';
import { processMuscleGroupImage } from './muscle-group-image-process.service.js';
import { storageService } from './storage.service.js';
import {
  isAllowedMuscleGroupImage,
  muscleGroupImageLimits,
} from '../config/muscle-group-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { muscleGroupMediaUrl } from '../utils/public-api-base.js';
import { env } from '../config/env.js';

async function trySupabaseStore(params: {
  muscleGroup: string;
  kind: 'main' | 'thumb';
  extension: string;
  mimeType: string;
  buffer: Buffer;
  version: number;
}): Promise<{ storagePath: string; publicUrl: string } | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const stored = await storageService.saveMuscleGroupImage(params);
    return { storagePath: stored.storagePath, publicUrl: stored.publicUrl };
  } catch {
    // Keep DB-backed media working even if Storage is misconfigured.
    return null;
  }
}

export const muscleGroupImageService = {
  async list(): Promise<MuscleGroupImageAsset[]> {
    return muscleGroupImageRepository.list();
  },

  async getBlob(muscleGroup: MuscleGroupImageKey, kind: 'main' | 'thumb') {
    return muscleGroupImageRepository.getBlob(muscleGroup, kind);
  },

  async upload(params: {
    muscleGroup: MuscleGroupImageKey;
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    };
  }): Promise<MuscleGroupImageAsset> {
    const limits = muscleGroupImageLimits();
    const originalName = params.file.originalname || 'image';
    if (!isAllowedMuscleGroupImage(originalName, params.file.mimetype)) {
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

    const existing = await muscleGroupImageRepository.get(params.muscleGroup);
    const nextVersion = (existing?.version ?? 0) + 1;
    const processed = await processMuscleGroupImage(params.file.buffer);

    // Always persist bytes in Postgres so Render works without Storage keys.
    const apiMainUrl = muscleGroupMediaUrl(params.muscleGroup, 'main', nextVersion);
    const apiThumbUrl = muscleGroupMediaUrl(params.muscleGroup, 'thumb', nextVersion);

    // Optional CDN dual-write when service role is configured.
    const mainStored = await trySupabaseStore({
      muscleGroup: params.muscleGroup,
      kind: 'main',
      extension: processed.main.extension,
      mimeType: processed.main.mimeType,
      buffer: processed.main.buffer,
      version: nextVersion,
    });
    const thumbStored = await trySupabaseStore({
      muscleGroup: params.muscleGroup,
      kind: 'thumb',
      extension: processed.thumbnail.extension,
      mimeType: processed.thumbnail.mimeType,
      buffer: processed.thumbnail.buffer,
      version: nextVersion,
    });

    const saved = await muscleGroupImageRepository.upsert({
      muscleGroup: params.muscleGroup,
      imageUrl: mainStored?.publicUrl ?? apiMainUrl,
      thumbnailUrl: thumbStored?.publicUrl ?? apiThumbUrl,
      storagePath: mainStored?.storagePath ?? `db:${params.muscleGroup}/main`,
      thumbnailStoragePath: thumbStored?.storagePath ?? `db:${params.muscleGroup}/thumb`,
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
      await storageService.deleteMuscleGroupImage(existing.storagePath);
    }
    if (existing?.thumbnailStoragePath && !existing.thumbnailStoragePath.startsWith('db:')) {
      await storageService.deleteMuscleGroupImage(existing.thumbnailStoragePath);
    }

    return saved;
  },

  async remove(muscleGroup: MuscleGroupImageKey): Promise<MuscleGroupImageAsset> {
    const removed = await muscleGroupImageRepository.remove(muscleGroup);
    if (removed) {
      if (removed.storagePath && !removed.storagePath.startsWith('db:')) {
        await storageService.deleteMuscleGroupImage(removed.storagePath);
      }
      if (removed.thumbnailStoragePath && !removed.thumbnailStoragePath.startsWith('db:')) {
        await storageService.deleteMuscleGroupImage(removed.thumbnailStoragePath);
      }
    }
    return {
      muscleGroup,
      imageUrl: null,
      thumbnailUrl: null,
      originalFilename: null,
      mimeType: null,
      fileSizeBytes: null,
      width: null,
      height: null,
      version: 0,
      createdAt: null,
      updatedAt: null,
    };
  },
};
