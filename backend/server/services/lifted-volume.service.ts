import {
  LIFTED_BADGES,
  buildBadgeProgress,
  buildHeadline,
  buildHeadlineSuffix,
  computeLogVolumeKg,
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

function monthKey(logDate: string): string {
  return logDate.slice(0, 7);
}

function yearKey(logDate: string): string {
  return logDate.slice(0, 4);
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
  }): Promise<void> {
    const prev = computeLogVolumeKg(options.previousWeights, options.previousCompleted);
    const next = computeLogVolumeKg(options.nextWeights, options.nextCompleted);
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
      totalKg = await liftedVolumeRepository.getTotal('user', options.userId);
    }

    const userKg =
      options.mode === 'user'
        ? totalKg
        : await liftedVolumeRepository.getTotal('user', options.userId);
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

    if (options.board === 'global') {
      rows = await liftedVolumeRepository.listTopUsers({ scope: 'user', limit });
    } else if (options.board === 'gym' || options.board === 'friends') {
      const gymId = options.gymId;
      if (!gymId) throw new AppError(400, 'VALIDATION_ERROR', 'gymId is required');
      await gymScopeService.assertOwned(options.userId, gymId);
      rows = await listScopedUserTotals('user_gym', `%|${gymId}`, limit);
    } else if (options.board === 'month') {
      period = 'month';
      const ym = new Date().toISOString().slice(0, 7);
      rows = await listScopedUserTotals('user_month', `%|${ym}`, limit);
    } else {
      period = 'year';
      const year = String(new Date().getFullYear());
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
