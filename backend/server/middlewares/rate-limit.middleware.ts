import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

/** Render (and other probes) poll health often — never count them toward API limits. */
function isHealthProbePath(req: Request): boolean {
  const path = req.path || '';
  return (
    path === '/health' ||
    path === '/warmup' ||
    path.endsWith('/health') ||
    path.endsWith('/warmup')
  );
}

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isHealthProbePath,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT', message: 'Too many requests' },
  },
});
