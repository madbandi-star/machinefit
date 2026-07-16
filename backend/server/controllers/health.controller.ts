import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const dbConnected = await checkDatabaseConnection();

  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'connected' : 'not_configured',
    },
  });
}
