import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as userGymController from '../controllers/user-gym.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const userRouter = Router();

userRouter.get('/me', authMiddleware, userController.getMe);
userRouter.patch('/me', authMiddleware, userController.updateMe);
userRouter.post('/me/workout-reports', authMiddleware, userController.sendWorkoutReport);

userRouter.get('/me/gyms', authMiddleware, userGymController.listMyGyms);
userRouter.post('/me/gyms', authMiddleware, userGymController.createMyGym);
userRouter.patch('/me/gyms/:gymId', authMiddleware, userGymController.updateMyGym);
userRouter.delete('/me/gyms/:gymId', authMiddleware, userGymController.deleteMyGym);
userRouter.post('/me/gyms/:gymId/select', authMiddleware, userGymController.selectMyGym);
