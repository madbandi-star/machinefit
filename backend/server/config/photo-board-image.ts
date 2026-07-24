export function photoBoardImageLimits() {
  return {
    maxBytes: 8 * 1024 * 1024,
    maxCount: 10,
    maxEdge: 1600,
    thumbEdge: 480,
  };
}

export function isAllowedPhotoBoardImage(mime?: string, filename?: string): boolean {
  const lowerMime = (mime ?? '').toLowerCase();
  if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(lowerMime)) {
    return true;
  }
  const name = (filename ?? '').toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(name);
}
