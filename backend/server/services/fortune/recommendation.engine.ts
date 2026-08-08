import type {
  FortuneCta,
  FortuneDataAnalysis,
  FortuneRecommendation,
  FortuneScores,
} from '@machinefit/shared';
import type { FortuneEngineResult } from './fortune.engine.js';
import { labelForCode } from './fortune.engine.js';
import type { FortuneContentItem } from '@machinefit/shared';

const MUSCLE_TO_QUERY: Record<string, string> = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  LEGS: 'legs',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  CORE: 'core',
  FULL_BODY: '',
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function computeFortuneScores(
  fortune: FortuneEngineResult,
  analysis: FortuneDataAnalysis
): FortuneScores {
  let healthman = fortune.baseHealthman + fortune.scoreStars * 2;
  let prLuck = fortune.basePrLuck;
  let recoveryLuck = fortune.baseRecoveryLuck;

  // Analytics adjustments (not medical).
  if (analysis.workoutCount7d >= 4) {
    recoveryLuck -= 12;
    healthman += 4;
  } else if (analysis.workoutCount7d <= 1 && analysis.logCount30d > 0) {
    recoveryLuck += 10;
  }
  if (analysis.consecutiveDays >= 4) {
    recoveryLuck -= 18;
    prLuck -= 10;
  }
  if (analysis.daysSincePr != null && analysis.daysSincePr >= 10) {
    prLuck += 12;
  } else if (analysis.daysSincePr != null && analysis.daysSincePr <= 2) {
    prLuck -= 8;
  }
  if (analysis.personalizationTier === 'none') {
    // Keep seed-ish mid scores for new users.
    healthman = clamp((healthman + 70) / 2, 50, 88);
  }

  if (fortune.keywordCode === 'PR_DAY') prLuck += 8;
  if (fortune.keywordCode === 'RECOVERY_DAY') {
    recoveryLuck += 15;
    prLuck -= 10;
  }

  return {
    healthmanIndex: clamp(healthman, 20, 99),
    prLuck: clamp(prLuck, 15, 99),
    recoveryLuck: clamp(recoveryLuck, 10, 99),
  };
}

export function buildRecommendation(
  fortune: FortuneEngineResult,
  analysis: FortuneDataAnalysis,
  catalog: FortuneContentItem[]
): FortuneRecommendation {
  // Data-driven style nudge (separate from fortune style pick).
  let styleCode = fortune.styleCode;
  if (analysis.personalizationTier !== 'none' && analysis.logCount30d >= 7) {
    if (analysis.barbellRatio30d >= 50 && analysis.dumbbellRatio30d < 25) {
      styleCode = 'DUMBBELL';
    } else if (analysis.machineRatio30d >= 55) {
      styleCode = analysis.dumbbellRatio30d < analysis.barbellRatio30d ? 'DUMBBELL' : 'FREE_WEIGHT';
    } else if (analysis.dumbbellRatio30d >= 50) {
      styleCode = 'BARBELL';
    }
  }

  let bodyPartCode = fortune.bodyPartCode;
  if (analysis.lowMuscleGroup) {
    const map: Record<string, string> = {
      chest: 'CHEST',
      back: 'BACK',
      shoulders: 'SHOULDERS',
      legs: 'LEGS',
      quads: 'LEGS',
      hamstrings: 'LEGS',
      glutes: 'LEGS',
      biceps: 'BICEPS',
      triceps: 'TRICEPS',
      core: 'CORE',
      abs: 'CORE',
    };
    const mapped = map[analysis.lowMuscleGroup.toLowerCase()];
    if (mapped) bodyPartCode = mapped;
  }

  let strategyCode = fortune.strategyCode;
  if (analysis.consecutiveDays >= 4) {
    strategyCode = 'WEIGHT_HOLD';
  } else if (
    fortune.keywordCode === 'PR_DAY' ||
    (analysis.daysSincePr != null && analysis.daysSincePr >= 12)
  ) {
    strategyCode = 'PR_CHALLENGE';
  }

  const style = labelForCode(catalog, 'style', styleCode);
  const strategy = labelForCode(catalog, 'strategy', strategyCode);
  const avoid = labelForCode(catalog, 'avoid', fortune.avoidCode);
  const pre = labelForCode(catalog, 'pre_workout', fortune.preCode);
  const post = labelForCode(catalog, 'post_workout', fortune.postCode);
  const body = labelForCode(catalog, 'body_part', bodyPartCode);
  const condition = labelForCode(catalog, 'condition', fortune.conditionCode);

  const muscleQ = MUSCLE_TO_QUERY[bodyPartCode] ?? '';
  const ctas: FortuneCta[] = [
    {
      kind: 'records',
      labelKey: 'cta.records',
      href: '/records?tab=history',
    },
  ];
  if (styleCode === 'DUMBBELL') {
    ctas.push({
      kind: 'machines',
      labelKey: 'cta.dumbbell',
      href: '/machines?q=dumbbell',
    });
  } else if (styleCode === 'BARBELL') {
    ctas.push({
      kind: 'machines',
      labelKey: 'cta.barbell',
      href: '/machines?q=barbell',
    });
  } else {
    ctas.push({
      kind: 'machines',
      labelKey: 'cta.machines',
      href: muscleQ ? `/machines?muscle=${encodeURIComponent(muscleQ)}` : '/machines',
    });
  }
  if (strategyCode === 'PR_CHALLENGE' || fortune.keywordCode === 'PR_DAY') {
    ctas.push({
      kind: 'pr',
      labelKey: 'cta.pr',
      href: '/my-page/achievements',
    });
  }

  return {
    bodyPart: bodyPartCode,
    bodyPartLabel: body.title,
    style: styleCode,
    styleLabel: style.title,
    strategy: strategyCode,
    strategyLabel: strategy.title,
    avoid: fortune.avoidCode,
    avoidLabel: avoid.title,
    preWorkout: fortune.preCode,
    preWorkoutBody: pre.body || pre.title,
    postWorkout: fortune.postCode,
    postWorkoutBody: post.body || post.title,
    condition: fortune.conditionCode,
    conditionLabel: condition.title,
    ctas,
  };
}
