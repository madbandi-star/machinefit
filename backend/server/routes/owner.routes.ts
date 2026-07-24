import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as ownerController from '../controllers/owner.controller.js';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';

export const ownerRouter = Router();

ownerRouter.post('/apply', authMiddleware, ownerController.apply);

ownerRouter.use(authMiddleware, requireMinRole(Role.OWNER));

ownerRouter.get('/dashboard', ownerController.dashboard);
ownerRouter.get('/gyms', ownerController.listGyms);
ownerRouter.post('/gyms', ownerController.createGym);
ownerRouter.get('/gyms/:gymId/machines', ownerController.getGymMachines);
ownerRouter.post('/gyms/:gymId/machines', ownerController.addGymMachine);
ownerRouter.delete('/gyms/:gymId/machines/:itemId', ownerController.removeGymMachine);
