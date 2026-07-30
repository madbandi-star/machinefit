import { API_BASE_URL } from '@/services/http/axios-client';

const BRAND_ASSET_PATH = '/media/brand-assets/';

/**
 * Normalize brand logo/hero media URLs to the configured API host.
 * Stored URLs often include `/api/v1/...`; never concatenate that onto API_BASE_URL
 * again or the browser requests `/api/v1/api/v1/media/...` (404).
 */
export function resolveBrandMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  const apiBase = API_BASE_URL.replace(/\/+$/, '');

  try {
    const parsed = new URL(url);
    const idx = parsed.pathname.indexOf(BRAND_ASSET_PATH);
    if (idx < 0) return url;
    return `${apiBase}${parsed.pathname.slice(idx)}${parsed.search}`;
  } catch {
    const idx = url.indexOf(BRAND_ASSET_PATH);
    if (idx >= 0) return `${apiBase}${url.slice(idx)}`;
    if (url.startsWith('/')) return `${apiBase}${url}`;
    return url;
  }
}
