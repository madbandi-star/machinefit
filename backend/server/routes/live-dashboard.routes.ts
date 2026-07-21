import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as liveDashboardController from '../controllers/live-dashboard.controller.js';

export const liveDashboardRouter = Router();

liveDashboardRouter.use(authMiddleware);
liveDashboardRouter.get('/snapshot', liveDashboardController.getLiveSnapshot);
liveDashboardRouter.get('/rankings', liveDashboardController.getLiveRankings);
liveDashboardRouter.get('/search', liveDashboardController.searchLive);
