import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as adminCatalogController from '../controllers/admin-catalog.controller.js';
import * as motivationMediaController from '../controllers/motivation-media.controller.js';
import * as adminMotivationUploadController from '../controllers/admin-motivation-upload.controller.js';
import * as muscleGroupImageController from '../controllers/muscle-group-image.controller.js';
import * as machineCoverImageController from '../controllers/machine-cover-image.controller.js';
import { Role } from '@machinefit/shared';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';
import {
  motivationAudioUpload,
  muscleGroupImageUpload,
} from '../middlewares/upload.middleware.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware, requireMinRole(Role.ADMIN));

/* Catalog CRUD (real DB) */
adminRouter.get('/catalog/brands', adminCatalogController.listBrands);
adminRouter.post('/catalog/brands', adminCatalogController.createBrand);
adminRouter.patch('/catalog/brands/:id', adminCatalogController.updateBrand);
adminRouter.patch('/catalog/brands/:id/active', adminCatalogController.setBrandActive);
adminRouter.delete('/catalog/brands/:id', adminCatalogController.deleteBrand);
adminRouter.post(
  '/catalog/brands/:id/logo',
  muscleGroupImageUpload,
  adminCatalogController.uploadBrandLogo
);
adminRouter.delete('/catalog/brands/:id/logo', adminCatalogController.clearBrandLogo);
adminRouter.post(
  '/catalog/brands/:id/image',
  muscleGroupImageUpload,
  adminCatalogController.uploadBrandImage
);
adminRouter.delete('/catalog/brands/:id/image', adminCatalogController.clearBrandImage);

adminRouter.get('/catalog/machines', adminCatalogController.listMachines);
adminRouter.post('/catalog/machines', adminCatalogController.createMachine);
adminRouter.patch('/catalog/machines/:id', adminCatalogController.updateMachine);
adminRouter.patch('/catalog/machines/:id/active', adminCatalogController.setMachineActive);
adminRouter.delete('/catalog/machines/:id', adminCatalogController.deleteMachine);
adminRouter.post(
  '/catalog/machines/:id/image',
  muscleGroupImageUpload,
  adminCatalogController.uploadMachineImage
);
adminRouter.delete('/catalog/machines/:id/image', adminCatalogController.clearMachineImage);

adminRouter.get('/dashboard', adminController.dashboard);
adminRouter.get('/motivation-media', motivationMediaController.listAdmin);
adminRouter.put('/motivation-media', motivationMediaController.replace);
adminRouter.post(
  '/motivation-media/upload',
  motivationAudioUpload,
  adminMotivationUploadController.uploadMotivationAudio
);
adminRouter.get('/muscle-group-images', muscleGroupImageController.listMuscleGroupImages);
adminRouter.post(
  '/muscle-group-images/:muscleGroup/upload',
  muscleGroupImageUpload,
  muscleGroupImageController.uploadMuscleGroupImage
);
adminRouter.delete(
  '/muscle-group-images/:muscleGroup',
  muscleGroupImageController.deleteMuscleGroupImage
);
adminRouter.get('/machine-covers/brands', machineCoverImageController.listMachineCoverBrands);
adminRouter.get('/machine-covers', machineCoverImageController.listMachineCovers);
adminRouter.post(
  '/machine-covers/:machineCode/upload',
  muscleGroupImageUpload,
  machineCoverImageController.uploadMachineCover
);
adminRouter.delete(
  '/machine-covers/:machineCode',
  machineCoverImageController.deleteMachineCover
);
adminRouter.get('/users', adminController.listUsers);
adminRouter.patch('/users/:id', adminController.updateUser);
adminRouter.get('/gyms', adminController.listGyms);
adminRouter.patch('/gyms/:id/verify', adminController.verifyGym);
adminRouter.get('/brands', adminController.listBrands);
adminRouter.patch('/brands/:id', adminController.updateBrand);
adminRouter.get('/machines', adminController.listMachines);
adminRouter.patch('/machines/:id', adminController.updateMachine);
adminRouter.get('/posts', adminController.listPosts);
adminRouter.patch('/posts/:id', adminController.moderatePost);
adminRouter.get('/machine-requests', adminController.listMachineRequests);
adminRouter.patch('/machine-requests/:id', adminController.updateMachineRequest);
adminRouter.get('/reports', adminController.listReports);
adminRouter.patch('/reports/:id', adminController.resolveReport);

adminRouter.get('/owner-applications', adminController.listOwnerApplications);
adminRouter.patch('/owner-applications/:id', adminController.reviewOwnerApplication);
adminRouter.get('/trainer-applications', adminController.listTrainerApplications);
adminRouter.patch('/trainer-applications/:id', adminController.reviewTrainerApplication);
adminRouter.get('/gyms/:gymId/inventory', adminController.listGymInventory);
adminRouter.post('/gym-machines/:itemId/actions', adminController.gymInventoryAction);
