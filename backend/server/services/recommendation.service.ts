import type { RecommendationInput } from '@machinefit/shared';
import {
  applyPersonalizationToWeight,
  applyWeightDifficultyToRecommendation,
  buildPersonalizedTips,
  DEFAULT_ROM_SETTING,
  isBodyweightExercise,
  isFreeWeightMachineCode,
  resolveActiveRecommendationSettings,
  recommendRepsForGoal,
  resolveStandardMachineCoaching,
  stripProTipSeparatorsFromLines,
} from '@machinefit/shared';
import { recommendationRepository } from '../repositories/recommendation.repository.js';
import { preferenceRepository } from '../repositories/preference.repository.js';
import { historyRepository } from '../repositories/history.repository.js';
import { firstLocalizedRecord, pickLocalizedArray } from '../utils/localize.util.js';
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

    const [rules, savedPreferences, standardFit] = await Promise.all([
      recommendationRepository.findSettingsForMachine(machineId, input.machineCode),
      userId != null
        ? preferenceRepository
            .findByUserMachine(
              userId,
              machineId,
              input.gymId && input.memberId
                ? { gymId: input.gymId, memberId: input.memberId }
                : undefined
            )
            .catch((err) => {
              // Prefer cold recommendations over failing the whole request
              // (e.g. pending migrations for preference columns).
              console.error('preference lookup failed during recommend', err);
              return null;
            })
        : Promise.resolve(null),
      recommendationRepository.findStandardFitPositions(machineId, input.machineCode),
    ]);

    const match = rules.length > 0 ? findBestMatch(rules, input) : undefined;
    const { recommendedWeightKg, weightBasis } = await computeRecommendationWeight({
      input,
      userId,
      machineId,
      matchedSettingWeightKg: match?.weightKg,
      gymId: input.gymId,
      memberId: input.memberId,
      machineType: machine.machineType,
      bodyweightLoadFactor: machine.bodyweightLoadFactor,
      machineSettings: rules,
    });

    // Progressive / growth targets already come from the user's real logs for that
    // machine (and muscle). Do not re-scale them with goal/muscle bias.
    // Bodyweight estimated load is bodyweight × factor — keep it unscaled.
    const fromUserHistory =
      weightBasis.primarySourceId === 'progressiveTarget' ||
      weightBasis.primarySourceId === 'growthNextTarget';
    const fromBodyweightEstimate = weightBasis.primarySourceId === 'bodyweightEstimatedLoad';

    const afterPersonalization =
      fromUserHistory || fromBodyweightEstimate
        ? recommendedWeightKg
        : applyPersonalizationToWeight(recommendedWeightKg, {
            gender: input.gender,
            workoutGoal: input.workoutGoal,
            experienceLevel: input.experienceLevel,
            age: input.age,
            targetMuscleGroup: input.targetMuscleGroup,
          });

    const personalizedWeight = fromBodyweightEstimate
      ? afterPersonalization
      : applyWeightDifficultyToRecommendation(afterPersonalization, input.weightDifficulty, {
          // BW history progressive also uses estimated-load precision (not plate snaps).
          bodyweightEstimated:
            isBodyweightExercise({
              machineCode: input.machineCode,
              machineType: machine.machineType,
            }) &&
            (fromUserHistory || fromBodyweightEstimate),
        });

    const recommendedReps = recommendRepsForGoal(
      input.workoutGoal,
      input.experienceLevel
    );

    const aiSettings = {
      seatPosition: match?.seatPosition ?? standardFit?.seatPosition,
      backPadPosition: match?.backPadPosition ?? standardFit?.backPadPosition,
      footPosition: match?.footPosition ?? standardFit?.footPosition,
      handlePosition: match?.handlePosition ?? standardFit?.handlePosition,
      romSetting: match?.romSetting ?? DEFAULT_ROM_SETTING,
      recommendedWeightKg: personalizedWeight,
      recommendedRepsMin: recommendedReps.min,
      recommendedRepsMax: recommendedReps.max,
    };

    const { settings: activeSettings, activeSource } = resolveActiveRecommendationSettings(
      aiSettings,
      {
        customSettings: savedPreferences?.customSettings ?? null,
        activeSource: savedPreferences?.activeSource ?? 'recommended',
      }
    );

    const standardCoaching = resolveStandardMachineCoaching(
      input.machineCode,
      machine.standardTypeCode
    );
    const standardTips = pickLocalizedArray(standardCoaching?.tips ?? null, locale);
    const standardWarnings = pickLocalizedArray(standardCoaching?.warnings ?? null, locale);

    const settingsTips = match ? pickLocalizedArray(match.tips, locale) : [];
    const catalogTips = pickLocalizedArray(machine.tips ?? null, locale);
    const settingsWarnings = match ? pickLocalizedArray(match.warnings, locale) : [];
    const catalogWarnings = pickLocalizedArray(machine.warnings ?? null, locale);

    let typeCoaching:
      | { tips: Record<string, string[]> | null; warnings: Record<string, string[]> | null }
      | undefined;
    if (
      standardTips.length === 0 &&
      ((settingsTips.length === 0 && catalogTips.length === 0) ||
        (settingsWarnings.length === 0 && catalogWarnings.length === 0))
    ) {
      typeCoaching = await recommendationRepository.findTypeCoaching(machineId);
    }
    const typeTips = pickLocalizedArray(typeCoaching?.tips ?? null, locale);
    const typeWarnings = pickLocalizedArray(typeCoaching?.warnings ?? null, locale);

    const baseTips =
      standardTips.length > 0
        ? standardTips
        : settingsTips.length > 0
          ? settingsTips
          : catalogTips.length > 0
            ? catalogTips
            : typeTips.length > 0
              ? typeTips
              : pickLocalizedArray(DEFAULT_TIPS, locale);

    const hasCustomSettings = Boolean(
      savedPreferences?.customSettings &&
        Object.values(savedPreferences.customSettings).some(
          (value) => value != null && value !== ''
        )
    );
    const usingAdjusted = activeSource === 'adjusted';

    const tips = standardTips.length
      ? standardTips
      : buildPersonalizedTips(baseTips, locale, {
          workoutGoal: input.workoutGoal,
          experienceLevel: input.experienceLevel,
          targetMuscleGroup: input.targetMuscleGroup,
          hasCustomPreferences: usingAdjusted || hasCustomSettings,
        });

    const warnings =
      standardWarnings.length > 0
        ? standardWarnings
        : settingsWarnings.length > 0
          ? settingsWarnings
          : catalogWarnings.length > 0
            ? catalogWarnings
            : typeWarnings;
    const proTips = stripProTipSeparatorsFromLines(
      pickLocalizedArray(machine.proTips ?? null, locale)
    );
    const tipsByLocale: Record<string, string[]> = standardCoaching
      ? { ...standardCoaching.tips, [locale]: tips }
      : {
          [locale]: tips,
          ...(match?.tips ?? {}),
          ...(machine.tips ?? {}),
          ...(typeCoaching?.tips ?? {}),
        };
    // Prefer the response locale's canonical / personalized tips.
    tipsByLocale[locale] = tips;
    const warningsByLocale = standardCoaching
      ? standardCoaching.warnings
      : firstLocalizedRecord(
          match?.warnings,
          machine.warnings ?? undefined,
          typeCoaching?.warnings ?? undefined
        ) ?? (warnings.length ? { [locale]: warnings } : null);

    const [id, youtubeVideos] = await Promise.all([
      recommendationRepository.save(
        input,
        machineId,
        null,
        // Persist AI snapshot so history can compare recommended vs adjusted.
        aiSettings,
        aiSettings.recommendedWeightKg,
        weightBasis,
        userId,
        undefined,
        {
          min: aiSettings.recommendedRepsMin ?? recommendedReps.min,
          max: aiSettings.recommendedRepsMax ?? recommendedReps.max,
        },
        tipsByLocale,
        warningsByLocale
      ),
      recommendationRepository.findYoutubeVideos(machineId),
    ]);

    if (userId && !input.skipHistory) {
      const { userGymRepository } = await import('../repositories/user-gym.repository.js');
      const { gymMemberRepository } = await import('../repositories/gym-member.repository.js');
      const gymId = input.gymId ?? (await userGymRepository.getActiveGymId(userId));
      if (gymId) {
        const memberId =
          input.memberId ?? (await gymMemberRepository.findSelfMember(gymId, userId))?.id;
        if (memberId) {
          // Fire-and-forget history write must still be awaited for consistency,
          // but gym/member resolution above avoids extra work when already scoped.
          await historyRepository.record(userId, gymId, memberId, machineId, id);
        }
      }
    }

    const brandName =
      machine.brandName?.[locale as keyof typeof machine.brandName] ??
      machine.brandName?.en;

    return {
      id,
      machineCode: machine.code,
      machineName: machine.name[locale as keyof typeof machine.name] ?? machine.name.en,
      ...(brandName ? { brandName } : {}),
      settings: activeSettings,
      aiRecommendedSettings: aiSettings,
      adjustedSettings: savedPreferences?.customSettings ?? {},
      activeSource,
      tips,
      warnings,
      ...(proTips.length > 0 ? { proTips } : {}),
      youtubeVideos,
      createdAt: new Date().toISOString(),
      weightBasis,
      ...(input.targetMuscleGroup ? { targetMuscleGroup: input.targetMuscleGroup } : {}),
    };
  },

  async getById(id: string, locale = 'en', viewerUserId?: string) {
    return recommendationRepository.findById(id, locale, viewerUserId);
  },
};
