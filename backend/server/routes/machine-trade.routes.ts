import { Router } from 'express';
import { Role } from '@machinefit/shared';
import * as machineTradeController from '../controllers/machine-trade.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import { machineTradeImagesUpload } from '../middlewares/upload.middleware.js';

export const machineTradeRouter = Router();

machineTradeRouter.get('/images/:imageId', machineTradeController.getImage);

machineTradeRouter.get('/', optionalAuthMiddleware, machineTradeController.listTrades);
machineTradeRouter.get('/admin', authMiddleware, requireMinRole(Role.ADMIN), machineTradeController.listAdminTrades);
machineTradeRouter.get(
  '/admin/reports',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  machineTradeController.listReports
);
machineTradeRouter.get(
  '/admin/stats',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  machineTradeController.getStats
);
machineTradeRouter.patch(
  '/admin/reports/:reportId',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  machineTradeController.resolveReport
);
machineTradeRouter.post(
  '/admin/:tradeId/restore',
  authMiddleware,
  requireMinRole(Role.ADMIN),
  machineTradeController.restoreTrade
);

machineTradeRouter.get('/:tradeId', optionalAuthMiddleware, machineTradeController.getTrade);
machineTradeRouter.post(
  '/',
  authMiddleware,
  requireMinRole(Role.OWNER),
  machineTradeImagesUpload,
  machineTradeController.createTrade
);
machineTradeRouter.patch(
  '/:tradeId',
  authMiddleware,
  requireMinRole(Role.OWNER),
  machineTradeController.updateTrade
);
machineTradeRouter.delete(
  '/:tradeId',
  authMiddleware,
  requireMinRole(Role.OWNER),
  machineTradeController.deleteTrade
);
machineTradeRouter.post(
  '/:tradeId/republish',
  authMiddleware,
  requireMinRole(Role.OWNER),
  machineTradeController.republishTrade
);
machineTradeRouter.post('/:tradeId/like', authMiddleware, machineTradeController.toggleLike);
machineTradeRouter.post('/:tradeId/report', authMiddleware, machineTradeController.createReport);
