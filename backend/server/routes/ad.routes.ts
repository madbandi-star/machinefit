import { Router } from 'express';
import { z } from 'zod';
import {
  Role,
  adDecisionQuerySchema,
  adFlagUpdateSchema,
  adPlacementUpdateSchema,
  adPolicyUpdateSchema,
  adRewardClaimBodySchema,
  adStatsQuerySchema,
  adTrackEventBodySchema,
} from '@machinefit/shared';
import * as adController from '../controllers/ad.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';

export const adRouter = Router();

adRouter.get(
  '/decision',
  optionalAuthMiddleware,
  validateQuery(adDecisionQuerySchema),
  adController.decideAd
);

adRouter.post(
  '/events',
  optionalAuthMiddleware,
  validateBody(adTrackEventBodySchema),
  adController.trackAdEvent
);

adRouter.post(
  '/reward/claim',
  authMiddleware,
  validateBody(adRewardClaimBodySchema),
  adController.claimReward
);

const admin = Router();
admin.use(authMiddleware, requireMinRole(Role.ADMIN));

admin.get('/flags', adController.listFlags);
admin.patch(
  '/flags/:flagKey',
  validateParams(z.object({ flagKey: z.string().min(1).max(64) })),
  validateBody(adFlagUpdateSchema),
  adController.updateFlag
);

admin.get('/placements', adController.listPlacements);
admin.patch(
  '/placements/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(adPlacementUpdateSchema),
  adController.updatePlacement
);

admin.get('/policies', adController.listPolicies);
admin.patch(
  '/policies/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(adPolicyUpdateSchema),
  adController.updatePolicy
);

admin.get('/stats', validateQuery(adStatsQuerySchema), adController.getStats);

adRouter.use('/admin', admin);
