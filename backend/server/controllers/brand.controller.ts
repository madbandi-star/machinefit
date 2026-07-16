import type { Request, Response } from 'express';
import { brandService } from '../services/brand.service.js';
import { getParam } from '../utils/params.util.js';

export async function listBrands(_req: Request, res: Response): Promise<void> {
  const brands = await brandService.list();
  res.json({ success: true, data: brands });
}

export async function getBrandByCode(req: Request, res: Response): Promise<void> {
  const brand = await brandService.getByCode(getParam(req.params.brandCode));
  res.json({ success: true, data: brand });
}

export async function getBrandMachines(req: Request, res: Response): Promise<void> {
  const machines = await brandService.getMachines(getParam(req.params.brandCode));
  res.json({ success: true, data: machines });
}
