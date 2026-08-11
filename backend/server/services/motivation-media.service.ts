import type { MotivationMediaItem, ReplaceMotivationMediaInput } from '@machinefit/shared';
import { motivationMediaRepository } from '../repositories/motivation-media.repository.js';
import { AppError } from '../middlewares/error.middleware.js';
import { extractYoutubeId } from '../utils/youtube.util.js';
import {
  refreshMotivationAudioMediaUrl,
  stripMotivationAudioMediaToken,
} from './storage.service.js';

function withFreshAudioUrls(bundle: {
  music: MotivationMediaItem[];
  video: MotivationMediaItem[];
}): { music: MotivationMediaItem[]; video: MotivationMediaItem[] } {
  return {
    music: bundle.music.map((item) => ({
      ...item,
      mediaUrl: refreshMotivationAudioMediaUrl(item.mediaUrl),
    })),
    video: bundle.video,
  };
}

export const motivationMediaService = {
  async listPlaylist() {
    return withFreshAudioUrls(await motivationMediaRepository.listPlaylist());
  },

  async listAdmin() {
    return withFreshAudioUrls(await motivationMediaRepository.listAdmin());
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

    const persistItems =
      input.mediaType === 'music'
        ? input.items.map((slot) => ({
            ...slot,
            mediaUrl: stripMotivationAudioMediaToken(slot.mediaUrl),
          }))
        : input.items;
    const items = await motivationMediaRepository.replaceType(input.mediaType, persistItems);
    const signed =
      input.mediaType === 'music'
        ? items.map((item) => ({
            ...item,
            mediaUrl: refreshMotivationAudioMediaUrl(item.mediaUrl),
          }))
        : items;
    return { mediaType: input.mediaType, items: signed };
  },
};
