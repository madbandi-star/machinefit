import { Router } from 'express';
import * as machineController from '../controllers/machine.controller.js';
import * as feedbackController from '../controllers/feedback.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';
import { searchRateLimit } from '../middlewares/rate-limit.middleware.js';

export const machineRouter = Router();

machineRouter.get('/', machineController.listMachines);
machineRouter.get(
  '/search',
  searchRateLimit,
  optionalAuthMiddleware,
  machineController.searchMachines
);
machineRouter.get('/preferences', authMiddleware, feedbackController.getPreferenceBatch);
machineRouter.get('/:machineCode/preferences', authMiddleware, feedbackController.getPreference);
machineRouter.put('/:machineCode/preferences', authMiddleware, feedbackController.upsertPreference);
machineRouter.get(
  '/:machineCode',
  optionalAuthMiddleware,
  machineController.getMachineByCode
);
