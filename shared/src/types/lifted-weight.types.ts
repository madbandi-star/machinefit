export type LiftedLocaleText = { ko: string; en: string };

export interface LiftedComparisonItem {
  id: string;
  emoji: string;
  weightKg: number;
  name: LiftedLocaleText;
  unit: LiftedLocaleText;
  tips: { ko: string[]; en: string[] };
}

export interface LiftedBadgeDef {
  id: string;
  emoji: string;
  thresholdKg: number;
  name: LiftedLocaleText;
  description: LiftedLocaleText;
}

export type LiftedScopeMode = 'global' | 'gym' | 'user';

export type LiftedRankingPeriod = 'all' | 'month' | 'year';

export type LiftedRankingBoard = 'global' | 'gym' | 'friends' | 'month' | 'year';

export interface LiftedComparisonResult {
  id: string;
  emoji: string;
  name: string;
  unit: string;
  count: number;
  tip: string;
  weightKg: number;
}

export interface LiftedBadgeProgress {
  currentBadge: LiftedBadgeDef | null;
  nextBadge: LiftedBadgeDef | null;
  currentKg: number;
  remainingKg: number;
  progressRatio: number;
  earnedBadgeIds: string[];
}

export interface LiftedWeightSnapshot {
  mode: LiftedScopeMode;
  totalKg: number;
  labelName: string;
  headline: string;
  funLine: string;
  comparisons: LiftedComparisonResult[];
  badgeProgress: LiftedBadgeProgress;
  updatedAt?: string;
}

export interface LiftedRankingEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalKg: number;
  isMe?: boolean;
}

export interface LiftedRankingResponse {
  board: LiftedRankingBoard;
  period: LiftedRankingPeriod;
  gymId?: string;
  items: LiftedRankingEntry[];
}
