import type {
  PointAwardResult,
  PointPolicy,
  PowerBoxClaimResult,
  PowerBoxStatus,
} from '@machinefit/shared';
import { pointsRepository } from '../repositories/points.repository.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middlewares/error.middleware.js';

export type AwardPointsInput = {
  userId: string;
  actionCode: string;
  referenceType?: string | null;
  referenceId?: string | null;
  /** Override auto idempotency key when needed */
  idempotencyKey?: string;
  description?: string;
  /** When set, award this amount instead of policy.points (server-side random rewards). */
  pointsOverride?: number;
};

export function buildIdempotencyKey(input: AwardPointsInput): string {
  if (input.idempotencyKey?.trim()) return input.idempotencyKey.trim().slice(0, 200);
  const refType = input.referenceType?.trim() || 'none';
  const refId = input.referenceId?.trim() || 'none';
  return `${input.actionCode}:${refType}:${refId}`.slice(0, 200);
}

export function policyInWindow(policy: PointPolicy, now = new Date()): boolean {
  if (policy.startAt && new Date(policy.startAt) > now) return false;
  if (policy.endAt && new Date(policy.endAt) < now) return false;
  return true;
}

function seoulDateKey(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Instant of next Asia/Seoul midnight after the given Seoul calendar day. */
function nextSeoulDayStartIso(rewardDate: string): string {
  const nextDay = shiftDateKey(rewardDate, 1);
  return new Date(`${nextDay}T00:00:00+09:00`).toISOString();
}

function randomPowerBoxPoints(): number {
  return 1 + Math.floor(Math.random() * 100);
}

export const pointsService = {
  listPolicies() {
    return pointsRepository.listPolicies();
  },

  getSummary(userId: string) {
    return pointsRepository.getSummary(userId);
  },

  listTransactions(userId: string, limit: number, offset: number) {
    return pointsRepository.listTransactions(userId, limit, offset);
  },

  async updatePolicy(id: string, patch: Parameters<typeof pointsRepository.updatePolicy>[1]) {
    const updated = await pointsRepository.updatePolicy(id, patch);
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Point policy not found');
    return updated;
  },

  async adminAdjust(input: {
    userId: string;
    points: number;
    direction: 'grant' | 'deduct';
    description: string;
    adminId: string;
  }) {
    const result = await pointsRepository.applyAdminAdjust(input);
    if (!result) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Unable to adjust points (insufficient balance?)');
    }
    return result;
  },

  async award(input: AwardPointsInput): Promise<PointAwardResult> {
    const policy = await pointsRepository.getPolicyByCode(input.actionCode);
    if (!policy || !policy.enabled) {
      return { awarded: false, points: 0, balance: 0, reason: 'DISABLED' };
    }
    if (!policyInWindow(policy)) {
      return { awarded: false, points: 0, balance: 0, reason: 'OUT_OF_WINDOW' };
    }

    const points =
      input.pointsOverride != null
        ? Math.max(0, Math.floor(Number(input.pointsOverride)))
        : policy.points;

    if (points <= 0) {
      const summary = await pointsRepository.getSummary(input.userId);
      return {
        awarded: false,
        points: 0,
        balance: summary.balance,
        reason: 'ZERO_POINTS',
      };
    }

    const idempotencyKey = buildIdempotencyKey(input);
    const applied = await pointsRepository.applyEarn({
      userId: input.userId,
      actionCode: input.actionCode,
      points,
      description: input.description?.trim() || policy.actionName,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      idempotencyKey,
      dailyLimit: policy.dailyLimit,
      userLimit: policy.userLimit,
      cooldownSeconds: policy.cooldownSeconds,
    });

    if (!applied.ok) {
      return {
        awarded: false,
        points: 0,
        balance: applied.summary.balance,
        reason: applied.reason,
      };
    }

    return {
      awarded: true,
      points,
      balance: applied.summary.balance,
      reason: 'AWARDED',
      transactionId: applied.tx.id,
    };
  },

  async getPowerBoxStatus(userId: string): Promise<PowerBoxStatus> {
    const rewardDate = seoulDateKey();
    const nextAvailableAt = nextSeoulDayStartIso(rewardDate);
    const policy = await pointsRepository.getPolicyByCode('power_box_claim');
    const enabled = Boolean(policy?.enabled && policyInWindow(policy));
    const todayCount = await pointsRepository.countEarnToday(userId, 'power_box_claim');
    const claimedToday = todayCount > 0;
    let lastRewardPower: number | null = null;
    if (claimedToday) {
      const last = await pointsRepository.getLastEarnToday(userId, 'power_box_claim');
      lastRewardPower = last?.points ?? null;
    }
    return {
      available: enabled && !claimedToday,
      claimedToday,
      rewardDate,
      nextAvailableAt,
      lastRewardPower,
    };
  },

  async claimPowerBox(userId: string): Promise<PowerBoxClaimResult> {
    const rewardDate = seoulDateKey();
    const nextAvailableAt = nextSeoulDayStartIso(rewardDate);
    const points = randomPowerBoxPoints();
    const result = await this.award({
      userId,
      actionCode: 'power_box_claim',
      referenceType: 'day',
      referenceId: rewardDate,
      idempotencyKey: `power_box_claim:day:${rewardDate}`,
      description: `파워박스 +${points}Power`,
      pointsOverride: points,
    });

    return {
      awarded: result.awarded,
      points: result.awarded ? result.points : 0,
      balance: result.balance,
      rewardDate,
      nextAvailableAt,
      reason: result.reason,
      transactionId: result.transactionId,
    };
  },
};

/** Fire-and-forget — never throws to callers (core UX must not fail). */
export function awardPointsSafe(input: AwardPointsInput): void {
  if (!input.userId || !input.actionCode) return;
  void pointsService.award(input).catch((err) => {
    logger.warn('points.award failed', {
      err: String(err),
      userId: input.userId,
      actionCode: input.actionCode,
    });
  });
}
