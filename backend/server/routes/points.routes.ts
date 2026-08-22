import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as pointsController from '../controllers/points.controller.js';

export const pointsRouter = Router();

pointsRouter.get('/me', authMiddleware, pointsController.getMyPoints);
pointsRouter.get('/me/ledger', authMiddleware, pointsController.getMyLedger);
pointsRouter.get('/hellpower-lookup', pointsController.getHellpowerLookup);
pointsRouter.post('/track', authMiddleware, pointsController.trackClientAction);
pointsRouter.get('/power-box', authMiddleware, pointsController.getPowerBoxStatus);
pointsRouter.post('/power-box/claim', authMiddleware, pointsController.claimPowerBox);
