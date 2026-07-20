import type { MotivationMediaItem, MotivationMediaType } from '@machinefit/shared';

let mockItems: MotivationMediaItem[] = [];

export function getMockMotivationMedia(mediaType?: MotivationMediaType): MotivationMediaItem[] {
  const items = mediaType ? mockItems.filter((i) => i.mediaType === mediaType) : [...mockItems];
  return items.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function getMockMotivationPlaylist(): {
  music: MotivationMediaItem[];
  video: MotivationMediaItem[];
} {
  const activeSelected = (type: MotivationMediaType) =>
    getMockMotivationMedia(type).filter((i) => i.isActive && i.isSelected);

  return {
    music: activeSelected('music'),
    video: activeSelected('video'),
  };
}

export function replaceMockMotivationMedia(
  mediaType: MotivationMediaType,
  items: MotivationMediaItem[]
): MotivationMediaItem[] {
  mockItems = [...mockItems.filter((i) => i.mediaType !== mediaType), ...items];
  return getMockMotivationMedia(mediaType);
}
