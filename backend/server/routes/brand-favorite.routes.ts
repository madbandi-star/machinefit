import { Router } from 'express';
import { z } from 'zod';
import * as brandFavoriteController from '../controllers/brand-favorite.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateParams } from '../middlewares/validate.middleware.js';

export const brandFavoriteRouter = Router();

const brandIdParamsSchema = z.object({
  brandId: z.string().uuid(),
});

brandFavoriteRouter.use(authMiddleware);
brandFavoriteRouter.get('/', brandFavoriteController.listBrandFavorites);
brandFavoriteRouter.get('/ids', brandFavoriteController.listBrandFavoriteIds);
brandFavoriteRouter.post(
  '/:brandId',
  validateParams(brandIdParamsSchema),
  brandFavoriteController.addBrandFavorite
);
brandFavoriteRouter.delete(
  '/:brandId',
  validateParams(brandIdParamsSchema),
  brandFavoriteController.removeBrandFavorite
);
