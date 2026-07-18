import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const userRouter = Router();

userRouter.get('/me', authMiddleware, userController.getMe);
userRouter.patch('/me', authMiddleware, userController.updateMe);
userRouter.post('/me/workout-reports', authMiddleware, userController.sendWorkoutReport);
