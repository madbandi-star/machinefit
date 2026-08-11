import { Router } from 'express';
import {
  bannerEventBodySchema,
  bannerIdParamsSchema,
  bannerListQuerySchema,
  bannerSlotKeyParamsSchema,
  createBannerSchema,
  createBannerSlotSchema,
  Role,
  updateBannerSchema,
  updateBannerSlotSchema,
} from '@machinefit/shared';
import * as bannerController from '../controllers/banner.controller.js';
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireMinRole,
} from '../middlewares/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middlewares/validate.middleware.js';
import { bannerImageUpload } from '../middlewares/upload.middleware.js';
import { z } from 'zod';

export const bannerRouter = Router();

/** Public: active banners for a slot (cached lightly on client). */
bannerRouter.get(
  '/public/:slotKey',
  optionalAuthMiddleware,
  validateParams(bannerSlotKeyParamsSchema),
  bannerController.getPublicSlot
);

/** Public: impression / click (optional auth). */
bannerRouter.post(
  '/public/events',
  optionalAuthMiddleware,
  validateBody(bannerEventBodySchema),
  bannerController.recordBannerEvent
);

const admin = Router();
admin.use(authMiddleware, requireMinRole(Role.ADMIN));

admin.get('/stats', bannerController.getAdminStats);
admin.get('/stats/rows', bannerController.getStatsRows);

admin.get('/slots', bannerController.listSlots);
admin.post('/slots', validateBody(createBannerSlotSchema), bannerController.createSlot);
admin.put(
  '/slots/:id',
  validateParams(z.object({ id: z.string().uuid() })),
  validateBody(updateBannerSlotSchema),
  bannerController.updateSlot
);

admin.get('/', validateQuery(bannerListQuerySchema), bannerController.listAdminBanners);
admin.post('/', validateBody(createBannerSchema), bannerController.createBanner);
admin.get(
  '/:id',
  validateParams(bannerIdParamsSchema),
  bannerController.getAdminBanner
);
admin.put(
  '/:id',
  validateParams(bannerIdParamsSchema),
  validateBody(updateBannerSchema),
  bannerController.updateBanner
);
admin.delete(
  '/:id',
  validateParams(bannerIdParamsSchema),
  bannerController.deleteBanner
);
admin.post(
  '/:id/image',
  validateParams(bannerIdParamsSchema),
  bannerImageUpload,
  bannerController.uploadBannerImage
);
admin.delete(
  '/:id/image',
  validateParams(bannerIdParamsSchema),
  bannerController.clearBannerImage
);

bannerRouter.use('/admin', admin);
