import type { CoreTheme } from './constants.js';
import { deriveFromTheme, clampToBand } from './derive.js';

export interface ConsistencyInput {
  coreTheme: CoreTheme;
  keywordCode: string;
  strategyCode: string;
  conditionCode: string;
  avoidCode: string;
  scoreStars: number;
  scores: {
    healthmanIndex: number;
    prLuck: number;
    recoveryLuck: number;
    volumeLuck: number;
    focusLuck: number;
    changeLuck: number;
  };
}

export interface ConsistencyResult {
  keywordCode: string;
  strategyCode: string;
  conditionCode: string;
  avoidCode: string;
  scoreStars: number;
  scores: ConsistencyInput['scores'];
  remapped: boolean;
}

function firstAllowed(allow: string[], current: string, fallback: string): string {
  if (allow.includes(current)) return current;
  return allow[0] ?? fallback;
}

/**
 * Force remap — never re-roll with RNG — so outputs stay deterministic.
 */
export function enforceFortuneConsistency(input: ConsistencyInput): ConsistencyResult {
  const { allow, bands } = deriveFromTheme(input.coreTheme);
  let remapped = false;

  let keywordCode = input.keywordCode;
  if (!allow.keywords.includes(keywordCode)) {
    keywordCode = allow.keywords[0];
    remapped = true;
  }

  let strategyCode = input.strategyCode;
  if (!allow.strategies.includes(strategyCode)) {
    strategyCode = allow.strategies[0];
    remapped = true;
  }

  let conditionCode = input.conditionCode;
  if (!allow.conditions.includes(conditionCode)) {
    conditionCode = allow.conditions[0];
    remapped = true;
  }

  let avoidCode = input.avoidCode;
  if (!allow.avoids.includes(avoidCode)) {
    avoidCode = allow.avoids[0];
    remapped = true;
  }

  let scoreStars = input.scoreStars;
  if (scoreStars < bands.stars[0] || scoreStars > bands.stars[1]) {
    scoreStars = clampToBand(scoreStars, bands.stars);
    remapped = true;
  }

  const scores = {
    healthmanIndex: clampToBand(input.scores.healthmanIndex, bands.healthman),
    prLuck: clampToBand(input.scores.prLuck, bands.prLuck),
    recoveryLuck: clampToBand(input.scores.recoveryLuck, bands.recoveryLuck),
    volumeLuck: clampToBand(input.scores.volumeLuck, bands.volumeLuck),
    focusLuck: clampToBand(input.scores.focusLuck, bands.focusLuck),
    changeLuck: clampToBand(input.scores.changeLuck, bands.changeLuck),
  };

  if (
    scores.healthmanIndex !== input.scores.healthmanIndex ||
    scores.prLuck !== input.scores.prLuck ||
    scores.recoveryLuck !== input.scores.recoveryLuck ||
    scores.volumeLuck !== input.scores.volumeLuck ||
    scores.focusLuck !== input.scores.focusLuck ||
    scores.changeLuck !== input.scores.changeLuck
  ) {
    remapped = true;
  }

  // Hard narrative guards
  if (
    input.coreTheme === 'RECOVERY_RESET' &&
    (keywordCode === 'PR_DAY' || strategyCode === 'PR_CHALLENGE')
  ) {
    keywordCode = firstAllowed(allow.keywords, 'RECOVERY_DAY', 'RECOVERY_DAY');
    strategyCode = firstAllowed(allow.strategies, 'WEIGHT_HOLD', 'WEIGHT_HOLD');
    remapped = true;
  }

  if (
    (input.coreTheme === 'EXECUTE_PUSH' || input.coreTheme === 'FOCUS_BREAKTHROUGH') &&
    keywordCode === 'RECOVERY_DAY'
  ) {
    keywordCode = firstAllowed(allow.keywords, allow.keywords[0], 'PR_DAY');
    remapped = true;
  }

  return {
    keywordCode,
    strategyCode,
    conditionCode,
    avoidCode,
    scoreStars,
    scores,
    remapped,
  };
}
