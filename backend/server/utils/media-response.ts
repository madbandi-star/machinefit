import type { Request, Response } from 'express';

/** Catalog assets — long-lived CDN-friendly cache. */
export const CATALOG_MEDIA_CACHE = 'public, max-age=31536000, immutable';
/** UGC images — keep existing 1-day cache policy (response body unchanged). */
export const UGC_MEDIA_CACHE = 'public, max-age=86400, immutable';

/**
 * Conditional GET helper. Returns true if a 304 was sent (no body).
 * Call with version/meta-derived ETag before loading BYTEA.
 */
export function trySendNotModified(
  req: Request,
  res: Response,
  etag: string,
  cacheControl: string = CATALOG_MEDIA_CACHE
): boolean {
  res.setHeader('Cache-Control', cacheControl);
  res.setHeader('ETag', etag);
  const inm = req.headers['if-none-match'];
  if (typeof inm === 'string' && inm === etag) {
    res.status(304).end();
    return true;
  }
  return false;
}

/** Serve immutable media with ETag / 304 — avoids re-sending BYTEA bodies. */
export function sendImmutableMedia(
  req: Request,
  res: Response,
  opts: { etag: string; mimeType: string; data: Buffer; cacheControl?: string }
): void {
  const { etag, mimeType, data, cacheControl = CATALOG_MEDIA_CACHE } = opts;
  if (trySendNotModified(req, res, etag, cacheControl)) return;
  res.setHeader('Content-Type', mimeType);
  res.status(200).send(data);
}
