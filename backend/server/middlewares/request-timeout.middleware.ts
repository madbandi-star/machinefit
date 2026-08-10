import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

/**
 * Soft request deadline — prevents unbounded hangs.
 * Skips health/media probes. Does not change successful response shapes.
 */
export function requestTimeoutMiddleware(req: Request, res: Response, next: NextFunction): void {
  const url = req.originalUrl || req.url || '';
  if (
    url.endsWith('/health') ||
    url.endsWith('/warmup') ||
    url.endsWith('/ready') ||
    url.endsWith('/live') ||
    url.endsWith('/liveness') ||
    url.includes('/media/') ||
    // Backup/restore can exceed the soft deadline while parsing + applying ZIP.
    url.includes('/backup/') ||
    url.includes('/system-backup') ||
    url.includes('/system-restore')
  ) {
    next();
    return;
  }

  const ms = env.REQUEST_TIMEOUT_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    next();
    return;
  }

  const timer = setTimeout(() => {
    if (res.headersSent) return;
    res.status(504).json({
      success: false,
      error: {
        code: 'REQUEST_TIMEOUT',
        message: 'Request timed out',
        requestId: req.requestId,
      },
    });
  }, ms);

  const clear = () => clearTimeout(timer);
  res.on('finish', clear);
  res.on('close', clear);
  next();
}
