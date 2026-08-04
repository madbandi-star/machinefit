import type { Request, Response } from 'express';
import { checkDatabaseConnection, warmupDatabase } from '../config/database.js';
import { getBuildTime, getBuildVersion, getUptimeSec } from '../ops/ops-runtime.js';

/**
 * Liveness probe for Render (`healthCheckPath: /api/v1/health`).
 *
 * Must stay fast and always HTTP 200 while the Node process is alive.
 * Do not await DB / ops aggregation here — that previously returned 503 on
 * host memory pressure and took the API out of rotation (social login 502).
 * Detailed status: GET /ops/health (admin ops dashboard).
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: getBuildVersion(),
      buildTime: getBuildTime(),
      uptimeSec: getUptimeSec(),
    },
  });
}

/** Explicit warm endpoint for Render free-tier wake + pool priming. */
export async function warmup(_req: Request, res: Response): Promise<void> {
  const ok = await warmupDatabase();
  // Optionally poke DB connectivity for humans; never fail the HTTP status hard.
  const dbConnected = await Promise.race([
    checkDatabaseConnection(),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
  ]);
  res.status(200).json({
    success: true,
    data: {
      status: ok ? 'warm' : 'unavailable',
      database: dbConnected ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    },
  });
}
