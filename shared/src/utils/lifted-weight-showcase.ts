import { LIFTED_COMPARISONS, LIFTED_FUN_LINES } from '../data/lifted-comparisons.js';
import { LIFTED_BADGES } from '../data/lifted-badges.js';
import type {
  LiftedBadgeDef,
  LiftedBadgeProgress,
  LiftedComparisonResult,
  LiftedScopeMode,
} from '../types/lifted-weight.types.js';

function pickLocale<T extends { ko: string; en: string }>(
  map: T,
  locale: string
): string {
  return locale.startsWith('ko') ? map.ko : map.en;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickTip(tips: string[], seed: number): string {
  if (!tips.length) return '';
  return tips[seed % tips.length]!;
}

/**
 * Pick Top N comparison cards that are fun and readable:
 * prefer counts between ~2 and ~9999, score by "interestingness".
 */
export function selectTopComparisons(
  totalKg: number,
  locale: string,
  limit = 5,
  seedKey = ''
): LiftedComparisonResult[] {
  const seed = hashSeed(`${Math.floor(totalKg)}:${seedKey}`);
  const scored = LIFTED_COMPARISONS.map((item, index) => {
    const raw = totalKg / item.weightKg;
    const count = Math.max(0, Math.floor(raw * 10) / 10);
    const displayCount = count >= 10 ? Math.floor(count) : count;
    let score = 0;
    if (displayCount >= 2 && displayCount <= 9999) score += 100;
    else if (displayCount >= 1 && displayCount < 2) score += 40;
    else if (displayCount > 9999 && displayCount <= 99999) score += 30;
    else score += 5;
    // Prefer variety of mass scales
    score += (index + seed) % 7;
    if (displayCount >= 3 && displayCount <= 500) score += 25;
    return { item, displayCount, score };
  })
    .filter((row) => row.displayCount >= 1)
    .sort((a, b) => b.score - a.score || b.displayCount - a.displayCount);

  const picked = scored.slice(0, limit);
  const lang = locale.startsWith('ko') ? 'ko' : 'en';

  return picked.map((row, i) => ({
    id: row.item.id,
    emoji: row.item.emoji,
    name: pickLocale(row.item.name, locale),
    unit: pickLocale(row.item.unit, locale),
    count: row.displayCount,
    tip: pickTip(row.item.tips[lang], seed + i * 17),
    weightKg: row.item.weightKg,
  }));
}

export function pickFunLine(locale: string, seedKey = ''): string {
  const lang = locale.startsWith('ko') ? 'ko' : 'en';
  const lines = LIFTED_FUN_LINES[lang];
  const seed = hashSeed(seedKey || String(Date.now()));
  return lines[seed % lines.length]!;
}

export function buildBadgeProgress(
  totalKg: number,
  earnedBadgeIds: string[] = []
): LiftedBadgeProgress {
  const earned = new Set(earnedBadgeIds);
  let currentBadge: LiftedBadgeDef | null = null;
  let nextBadge: LiftedBadgeDef | null = null;

  for (const badge of LIFTED_BADGES) {
    if (totalKg >= badge.thresholdKg) {
      currentBadge = badge;
      earned.add(badge.id);
    } else if (!nextBadge) {
      nextBadge = badge;
    }
  }

  const remainingKg = nextBadge ? Math.max(0, nextBadge.thresholdKg - totalKg) : 0;
  const floor = currentBadge?.thresholdKg ?? 0;
  const ceiling = nextBadge?.thresholdKg ?? Math.max(floor, 1);
  const span = Math.max(1, ceiling - floor);
  const progressRatio = nextBadge
    ? Math.min(1, Math.max(0, (totalKg - floor) / span))
    : 1;

  return {
    currentBadge,
    nextBadge,
    currentKg: totalKg,
    remainingKg,
    progressRatio,
    earnedBadgeIds: [...earned],
  };
}

export function buildHeadline(
  mode: LiftedScopeMode,
  labelName: string,
  locale: string
): string {
  if (locale.startsWith('ko')) {
    if (mode === 'global') return 'MachineFit 회원들이';
    if (mode === 'gym') return `${labelName} 회원들이`;
    return `${labelName}님은`;
  }
  if (mode === 'global') return 'MachineFit members have';
  if (mode === 'gym') return `${labelName} members have`;
  return `${labelName} has`;
}

export function buildHeadlineSuffix(locale: string): string {
  return locale.startsWith('ko') ? '지금까지' : 'lifted a total of';
}

export function buildHeadlineClosing(locale: string): string {
  return locale.startsWith('ko') ? '를 들어올렸습니다.' : 'so far.';
}

export { LIFTED_BADGES, LIFTED_COMPARISONS, LIFTED_FUN_LINES };
