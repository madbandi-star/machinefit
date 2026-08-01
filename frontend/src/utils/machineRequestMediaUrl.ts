import { API_BASE_URL } from '@/services/http/axios-client';

const REQUEST_IMAGE_PATH = '/machine-requests/images/';

/** Normalize machine-request image URLs to the configured API host. */
export function resolveMachineRequestMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const apiBase = API_BASE_URL.replace(/\/+$/, '');

  try {
    const { pathname, search } = new URL(url);
    if (!pathname.includes(REQUEST_IMAGE_PATH)) return url;
    return `${apiBase}${pathname}${search}`;
  } catch {
    if (url.startsWith('/')) return `${apiBase}${url}`;
    return url;
  }
}
