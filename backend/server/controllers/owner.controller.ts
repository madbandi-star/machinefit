import type { Request, Response } from 'express';
import {
  ownerApplicationSchema,
  createOwnerGymSchema,
  addGymMachineSchema,
} from '@machinefit/shared';
import { ownerService } from '../services/owner.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function apply(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = ownerApplicationSchema.parse(req.body);
  const result = await ownerService.apply(req.user.userId, input);
  res.status(201).json({ success: true, data: result });
}

export async function dashboard(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const stats = await ownerService.dashboard(req.user.userId);
  res.json({ success: true, data: stats });
}

export async function listGyms(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const gyms = await ownerService.listGyms(req.user.userId);
  res.json({ success: true, data: gyms });
}

export async function createGym(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = createOwnerGymSchema.parse(req.body);
  const gym = await ownerService.createGym(req.user.userId, input);
  res.status(201).json({ success: true, data: gym });
}

export async function getGymMachines(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const machines = await ownerService.getGymMachines(req.user.userId, getParam(req.params.gymId));
  res.json({ success: true, data: machines });
}

export async function addGymMachine(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = addGymMachineSchema.parse(req.body);
  const item = await ownerService.addGymMachine(
    req.user.userId,
    getParam(req.params.gymId),
    input
  );
  res.status(201).json({ success: true, data: item });
}

export async function removeGymMachine(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await ownerService.removeGymMachine(
    req.user.userId,
    getParam(req.params.gymId),
    getParam(req.params.itemId)
  );
  res.json({ success: true, data: { message: 'Removed' } });
}
