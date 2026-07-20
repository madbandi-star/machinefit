import type { Request, Response } from 'express';
import { addGymMachineSchema } from '@machinefit/shared';
import { gymInventoryService } from '../services/gym-inventory.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getParam } from '../utils/params.util.js';

export async function listInventory(req: Request, res: Response): Promise<void> {
  const brandCode = req.query.brandCode ? String(req.query.brandCode) : undefined;
  const q = req.query.q ? String(req.query.q) : undefined;
  const locale = req.headers['accept-language']?.toString().slice(0, 2) || 'ko';

  const result = await gymInventoryService.list(getParam(req.params.gymId), {
    brandCode,
    q,
    viewerUserId: req.user?.userId,
    viewerRole: req.user?.roleCode,
    locale,
  });
  res.json({ success: true, data: result });
}

export async function addInventory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const input = addGymMachineSchema.parse(req.body);
  const item = await gymInventoryService.add(
    getParam(req.params.gymId),
    req.user.userId,
    req.user.roleCode,
    input
  );
  res.status(201).json({ success: true, data: item });
}

export async function removeInventory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  await gymInventoryService.remove(
    getParam(req.params.gymId),
    getParam(req.params.itemId),
    req.user.userId,
    req.user.roleCode
  );
  res.json({ success: true, data: { message: 'Removed' } });
}
