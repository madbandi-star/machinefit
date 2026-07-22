import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as motivationMediaController from '../controllers/motivation-media.controller.js';
import * as adminMotivationUploadController from '../controllers/admin-motivation-upload.controller.js';
import * as muscleGroupImageController from '../controllers/muscle-group-image.controller.js';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware.js';
import {
  motivationAudioUpload,
  muscleGroupImageUpload,
} from '../middlewares/upload.middleware.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware, requireRole('admin'));

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
adminRouter.get('/gyms/:gymId/inventory', adminController.listGymInventory);
adminRouter.post('/gym-machines/:itemId/actions', adminController.gymInventoryAction);
