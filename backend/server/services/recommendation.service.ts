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

function pickClosestHeightRule(rules: MockSettingRule[], heightCm: number): MockSettingRule {
  return rules.reduce((best, r) => {
    const bestDist = Math.min(
      Math.abs(heightCm - best.heightMinCm),
      Math.abs(heightCm - best.heightMaxCm)
    );
    const rDist = Math.min(
      Math.abs(heightCm - r.heightMinCm),
      Math.abs(heightCm - r.heightMaxCm)
    );
    return rDist < bestDist ? r : best;
  });
}

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
  if (sameProfile.length > 0) {
    return pickClosestHeightRule(sameProfile, input.heightCm);
  }

  const sameGender = rules.filter((r) => r.gender === input.gender);
  if (sameGender.length > 0) {
    return pickClosestHeightRule(sameGender, input.heightCm);
  }

  const sameExperience = rules.filter((r) => r.experienceLevel === input.experienceLevel);
  if (sameExperience.length > 0) {
    return pickClosestHeightRule(sameExperience, input.heightCm);
  }

  return rules[0];
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

    // Progressive / growth targets already come from the user's real logs for that
    // machine (and muscle). Do not re-scale them with goal/muscle bias.
    const fromUserHistory =
      weightBasis.primarySourceId === 'progressiveTarget' ||
      weightBasis.primarySourceId === 'growthNextTarget';

    const personalizedWeight = fromUserHistory
      ? recommendedWeightKg
      : applyPersonalizationToWeight(recommendedWeightKg, {
          workoutGoal: input.workoutGoal,
          experienceLevel: input.experienceLevel,
          age: input.age,
          targetMuscleGroup: input.targetMuscleGroup,
        });

    const savedPreferences =
      userId != null
        ? await preferenceRepository.findByUserMachine(userId, machineId)
        : null;

    const recommendedReps = recommendRepsForGoal(
      input.workoutGoal,
      input.experienceLevel
    );

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

    const baseTips = match
      ? pickLocalizedArray(match.tips, locale)
      : pickLocalizedArray(DEFAULT_TIPS, locale);

    const hasCustomSettings = Boolean(
      savedPreferences?.customSettings &&
        Object.values(savedPreferences.customSettings).some(
          (value) => value != null && value !== ''
        )
    );

    const tips = buildPersonalizedTips(baseTips, locale, {
      workoutGoal: input.workoutGoal,
      experienceLevel: input.experienceLevel,
      targetMuscleGroup: input.targetMuscleGroup,
      hasCustomPreferences: hasCustomSettings,
    });

    const warnings = match ? pickLocalizedArray(match.warnings, locale) : [];
    const tipsByLocale = { [locale]: tips, ...(match?.tips ?? {}) };
    // Prefer the response locale's personalized tips; keep other catalog locales as fallback.
    tipsByLocale[locale] = tips;
    const warningsByLocale = match?.warnings ?? (warnings.length ? { [locale]: warnings } : null);

    const id = await recommendationRepository.save(
      input,
      machineId,
      null,
      settings,
      settings.recommendedWeightKg,
      weightBasis,
      userId,
      undefined,
      {
        min: settings.recommendedRepsMin ?? recommendedReps.min,
        max: settings.recommendedRepsMax ?? recommendedReps.max,
      },
      tipsByLocale,
      warningsByLocale
    );

    const youtubeVideos = await recommendationRepository.findYoutubeVideos(machineId);

    if (userId) {
      await historyRepository.record(userId, machineId, id);
    }

    return {
      id,
      machineCode: machine.code,
      machineName: machine.name[locale as keyof typeof machine.name] ?? machine.name.en,
      settings,
      tips,
      warnings,
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
