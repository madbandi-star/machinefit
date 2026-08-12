import type { CoreTheme } from './constants.js';
import { deriveFromTheme, clampToBand } from './derive.js';

export interface ConsistencyInput {
  coreTheme: CoreTheme;
  keywordCode: string;
  strategyCode: string;
  conditionCode: string;
  avoidCode: string;
  styleCode: string;
  bodyPartCode: string;
  preCode: string;
  postCode: string;
  headlineCode: string;
  oneLinerCode: string;
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
  styleCode: string;
  bodyPartCode: string;
  preCode: string;
  postCode: string;
  headlineCode: string;
  oneLinerCode: string;
  scoreStars: number;
  scores: ConsistencyInput['scores'];
  remapped: boolean;
}

function clampCode(allow: string[], current: string, fallback: string): string {
  if (allow.includes(current)) return current;
  return allow[0] ?? fallback;
}

/**
 * Force remap — never re-roll with RNG — so outputs stay deterministic
 * and every narrative field stays inside the same core theme pack.
 */
export function enforceFortuneConsistency(input: ConsistencyInput): ConsistencyResult {
  const { allow, bands } = deriveFromTheme(input.coreTheme);
  let remapped = false;

  const track = (next: string, prev: string): string => {
    if (next !== prev) remapped = true;
    return next;
  };

  let keywordCode = track(
    clampCode(allow.keywords, input.keywordCode, 'CONTROL_DAY'),
    input.keywordCode
  );
  let strategyCode = track(
    clampCode(allow.strategies, input.strategyCode, 'WEIGHT_HOLD'),
    input.strategyCode
  );
  let conditionCode = track(
    clampCode(allow.conditions, input.conditionCode, 'NORMAL'),
    input.conditionCode
  );
  let avoidCode = track(
    clampCode(allow.avoids, input.avoidCode, 'HEAVY_EGO'),
    input.avoidCode
  );
  let styleCode = track(
    clampCode(allow.styles, input.styleCode, 'DUMBBELL'),
    input.styleCode
  );
  let bodyPartCode = track(
    clampCode(allow.bodyParts, input.bodyPartCode, 'FULL_BODY'),
    input.bodyPartCode
  );
  let preCode = track(
    clampCode(allow.pre, input.preCode, 'PREP_SETS'),
    input.preCode
  );
  let postCode = track(
    clampCode(allow.post, input.postCode, 'STRETCH'),
    input.postCode
  );
  let headlineCode = track(
    clampCode(allow.headlines, input.headlineCode, allow.headlines[0] ?? 'CONTROL_FOCUS'),
    input.headlineCode
  );
  let oneLinerCode = track(
    clampCode(allow.oneLiners, input.oneLinerCode, allow.oneLiners[0] ?? 'PREP_WINS'),
    input.oneLinerCode
  );

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

  // Hard narrative guards — recovery themes must never push PR language.
  if (
    input.coreTheme === 'RECOVERY_RESET' &&
    (keywordCode === 'PR_DAY' || strategyCode === 'PR_CHALLENGE')
  ) {
    keywordCode = clampCode(allow.keywords, 'RECOVERY_DAY', 'RECOVERY_DAY');
    strategyCode = clampCode(allow.strategies, 'WEIGHT_HOLD', 'WEIGHT_HOLD');
    remapped = true;
  }

  if (
    (input.coreTheme === 'EXECUTE_PUSH' || input.coreTheme === 'FOCUS_BREAKTHROUGH') &&
    (keywordCode === 'RECOVERY_DAY' || conditionCode === 'REST')
  ) {
    keywordCode = clampCode(allow.keywords, allow.keywords[0], 'PR_DAY');
    conditionCode = clampCode(allow.conditions, 'NORMAL', 'NORMAL');
    remapped = true;
  }

  // Body-part keywords should match body recommendation when both are specific.
  const keywordBody: Record<string, string> = {
    LEG_DAY: 'LEGS',
    CHEST_DAY: 'CHEST',
    BACK_DAY: 'BACK',
  };
  const forcedBody = keywordBody[keywordCode];
  if (forcedBody && allow.bodyParts.includes(forcedBody) && bodyPartCode !== forcedBody) {
    bodyPartCode = forcedBody;
    remapped = true;
  }

  return {
    keywordCode,
    strategyCode,
    conditionCode,
    avoidCode,
    styleCode,
    bodyPartCode,
    preCode,
    postCode,
    headlineCode,
    oneLinerCode,
    scoreStars,
    scores,
    remapped,
  };
}
