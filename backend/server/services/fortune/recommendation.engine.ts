import type {
  CoreTheme,
  FortuneCta,
  FortuneDataAnalysis,
  FortuneRecommendation,
  FortuneScores,
  ThemeDerivation,
} from '@machinefit/shared';
import { clampToBand, deriveFromTheme } from '@machinefit/shared';
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

function inAllow(code: string, allow: string[]): boolean {
  return allow.includes(code);
}

export function computeFortuneScores(
  fortune: FortuneEngineResult,
  analysis: FortuneDataAnalysis,
  theme?: CoreTheme
): FortuneScores {
  const derivation: ThemeDerivation = deriveFromTheme(
    theme ?? fortune.coreTheme
  );
  let healthman = fortune.baseHealthman + fortune.scoreStars * 2;
  let prLuck = fortune.basePrLuck;
  let recoveryLuck = fortune.baseRecoveryLuck;
  let volumeLuck = fortune.baseVolumeLuck;
  let focusLuck = fortune.baseFocusLuck;
  let changeLuck = fortune.baseChangeLuck;

  // Soft analytics — never intended to invert theme bands (clamped after).
  if (analysis.workoutCount7d >= 4) {
    recoveryLuck -= 6;
    healthman += 2;
  } else if (analysis.workoutCount7d <= 1 && analysis.logCount30d > 0) {
    recoveryLuck += 5;
  }
  if (analysis.consecutiveDays >= 4) {
    recoveryLuck -= 8;
    prLuck -= 5;
    volumeLuck -= 4;
  }
  if (analysis.daysSincePr != null && analysis.daysSincePr >= 10) {
    prLuck += 6;
  } else if (analysis.daysSincePr != null && analysis.daysSincePr <= 2) {
    prLuck -= 4;
  }
  if (analysis.personalizationTier === 'none') {
    healthman = clamp((healthman + 70) / 2, 50, 88);
  }

  if (fortune.keywordCode === 'PR_DAY') prLuck += 4;
  if (fortune.keywordCode === 'RECOVERY_DAY') {
    recoveryLuck += 8;
    prLuck -= 6;
  }
  if (fortune.keywordCode === 'VOLUME_DAY') volumeLuck += 5;
  if (fortune.keywordCode === 'CONTROL_DAY') focusLuck += 4;
  if (
    fortune.keywordCode === 'DUMBBELL_DAY' ||
    fortune.keywordCode === 'SUPER_SET_DAY'
  ) {
    changeLuck += 5;
  }

  return {
    healthmanIndex: clampToBand(healthman, derivation.bands.healthman),
    prLuck: clampToBand(prLuck, derivation.bands.prLuck),
    recoveryLuck: clampToBand(recoveryLuck, derivation.bands.recoveryLuck),
    volumeLuck: clampToBand(volumeLuck, derivation.bands.volumeLuck),
    focusLuck: clampToBand(focusLuck, derivation.bands.focusLuck),
    changeLuck: clampToBand(changeLuck, derivation.bands.changeLuck),
  };
}

export function buildRecommendation(
  fortune: FortuneEngineResult,
  analysis: FortuneDataAnalysis,
  catalog: FortuneContentItem[],
  theme?: CoreTheme
): FortuneRecommendation {
  const allow = deriveFromTheme(theme ?? fortune.coreTheme).allow;

  // Data-driven style nudge — only if still in theme allow-list.
  let styleCode = fortune.styleCode;
  if (analysis.personalizationTier !== 'none' && analysis.logCount30d >= 7) {
    let nudged = styleCode;
    if (analysis.barbellRatio30d >= 50 && analysis.dumbbellRatio30d < 25) {
      nudged = 'DUMBBELL';
    } else if (analysis.machineRatio30d >= 55) {
      nudged =
        analysis.dumbbellRatio30d < analysis.barbellRatio30d
          ? 'DUMBBELL'
          : 'FREE_WEIGHT';
    } else if (analysis.dumbbellRatio30d >= 50) {
      nudged = 'BARBELL';
    }
    if (inAllow(nudged, allow.styles)) styleCode = nudged;
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
    if (mapped && inAllow(mapped, allow.bodyParts)) bodyPartCode = mapped;
  }

  // Strategy stays theme-bound. Consecutive-day soft nudge only if allowed.
  let strategyCode = fortune.strategyCode;
  if (
    analysis.consecutiveDays >= 4 &&
    inAllow('WEIGHT_HOLD', allow.strategies)
  ) {
    strategyCode = 'WEIGHT_HOLD';
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
      href: muscleQ
        ? `/machines?muscle=${encodeURIComponent(muscleQ)}`
        : '/machines',
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
