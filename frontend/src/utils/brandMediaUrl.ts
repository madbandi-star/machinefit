import { API_BASE_URL } from '@/services/http/axios-client';

const BRAND_ASSET_PATH = '/media/brand-assets/';

/** Normalize brand logo/hero media URLs to the configured API host. */
export function resolveBrandMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const apiBase = API_BASE_URL.replace(/\/+$/, '');

  try {
    const { pathname, search } = new URL(url);
    if (!pathname.includes(BRAND_ASSET_PATH)) return url;
    return `${apiBase}${pathname}${search}`;
  } catch {
    if (url.startsWith('/')) return `${apiBase}${url}`;
    return url;
  }
}
