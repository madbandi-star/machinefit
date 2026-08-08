import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as fortuneController from '../controllers/fortune.controller.js';

export const fortuneRouter = Router();

fortuneRouter.get('/today', authMiddleware, fortuneController.getTodayFortune);
