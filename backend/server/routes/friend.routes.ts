import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as friendController from '../controllers/friend.controller.js';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';

export const friendRouter = Router();

friendRouter.use(authMiddleware, requireMinRole(Role.MEMBER));

friendRouter.get('/privacy', friendController.getPrivacy);
friendRouter.put('/privacy', friendController.updatePrivacy);

friendRouter.get('/', friendController.listFriends);
friendRouter.get('/search', friendController.searchUsers);

friendRouter.get('/requests/incoming', friendController.listIncoming);
friendRouter.get('/requests/outgoing', friendController.listOutgoing);
friendRouter.post('/friend-request', friendController.createRequest);
friendRouter.post('/friend-accept/:requestId', friendController.acceptRequest);
friendRouter.post('/friend-reject/:requestId', friendController.rejectRequest);
friendRouter.delete('/requests/:requestId', friendController.cancelRequest);

friendRouter.delete('/friend', friendController.removeFriend);
friendRouter.post('/pin', friendController.setPin);

friendRouter.post('/friend-block', friendController.blockUser);
friendRouter.delete('/friend-block', friendController.unblockUser);
friendRouter.get('/blocked', friendController.listBlocked);

friendRouter.get('/feed', friendController.getFeed);
friendRouter.get('/rankings', friendController.getRankings);
friendRouter.get('/invite', friendController.getInvite);
friendRouter.post('/invite/apply', friendController.applyInvite);
friendRouter.post('/report', friendController.reportUser);

friendRouter.get('/profile/:userId', friendController.getProfile);

friendRouter.get('/admin/stats', requireMinRole(Role.ADMIN), friendController.adminStats);
friendRouter.get('/admin/friendships', requireMinRole(Role.ADMIN), friendController.adminList);
friendRouter.delete(
  '/admin/friendships/:id',
  requireMinRole(Role.ADMIN),
  friendController.adminDelete
);
friendRouter.get('/admin/reports', requireMinRole(Role.ADMIN), friendController.adminReports);
friendRouter.patch(
  '/admin/reports/:id',
  requireMinRole(Role.ADMIN),
  friendController.adminResolveReport
);
friendRouter.get('/admin/spam', requireMinRole(Role.ADMIN), friendController.adminSpam);
friendRouter.post('/admin/block', requireMinRole(Role.ADMIN), friendController.adminBlock);
