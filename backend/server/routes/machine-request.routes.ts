import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware.js';
import { machineRequestImagesUpload } from '../middlewares/upload.middleware.js';

export const machineRequestRouter = Router();

machineRequestRouter.get('/images/:imageId', communityController.getMachineRequestImage);
machineRequestRouter.get('/', optionalAuthMiddleware, communityController.listMachineRequests);
machineRequestRouter.get(
  '/:requestId',
  optionalAuthMiddleware,
  communityController.getMachineRequest
);
machineRequestRouter.post(
  '/',
  authMiddleware,
  machineRequestImagesUpload,
  communityController.createMachineRequest
);
machineRequestRouter.patch(
  '/:requestId',
  authMiddleware,
  communityController.updateMachineRequest
);
machineRequestRouter.delete(
  '/:requestId',
  authMiddleware,
  communityController.deleteMachineRequest
);
machineRequestRouter.post(
  '/:requestId/vote',
  authMiddleware,
  communityController.toggleMachineRequestVote
);
