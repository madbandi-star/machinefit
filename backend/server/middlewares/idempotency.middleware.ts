import type { NextFunction, Request, RequestHandler, Response } from 'express';

type IdempotencyEntry = {
  status: 'pending' | 'done';
  statusCode: number;
  body: unknown;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 120_000;
const store = new Map<string, IdempotencyEntry>();

function pruneExpired(now: number): void {
  if (store.size < 200) return;
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

/**
 * Optional Idempotency-Key replay for write methods (in-memory, single-node).
 * Clients that omit the header are unchanged. Safe alongside existing domain keys.
 */
export function idempotencyMiddleware(ttlMs = DEFAULT_TTL_MS): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const method = (req.method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      next();
      return;
    }

    const rawKey = req.get('Idempotency-Key')?.trim();
    if (!rawKey || rawKey.length > 128) {
      next();
      return;
    }

    const userId =
      (req as Request & { user?: { userId?: string } }).user?.userId ??
      (req as Request & { user?: { id?: string } }).user?.id ??
      'anon';
    const scope = `${userId}:${method}:${req.baseUrl}${req.path}:${rawKey}`;
    const now = Date.now();
    pruneExpired(now);

    const existing = store.get(scope);
    if (existing && existing.expiresAt > now) {
      if (existing.status === 'done') {
        res.status(existing.statusCode).json(existing.body);
        return;
      }
      // In-flight duplicate — ask client to wait briefly.
      res.setHeader('Retry-After', '2');
      res.status(409).json({
        success: false,
        error: {
          code: 'REQUEST_IN_PROGRESS',
          message: '동일한 요청이 처리 중입니다. 잠시 후 다시 시도해주세요.',
          retryAfter: 2,
        },
      });
      return;
    }

    store.set(scope, {
      status: 'pending',
      statusCode: 200,
      body: null,
      expiresAt: now + ttlMs,
    });

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      const entry = store.get(scope);
      if (entry) {
        store.set(scope, {
          status: 'done',
          statusCode: res.statusCode || 200,
          body,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return originalJson(body);
    }) as typeof res.json;

    const onFinish = () => {
      res.off('finish', onFinish);
      res.off('close', onFinish);
      const entry = store.get(scope);
      if (entry?.status === 'pending') {
        // Failed before body — drop pending so client can retry with same key.
        store.delete(scope);
      }
    };
    res.on('finish', onFinish);
    res.on('close', onFinish);

    next();
  };
}
