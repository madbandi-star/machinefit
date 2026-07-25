import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

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

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
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
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
