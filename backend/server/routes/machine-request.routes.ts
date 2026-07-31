import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { machineRequestImagesUpload } from '../middlewares/upload.middleware.js';

export const machineRequestRouter = Router();

machineRequestRouter.get('/images/:imageId', communityController.getMachineRequestImage);
machineRequestRouter.get('/', communityController.listMachineRequests);
machineRequestRouter.post(
  '/',
  authMiddleware,
  machineRequestImagesUpload,
  communityController.createMachineRequest
);
