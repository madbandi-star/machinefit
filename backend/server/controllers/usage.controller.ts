import type { Request, Response, NextFunction } from 'express';
import {
  usageHistoryQuerySchema,
  usagePolicyUpdateSchema,
  usageSummaryQuerySchema,
  usageTimeseriesQuerySchema,
  usageTrackBodySchema,
  usageUsersQuerySchema,
} from '@machinefit/shared';
import { AppError } from '../middlewares/error.middleware.js';
import { usageAdminService } from '../services/usage-admin.service.js';
import { usageService } from '../services/usage.service.js';
import { abuseRepository } from '../repositories/abuse.repository.js';

export async function trackEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    const parsed = usageTrackBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await usageService.recordEvents(req.user.userId, parsed.data.events);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function checkLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    const featureCode = String(req.params.featureCode ?? '');
    const data = await usageService.checkUsageLimit(req.user.userId, featureCode);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    usageSummaryQuerySchema.safeParse(req.query);
    const data = await usageAdminService.getSummary();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTimeseries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = usageTimeseriesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await usageAdminService.getTimeseries(parsed.data.from, parsed.data.to);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = usageUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await usageAdminService.listUsers(parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await usageAdminService.getUser(String(req.params.userId));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listPolicies(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await usageAdminService.listPolicies();
    res.json({ success: true, data });
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
    const parsed = usagePolicyUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await usageAdminService.updatePolicy(
      String(req.params.policyId),
      parsed.data,
      req.user?.userId ?? null
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = usageHistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', parsed.error.message);
    }
    const data = await usageAdminService.listHistory(parsed.data);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listAbuseEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const data = await abuseRepository.list({
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
      eventType: typeof req.query.eventType === 'string' ? req.query.eventType : undefined,
      page,
      limit,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
