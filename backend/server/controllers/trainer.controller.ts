import type { Request, Response } from 'express';
import { trainerApplicationSchema } from '@machinefit/shared';
import { trainerApplicationService } from '../services/trainer-application.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function apply(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = trainerApplicationSchema.parse(req.body);
  const result = await trainerApplicationService.apply(req.user.userId, input);
  res.status(201).json({ success: true, data: result });
}
