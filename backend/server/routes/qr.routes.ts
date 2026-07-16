import { Router } from 'express';
import * as qrController from '../controllers/qr.controller.js';
import { optionalAuthMiddleware } from '../middlewares/auth.middleware.js';

export const qrRouter = Router();

qrRouter.get('/:qrCode', qrController.resolveQrCode);
qrRouter.post('/:qrCode/scan', optionalAuthMiddleware, qrController.scanQrCode);
