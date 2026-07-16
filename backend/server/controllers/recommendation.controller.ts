import type { Request, Response } from 'express';
import { recommendationSchema } from '@machinefit/shared';
import { recommendationService } from '../services/recommendation.service.js';
import { getParam } from '../utils/params.util.js';

export async function createRecommendation(
  req: Request,
  res: Response
): Promise<void> {
  const input = recommendationSchema.parse(req.body);
  const result = await recommendationService.generate(input, req.user?.userId);
  res.status(201).json({ success: true, data: result });
}

export async function getRecommendation(
  req: Request,
  res: Response
): Promise<void> {
  const result = await recommendationService.getById(getParam(req.params.id));
  res.json({ success: true, data: result });
}
