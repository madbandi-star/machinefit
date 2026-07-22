import type { Request, Response } from 'express';
import { z } from 'zod';
import type { RecommendationSettings } from '@machinefit/shared';
import { gymIdSchema, machinePreferenceBodySchema, memberIdSchema } from '@machinefit/shared';
import { feedbackRepository } from '../repositories/feedback.repository.js';
import { preferenceRepository } from '../repositories/preference.repository.js';
import { machineRepository } from '../repositories/machine.repository.js';
import { recommendationRepository } from '../repositories/recommendation.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

const feedbackSchema = z.object({
  recommendationId: z.string().uuid(),
  fitRating: z.enum(['good', 'bad']),
  gymId: gymIdSchema.optional(),
  memberId: memberIdSchema.optional(),
});

const preferenceScopeSchema = z
  .object({
    gymId: gymIdSchema.optional(),
    memberId: memberIdSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.gymId && !value.memberId) || (!value.gymId && value.memberId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'gymId and memberId must be provided together',
        path: value.gymId ? ['memberId'] : ['gymId'],
      });
    }
  });

function parseCsvQueryParam(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

function paramString(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function resolvePreferenceScope(source: { gymId?: string; memberId?: string }) {
  if (source.gymId && source.memberId) {
    return { gymId: source.gymId, memberId: source.memberId };
  }
  return undefined;
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

  // Sync machine-level active source with fit feedback.
  // good → AI recommended; bad → user adjusted (prefs kept if already saved).
  await preferenceRepository.setActiveSource(
    userId,
    machineId,
    input.fitRating === 'bad' ? 'adjusted' : 'recommended',
    resolvePreferenceScope(input)
  );

  res.json({ success: true, data: { fitRating: input.fitRating } });
}

export async function getFeedback(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { id } = req.params;
  const fitRating = await feedbackRepository.findByUserRecommendation(userId, paramString(id));
  res.json({ success: true, data: { fitRating } });
}

export async function getFeedbackBatch(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const recommendationIds = parseCsvQueryParam(req.query.ids);
  const feedbackByRecommendation = await feedbackRepository.findByUserRecommendationIds(
    userId,
    recommendationIds
  );
  res.json({ success: true, data: feedbackByRecommendation });
}

export async function upsertPreference(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const machineCode = paramString(req.params.machineCode);
  const body = machinePreferenceBodySchema
    .and(preferenceScopeSchema)
    .parse(req.body);

  const machineId = await machineRepository.findIdByCode(machineCode);
  if (!machineId) {
    throw new AppError(404, 'NOT_FOUND', 'Machine not found');
  }

  const saved = await preferenceRepository.upsert(
    userId,
    machineId,
    {
      customSettings: body.customSettings as Partial<RecommendationSettings> | undefined,
      personalTipMemo: body.personalTipMemo,
      activeSource: body.activeSource,
      clearAdjusted: body.clearAdjusted,
    },
    resolvePreferenceScope(body)
  );
  res.json({
    success: true,
    data: {
      machineCode,
      customSettings: saved.customSettings,
      personalTipMemo: saved.personalTipMemo,
      activeSource: saved.activeSource,
    },
  });
}

export async function getPreference(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const machineCode = paramString(req.params.machineCode);
  const scopeQuery = preferenceScopeSchema.parse(req.query);

  const machineId = await machineRepository.findIdByCode(machineCode);
  if (!machineId) {
    throw new AppError(404, 'NOT_FOUND', 'Machine not found');
  }

  const prefs = await preferenceRepository.findByUserMachine(
    userId,
    machineId,
    resolvePreferenceScope(scopeQuery)
  );
  res.json({
    success: true,
    data: {
      customSettings: prefs?.customSettings ?? {},
      personalTipMemo: prefs?.personalTipMemo ?? '',
      activeSource: prefs?.activeSource ?? 'recommended',
    },
  });
}

export async function getPreferenceBatch(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const machineCodes = parseCsvQueryParam(req.query.codes);
  const scopeQuery = preferenceScopeSchema.parse(req.query);
  const preferencesByMachine = await preferenceRepository.findByUserMachineCodes(
    userId,
    machineCodes,
    resolvePreferenceScope(scopeQuery)
  );
  res.json({ success: true, data: preferencesByMachine });
}
