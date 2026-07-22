import type { Request, Response } from 'express';
import { ageFromBirthDate, recommendationSchema } from '@machinefit/shared';
import { recommendationService } from '../services/recommendation.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { gymMemberRepository } from '../repositories/gym-member.repository.js';
import { gymScopeService } from '../services/gym-scope.service.js';
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
    const userId = req.user.userId;

    if (input.gymId && input.memberId) {
      await gymScopeService.resolveMemberForWrite(userId, input.gymId, input.memberId);
      const member = await gymMemberRepository.findById(input.memberId);
      if (!member) {
        throw new AppError(404, 'NOT_FOUND', 'Member not found');
      }

      if (member.isSelf) {
        // Self member: account profile is the source of truth.
        const user = await userRepository.findById(userId);
        if (user) {
          if (user.gender) input.gender = user.gender;
          if (user.heightCm != null) input.heightCm = user.heightCm;
          if (user.weightKg != null) input.weightKg = user.weightKg;
          if (user.experienceLevel) input.experienceLevel = user.experienceLevel;
          if (user.age != null) input.age = user.age;
          if (user.workoutGoal) input.workoutGoal = user.workoutGoal;
        }
      } else {
        // Other members: never inherit the account owner's body profile.
        if (!member.gender || member.heightCm == null || member.weightKg == null) {
          throw new AppError(
            400,
            'MEMBER_PROFILE_INCOMPLETE',
            'Selected member needs gender, height, and weight for recommendations'
          );
        }
        input.gender = member.gender;
        input.heightCm = member.heightCm;
        input.weightKg = member.weightKg;
        const age = ageFromBirthDate(member.birthDate);
        if (age != null) input.age = age;
        else delete input.age;
        // Members do not store experience/goal — do not copy from owner.
        input.experienceLevel = input.experienceLevel || 'intermediate';
        delete input.workoutGoal;
      }
    } else {
      // Legacy clients without gym/member scope still use the account profile.
      const user = await userRepository.findById(userId);
      if (user) {
        if (user.gender) input.gender = user.gender;
        if (user.experienceLevel) input.experienceLevel = user.experienceLevel;
        if (user.age != null) input.age = user.age;
        if (user.workoutGoal) input.workoutGoal = user.workoutGoal;
      }
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
