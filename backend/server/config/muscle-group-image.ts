import { adminCoverImageLimits, extensionFromImageFilename, isAllowedAdminCoverImage } from './admin-cover-image.js';

/** @deprecated Prefer adminCoverImageLimits — kept for existing muscle-group call sites. */
export function muscleGroupImageLimits() {
  const limits = adminCoverImageLimits();
  return {
    maxBytes: limits.maxBytes,
    bucket: limits.muscleBucket,
    allowedExtensions: limits.allowedExtensions,
    maxEdge: limits.maxEdge,
    thumbEdge: limits.thumbEdge,
  };
}

export { extensionFromImageFilename };

export function isAllowedMuscleGroupImage(filename: string, mimeType: string): boolean {
  return isAllowedAdminCoverImage(filename, mimeType);
}
