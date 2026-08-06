import { Router } from 'express';
import {
  applyWorkoutCardTemplateSchema,
  copyWorkoutCardSchema,
  createWorkoutCardSchema,
  createWorkoutCardTemplateSchema,
  moveWorkoutCardDateSchema,
  patchWorkoutCardStatusSchema,
  resolveMissedWorkoutCardSchema,
  updateWorkoutCardSchema,
  workoutCardCalendarSummaryQuerySchema,
  workoutCardIdParamsSchema,
  workoutCardListQuerySchema,
  workoutCardMissedQuerySchema,
  workoutCardTemplateListQuerySchema,
  workoutPlanStatsQuerySchema,
} from '@machinefit/shared';
import * as workoutCardController from '../controllers/workout-card.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';

export const workoutCardRouter = Router();

workoutCardRouter.use(authMiddleware);

workoutCardRouter.get(
  '/',
  validateQuery(workoutCardListQuerySchema),
  workoutCardController.listWorkoutCards
);
workoutCardRouter.post(
  '/',
  validateBody(createWorkoutCardSchema),
  workoutCardController.createWorkoutCard
);

workoutCardRouter.get(
  '/missed',
  validateQuery(workoutCardMissedQuerySchema),
  workoutCardController.listMissedWorkoutCards
);
workoutCardRouter.get(
  '/stats',
  validateQuery(workoutPlanStatsQuerySchema),
  workoutCardController.getWorkoutPlanStats
);
workoutCardRouter.get(
  '/calendar-summary',
  validateQuery(workoutCardCalendarSummaryQuerySchema),
  workoutCardController.getWorkoutCardCalendarSummary
);

workoutCardRouter.get(
  '/templates',
  validateQuery(workoutCardTemplateListQuerySchema),
  workoutCardController.listWorkoutCardTemplates
);
workoutCardRouter.post(
  '/templates',
  validateBody(createWorkoutCardTemplateSchema),
  workoutCardController.createWorkoutCardTemplate
);
workoutCardRouter.post(
  '/templates/apply',
  validateBody(applyWorkoutCardTemplateSchema),
  workoutCardController.applyWorkoutCardTemplate
);
workoutCardRouter.delete(
  '/templates/:id',
  validateParams(workoutCardIdParamsSchema),
  workoutCardController.deleteWorkoutCardTemplate
);

workoutCardRouter.patch(
  '/:id',
  validateParams(workoutCardIdParamsSchema),
  validateBody(updateWorkoutCardSchema),
  workoutCardController.updateWorkoutCard
);
workoutCardRouter.patch(
  '/:id/status',
  validateParams(workoutCardIdParamsSchema),
  validateBody(patchWorkoutCardStatusSchema),
  workoutCardController.patchWorkoutCardStatus
);
workoutCardRouter.patch(
  '/:id/move-date',
  validateParams(workoutCardIdParamsSchema),
  validateBody(moveWorkoutCardDateSchema),
  workoutCardController.moveWorkoutCardDate
);
workoutCardRouter.post(
  '/:id/copy',
  validateParams(workoutCardIdParamsSchema),
  validateBody(copyWorkoutCardSchema),
  workoutCardController.copyWorkoutCard
);
workoutCardRouter.post(
  '/:id/resolve-missed',
  validateParams(workoutCardIdParamsSchema),
  validateBody(resolveMissedWorkoutCardSchema),
  workoutCardController.resolveMissedWorkoutCard
);
workoutCardRouter.delete(
  '/:id',
  validateParams(workoutCardIdParamsSchema),
  workoutCardController.deleteWorkoutCard
);
