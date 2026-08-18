import { Router } from 'express';
import {
  createTimerHistorySchema,
  timerHistoryDateParamsSchema,
  timerHistoryMonthQuerySchema,
  timerHistorySessionParamsSchema,
} from '@machinefit/shared';
import * as timerHistoryController from '../controllers/timer-history.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { contentWriteRateLimit } from '../middlewares/rate-limit.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';

export const timerHistoryRouter = Router();

timerHistoryRouter.use(authMiddleware);

timerHistoryRouter.get(
  '/',
  validateQuery(timerHistoryMonthQuerySchema),
  timerHistoryController.getTimerHistoryMonth
);

timerHistoryRouter.post(
  '/',
  contentWriteRateLimit,
  validateBody(createTimerHistorySchema),
  timerHistoryController.createTimerHistory
);

timerHistoryRouter.get(
  '/date/:date',
  validateParams(timerHistoryDateParamsSchema),
  timerHistoryController.getTimerHistoryDate
);

timerHistoryRouter.get(
  '/sessions/:sessionId',
  validateParams(timerHistorySessionParamsSchema),
  timerHistoryController.getTimerHistorySession
);
