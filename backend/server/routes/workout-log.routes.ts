import { Router } from 'express';
import * as workoutLogController from '../controllers/workout-log.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { upsertWorkoutLogSchema } from '@machinefit/shared';

export const workoutLogRouter = Router();

workoutLogRouter.use(authMiddleware);
workoutLogRouter.get('/', workoutLogController.listWorkoutLogs);
workoutLogRouter.put('/', validateBody(upsertWorkoutLogSchema), workoutLogController.upsertWorkoutLog);
