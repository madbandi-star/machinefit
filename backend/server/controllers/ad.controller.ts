import type { Request, Response, NextFunction } from 'express';
import type {
  AdDecisionQuery,
  AdFlagUpdate,
  AdPlacementUpdate,
  AdPolicyUpdate,
  AdRewardClaimBody,
  AdStatsQuery,
  AdTrackEventBody,
} from '@machinefit/shared';
import { adPolicyService } from '../services/ad-policy.service.js';
import { adRepository } from '../repositories/ad.repository.js';
import { AppError } from '../middlewares/error.middleware.js';

export async function decideAd(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query as unknown as AdDecisionQuery;
    const data = await adPolicyService.decide(query, {
      userId: req.user?.userId,
      roleCode: req.user?.roleCode,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function trackAdEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as AdTrackEventBody;
    const data = await adPolicyService.track(body, { userId: req.user?.userId });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function claimReward(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as AdRewardClaimBody;
    const data = await adPolicyService.claimReward(body, {
      userId: req.user?.userId,
      roleCode: req.user?.roleCode,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listFlags(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await adRepository.isReady())) {
      throw new AppError(503, 'ADS_UNAVAILABLE', 'Apply migration 140 first');
    }
    const data = await adRepository.listFlags();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateFlag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const flagKey = String(req.params.flagKey || '');
    const body = req.body as AdFlagUpdate;
    const data = await adRepository.setFlag(flagKey, body.enabled);
    if (!data) throw new AppError(404, 'NOT_FOUND', 'Flag not found');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listPlacements(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await adRepository.isReady())) {
      throw new AppError(503, 'ADS_UNAVAILABLE', 'Apply migration 140 first');
    }
    const data = await adRepository.listPlacements();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updatePlacement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id || '');
    const body = req.body as AdPlacementUpdate;
    const data = await adRepository.updatePlacement(id, body);
    if (!data) throw new AppError(404, 'NOT_FOUND', 'Placement not found');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function listPolicies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await adRepository.isReady())) {
      throw new AppError(503, 'ADS_UNAVAILABLE', 'Apply migration 140 first');
    }
    const placementId = typeof req.query.placementId === 'string' ? req.query.placementId : undefined;
    const data = await adRepository.listPolicies(placementId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updatePolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = String(req.params.id || '');
    const body = req.body as AdPolicyUpdate;
    const data = await adRepository.updatePolicy(id, {
      minIntervalSeconds: body.minIntervalSeconds,
      sessionLimit: body.sessionLimit,
      dailyLimit: body.dailyLimit,
      eventIntervalCount: body.eventIntervalCount,
      anonymousEnabled: body.anonymousEnabled,
      freeUserEnabled: body.freeUserEnabled,
      paidUserEnabled: body.paidUserEnabled,
      adminEnabled: body.adminEnabled,
      requireMarketingOptIn: body.requireMarketingOptIn,
      enabled: body.enabled,
    });
    if (!data) throw new AppError(404, 'NOT_FOUND', 'Policy not found');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!(await adRepository.isReady())) {
      throw new AppError(503, 'ADS_UNAVAILABLE', 'Apply migration 140 first');
    }
    const query = req.query as unknown as AdStatsQuery;
    const data = await adRepository.getAdminStats(query.range ?? 'today');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
