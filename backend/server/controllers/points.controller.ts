import type { Request, Response } from 'express';
import {
  adminPointAdjustSchema,
  pointClientTrackSchema,
  pointLedgerQuerySchema,
  pointPolicyUpdateSchema,
} from '@machinefit/shared';
import { pointsService } from '../services/points.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function getMyPoints(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const summary = await pointsService.getSummary(req.user.userId);
  res.json({ success: true, data: summary });
}

export async function getMyLedger(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const query = pointLedgerQuerySchema.parse(req.query);
  const items = await pointsService.listTransactions(
    req.user.userId,
    query.limit,
    query.offset
  );
  res.json({ success: true, data: { items, limit: query.limit, offset: query.offset } });
}

/** Ladder + percentile for a given 헬창력 score (author badge popover). */
export async function getHellpowerLookup(req: Request, res: Response): Promise<void> {
  const score = Number(req.query.score ?? 0);
  if (!Number.isFinite(score) || score < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'score must be a non-negative number');
  }
  const data = await pointsService.hellpowerLookup(score);
  res.json({ success: true, data });
}

export async function trackClientAction(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = pointClientTrackSchema.parse(req.body);
  const seoulDay = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const result = await pointsService.award({
    userId: req.user.userId,
    actionCode: body.actionCode,
    referenceType: body.referenceType ?? body.actionCode,
    referenceId: body.referenceId?.trim() || seoulDay,
    // Detail: once per machine per day. Search: cooldown slot (policy cooldown enforces spacing).
    idempotencyKey:
      body.actionCode === 'machine_detail_view' && body.referenceId
        ? `machine_detail_view:machine:${body.referenceId}:${seoulDay}`
        : body.actionCode === 'machine_search'
          ? `machine_search:${req.user.userId}:slot:${Math.floor(Date.now() / 10_000)}`
          : undefined,
  });
  res.json({ success: true, data: result });
}

export async function getPowerBoxStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await pointsService.getPowerBoxStatus(req.user.userId);
  res.json({ success: true, data });
}

export async function claimPowerBox(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const data = await pointsService.claimPowerBox(req.user.userId);
  res.json({ success: true, data });
}

export async function adminListPolicies(_req: Request, res: Response): Promise<void> {
  const data = await pointsService.listPolicies();
  res.json({ success: true, data });
}

export async function adminUpdatePolicy(req: Request, res: Response): Promise<void> {
  const id = String(req.params.policyId || '');
  const body = pointPolicyUpdateSchema.parse(req.body);
  const data = await pointsService.updatePolicy(id, body);
  res.json({ success: true, data });
}

export async function adminGetUserPoints(req: Request, res: Response): Promise<void> {
  const userId = String(req.params.userId || '');
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  const summary = await pointsService.getSummary(userId);
  const recent = await pointsService.listTransactions(userId, 50, 0);
  res.json({
    success: true,
    data: {
      summary,
      recent,
      email: null,
      displayName: user.displayName,
    },
  });
}

export async function adminAdjustPoints(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  const body = adminPointAdjustSchema.parse(req.body);
  const result = await pointsService.adminAdjust({
    userId: body.userId,
    points: body.points,
    direction: body.direction,
    description: body.description,
    adminId: req.user.userId,
  });
  res.json({ success: true, data: result });
}

export async function adminListUsersWithPoints(req: Request, res: Response): Promise<void> {
  const q = String(req.query.q || '').trim();
  const pool = (await import('../config/database.js')).getPool();
  if (!pool) {
    res.json({ success: true, data: [] });
    return;
  }
  const { rows } = await pool.query<{
    user_id: string;
    display_name: string | null;
    balance: number;
    lifetime_earned: number;
    lifetime_spent: number;
    updated_at: Date;
  }>(
    `SELECT up.user_id, u.display_name, up.balance, up.lifetime_earned, up.lifetime_spent, up.updated_at
     FROM user_points up
     JOIN users u ON u.id = up.user_id
     WHERE ($1 = '' OR u.display_name ILIKE '%' || $1 || '%' OR u.id::text ILIKE '%' || $1 || '%')
     ORDER BY up.updated_at DESC
     LIMIT 50`,
    [q]
  );
  res.json({
    success: true,
    data: rows.map((r) => ({
      userId: r.user_id,
      email: null,
      displayName: r.display_name,
      balance: Number(r.balance),
      lifetimeEarned: Number(r.lifetime_earned),
      lifetimeSpent: Number(r.lifetime_spent),
      updatedAt: r.updated_at?.toISOString?.() ?? String(r.updated_at),
    })),
  });
}
