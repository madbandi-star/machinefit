/**
 * MEMBER-only 헬창력 (Hellchang Power) 30-level ladder.
 * Single source of truth for thresholds, emoji, and titles.
 */

import { Role, ROLE_EMOJI, isRoleCode } from './roles.js';

export type HellpowerLevelDef = {
  level: number;
  /** Inclusive lower bound. */
  minScore: number;
  /** Inclusive upper bound; `null` = no upper limit. */
  maxScore: number | null;
  emoji: string;
  title: string;
};

export type HellpowerLevelInfo = HellpowerLevelDef & {
  /** Points still needed to reach the next level; `null` at max level. */
  pointsToNext: number | null;
};

/** Canonical 30-step ladder — do not duplicate thresholds elsewhere. */
export const HELLPOWER_LEVELS = [
  { level: 1, minScore: 0, maxScore: 299, emoji: '🥚', title: '알' },
  { level: 2, minScore: 300, maxScore: 699, emoji: '🐣', title: '병아리' },
  { level: 3, minScore: 700, maxScore: 1199, emoji: '🐥', title: '초보자' },
  { level: 4, minScore: 1200, maxScore: 1799, emoji: '🐤', title: '수습생' },
  { level: 5, minScore: 1800, maxScore: 2499, emoji: '💪', title: '헬린이' },
  { level: 6, minScore: 2500, maxScore: 3499, emoji: '🏋️', title: '수련생' },
  { level: 7, minScore: 3500, maxScore: 4999, emoji: '🗡️', title: '견습 전사' },
  { level: 8, minScore: 5000, maxScore: 6499, emoji: '⚔️', title: '전사' },
  { level: 9, minScore: 6500, maxScore: 8499, emoji: '🛡️', title: '기사' },
  { level: 10, minScore: 8500, maxScore: 10999, emoji: '🐴', title: '기마기사' },
  { level: 11, minScore: 11000, maxScore: 13999, emoji: '🦁', title: '용사' },
  { level: 12, minScore: 14000, maxScore: 17499, emoji: '🦅', title: '영웅' },
  { level: 13, minScore: 17500, maxScore: 20999, emoji: '🐺', title: '전투영웅' },
  { level: 14, minScore: 21000, maxScore: 24999, emoji: '🐗', title: '맹장' },
  { level: 15, minScore: 25000, maxScore: 29999, emoji: '🗿', title: '거인' },
  { level: 16, minScore: 30000, maxScore: 34999, emoji: '🦂', title: '괴수' },
  { level: 17, minScore: 35000, maxScore: 39999, emoji: '👹', title: '오우거' },
  { level: 18, minScore: 40000, maxScore: 44999, emoji: '🦍', title: '베히모스' },
  { level: 19, minScore: 45000, maxScore: 49999, emoji: '🐘', title: '맹수왕' },
  { level: 20, minScore: 50000, maxScore: 59999, emoji: '🐙', title: '심연군주' },
  { level: 21, minScore: 60000, maxScore: 69999, emoji: '🐲', title: '고룡' },
  { level: 22, minScore: 70000, maxScore: 79999, emoji: '⚡', title: '천둥의 전사' },
  { level: 23, minScore: 80000, maxScore: 89999, emoji: '☀️', title: '태양의 전사' },
  { level: 24, minScore: 90000, maxScore: 99999, emoji: '😈', title: '마신' },
  { level: 25, minScore: 100000, maxScore: 119999, emoji: '👺', title: '사신' },
  { level: 26, minScore: 120000, maxScore: 139999, emoji: '👾', title: '재앙' },
  { level: 27, minScore: 140000, maxScore: 169999, emoji: '💀', title: '불멸자' },
  { level: 28, minScore: 170000, maxScore: 199999, emoji: '🌟', title: '성좌' },
  { level: 29, minScore: 200000, maxScore: 299999, emoji: '☄️', title: '천벌' },
  { level: 30, minScore: 300000, maxScore: null, emoji: '🌈', title: '헬창의 신' },
] as const satisfies readonly HellpowerLevelDef[];

function normalizeScore(score: number | null | undefined): number {
  if (score == null || !Number.isFinite(Number(score))) return 0;
  return Math.max(0, Math.floor(Number(score)));
}

/** Map a 헬창력 score to its level (emoji + title + points-to-next). */
export function getHellpowerLevel(score: number | null | undefined): HellpowerLevelInfo {
  const s = normalizeScore(score);
  let match: HellpowerLevelDef = HELLPOWER_LEVELS[0]!;
  for (const row of HELLPOWER_LEVELS) {
    if (s >= row.minScore) match = row;
    else break;
  }
  const next = HELLPOWER_LEVELS.find((row) => row.level === match.level + 1);
  const pointsToNext = next ? Math.max(0, next.minScore - s) : null;
  return {
    level: match.level,
    minScore: match.minScore,
    maxScore: match.maxScore,
    emoji: match.emoji,
    title: match.title,
    pointsToNext,
  };
}

/**
 * Author-line badge emoji:
 * - member → 헬창력 30단 이모지 (score defaults to 0 → 🥚)
 * - other roles → ROLE_EMOJI (premium = ⚜️, …)
 */
export function getAuthorBadgeEmoji(
  roleCode: string | null | undefined,
  hellpowerScore?: number | null
): string {
  if (roleCode === Role.MEMBER) {
    return getHellpowerLevel(hellpowerScore).emoji;
  }
  if (isRoleCode(roleCode)) return ROLE_EMOJI[roleCode];
  // Unknown role: treat as member ladder when a score was provided, else guest.
  if (hellpowerScore != null) return getHellpowerLevel(hellpowerScore).emoji;
  return ROLE_EMOJI[Role.GUEST];
}
