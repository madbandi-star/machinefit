import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response, NextFunction } from 'express';

/**
 * Optional API timing breakdown (dev / API_PERF_LOG=1).
 * Logs only durations — never tokens, emails, or request bodies.
 * Does not alter JSON responses.
 */
export type ApiPerfMarks = {
  startedAt: number;
  authMs?: number;
  dbMs: number;
  externalMs: number;
  logicMs: number;
  markDb(ms: number): void;
  markAuth(ms: number): void;
  markExternal(ms: number): void;
};

declare global {
  namespace Express {
    interface Request {
      apiPerf?: ApiPerfMarks;
    }
  }
}

export const apiPerfAls = new AsyncLocalStorage<ApiPerfMarks>();

function perfEnabled(): boolean {
  if (process.env.API_PERF_LOG === '1' || process.env.API_PERF_LOG === 'true') return true;
  return process.env.NODE_ENV === 'development';
}

export function createApiPerfMarks(startedAt = Date.now()): ApiPerfMarks {
  return {
    startedAt,
    dbMs: 0,
    externalMs: 0,
    logicMs: 0,
    markDb(ms: number) {
      if (ms > 0) this.dbMs += ms;
    },
    markAuth(ms: number) {
      if (ms > 0) this.authMs = (this.authMs ?? 0) + ms;
    },
    markExternal(ms: number) {
      if (ms > 0) this.externalMs += ms;
    },
  };
}

export function apiPerfMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!perfEnabled()) {
    next();
    return;
  }

  const marks = createApiPerfMarks();
  req.apiPerf = marks;

  apiPerfAls.run(marks, () => {
    res.on('finish', () => {
      const total = Date.now() - marks.startedAt;
      const auth = marks.authMs ?? 0;
      const db = marks.dbMs;
      const external = marks.externalMs;
      const accounted = auth + db + external;
      const processing = Math.max(0, total - accounted);
      const route = req.route?.path
        ? `${req.baseUrl}${req.route.path}`
        : req.originalUrl.split('?')[0];
      // eslint-disable-next-line no-console
      console.info(
        [
          'API_PERFORMANCE',
          `${req.method} ${route}`,
          `total=${total} ms`,
          `db=${db} ms`,
          `external=${external} ms`,
          `processing=${processing} ms`,
          `auth=${auth} ms`,
          `status=${res.statusCode}`,
        ].join('\n')
      );
    });
    next();
  });
}

/** Time an async DB call and attribute duration to the request perf marks. */
export async function withDbTiming<T>(req: Request | undefined, work: () => Promise<T>): Promise<T> {
  // When ALS is active, pg.Pool.query is already instrumented — avoid double-counting.
  if (apiPerfAls.getStore()) return work();
  const started = Date.now();
  try {
    return await work();
  } finally {
    req?.apiPerf?.markDb(Date.now() - started);
  }
}

/** Time an external HTTP / storage call. */
export async function withExternalTiming<T>(
  req: Request | undefined,
  work: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  try {
    return await work();
  } finally {
    const ms = Date.now() - started;
    req?.apiPerf?.markExternal(ms);
    apiPerfAls.getStore()?.markExternal(ms);
  }
}
