import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { redactGeoFromUrl } from '@machinefit/shared';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Detect Zod validation errors across duplicate `zod` package copies.
 * `instanceof ZodError` fails when shared schemas throw a different ZodError class
 * than the one imported by this middleware.
 */
function isZodError(err: unknown): err is ZodError {
  if (err instanceof ZodError) return true;
  if (!err || typeof err !== 'object') return false;
  const candidate = err as { name?: unknown; issues?: unknown; flatten?: unknown };
  return (
    candidate.name === 'ZodError' &&
    Array.isArray(candidate.issues) &&
    typeof candidate.flatten === 'function'
  );
}

function responseTimeMs(req: Request): number | undefined {
  if (typeof req.requestStartedAt !== 'number') return undefined;
  return Math.max(0, Date.now() - req.requestStartedAt);
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;
  const durationMs = responseTimeMs(req);
  const userId =
    (req as typeof req & { user?: { userId?: string; id?: string } }).user?.userId ??
    (req as typeof req & { user?: { id?: string } }).user?.id ??
    null;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('AppError', {
        requestId,
        method: req.method,
        url: redactGeoFromUrl(req.originalUrl),
        userId,
        ip: req.ip,
        code: err.code,
        message: err.message,
        durationMs,
      });
      void import('../ops/sentry.js')
        .then(({ captureSentryException }) =>
          captureSentryException(err, {
            requestId,
            method: req.method,
            url: redactGeoFromUrl(req.originalUrl),
            userId,
            statusCode: err.statusCode,
            code: err.code,
            durationMs,
          })
        )
        .catch(() => undefined);
    }
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        ...(requestId ? { requestId } : {}),
      },
    });
    return;
  }

  if (isZodError(err)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        // Match validateBody middleware: flatten() so clients can read fieldErrors.
        details: err.flatten(),
        ...(requestId ? { requestId } : {}),
      },
    });
    return;
  }

  logger.error('Unhandled API error', {
    requestId,
    method: req.method,
    url: redactGeoFromUrl(req.originalUrl),
    userId,
    ip: req.ip,
    message: err.message,
    stack: err.stack,
    durationMs,
  });

  void import('../ops/sentry.js')
    .then(({ captureSentryException }) =>
      captureSentryException(err, {
        requestId,
        method: req.method,
        url: redactGeoFromUrl(req.originalUrl),
        userId,
        durationMs,
      })
    )
    .catch(() => undefined);

  try {
    // Fire-and-forget ops capture (dynamic import avoids circular init issues).
    void import('../services/ops.service.js')
      .then(({ opsService }) =>
        opsService.ingest(
          [
            {
              type: 'error',
              error: {
                title: err.name || 'INTERNAL_ERROR',
                message: err.message,
                stack: err.stack,
                severity: 'high',
                source: 'backend',
                url: redactGeoFromUrl(req.originalUrl),
                fingerprint: requestId ? `req:${requestId}` : undefined,
              },
              meta: {
                requestId,
                method: req.method,
                durationMs,
              },
            },
          ],
          {
            userId,
            ip: req.ip,
            userAgent: req.get('user-agent') ?? null,
          }
        )
      )
      .catch(() => undefined);
  } catch {
    /* ignore */
  }
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(requestId ? { requestId } : {}),
    },
  });
}
