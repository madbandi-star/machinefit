import type { ReplaceMotivationMediaInput } from '@machinefit/shared';
import { motivationMediaRepository } from '../repositories/motivation-media.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { extractYoutubeId } from '../utils/youtube.util.js';

export const motivationMediaService = {
  listPlaylist() {
    return motivationMediaRepository.listPlaylist();
  },

  listAdmin() {
    return motivationMediaRepository.listAdmin();
  },

  async replace(input: ReplaceMotivationMediaInput) {
    for (const slot of input.items) {
      const title = slot.title.trim();
      const mediaUrl = slot.mediaUrl.trim();
      if (!title && !mediaUrl) continue;
      if (!title || !mediaUrl) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Each media slot needs both title and URL');
      }
      if (input.mediaType === 'video' && !extractYoutubeId(mediaUrl)) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          `Video URL must be a valid YouTube link: ${mediaUrl}`
        );
      }
      if (input.mediaType === 'music') {
        let valid = false;
        try {
          valid = Boolean(new URL(mediaUrl).href);
        } catch {
          valid = false;
        }
        if (!valid) {
          throw new AppError(400, 'VALIDATION_ERROR', `Music URL is invalid: ${mediaUrl}`);
        }
      }
    }

    const items = await motivationMediaRepository.replaceType(input.mediaType, input.items);
    return { mediaType: input.mediaType, items };
  },
};
