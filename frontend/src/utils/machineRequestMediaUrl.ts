import { API_BASE_URL } from '@/services/http/axios-client';

const REQUEST_IMAGE_PATH = '/machine-requests/images/';

/** Normalize machine-request image URLs to the configured API host. */
export function resolveMachineRequestMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const apiBase = API_BASE_URL.replace(/\/+$/, '');

  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(REQUEST_IMAGE_PATH);
    if (idx < 0) return url;
    return `${apiBase}${parsed.pathname.slice(idx)}${parsed.search}`;
  } catch {
    const idx = url.indexOf(REQUEST_IMAGE_PATH);
    if (idx >= 0) return `${apiBase}${url.slice(idx)}`;
    if (url.startsWith('/')) return `${apiBase}${url}`;
    return url;
  }
}
