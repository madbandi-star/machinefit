import type { Request, Response } from 'express';
import { createUserGymSchema, updateUserGymSchema } from '@machinefit/shared';
import { userGymService } from '../services/user-gym.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function listMyGyms(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await userGymService.ensureReady(req.user.userId);
  res.json({ success: true, data });
}

export async function createMyGym(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createUserGymSchema.parse(req.body);
  const gym = await userGymService.create(req.user.userId, input);
  res.status(201).json({ success: true, data: gym });
}

export async function updateMyGym(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = updateUserGymSchema.parse(req.body);
  const gym = await userGymService.update(req.user.userId, getParam(req.params.gymId), input);
  res.json({ success: true, data: gym });
}

export async function deleteMyGym(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await userGymService.remove(req.user.userId, getParam(req.params.gymId));
  res.json({ success: true, data: { message: 'Deleted' } });
}

export async function selectMyGym(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gym = await userGymService.select(req.user.userId, getParam(req.params.gymId));
  res.json({ success: true, data: gym });
}
