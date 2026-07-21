import type { Request, Response } from 'express';
import { replaceMotivationMediaSchema } from '@machinefit/shared';
import { motivationMediaService } from '../services/motivation-media.service.js';

export async function listPlaylist(_req: Request, res: Response): Promise<void> {
  const data = await motivationMediaService.listPlaylist();
  res.json({ success: true, data });
}

export async function listAdmin(_req: Request, res: Response): Promise<void> {
  const data = await motivationMediaService.listAdmin();
  res.json({ success: true, data });
}

export async function replace(req: Request, res: Response): Promise<void> {
  const input = replaceMotivationMediaSchema.parse(req.body);
  const data = await motivationMediaService.replace(input);
  res.json({ success: true, data });
}
