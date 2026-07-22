import { MOTIVATION_AUDIO_EXTENSIONS } from '@machinefit/shared';
import { env } from './env.js';

export const MOTIVATION_AUDIO_MIME_BY_EXT: Record<(typeof MOTIVATION_AUDIO_EXTENSIONS)[number], string[]> = {
  mp3: ['audio/mpeg', 'audio/mp3'],
  m4a: ['audio/mp4', 'audio/x-m4a', 'audio/m4a'],
  aac: ['audio/aac', 'audio/x-aac'],
  wav: ['audio/wav', 'audio/wave', 'audio/x-wav'],
  ogg: ['audio/ogg', 'audio/vorbis', 'application/ogg'],
};

export const MOTIVATION_AUDIO_ALLOWED_MIME_TYPES = Array.from(
  new Set(Object.values(MOTIVATION_AUDIO_MIME_BY_EXT).flat())
);

export function motivationAudioLimits() {
  return {
    maxBytes: env.MOTIVATION_AUDIO_MAX_BYTES,
    maxTracksPerUser: env.MOTIVATION_AUDIO_MAX_TRACKS,
    allowedExtensions: [...MOTIVATION_AUDIO_EXTENSIONS],
    allowedMimeTypes: MOTIVATION_AUDIO_ALLOWED_MIME_TYPES,
  };
}

export function extensionFromFilename(filename: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  if (!match) return null;
  return match[1].toLowerCase();
}

export function isAllowedMotivationAudio(filename: string, mimeType?: string | null): boolean {
  const ext = extensionFromFilename(filename);
  if (!ext || !(MOTIVATION_AUDIO_EXTENSIONS as readonly string[]).includes(ext)) {
    return false;
  }
  if (!mimeType || mimeType === 'application/octet-stream') {
    return true;
  }
  const allowed = MOTIVATION_AUDIO_MIME_BY_EXT[ext as (typeof MOTIVATION_AUDIO_EXTENSIONS)[number]];
  return allowed.includes(mimeType.toLowerCase());
}
