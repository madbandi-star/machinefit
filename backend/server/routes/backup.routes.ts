import { Router } from 'express';
import {
  FREE_OPEN_MEMBER_FEATURES_MIN_ROLE,
  backupExportSchema,
  backupImportMetaSchema,
} from '@machinefit/shared';
import { authMiddleware, requireMinRole } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { backupUpload } from '../middlewares/upload.middleware.js';
import * as backupController from '../controllers/backup.controller.js';

export const backupRouter = Router();

/** Free-open: MEMBER+. Paid later → requirePremium() (see FREE_OPEN_MEMBER_FEATURES_MIN_ROLE). */
backupRouter.use(authMiddleware, requireMinRole(FREE_OPEN_MEMBER_FEATURES_MIN_ROLE));

/** POST /backup/export — download user backup (zip|json) */
backupRouter.post('/export', validateBody(backupExportSchema), (req, res, next) => {
  void backupController.exportBackup(req, res).catch(next);
});

/** POST /backup/import — restore user backup */
backupRouter.post(
  '/import',
  backupUpload,
  validateBody(backupImportMetaSchema),
  (req, res, next) => {
    void backupController.importBackup(req, res).catch(next);
  }
);

/** GET /backup/history */
backupRouter.get('/history', (req, res, next) => {
  void backupController.backupHistory(req, res).catch(next);
});

/** GET /backup/jobs/:jobId — progress */
backupRouter.get('/jobs/:jobId', (req, res, next) => {
  void backupController.backupJobStatus(req, res).catch(next);
});

/** GET /backup/download/:jobId */
backupRouter.get('/download/:jobId', (req, res, next) => {
  void backupController.downloadUserBackup(req, res).catch(next);
});
