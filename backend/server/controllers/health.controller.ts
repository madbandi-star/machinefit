import type { Request, Response } from 'express';
import { checkDatabaseConnection, warmupDatabase } from '../config/database.js';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  // Respond quickly for Render probes; DB status is best-effort (1.5s cap).
  const dbConnected = await Promise.race([
    checkDatabaseConnection(),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1500)),
  ]);

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'not_configured',
    },
  });
}

/** Explicit warm endpoint for Render free-tier wake + pool priming. */
export async function warmup(_req: Request, res: Response): Promise<void> {
  const ok = await warmupDatabase();
  res.json({
    success: true,
    data: {
      status: ok ? 'warm' : 'unavailable',
      timestamp: new Date().toISOString(),
    },
  });
}
