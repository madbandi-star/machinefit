import type { MuscleGroupImageAsset, MuscleGroupImageKey } from '@machinefit/shared';
import { muscleGroupImageRepository } from '../repositories/muscle-group-image.repository.js';
import { processMuscleGroupImage } from './muscle-group-image-process.service.js';
import { storageService } from './storage.service.js';
import {
  isAllowedMuscleGroupImage,
  muscleGroupImageLimits,
} from '../config/muscle-group-image.js';
import { AppError } from '../middlewares/error.middleware.js';

export const muscleGroupImageService = {
  async list(): Promise<MuscleGroupImageAsset[]> {
    return muscleGroupImageRepository.list();
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

    const mainStored = await storageService.saveMuscleGroupImage({
      muscleGroup: params.muscleGroup,
      kind: 'main',
      extension: processed.main.extension,
      mimeType: processed.main.mimeType,
      buffer: processed.main.buffer,
      version: nextVersion,
    });
    const thumbStored = await storageService.saveMuscleGroupImage({
      muscleGroup: params.muscleGroup,
      kind: 'thumb',
      extension: processed.thumbnail.extension,
      mimeType: processed.thumbnail.mimeType,
      buffer: processed.thumbnail.buffer,
      version: nextVersion,
    });

    const saved = await muscleGroupImageRepository.upsert({
      muscleGroup: params.muscleGroup,
      imageUrl: mainStored.publicUrl,
      thumbnailUrl: thumbStored.publicUrl,
      storagePath: mainStored.storagePath,
      thumbnailStoragePath: thumbStored.storagePath,
      originalFilename: originalName,
      mimeType: processed.main.mimeType,
      fileSizeBytes: processed.main.fileSizeBytes,
      width: processed.main.width,
      height: processed.main.height,
      version: nextVersion,
    });

    if (existing) {
      await storageService.deleteMuscleGroupImage(existing.storagePath);
      await storageService.deleteMuscleGroupImage(existing.thumbnailStoragePath);
    }

    return saved;
  },

  async remove(muscleGroup: MuscleGroupImageKey): Promise<MuscleGroupImageAsset> {
    const removed = await muscleGroupImageRepository.remove(muscleGroup);
    if (removed) {
      await storageService.deleteMuscleGroupImage(removed.storagePath);
      await storageService.deleteMuscleGroupImage(removed.thumbnailStoragePath);
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
