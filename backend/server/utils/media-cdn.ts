import type { Response } from 'express';
import { CATALOG_MEDIA_CACHE, UGC_MEDIA_CACHE } from './media-response.js';

/** True when URL points at Supabase Storage (or similar object CDN), not Render. */
export function isDirectObjectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      /supabase\.(co|in)$/i.test(u.hostname) ||
      /\/storage\/v1\/object\//i.test(u.pathname)
    );
  } catch {
    return /supabase\.(co|in)\/storage\//i.test(url);
  }
}

/** Strip ?v= cache-bust for redirect target (CDN still immutable by path). */
export function stripCacheBustQuery(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete('v');
    return u.toString();
  } catch {
    return url.replace(/([?&])v=\d+(&)?/, (_, p1, p2) => (p2 ? p1 : '')).replace(/\?$/, '');
  }
}

export function isDbPlaceholderPath(storagePath: string | null | undefined): boolean {
  return !storagePath || storagePath.startsWith('db:');
}

/**
 * 302 to Storage/CDN so the browser (and Cloudflare) fetch the object
 * without Render reading BYTEA. Returns true if redirected.
 */
export function redirectToObjectUrl(
  res: Response,
  url: string | null | undefined,
  cacheControl: string = CATALOG_MEDIA_CACHE
): boolean {
  if (!url || !isDirectObjectUrl(url)) return false;
  const target = stripCacheBustQuery(url);
  res.setHeader('Cache-Control', cacheControl);
  res.redirect(302, target);
  return true;
}

export function ugcRedirectToObjectUrl(res: Response, url: string | null | undefined): boolean {
  return redirectToObjectUrl(res, url, UGC_MEDIA_CACHE);
}
