import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import * as userGymController from '../controllers/user-gym.controller.js';
import * as gymMemberController from '../controllers/gym-member.controller.js';
import * as liftedVolumeController from '../controllers/lifted-volume.controller.js';
import * as lifterDnaController from '../controllers/lifter-dna.controller.js';
import * as achievementController from '../controllers/achievement.controller.js';
import * as growthTimelineController from '../controllers/growth-timeline.controller.js';
import * as userMotivationTrackController from '../controllers/user-motivation-track.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { motivationAudioUpload } from '../middlewares/upload.middleware.js';

export const userRouter = Router();

userRouter.get('/me', authMiddleware, userController.getMe);
userRouter.patch('/me', authMiddleware, userController.updateMe);
userRouter.post('/me/workout-reports', authMiddleware, userController.sendWorkoutReport);

userRouter.get('/me/motivation-tracks', authMiddleware, userMotivationTrackController.listTracks);
userRouter.post('/me/motivation-tracks/url', authMiddleware, userMotivationTrackController.createFromUrl);
userRouter.post(
  '/me/motivation-tracks/upload',
  authMiddleware,
  motivationAudioUpload,
  userMotivationTrackController.createFromUpload
);
userRouter.patch('/me/motivation-tracks/:id', authMiddleware, userMotivationTrackController.updateTrack);
userRouter.delete('/me/motivation-tracks/:id', authMiddleware, userMotivationTrackController.deleteTrack);

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
userRouter.get('/me/achievements', authMiddleware, achievementController.getAchievementSnapshot);
userRouter.get('/me/achievements/rankings', authMiddleware, achievementController.getAchievementRankings);
userRouter.get('/me/growth-timeline', authMiddleware, growthTimelineController.getGrowthTimelineSnapshot);
