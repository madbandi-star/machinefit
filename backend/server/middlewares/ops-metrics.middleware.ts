import type { NextFunction, Request, Response } from 'express';
import { normalizeRouteKey } from '../ops/ops-runtime.js';
import { opsService } from '../services/ops.service.js';

/** Async API latency / status collector — never blocks the response. */
export function opsMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = Date.now();
  res.on('finish', () => {
    try {
      const path = req.originalUrl || req.url || '/';
      if (path.includes('/ops/ingest') || path.includes('/health') || path.includes('/warmup')) {
        return;
      }
      const userId = (req as Request & { user?: { id?: string } }).user?.id ?? null;
      const routeKey = normalizeRouteKey(req.method, path);
      const durationMs = Date.now() - started;
      void opsService
        .recordApiMetric({
          method: req.method,
          routeKey,
          statusCode: res.statusCode || 0,
          durationMs,
          userId,
          ip: req.ip,
        })
        .catch(() => undefined);
    } catch {
      /* ignore collector failures */
    }
  });
  next();
}
