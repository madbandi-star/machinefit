import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as inspectionController from '../controllers/inspection.controller.js';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';

export const inspectionRouter = Router();

inspectionRouter.use(authMiddleware);

inspectionRouter.get(
  '/templates',
  requireMinRole(Role.MEMBER),
  inspectionController.listTemplates
);

inspectionRouter.get(
  '/gym-machines',
  requireMinRole(Role.OWNER),
  inspectionController.listGymMachines
);
inspectionRouter.get(
  '/gym-machines/by-code',
  requireMinRole(Role.MEMBER),
  inspectionController.getGymMachineByCode
);
inspectionRouter.get(
  '/gym-machines/:id',
  requireMinRole(Role.OWNER),
  inspectionController.getGymMachine
);

inspectionRouter.post(
  '/inspections',
  requireMinRole(Role.OWNER),
  inspectionController.createInspection
);
inspectionRouter.get(
  '/inspections',
  requireMinRole(Role.OWNER),
  inspectionController.listInspections
);
inspectionRouter.get(
  '/inspections/:id',
  requireMinRole(Role.OWNER),
  inspectionController.getInspection
);

inspectionRouter.get('/faults', requireMinRole(Role.OWNER), inspectionController.listFaults);
inspectionRouter.post('/faults', requireMinRole(Role.OWNER), inspectionController.createFault);
inspectionRouter.patch(
  '/faults/:id',
  requireMinRole(Role.OWNER),
  inspectionController.updateFault
);

inspectionRouter.post(
  '/member-reports',
  requireMinRole(Role.MEMBER),
  inspectionController.createMemberReport
);

inspectionRouter.get('/dashboard', requireMinRole(Role.OWNER), inspectionController.dashboard);
inspectionRouter.get('/statistics', requireMinRole(Role.OWNER), inspectionController.dashboard);
