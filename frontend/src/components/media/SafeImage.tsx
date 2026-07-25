import { useState, type ImgHTMLAttributes } from 'react';

export interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Shown when `src` is missing or the image fails to load. */
  fallbackSrc?: string;
}

/**
 * Image that falls back on load error to avoid console 404 noise
 * and broken thumbnails when remote/static assets are missing.
 */
export function SafeImage({ src, fallbackSrc, onError, alt = '', ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = !src || failed ? fallbackSrc : src;

  if (!resolved) return null;

  return (
    <img
      {...props}
      alt={alt}
      src={resolved}
      onError={(event) => {
        if (!failed && fallbackSrc && src !== fallbackSrc) {
          setFailed(true);
        }
        onError?.(event);
      }}
    />
  );
}
