import type { PointActionCode, PointTransactionType } from '../constants/points.js';

export interface PointPolicy {
  id: string;
  actionCode: PointActionCode | string;
  actionName: string;
  points: number;
  dailyLimit: number | null;
  userLimit: number | null;
  cooldownSeconds: number;
  enabled: boolean;
  startAt: string | null;
  endAt: string | null;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPointsSummary {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
  /** MEMBER 헬창력 ladder snapshot (omitted / null for non-members). */
  hellpower?: HellpowerSummary | null;
}

export interface HellpowerSummary {
  level: number;
  title: string;
  emoji: string;
  /** Top percentile among active MEMBER balances (1–100); null if unavailable. */
  topPercent: number | null;
  /** Points needed for next level; null at max. */
  pointsToNext: number | null;
}

export interface PointTransaction {
  id: string;
  userId: string;
  transactionType: PointTransactionType;
  actionCode: string | null;
  points: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  description: string;
  idempotencyKey: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface PointAwardResult {
  awarded: boolean;
  points: number;
  balance: number;
  reason:
    | 'AWARDED'
    | 'DISABLED'
    | 'OUT_OF_WINDOW'
    | 'DAILY_LIMIT'
    | 'USER_LIMIT'
    | 'COOLDOWN'
    | 'DUPLICATE'
    | 'ZERO_POINTS'
    | 'SKIPPED';
  transactionId?: string;
}

/** My Page Power Box daily claim status (Asia/Seoul day). */
export interface PowerBoxStatus {
  available: boolean;
  claimedToday: boolean;
  rewardDate: string;
  nextAvailableAt: string;
  lastRewardPower: number | null;
}

export interface PowerBoxClaimResult {
  awarded: boolean;
  points: number;
  balance: number;
  rewardDate: string;
  nextAvailableAt: string;
  reason: PointAwardResult['reason'];
  transactionId?: string;
}

export interface AdminUserPointsDetail {
  summary: UserPointsSummary;
  recent: PointTransaction[];
  email?: string | null;
  displayName?: string | null;
}
