import {
  LIFTED_BADGES,
  buildBadgeProgress,
  buildHeadline,
  buildHeadlineSuffix,
  computePerformedTotalWeightKg,
  pickFunLine,
  selectTopComparisons,
  type LiftedRankingBoard,
  type LiftedRankingPeriod,
  type LiftedScopeMode,
  type LiftedWeightSnapshot,
} from '@machinefit/shared';
import { liftedVolumeRepository } from '../repositories/lifted-volume.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { userGymRepository } from '../repositories/user-gym.repository.js';
import { gymScopeService } from './gym-scope.service.js';
import { AppError } from '../middlewares/error.middleware.js';
import { getPool } from '../config/database.js';
import {
  resolveWorkoutLoadContexts,
  type WorkoutLoadContext,
} from './workout-load.service.js';
import {
  parseCompletedArray,
  parseWeightArray,
  performedVolumeFromLog,
  seoulMonthKey,
  seoulYearKey,
} from '../utils/mypage-workout-metrics.js';

function monthKey(logDate: string): string {
  return logDate.slice(0, 7);
}

function yearKey(logDate: string): string {
  return logDate.slice(0, 4);
}

function volumeFromWeights(
  weights: number[],
  completed?: boolean[] | null,
  load?: WorkoutLoadContext | null,
  sets?: number | null
): number {
  return computePerformedTotalWeightKg({
    setWeightsKg: weights,
    setCompleted: completed,
    sets: sets ?? weights.length,
    adjustedWeight: load?.adjustedWeight,
    recommendedWeight: load?.recommendedWeight,
    adjustedReps: load?.adjustedReps,
    recommendedReps: load?.recommendedReps,
  });
}

/**
 * Recompute a user's total performed volume from workout_logs (My Page
 * "내가 들어올린 무게는?" source of truth). Ignores AI seed when steppers empty.
 */
