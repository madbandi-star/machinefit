import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export const machineRequestRouter = Router();

machineRequestRouter.get('/', communityController.listMachineRequests);
machineRequestRouter.post('/', authMiddleware, communityController.createMachineRequest);
