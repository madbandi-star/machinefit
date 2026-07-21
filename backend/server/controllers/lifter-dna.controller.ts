import type { Request, Response } from 'express';
import { lifterDnaService } from '../services/lifter-dna.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function getLifterDnaSnapshot(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const locale = String(req.headers['accept-language'] ?? 'ko').slice(0, 2);
  const data = await lifterDnaService.getSnapshot(req.user.userId, locale);
  res.json({ success: true, data });
}
