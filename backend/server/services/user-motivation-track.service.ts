import type {
  CreateMotivationTrackFromUrlInput,
  UpdateMotivationTrackInput,
  UserMotivationTrack,
} from '@machinefit/shared';
import { randomUUID } from 'node:crypto';
import { motivationAudioLimits, extensionFromFilename, isAllowedMotivationAudio } from '../config/motivation-audio.js';
import { AppError } from '../middlewares/error.middleware.js';
import { userMotivationTrackRepository } from '../repositories/user-motivation-track.repository.js';
import { storageService } from './storage.service.js';

async function assertUnderTrackLimit(userId: string): Promise<void> {
  const limits = motivationAudioLimits();
  const count = await userMotivationTrackRepository.countByUser(userId);
  if (count >= limits.maxTracksPerUser) {
    throw new AppError(
      400,
      'TRACK_LIMIT',
      `You can save up to ${limits.maxTracksPerUser} tracks.`
    );
  }
}

export const userMotivationTrackService = {
  async list(userId: string): Promise<{ items: UserMotivationTrack[]; limits: ReturnType<typeof motivationAudioLimits> }> {
    const items = await userMotivationTrackRepository.listByUser(userId);
    return { items, limits: motivationAudioLimits() };
  },

  async createFromUrl(userId: string, input: CreateMotivationTrackFromUrlInput): Promise<UserMotivationTrack> {
    await assertUnderTrackLimit(userId);
    return userMotivationTrackRepository.insert({
      userId,
      title: input.title.trim(),
      sourceType: 'url',
      mediaUrl: input.mediaUrl.trim(),
      durationSeconds: input.durationSeconds ?? null,
      isDefault: Boolean(input.setAsDefault),
    });
  },

  async createFromUpload(
    userId: string,
    file: Express.Multer.File,
    options: {
      title?: string;
      durationSeconds?: number | null;
      setAsDefault?: boolean;
    }
  ): Promise<UserMotivationTrack> {
    await assertUnderTrackLimit(userId);

    const limits = motivationAudioLimits();
    const originalName = file.originalname || 'audio';
    if (!isAllowedMotivationAudio(originalName, file.mimetype)) {
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

    const extension = extensionFromFilename(originalName) ?? 'mp3';
    const trackId = randomUUID();
    const title =
      options.title?.trim() ||
      originalName.replace(/\.[^.]+$/, '').trim() ||
      'Untitled track';

    let stored;
    try {
      stored = await storageService.saveMotivationAudio({
        userId,
        trackId,
        extension,
        mimeType: file.mimetype || 'application/octet-stream',
        buffer: file.buffer,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'UPLOAD_FAILED', 'Upload failed. Please try again.', error);
    }

    try {
      return await userMotivationTrackRepository.insert({
        id: trackId,
        userId,
        title: title.slice(0, 200),
        sourceType: 'upload',
        mediaUrl: stored.publicUrl,
        storagePath: stored.storagePath,
        originalFilename: originalName.slice(0, 255),
        mimeType: file.mimetype || null,
        fileSizeBytes: file.size,
        durationSeconds: options.durationSeconds ?? null,
        isDefault: Boolean(options.setAsDefault),
      });
    } catch (error) {
      await storageService.deleteMotivationAudio(stored.storagePath);
      throw error;
    }
  },

  async update(
    userId: string,
    trackId: string,
    input: UpdateMotivationTrackInput
  ): Promise<UserMotivationTrack> {
    const updated = await userMotivationTrackRepository.update(userId, trackId, {
      title: input.title,
      isDefault: input.isDefault,
      durationSeconds: input.durationSeconds,
    });
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Track not found');
    }
    return updated;
  },

  async remove(userId: string, trackId: string): Promise<void> {
    const deleted = await userMotivationTrackRepository.delete(userId, trackId);
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Track not found');
    }
    await storageService.deleteMotivationAudio(deleted.storagePath);
  },
};
