import { Router } from 'express';
import * as trainerController from '../controllers/trainer.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const trainerRouter = Router();

trainerRouter.post('/apply', authMiddleware, trainerController.apply);
