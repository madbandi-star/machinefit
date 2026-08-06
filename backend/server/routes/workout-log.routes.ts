import { Router } from 'express';
import {
  deleteWorkoutLogSchema,
  deleteWorkoutLogsByDateBodySchema,
  deleteWorkoutLogsByDateParamsSchema,
  reorderWorkoutRecordCardsSchema,
  upsertWorkoutLogSchema,
  workoutInsightsQuerySchema,
  workoutLogListQuerySchema,
  workoutRecordDisplayOrderQuerySchema,
} from '@machinefit/shared';
import * as workoutLogController from '../controllers/workout-log.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';

export const workoutLogRouter = Router();

workoutLogRouter.use(authMiddleware);
workoutLogRouter.get(
  '/insights',
  validateQuery(workoutInsightsQuerySchema),
  workoutLogController.getWorkoutInsights
);
workoutLogRouter.get(
  '/display-order',
  validateQuery(workoutRecordDisplayOrderQuerySchema),
  workoutLogController.listWorkoutRecordDisplayOrders
);
workoutLogRouter.put(
  '/display-order',
  validateBody(reorderWorkoutRecordCardsSchema),
  workoutLogController.reorderWorkoutRecordCards
);
workoutLogRouter.get(
  '/',
  validateQuery(workoutLogListQuerySchema),
  workoutLogController.listWorkoutLogs
);
workoutLogRouter.put('/', validateBody(upsertWorkoutLogSchema), workoutLogController.upsertWorkoutLog);
workoutLogRouter.delete(
  '/date/:date',
  validateParams(deleteWorkoutLogsByDateParamsSchema),
  validateBody(deleteWorkoutLogsByDateBodySchema),
  workoutLogController.deleteWorkoutLogsByDate
);
workoutLogRouter.delete(
  '/',
  validateBody(deleteWorkoutLogSchema),
  workoutLogController.deleteWorkoutLog
);
