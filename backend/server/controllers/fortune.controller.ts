import type { Request, Response, NextFunction } from 'express';
import { fortuneTodayQuerySchema } from '@machinefit/shared';
import { fortuneService } from '../services/fortune/fortune.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function getTodayFortune(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Login required');

    const parsed = fortuneTodayQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query');
    }

    const data = await fortuneService.getToday(userId, {
      gymId: parsed.data.gymId,
      memberId: parsed.data.memberId,
      date: parsed.data.date,
      locale:
        parsed.data.locale ??
        (typeof req.headers['accept-language'] === 'string'
          ? req.headers['accept-language'].slice(0, 2)
          : 'ko'),
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
