import type { Request, Response } from 'express';
import { updateProfileSchema } from '@machinefit/shared';
import { userService } from '../services/user.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const user = await userService.getMe(req.user.userId);
  res.json({ success: true, data: user });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const input = updateProfileSchema.parse(req.body);
  const user = await userService.updateMe(req.user.userId, input);
  res.json({ success: true, data: user });
}
