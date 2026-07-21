import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as userGymController from '../controllers/user-gym.controller.js';
import * as gymMemberController from '../controllers/gym-member.controller.js';
import * as liftedVolumeController from '../controllers/lifted-volume.controller.js';
import * as lifterDnaController from '../controllers/lifter-dna.controller.js';
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

userRouter.get('/me/gyms/:gymId/members', authMiddleware, gymMemberController.listMembers);
userRouter.post('/me/gyms/:gymId/members', authMiddleware, gymMemberController.createMember);
userRouter.patch('/me/gyms/:gymId/members/:memberId', authMiddleware, gymMemberController.updateMember);
userRouter.delete('/me/gyms/:gymId/members/:memberId', authMiddleware, gymMemberController.deleteMember);

userRouter.get('/me/member-profile-requests', authMiddleware, gymMemberController.listPendingProfileRequests);
userRouter.post('/me/member-profile-requests/:id/respond', authMiddleware, gymMemberController.respondToProfileRequest);

userRouter.get('/me/lifted-weight', authMiddleware, liftedVolumeController.getLiftedSnapshot);
userRouter.get('/me/lifted-weight/rankings', authMiddleware, liftedVolumeController.getLiftedRankings);
userRouter.get('/me/lifter-dna', authMiddleware, lifterDnaController.getLifterDnaSnapshot);
