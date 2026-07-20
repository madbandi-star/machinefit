import type { RecommendationInput } from '@machinefit/shared';
import {
  applyPersonalizationToWeight,
  buildPersonalizedTips,
  DEFAULT_ROM_SETTING,
  isFreeWeightMachineCode,
  mergeSettingsWithPreferences,
  recommendRepsForGoal,
} from '@machinefit/shared';
import { recommendationRepository } from '../repositories/recommendation.repository.js';
import { preferenceRepository } from '../repositories/preference.repository.js';
import { historyRepository } from '../repositories/history.repository.js';
import { pickLocalizedArray } from '../utils/localize.util.js';
import { AppError } from '../middlewares/error.middleware.js';
import { machineService } from './machine.service.js';
import { computeRecommendationWeight } from './recommendation-weight.service.js';
import type { MockSettingRule } from '../data/mock.js';

const DEFAULT_TIPS: Record<string, string[]> = {
  en: ['Adjust settings to comfort'],
  ko: ['편한 설정으로 조절하세요'],
  ja: ['快適な設定に調整してください'],
  zh: ['调整到舒适的设置'],
};

function findBestMatch(rules: MockSettingRule[], input: RecommendationInput) {
  const exact = rules.find(
    (r) =>
      r.gender === input.gender &&
      r.experienceLevel === input.experienceLevel &&
      input.heightCm >= r.heightMinCm &&
      input.heightCm <= r.heightMaxCm
  );
  if (exact) return exact;

  const sameProfile = rules.filter(
    (r) => r.gender === input.gender && r.experienceLevel === input.experienceLevel
  );
  if (sameProfile.length === 0) return rules[0];

  return sameProfile.reduce((best, r) => {
    const bestDist = Math.min(
      Math.abs(input.heightCm - best.heightMinCm),
      Math.abs(input.heightCm - best.heightMaxCm)
    );
    const rDist = Math.min(
      Math.abs(input.heightCm - r.heightMinCm),
      Math.abs(input.heightCm - r.heightMaxCm)
    );
    return rDist < bestDist ? r : best;
  });
}

export const recommendationService = {
  async generate(input: RecommendationInput, userId?: string, locale = 'en') {
    if (isFreeWeightMachineCode(input.machineCode) && !input.targetMuscleGroup) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'targetMuscleGroup is required for free-weight recommendations'
      );
    }

    const machine = await machineService.getByCode(input.machineCode);
    const machineId = machine.id;

    const rules = await recommendationRepository.findSettingsForMachine(
      machineId,
      input.machineCode
    );

    const match = rules.length > 0 ? findBestMatch(rules, input) : undefined;
    const { recommendedWeightKg, weightBasis } = await computeRecommendationWeight({
      input,
      userId,
      machineId,
      matchedSettingWeightKg: match?.weightKg,
    });

    const personalizedWeight = applyPersonalizationToWeight(recommendedWeightKg, {
      workoutGoal: input.workoutGoal,
      age: input.age,
      targetMuscleGroup: input.targetMuscleGroup,
    });

    const savedPreferences =
      userId != null
        ? await preferenceRepository.findByUserMachine(userId, machineId)
        : null;

    const recommendedReps = recommendRepsForGoal(input.workoutGoal);

    const baseSettings = {
      seatPosition: match?.seatPosition,
      backPadPosition: match?.backPadPosition,
      footPosition: match?.footPosition,
      handlePosition: match?.handlePosition,
      romSetting: match?.romSetting ?? DEFAULT_ROM_SETTING,
      recommendedWeightKg: personalizedWeight,
      recommendedRepsMin: recommendedReps.min,
      recommendedRepsMax: recommendedReps.max,
    };

    const settings = mergeSettingsWithPreferences(baseSettings, savedPreferences?.customSettings ?? null);

    const id = await recommendationRepository.save(
      input,
      machineId,
      null,
      match,
      settings.recommendedWeightKg,
      weightBasis,
      userId,
      undefined,
      {
        min: settings.recommendedRepsMin ?? recommendedReps.min,
        max: settings.recommendedRepsMax ?? recommendedReps.max,
      }
    );

    const youtubeVideos = await recommendationRepository.findYoutubeVideos(machineId);

    if (userId) {
      await historyRepository.record(userId, machineId, id);
    }

    const baseTips = match
      ? pickLocalizedArray(match.tips, locale)
      : pickLocalizedArray(DEFAULT_TIPS, locale);

    const tips = buildPersonalizedTips(baseTips, locale, {
      workoutGoal: input.workoutGoal,
      targetMuscleGroup: input.targetMuscleGroup,
      hasCustomPreferences: Boolean(
        savedPreferences && Object.keys(savedPreferences).length > 0
      ),
    });

    return {
      id,
      machineCode: machine.code,
      machineName: machine.name[locale as keyof typeof machine.name] ?? machine.name.en,
      settings,
      tips,
      warnings: match ? pickLocalizedArray(match.warnings, locale) : [],
      youtubeVideos,
      createdAt: new Date().toISOString(),
      weightBasis,
      ...(input.targetMuscleGroup ? { targetMuscleGroup: input.targetMuscleGroup } : {}),
    };
  },

  async getById(id: string, locale = 'en') {
    return recommendationRepository.findById(id, locale);
  },
};
