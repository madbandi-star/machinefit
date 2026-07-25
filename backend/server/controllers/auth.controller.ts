import type { Request, Response } from 'express';
import { registerSchema, loginSchema, marketingPrefSchema } from '@machinefit/shared';
import { authService } from '../services/auth.service.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input);
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input);
  res.json({ success: true, data: result });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Refresh token required');
  }
  const result = await authService.refresh(refreshToken);
  res.json({ success: true, data: result });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  await authService.logout(req.user.userId);
  res.json({ success: true, data: { message: 'Logged out' } });
}

export async function deactivateAccount(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const data = await authService.deactivateAccount(req.user.userId);
  res.json({ success: true, data });
}

export async function updateMarketingPref(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const input = marketingPrefSchema.parse(req.body);
  const data = await authService.setMarketingOptIn(req.user.userId, input.marketingOptIn);
  res.json({ success: true, data });
}
