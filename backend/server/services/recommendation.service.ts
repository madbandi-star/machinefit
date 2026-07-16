import type { RecommendationInput } from '@machinefit/shared';
import { recommendationRepository } from '../repositories/recommendation.repository.js';
import { historyRepository } from '../repositories/history.repository.js';
import { pickLocalizedArray } from '../utils/localize.util.js';
import { machineService } from './machine.service.js';
import type { MockSettingRule } from '../data/mock.js';

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
    const machine = await machineService.getByCode(input.machineCode);
    const machineId = machine.id;

    const rules = await recommendationRepository.findSettingsForMachine(
      machineId,
      input.machineCode
    );

    const match = rules.length > 0 ? findBestMatch(rules, input) : undefined;
    const recommendedWeightKg = recommendationRepository.computeRecommendedWeight(
      input,
      match?.weightKg
    );

    const id = await recommendationRepository.save(
      input,
      machineId,
      null,
      match,
      recommendedWeightKg,
      userId
    );

    const youtubeVideos = await recommendationRepository.findYoutubeVideos(machineId);

    if (userId) {
      await historyRepository.record(userId, machineId, id);
    }

    return {
      id,
      machineCode: machine.code,
      machineName: machine.name[locale as keyof typeof machine.name] ?? machine.name.en,
      settings: {
        seatPosition: match?.seatPosition,
        backPadPosition: match?.backPadPosition,
        footPosition: match?.footPosition,
        handlePosition: match?.handlePosition,
        romSetting: match?.romSetting,
        recommendedWeightKg,
      },
      tips: match
        ? pickLocalizedArray(match.tips, locale)
        : ['Adjust settings to comfort'],
      warnings: match ? pickLocalizedArray(match.warnings, locale) : [],
      youtubeVideos,
      createdAt: new Date().toISOString(),
    };
  },

  async getById(id: string, locale = 'en') {
    return recommendationRepository.findById(id, locale);
  },
};
