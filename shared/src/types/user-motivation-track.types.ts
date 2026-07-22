export type MotivationTrackSourceType = 'upload' | 'url';

export interface UserMotivationTrack {
  id: string;
  userId: string;
  title: string;
  sourceType: MotivationTrackSourceType;
  mediaUrl: string;
  storagePath?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  durationSeconds?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MotivationAudioLimits {
  maxBytes: number;
  maxTracksPerUser: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
}
