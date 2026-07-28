import { API_BASE_URL } from '@/services/http/axios-client';

const PHOTO_IMAGE_PATH = '/photo-board/images/';

/** Normalize photo-board image URLs to the configured API host. */
export function resolvePhotoBoardMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const apiBase = API_BASE_URL.replace(/\/+$/, '');

  try {
    const { pathname, search } = new URL(url);
    if (!pathname.includes(PHOTO_IMAGE_PATH)) return url;
    return `${apiBase}${pathname}${search}`;
  } catch {
    if (url.startsWith('/')) return `${apiBase}${url}`;
    return url;
  }
}
