import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import {
  extensionFromFilename,
  isAllowedMotivationAudio,
  motivationAudioLimits,
} from '../config/motivation-audio.js';
import { AppError } from '../middlewares/error.middleware.js';
import { storageService } from '../services/storage.service.js';

/** Admin helper: upload an audio file and return a public URL for catalog slots. */
export async function uploadMotivationAudio(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Audio file is required');
    }

    const limits = motivationAudioLimits();
    const originalName = req.file.originalname || 'audio';
    if (!isAllowedMotivationAudio(originalName, req.file.mimetype)) {
      throw new AppError(
        400,
        'UNSUPPORTED_FILE_TYPE',
        `Unsupported file type. Allowed: ${limits.allowedExtensions.join(', ').toUpperCase()}`
      );
    }
    if (req.file.size > limits.maxBytes) {
      throw new AppError(
        400,
        'FILE_TOO_LARGE',
        `File is too large. Max size is ${Math.round(limits.maxBytes / (1024 * 1024))}MB.`
      );
    }

    const extension = extensionFromFilename(originalName) ?? 'mp3';
    const trackId = randomUUID();
    const adminId = req.user?.userId ?? 'admin';
    const stored = await storageService.saveMotivationAudio({
      userId: `admin/${adminId}`,
      trackId,
      extension,
      mimeType: req.file.mimetype || 'application/octet-stream',
      buffer: req.file.buffer,
    });

    res.status(201).json({
      success: true,
      data: {
        mediaUrl: stored.publicUrl,
        storagePath: stored.storagePath,
        originalFilename: originalName,
        mimeType: req.file.mimetype || null,
        fileSizeBytes: req.file.size,
      },
    });
  } catch (error) {
    next(error);
  }
}