async function recomputeUserTotalFromLogs(userId: string): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  const result = await pool.query<{
    id: string;
    gym_id: string;
    member_id: string;
    machine_code: string;
    log_date: string;
    set_count: number;
    set_weights_kg: number[] | string;
    set_completed: boolean[] | string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT wl.id::text,
            wl.gym_id::text,
            wl.member_id::text,
            m.code AS machine_code,
            wl.log_date::text,
            wl.set_count,
            wl.set_weights_kg,
            wl.set_completed,
            wl.created_at::text,
            wl.updated_at::text
     FROM workout_logs wl
     JOIN machines m ON m.id = wl.machine_id
     WHERE wl.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    await liftedVolumeRepository.setTotal('user', userId, 0);
    return 0;
  }

  const asWorkoutLogs = result.rows.map((row) => ({
    id: row.id,
    gymId: row.gym_id,
    memberId: row.member_id,
    machineCode: row.machine_code,
    logDate: row.log_date.slice(0, 10),
    setCount: row.set_count,
    setWeightsKg: parseWeightArray(row.set_weights_kg),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const loadById = await resolveWorkoutLoadContexts(userId, asWorkoutLogs);

  let total = 0;
  for (const row of result.rows) {
    const load = loadById.get(row.id);
    total += performedVolumeFromLog({
      setWeightsKg: parseWeightArray(row.set_weights_kg),
      setCompleted: parseCompletedArray(row.set_completed),
      setCount: row.set_count,
      adjustedWeight: load?.adjustedWeight,
      recommendedWeight: load?.recommendedWeight,
      adjustedReps: load?.adjustedReps,
      recommendedReps: load?.recommendedReps,
    });
  }

  const rounded = Math.round(total * 100) / 100;
  await liftedVolumeRepository.setTotal('user', userId, rounded);
  return rounded;
}

async function listScopedUserTotals(
  scope: 'user_gym' | 'user_month' | 'user_year',
  likePattern: string,
  limit: number
): Promise<{ userId: string; totalKg: number }[]> {
  const pool = getPool();
  if (!pool) return [];
  const result = await pool.query<{ scope_id: string; total_kg: string }>(
    `SELECT scope_id, total_kg::text
     FROM lifted_volume_totals
     WHERE scope = $1
       AND scope_id LIKE $2
       AND total_kg > 0
     ORDER BY total_kg DESC
     LIMIT $3`,
    [scope, likePattern, limit]
  );
  return result.rows.map((r) => ({
    userId: r.scope_id.split('|')[0]!,
    totalKg: parseFloat(r.total_kg) || 0,
  }));
}

export const liftedVolumeService = {
  async applyLogDelta(options: {
    userId: string;
    gymId: string;
    logDate: string;
    previousWeights: number[];
    previousCompleted?: boolean[] | null;
    nextWeights: number[];
    nextCompleted?: boolean[] | null;
    previousSets?: number | null;
    nextSets?: number | null;
    previousLoad?: WorkoutLoadContext | null;
    nextLoad?: WorkoutLoadContext | null;
  }): Promise<void> {
    const prev = volumeFromWeights(
      options.previousWeights,
      options.previousCompleted,
      options.previousLoad,
      options.previousSets
    );
    const next = volumeFromWeights(
      options.nextWeights,
      options.nextCompleted,
      options.nextLoad,
      options.nextSets
    );
    const delta = Math.round((next - prev) * 100) / 100;
    if (delta === 0) return;

    const month = monthKey(options.logDate);
    const year = yearKey(options.logDate);

    await liftedVolumeRepository.applyDelta([
      { scope: 'global', scopeId: '', deltaKg: delta },
      { scope: 'gym', scopeId: options.gymId, deltaKg: delta },
      { scope: 'user', scopeId: options.userId, deltaKg: delta },
      {
        scope: 'user_gym',
        scopeId: `${options.userId}|${options.gymId}`,
        deltaKg: delta,
      },
      {
        scope: 'user_month',
        scopeId: `${options.userId}|${month}`,
        deltaKg: delta,
      },
      {
        scope: 'user_year',
        scopeId: `${options.userId}|${year}`,
        deltaKg: delta,
      },
    ]);

    const userTotal = await liftedVolumeRepository.getTotal('user', options.userId);
    const earned = await liftedVolumeRepository.listEarnedBadges(options.userId);
    const newlyEarned = LIFTED_BADGES.filter(
      (b) => userTotal >= b.thresholdKg && !earned.includes(b.id)
    ).map((b) => b.id);
    if (newlyEarned.length) {
      await liftedVolumeRepository.awardBadges(options.userId, newlyEarned);
    }
  },

  async getSnapshot(options: {
    userId: string;
    mode: LiftedScopeMode;
    gymId?: string;
    locale?: string;
  }): Promise<LiftedWeightSnapshot> {
    const locale = options.locale ?? 'ko';
    let totalKg = 0;
    let labelName = 'MachineFit';

    if (options.mode === 'global') {
      totalKg = await liftedVolumeRepository.getTotal('global', '');
      labelName = 'MachineFit';
    } else if (options.mode === 'gym') {
      const gymId = options.gymId;
      if (!gymId) throw new AppError(400, 'VALIDATION_ERROR', 'gymId is required');
      await gymScopeService.assertOwned(options.userId, gymId);
      const gym = await userGymRepository.findByIdForUser(options.userId, gymId);
      labelName = gym?.name?.trim() || (locale.startsWith('ko') ? '헬스장' : 'Gym');
      totalKg = await liftedVolumeRepository.getTotal('gym', gymId);
    } else {
      const user = await userRepository.findById(options.userId);
      labelName = user?.displayName?.trim() || (locale.startsWith('ko') ? '회원' : 'Member');
      // Always reconcile from actual logged set weights (not stale aggregate / AI seed).
      totalKg = await recomputeUserTotalFromLogs(options.userId);
    }

    const userKg =
      options.mode === 'user'
        ? totalKg
        : await recomputeUserTotalFromLogs(options.userId);
    const earned = await liftedVolumeRepository.listEarnedBadges(options.userId);
    const badgeProgress = buildBadgeProgress(userKg, earned);

    const seed = `${options.mode}:${options.gymId ?? ''}:${Math.floor(totalKg)}`;
    return {
      mode: options.mode,
      totalKg,
      labelName,
      headline: `${buildHeadline(options.mode, labelName, locale)} ${buildHeadlineSuffix(locale)}`,
      funLine: pickFunLine(locale, seed),
      comparisons: selectTopComparisons(totalKg, locale, 5, seed),
      badgeProgress,
    };
  },

  async getRankings(options: {
    userId: string;
    board: LiftedRankingBoard;
    gymId?: string;
    limit?: number;
  }) {
    const limit = options.limit ?? 100;
    let rows: { userId: string; totalKg: number }[] = [];
    let period: LiftedRankingPeriod = 'all';

    // Keep the viewer's own total fresh before ranking.
    await recomputeUserTotalFromLogs(options.userId);

    if (options.board === 'global') {
      rows = await liftedVolumeRepository.listTopUsers({ scope: 'user', limit });
    } else if (options.board === 'gym' || options.board === 'friends') {
      const gymId = options.gymId;
      if (!gymId) throw new AppError(400, 'VALIDATION_ERROR', 'gymId is required');
      await gymScopeService.assertOwned(options.userId, gymId);
      rows = await listScopedUserTotals('user_gym', `%|${gymId}`, limit);
    } else if (options.board === 'month') {
      period = 'month';
      const ym = seoulMonthKey();
      rows = await listScopedUserTotals('user_month', `%|${ym}`, limit);
    } else {
      period = 'year';
      const year = seoulYearKey();
      rows = await listScopedUserTotals('user_year', `%|${year}`, limit);
    }

    const pool = getPool();
    const names = new Map<string, string>();
    if (pool && rows.length) {
      const ids = [...new Set(rows.map((r) => r.userId))];
      const nameResult = await pool.query<{ id: string; display_name: string }>(
        `SELECT id, display_name FROM users WHERE id = ANY($1::uuid[])`,
        [ids]
      );
      for (const row of nameResult.rows) names.set(row.id, row.display_name);
    }

    return {
      board: options.board,
      period,
      gymId: options.gymId,
      items: rows.slice(0, limit).map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        displayName: names.get(row.userId) || '회원',
        totalKg: row.totalKg,
        isMe: row.userId === options.userId,
      })),
    };
  },
};
