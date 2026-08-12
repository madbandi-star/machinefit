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

/**
 * Luck scores stay inside theme bands.
 * Soft analytics nudges are intentionally tiny and never rewrite narrative codes —
 * workout history belongs in dataAnalysis / apply section, not fortune picks.
 */
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

  // Tiny display polish only — clamped to theme bands afterward.
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

/**
 * Recommendation is pure fortune (theme pack). Do not rewrite style / body /
 * strategy from workout ratios — that mixed “운세” with “데이터 처방”.
 */
export function buildRecommendation(
  fortune: FortuneEngineResult,
  _analysis: FortuneDataAnalysis,
  catalog: FortuneContentItem[],
  theme?: CoreTheme
): FortuneRecommendation {
  void theme;
  const styleCode = fortune.styleCode;
  const bodyPartCode = fortune.bodyPartCode;
  const strategyCode = fortune.strategyCode;

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
