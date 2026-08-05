export type MotivationMediaType = 'music' | 'video';

export interface MotivationMediaItem {
  id: string;
  mediaType: MotivationMediaType;
  title: string;
  mediaUrl: string;
  youtubeId?: string | null;
  /** Cover art for music tracks (player artwork). */
  coverImageUrl?: string | null;
  sortOrder: number;
  isSelected: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Public playlist returned to the app header player (selected + active only). */
export interface MotivationPlaylist {
  music: MotivationMediaItem[];
  video: MotivationMediaItem[];
}

/** Admin editor payload: up to 20 slots per type (empty slots omitted or cleared). */
export interface MotivationMediaAdminState {
  music: MotivationMediaItem[];
  video: MotivationMediaItem[];
}
