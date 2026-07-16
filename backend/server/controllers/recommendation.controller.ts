import type { Request, Response } from 'express';
import { recommendationSchema } from '@machinefit/shared';
import { recommendationService } from '../services/recommendation.service.js';
import { getParam } from '../utils/params.util.js';
import { resolveRequestLocale } from '../utils/locale.util.js';

export async function createRecommendation(
  req: Request,
  res: Response
): Promise<void> {
  const input = recommendationSchema.parse(req.body);
  const locale = resolveRequestLocale(req);
  const result = await recommendationService.generate(input, req.user?.userId, locale);
  res.status(201).json({ success: true, data: result });
}

export async function getRecommendation(
  req: Request,
  res: Response
): Promise<void> {
  const locale = resolveRequestLocale(req);
  const result = await recommendationService.getById(getParam(req.params.id), locale);
  res.json({ success: true, data: result });
}
