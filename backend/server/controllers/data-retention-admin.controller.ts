import type { Request, Response, NextFunction } from 'express';
import {
  retentionConsentCreateSchema,
  retentionHoldSchema,
  retentionPolicyCreateSchema,
  retentionPolicyListQuerySchema,
  retentionPolicyUpdateSchema,
  retentionScheduledQuerySchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { dataRetentionAdminService } from '../services/data-retention-admin.service.js';

function actorMeta(req: Request) {
  return {
    ip: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
    role: req.user?.roleCode ?? null,
  };
}

export async function getSummary(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await dataRetentionAdminService.getSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listPolicies(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = retentionPolicyListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await dataRetentionAdminService.listPolicies(parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getPolicy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await dataRetentionAdminService.getPolicy(String(req.params.id));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createPolicy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = retentionPolicyCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const data = await dataRetentionAdminService.createPolicy(
      parsed.data,
      userId,
      actorMeta(req)
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updatePolicy(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = retentionPolicyUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const data = await dataRetentionAdminService.updatePolicy(
      String(req.params.id),
      parsed.data,
      userId,
      actorMeta(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listScheduled(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = retentionScheduledQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await dataRetentionAdminService.listScheduled(parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listDeletionLogs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const limit = Math.min(Number(req.query.limit ?? 100) || 100, 200);
    const data = await dataRetentionAdminService.listDeletionLogs(limit);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listConsentCatalog(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await dataRetentionAdminService.listConsentCatalog();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createConsent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = retentionConsentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const data = await dataRetentionAdminService.createConsent(
      parsed.data,
      userId,
      actorMeta(req)
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function setHold(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = retentionHoldSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const data = await dataRetentionAdminService.setHold(
      String(req.params.id),
      parsed.data,
      userId,
      actorMeta(req)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function syncWithdrawn(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const upserted = await dataRetentionAdminService.syncWithdrawnRecords();
    res.json({ success: true, data: { upserted } });
  } catch (err) {
    next(err);
  }
}
