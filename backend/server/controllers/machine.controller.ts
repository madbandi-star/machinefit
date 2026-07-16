import type { Request, Response } from 'express';
import { machineService } from '../services/machine.service.js';
import { machineListQuerySchema } from '@machinefit/shared';
import { getParam } from '../utils/params.util.js';

export async function listMachines(req: Request, res: Response): Promise<void> {
  const query = machineListQuerySchema.parse(req.query);
  const result = await machineService.list(query);
  res.json({ success: true, data: result });
}

export async function getMachineByCode(req: Request, res: Response): Promise<void> {
  const machine = await machineService.getByCode(getParam(req.params.machineCode));
  res.json({ success: true, data: machine });
}

export async function searchMachines(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q ?? '');
  const result = await machineService.search(q);
  res.json({ success: true, data: result });
}
