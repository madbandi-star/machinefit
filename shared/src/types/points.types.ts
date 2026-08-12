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

export interface AdminUserPointsDetail {
  summary: UserPointsSummary;
  recent: PointTransaction[];
  email?: string | null;
  displayName?: string | null;
}
