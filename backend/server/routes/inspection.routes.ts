import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as inspectionController from '../controllers/inspection.controller.js';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';
import { muscleGroupImageUpload } from '../middlewares/upload.middleware.js';

export const inspectionRouter = Router();

/**
 * Do NOT use `inspectionRouter.use(authMiddleware)` while this router is mounted at
 * the API root — Express would run it for every request (including /auth/login)
 * and block unauthenticated login/register.
 */
const member = [authMiddleware, requireMinRole(Role.MEMBER)] as const;
const owner = [authMiddleware, requireMinRole(Role.OWNER)] as const;

inspectionRouter.get('/templates', ...member, inspectionController.listTemplates);
inspectionRouter.post('/templates', ...owner, inspectionController.createTemplate);
inspectionRouter.patch('/templates/:id', ...owner, inspectionController.updateTemplate);

inspectionRouter.get('/gym-machines', ...owner, inspectionController.listGymMachines);
inspectionRouter.get('/gym-machines/by-code', ...member, inspectionController.getGymMachineByCode);
inspectionRouter.get(
  '/gym-machines/:id/public',
  ...member,
  inspectionController.getGymMachinePublic
);
inspectionRouter.get('/gym-machines/:id/photos', ...owner, inspectionController.listPhotos);
inspectionRouter.post(
  '/gym-machines/:id/photos',
  ...owner,
  muscleGroupImageUpload,
  inspectionController.uploadPhoto
);
inspectionRouter.get('/gym-machines/:id', ...owner, inspectionController.getGymMachine);

inspectionRouter.post('/inspections', ...owner, inspectionController.createInspection);
inspectionRouter.get('/inspections', ...owner, inspectionController.listInspections);
inspectionRouter.get('/inspections/:id', ...owner, inspectionController.getInspection);

inspectionRouter.get('/faults', ...owner, inspectionController.listFaults);
inspectionRouter.post('/faults', ...owner, inspectionController.createFault);
inspectionRouter.patch('/faults/:id', ...owner, inspectionController.updateFault);

inspectionRouter.get('/pm', ...owner, inspectionController.listPm);
inspectionRouter.post('/pm', ...owner, inspectionController.createPm);
inspectionRouter.post('/pm/refresh-due', ...owner, inspectionController.refreshPmDue);
inspectionRouter.patch('/pm/:id', ...owner, inspectionController.updatePm);
inspectionRouter.delete('/pm/:id', ...owner, inspectionController.deletePm);

inspectionRouter.get('/repairs', ...owner, inspectionController.listRepairs);
inspectionRouter.post('/repairs', ...owner, inspectionController.createRepair);

inspectionRouter.get('/parts', ...owner, inspectionController.listParts);
inspectionRouter.post('/parts', ...owner, inspectionController.createPart);
inspectionRouter.patch('/parts/:id', ...owner, inspectionController.updatePart);
inspectionRouter.delete('/parts/:id', ...owner, inspectionController.deletePart);

inspectionRouter.post('/member-reports', ...member, inspectionController.createMemberReport);

inspectionRouter.get('/dashboard', ...owner, inspectionController.dashboard);
inspectionRouter.get('/statistics', ...owner, inspectionController.statistics);
