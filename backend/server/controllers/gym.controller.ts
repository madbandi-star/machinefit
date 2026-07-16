import type { Request, Response } from 'express';
import { gymListQuerySchema } from '@machinefit/shared';
import { gymService } from '../services/gym.service.js';
import { getParam } from '../utils/params.util.js';

export async function listGyms(req: Request, res: Response): Promise<void> {
  const query = gymListQuerySchema.parse(req.query);
  const result = await gymService.list(query);
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

export async function nearbyGyms(req: Request, res: Response): Promise<void> {
  const lat = parseFloat(String(req.query.lat ?? ''));
  const lng = parseFloat(String(req.query.lng ?? ''));
  const radius = parseFloat(String(req.query.radius ?? '10'));
  const machineCode = req.query.machineCode ? String(req.query.machineCode) : undefined;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'lat and lng are required' },
    });
    return;
  }

  const gyms = await gymService.nearby(lat, lng, radius, machineCode);
  res.json({ success: true, data: gyms });
}
