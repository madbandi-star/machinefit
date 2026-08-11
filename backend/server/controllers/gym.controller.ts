import type { Request, Response } from 'express';
import { gymDirectorySearchSchema, gymListQuerySchema } from '@machinefit/shared';
import { gymService } from '../services/gym.service.js';
import { gymDirectoryRepository } from '../repositories/gym-directory.repository.js';
import { getParam } from '../utils/params.util.js';

export async function listGyms(req: Request, res: Response): Promise<void> {
  const query = gymListQuerySchema.parse(req.query);
  const result = await gymService.list({ ...query, lat: undefined, lng: undefined });
  res.json({ success: true, data: result });
}

export async function searchGymDirectory(req: Request, res: Response): Promise<void> {
  const query = gymDirectorySearchSchema.parse(req.query);
  const result = await gymDirectoryRepository.search({
    ...query,
    latitude: undefined,
    longitude: undefined,
  });
  res.json({ success: true, data: result });
}

export async function getGym(req: Request, res: Response): Promise<void> {
  const gym = await gymService.getDetail(getParam(req.params.gymId));
  res.json({ success: true, data: gym });
}

export async function getGymMachines(req: Request, res: Response): Promise<void> {
  const machines = await gymService.getMachines(getParam(req.params.gymId));
  res.json({ success: true, data: machines });
}
