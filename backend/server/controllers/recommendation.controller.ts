import type { Request, Response } from 'express';
import { recommendationSchema } from '@machinefit/shared';
import { recommendationService } from '../services/recommendation.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { getParam } from '../utils/params.util.js';
import { resolveRequestLocale } from '../utils/locale.util.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function createRecommendation(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = recommendationSchema.parse(req.body);
  const locale = resolveRequestLocale(req);

  let input = { ...parsed };

  if (req.user?.userId) {
    const user = await userRepository.findById(req.user.userId);
    if (user) {
      if (user.gender) input.gender = user.gender;
      if (user.experienceLevel) input.experienceLevel = user.experienceLevel;
      if (user.age != null) input.age = user.age;
      if (user.workoutGoal) input.workoutGoal = user.workoutGoal;
    }
  }

  if (!input.gender) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Gender is required for recommendations');
  }

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
