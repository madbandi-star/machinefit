import type { Request, Response, NextFunction } from 'express';

/** Public catalog endpoints change rarely — allow short browser/CDN caching. */
const CATALOG_PATHS = [
  '/machines',
  '/brands',
  '/motivation-media',
];

export function cacheHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== 'GET') {
    next();
    return;
  }

  const path = req.path;
  const isCatalog = CATALOG_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (isCatalog) {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  } else if (path === '/health' || path === '/warmup') {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
}
