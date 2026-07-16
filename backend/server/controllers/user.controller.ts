import type { Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const user = await userService.getMe(req.user.userId);
  res.json({ success: true, data: user });
}
