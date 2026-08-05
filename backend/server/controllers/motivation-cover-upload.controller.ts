import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import {
  adminCoverImageLimits,
  isAllowedAdminCoverImage,
} from '../config/admin-cover-image.js';
import { AppError } from '../middlewares/error.middleware.js';
import { processMuscleGroupImage } from '../services/muscle-group-image-process.service.js';
import { storageService } from '../services/storage.service.js';
import { userMotivationTrackRepository } from '../repositories/user-motivation-track.repository.js';

async function processAndStoreCover(params: {
  ownerKey: string;
  file: Express.Multer.File;
}): Promise<{ coverImageUrl: string; storagePath: string }> {
  const limits = adminCoverImageLimits();
  const originalName = params.file.originalname || 'cover.jpg';
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

  const processed = await processMuscleGroupImage(params.file.buffer);
  // Prefer square thumbnail for player artwork density.
  const stored = await storageService.saveMotivationCoverImage({
    ownerKey: params.ownerKey,
    assetId: randomUUID(),
    extension: processed.thumbnail.extension,
    mimeType: processed.thumbnail.mimeType,
    buffer: processed.thumbnail.buffer,
  });

  return {
    coverImageUrl: stored.publicUrl,
    storagePath: stored.storagePath,
  };
}

/** Admin: upload cover art URL for a catalog music slot (save via replace). */
export async function uploadAdminMotivationCover(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
    }
    const adminId = req.user?.userId ?? 'admin';
    const stored = await processAndStoreCover({
      ownerKey: `admin/${adminId}`,
      file: req.file,
    });
    res.status(201).json({
      success: true,
      data: stored,
    });
  } catch (error) {
    next(error);
  }
}

/** User: upload / attach cover art to a personal track. */
export async function uploadUserMotivationTrackCover(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    if (!req.file) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Image file is required');
    }

    const trackId = String(req.params.id);
    const existing = await userMotivationTrackRepository.getById(userId, trackId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Track not found');

    const stored = await processAndStoreCover({
      ownerKey: `user/${userId}`,
      file: req.file,
    });

    const updated = await userMotivationTrackRepository.update(userId, trackId, {
      coverImageUrl: stored.coverImageUrl,
    });

    res.status(201).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/** User: clear cover art on a personal track. */
export async function clearUserMotivationTrackCover(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const trackId = String(req.params.id);
    const existing = await userMotivationTrackRepository.getById(userId, trackId);
    if (!existing) throw new AppError(404, 'NOT_FOUND', 'Track not found');

    const updated = await userMotivationTrackRepository.update(userId, trackId, {
      coverImageUrl: null,
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
