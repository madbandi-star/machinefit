import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import * as adminCatalogController from '../controllers/admin-catalog.controller.js';
import * as adminBillingController from '../controllers/admin-billing.controller.js';
import * as motivationMediaController from '../controllers/motivation-media.controller.js';
import * as adminMotivationUploadController from '../controllers/admin-motivation-upload.controller.js';
import * as motivationCoverUploadController from '../controllers/motivation-cover-upload.controller.js';
import * as muscleGroupImageController from '../controllers/muscle-group-image.controller.js';
import * as machineCoverImageController from '../controllers/machine-cover-image.controller.js';
import { Role } from '@machinefit/shared';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';
import {
  backupUpload,
  motivationAudioUpload,
  muscleGroupImageUpload,
} from '../middlewares/upload.middleware.js';
import {
  backupSettingsUpdateSchema,
  systemRestoreConfirmSchema,
} from '@machinefit/shared';
import { validateBody } from '../middlewares/validate.middleware.js';
import * as backupController from '../controllers/backup.controller.js';
import * as adminFortuneController from '../controllers/admin-fortune.controller.js';

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
adminRouter.get('/catalog/machines/:id/tips', adminCatalogController.getMachineTips);
adminRouter.put('/catalog/machines/:id/tips', adminCatalogController.updateMachineTips);
adminRouter.post(
  '/catalog/machines/:id/image',
  muscleGroupImageUpload,
  adminCatalogController.uploadMachineImage
);
adminRouter.delete('/catalog/machines/:id/image', adminCatalogController.clearMachineImage);

adminRouter.get('/dashboard', adminController.dashboard);

adminRouter.get('/fortune-content', adminFortuneController.listFortuneContent);
adminRouter.post('/fortune-content', adminFortuneController.createFortuneContent);
adminRouter.patch('/fortune-content/:id', adminFortuneController.updateFortuneContent);
adminRouter.delete('/fortune-content/:id', adminFortuneController.deleteFortuneContent);
adminRouter.get('/motivation-media', motivationMediaController.listAdmin);
adminRouter.put('/motivation-media', motivationMediaController.replace);
adminRouter.post(
  '/motivation-media/upload',
  motivationAudioUpload,
  adminMotivationUploadController.uploadMotivationAudio
);
adminRouter.post(
  '/motivation-media/cover-upload',
  muscleGroupImageUpload,
  motivationCoverUploadController.uploadAdminMotivationCover
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
/** Per-muscle free-weight cover — muscle in path so clients cannot drop the query/body field. */
adminRouter.post(
  '/machine-covers/:machineCode/muscles/:targetMuscle/upload',
  muscleGroupImageUpload,
  machineCoverImageController.uploadMachineCoverForMuscle
);
adminRouter.delete(
  '/machine-covers/:machineCode/muscles/:targetMuscle',
  machineCoverImageController.deleteMachineCoverForMuscle
);
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

adminRouter.get('/subscriptions', adminBillingController.adminListSubscriptions);
adminRouter.get('/subscriptions/:userId', adminBillingController.adminGetUserSubscription);
adminRouter.post(
  '/subscriptions/:userId/extend',
  adminBillingController.adminExtendSubscription
);
adminRouter.post('/subscriptions/:userId/end', adminBillingController.adminEndSubscription);
adminRouter.post('/subscriptions/:userId/set', adminBillingController.adminSetSubscription);
adminRouter.post(
  '/subscriptions/:userId/grant-trial',
  adminBillingController.adminGrantTrial
);
adminRouter.post('/subscriptions/:userId/refund', adminBillingController.adminRefund);
adminRouter.get('/coupons', adminBillingController.adminListCoupons);
adminRouter.post('/coupons', adminBillingController.adminCreateCoupon);
adminRouter.delete('/coupons/:code', adminBillingController.adminDeleteCoupon);
adminRouter.get('/gyms', adminController.listGyms);
adminRouter.patch('/gyms/:id/verify', adminController.verifyGym);
adminRouter.get('/brands', adminController.listBrands);
adminRouter.patch('/brands/:id', adminController.updateBrand);
adminRouter.get('/machines', adminController.listMachines);
adminRouter.patch('/machines/:id', adminController.updateMachine);
adminRouter.get('/posts', adminController.listPosts);
adminRouter.patch('/posts/:id', adminController.moderatePost);
adminRouter.get('/machine-requests', adminController.listMachineRequests);
adminRouter.get('/machine-request-groups/stats', adminController.getMachineRequestGroupStats);
adminRouter.get('/machine-request-groups/popular', adminController.listPopularMachineRequestGroups);
adminRouter.post('/machine-request-groups/merge', adminController.mergeMachineRequestGroups);
adminRouter.get('/machine-request-groups/detail', adminController.getMachineRequestGroupDetail);
adminRouter.get('/machine-request-groups', adminController.listMachineRequestGroups);
adminRouter.patch('/machine-requests/:id', adminController.updateMachineRequest);
adminRouter.get('/reports', adminController.listReports);
adminRouter.patch('/reports/:id', adminController.resolveReport);

adminRouter.get('/owner-applications', adminController.listOwnerApplications);
adminRouter.patch('/owner-applications/:id', adminController.reviewOwnerApplication);
adminRouter.get('/trainer-applications', adminController.listTrainerApplications);
adminRouter.patch('/trainer-applications/:id', adminController.reviewTrainerApplication);
adminRouter.get('/gyms/:gymId/inventory', adminController.listGymInventory);
adminRouter.post('/gym-machines/:itemId/actions', adminController.gymInventoryAction);

/** System backup / restore */
adminRouter.post('/system-backup', (req, res, next) => {
  void backupController.systemBackup(req, res).catch(next);
});
adminRouter.post(
  '/system-restore',
  backupUpload,
  validateBody(systemRestoreConfirmSchema),
  (req, res, next) => {
    void backupController.systemRestore(req, res).catch(next);
  }
);
adminRouter.get('/system-backup/history', (req, res, next) => {
  void backupController.systemBackupHistory(req, res).catch(next);
});
adminRouter.get('/system-backup/download/:jobId', (req, res, next) => {
  void backupController.downloadSystemBackup(req, res).catch(next);
});
adminRouter.get('/backup-settings', (req, res, next) => {
  void backupController.getBackupSettings(req, res).catch(next);
});
adminRouter.put(
  '/backup-settings',
  validateBody(backupSettingsUpdateSchema),
  (req, res, next) => {
    void backupController.updateBackupSettings(req, res).catch(next);
  }
);
