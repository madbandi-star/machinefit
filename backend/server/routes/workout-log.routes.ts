import { Router } from 'express';
import {
  deleteWorkoutLogSchema,
  upsertWorkoutLogSchema,
  workoutInsightsQuerySchema,
  workoutLogListQuerySchema,
} from '@machinefit/shared';
import * as workoutLogController from '../controllers/workout-log.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody, validateQuery } from '../middlewares/validate.middleware.js';

export const workoutLogRouter = Router();

workoutLogRouter.use(authMiddleware);
workoutLogRouter.get(
  '/insights',
  validateQuery(workoutInsightsQuerySchema),
  workoutLogController.getWorkoutInsights
);
workoutLogRouter.get(
  '/',
  validateQuery(workoutLogListQuerySchema),
  workoutLogController.listWorkoutLogs
);
workoutLogRouter.put('/', validateBody(upsertWorkoutLogSchema), workoutLogController.upsertWorkoutLog);
workoutLogRouter.delete(
  '/',
  validateBody(deleteWorkoutLogSchema),
  workoutLogController.deleteWorkoutLog
);
