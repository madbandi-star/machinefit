import {
  buildFortuneSeedKey,
  hasFortuneBirthProfile,
  type TodayFortuneResponse,
} from '@machinefit/shared';
import { userRepository } from '../../repositories/user.repository.js';
import { fortuneContentRepository } from '../../repositories/fortune-content.repository.js';
import { TtlCache } from '../../utils/ttl-cache.js';
import { seoulDateKey } from '../../utils/mypage-workout-metrics.js';
import {
  computeWorkoutAnalytics,
  loadFortuneLogs,
} from './workout-analytics.engine.js';
import { runFortuneEngine } from './fortune.engine.js';
import { buildRecommendation, computeFortuneScores } from './recommendation.engine.js';

const cache = new TtlCache<TodayFortuneResponse>(10 * 60_000);

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

export const fortuneService = {
  invalidateUser(userId: string): void {
    cache.deleteByPrefix(userId);
  },

  clearCache(): void {
    cache.clear();
  },

  async getToday(
    userId: string,
    options?: {
      gymId?: string;
      memberId?: string;
      date?: string;
      locale?: string;
    }
  ): Promise<TodayFortuneResponse> {
    const dateKey = options?.date ?? seoulDateKey();
    const locale = options?.locale?.startsWith('ko')
      ? 'ko'
      : options?.locale?.slice(0, 2) || 'ko';
    const cacheKey = `${userId}:${dateKey}:${options?.gymId ?? ''}:${options?.memberId ?? ''}:${locale}`;
    const hit = cache.get(cacheKey);
    if (hit) return hit;

    const user = await userRepository.findById(userId);
    if (!user) {
      return { date: dateKey, status: 'needs_birth_profile' };
    }

    if (
      !hasFortuneBirthProfile({
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthTimeUnknown: user.birthTimeUnknown,
      })
    ) {
      const needs: TodayFortuneResponse = {
        date: dateKey,
        status: 'needs_birth_profile',
      };
      cache.set(cacheKey, needs, 60_000);
      return needs;
    }

    const birthDate = user.birthDate!;
    const birthTimeUnknown = Boolean(user.birthTimeUnknown) || !user.birthTime;
    const mode = birthTimeUnknown ? 'simple' : 'full';

    const seedKey = buildFortuneSeedKey({
      userId,
      birthDate,
      birthTime: user.birthTime,
      birthTimeUnknown,
      dateKey,
    });

    const from30 = shiftDateKey(dateKey, -29);
    const [logs, catalog] = await Promise.all([
      loadFortuneLogs(userId, from30, {
        gymId: options?.gymId,
        memberId: options?.memberId,
      }),
      fortuneContentRepository.listActive(locale === 'ko' ? 'ko' : 'ko'),
    ]);

    const analysis = computeWorkoutAnalytics(logs, dateKey);
    const fortuneResult = runFortuneEngine({
      seedKey,
      mode,
      catalog,
      analysis,
    });
    const scores = computeFortuneScores(fortuneResult, analysis);
    const recommendation = buildRecommendation(fortuneResult, analysis, catalog);

    const response: TodayFortuneResponse = {
      date: dateKey,
      status: 'ready',
      mode,
      fortune: fortuneResult.fortune,
      scores,
      recommendation,
      dataAnalysis:
        analysis.personalizationTier === 'none'
          ? {
              ...analysis,
              // Keep structure but lighter bullets already set in engine.
            }
          : analysis,
    };

    cache.set(cacheKey, response);
    return response;
  },
};
