import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as inspectionController from '../controllers/inspection.controller.js';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';
import { muscleGroupImageUpload } from '../middlewares/upload.middleware.js';

export const inspectionRouter = Router();

inspectionRouter.use(authMiddleware);

inspectionRouter.get(
  '/templates',
  requireMinRole(Role.MEMBER),
  inspectionController.listTemplates
);
inspectionRouter.post(
  '/templates',
  requireMinRole(Role.OWNER),
  inspectionController.createTemplate
);
inspectionRouter.patch(
  '/templates/:id',
  requireMinRole(Role.OWNER),
  inspectionController.updateTemplate
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
  '/gym-machines/:id/public',
  requireMinRole(Role.MEMBER),
  inspectionController.getGymMachinePublic
);
inspectionRouter.get(
  '/gym-machines/:id/photos',
  requireMinRole(Role.OWNER),
  inspectionController.listPhotos
);
inspectionRouter.post(
  '/gym-machines/:id/photos',
  requireMinRole(Role.OWNER),
  muscleGroupImageUpload,
  inspectionController.uploadPhoto
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

inspectionRouter.get('/pm', requireMinRole(Role.OWNER), inspectionController.listPm);
inspectionRouter.post('/pm', requireMinRole(Role.OWNER), inspectionController.createPm);
inspectionRouter.post(
  '/pm/refresh-due',
  requireMinRole(Role.OWNER),
  inspectionController.refreshPmDue
);
inspectionRouter.patch('/pm/:id', requireMinRole(Role.OWNER), inspectionController.updatePm);
inspectionRouter.delete('/pm/:id', requireMinRole(Role.OWNER), inspectionController.deletePm);

inspectionRouter.get('/repairs', requireMinRole(Role.OWNER), inspectionController.listRepairs);
inspectionRouter.post('/repairs', requireMinRole(Role.OWNER), inspectionController.createRepair);

inspectionRouter.get('/parts', requireMinRole(Role.OWNER), inspectionController.listParts);
inspectionRouter.post('/parts', requireMinRole(Role.OWNER), inspectionController.createPart);
inspectionRouter.patch('/parts/:id', requireMinRole(Role.OWNER), inspectionController.updatePart);
inspectionRouter.delete('/parts/:id', requireMinRole(Role.OWNER), inspectionController.deletePart);

inspectionRouter.post(
  '/member-reports',
  requireMinRole(Role.MEMBER),
  inspectionController.createMemberReport
);

inspectionRouter.get('/dashboard', requireMinRole(Role.OWNER), inspectionController.dashboard);
inspectionRouter.get('/statistics', requireMinRole(Role.OWNER), inspectionController.statistics);
