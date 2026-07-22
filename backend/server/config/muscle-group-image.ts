import { env } from './env.js';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export function muscleGroupImageLimits() {
  return {
    maxBytes: env.MUSCLE_GROUP_IMAGE_MAX_BYTES,
    bucket: env.MUSCLE_GROUP_IMAGE_BUCKET,
    allowedExtensions: [...ALLOWED_EXTENSIONS],
    maxEdge: 1024,
    thumbEdge: 256,
  };
}

export function extensionFromImageFilename(filename: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  if (ext === 'png' || ext === 'webp') return ext;
  return null;
}

export function isAllowedMuscleGroupImage(filename: string, mimeType: string): boolean {
  const ext = extensionFromImageFilename(filename);
  if (!ext) return false;
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) return false;
  if (!mimeType) return true;
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}
