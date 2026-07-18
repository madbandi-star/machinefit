import type { Request, Response } from 'express';
import { z } from 'zod';
import { feedbackRepository } from '../repositories/feedback.repository.js';
import { preferenceRepository } from '../repositories/preference.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { recommendationRepository } from '../repositories/recommendation.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

const feedbackSchema = z.object({
  recommendationId: z.string().uuid(),
  fitRating: z.enum(['good', 'bad']),
});

const preferenceSchema = z.object({
  customSettings: z.record(z.unknown()),
});

function paramString(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function submitFeedback(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const input = feedbackSchema.parse(req.body);

  const recommendation = await recommendationRepository.findById(input.recommendationId);
  const machineId = await machineRepository.findIdByCode(recommendation.machineCode);
  if (!machineId) {
    throw new AppError(404, 'NOT_FOUND', 'Machine not found');
  }

  await feedbackRepository.upsert(userId, input.recommendationId, machineId, input.fitRating);
  res.json({ success: true, data: { fitRating: input.fitRating } });
}

export async function getFeedback(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { id } = req.params;
  const fitRating = await feedbackRepository.findByUserRecommendation(userId, paramString(id));
  res.json({ success: true, data: { fitRating } });
}

export async function upsertPreference(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const machineCode = paramString(req.params.machineCode);
  const { customSettings } = preferenceSchema.parse(req.body);

  const machineId = await machineRepository.findIdByCode(machineCode);
  if (!machineId) {
    throw new AppError(404, 'NOT_FOUND', 'Machine not found');
  }

  const saved = await preferenceRepository.upsert(userId, machineId, customSettings);
  res.json({ success: true, data: { machineCode, customSettings: saved } });
}

export async function getPreference(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const machineCode = paramString(req.params.machineCode);

  const machineId = await machineRepository.findIdByCode(machineCode);
  if (!machineId) {
    throw new AppError(404, 'NOT_FOUND', 'Machine not found');
  }

  const customSettings = await preferenceRepository.findByUserMachine(userId, machineId);
  res.json({ success: true, data: { customSettings: customSettings ?? {} } });
}
