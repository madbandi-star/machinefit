import {
  FORTUNE_ENGINE_VERSION,
  buildFortuneSeedKey,
  buildTraditionalChart,
  enforceFortuneConsistency,
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
import { labelForCode, runFortuneEngine } from './fortune.engine.js';
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
    const cacheKey = `${userId}:${dateKey}:${options?.gymId ?? ''}:${options?.memberId ?? ''}:${locale}:${FORTUNE_ENGINE_VERSION}`;
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

    const chart = buildTraditionalChart({
      birthDate,
      birthTime: user.birthTime,
      birthTimeUnknown,
      dateKey,
      gender: user.gender ?? null,
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
      chart,
    });
    let scores = computeFortuneScores(fortuneResult, analysis, chart.coreTheme);

    const consistent = enforceFortuneConsistency({
      coreTheme: chart.coreTheme,
      keywordCode: fortuneResult.keywordCode,
      strategyCode: fortuneResult.strategyCode,
      conditionCode: fortuneResult.conditionCode,
      avoidCode: fortuneResult.avoidCode,
      styleCode: fortuneResult.styleCode,
      bodyPartCode: fortuneResult.bodyPartCode,
      preCode: fortuneResult.preCode,
      postCode: fortuneResult.postCode,
      headlineCode: fortuneResult.headlineCode,
      oneLinerCode: fortuneResult.oneLinerCode,
      scoreStars: fortuneResult.scoreStars,
      scores,
    });

    fortuneResult.keywordCode = consistent.keywordCode;
    fortuneResult.strategyCode = consistent.strategyCode;
    fortuneResult.conditionCode = consistent.conditionCode;
    fortuneResult.avoidCode = consistent.avoidCode;
    fortuneResult.styleCode = consistent.styleCode;
    fortuneResult.bodyPartCode = consistent.bodyPartCode;
    fortuneResult.preCode = consistent.preCode;
    fortuneResult.postCode = consistent.postCode;
    fortuneResult.headlineCode = consistent.headlineCode;
    fortuneResult.oneLinerCode = consistent.oneLinerCode;
    fortuneResult.scoreStars = consistent.scoreStars;
    fortuneResult.fortune.keyword = consistent.keywordCode;
    fortuneResult.fortune.scoreStars = consistent.scoreStars;
    fortuneResult.fortune.coreTheme = chart.coreTheme;

    const kw = labelForCode(catalog, 'keyword', consistent.keywordCode);
    fortuneResult.fortune.keywordTitle = kw.title;

    const headline = labelForCode(catalog, 'headline', consistent.headlineCode);
    fortuneResult.fortune.title = headline.title;
    fortuneResult.fortune.headline = headline.body || headline.title;

    const strategy = labelForCode(catalog, 'strategy', consistent.strategyCode);
    const style = labelForCode(catalog, 'style', consistent.styleCode);
    const condition = labelForCode(catalog, 'condition', consistent.conditionCode);
    fortuneResult.fortune.strategyLabels = [
      strategy.title,
      style.title,
      condition.title,
    ].filter(Boolean);

    const oneLiner = labelForCode(catalog, 'one_liner', consistent.oneLinerCode);
    fortuneResult.fortune.oneLiner = oneLiner.title;
    fortuneResult.fortune.oneLinerDetail = oneLiner.body || undefined;

    scores = consistent.scores;
    const recommendation = buildRecommendation(
      fortuneResult,
      analysis,
      catalog,
      chart.coreTheme
    );

    const response: TodayFortuneResponse = {
      date: dateKey,
      status: 'ready',
      mode,
      fortune: fortuneResult.fortune,
      scores,
      recommendation,
      dataAnalysis: analysis,
      narrative: chart.narrative,
      traditionalDetail: chart.traditionalDetail,
      engineVersion: chart.engineVersion,
    };

    cache.set(cacheKey, response);
    return response;
  },
};
