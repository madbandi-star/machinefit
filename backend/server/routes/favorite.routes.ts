import { Router } from 'express';
import { z } from 'zod';
import { gymIdSchema, gymScopeIdSchema, memberIdSchema } from '@machinefit/shared';
import * as favoriteController from '../controllers/favorite.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateParams, validateQuery } from '../middlewares/validate.middleware.js';

export const favoriteRouter = Router();

const favoriteListQuerySchema = z.object({
  gymId: gymScopeIdSchema,
  memberId: memberIdSchema.optional(),
});

const favoriteCheckQuerySchema = z.object({
  gymId: gymIdSchema,
  memberId: memberIdSchema.optional(),
});

const favoriteIdParamsSchema = z.object({
  id: z.string().uuid(),
});

favoriteRouter.use(authMiddleware);
favoriteRouter.get('/', validateQuery(favoriteListQuerySchema), favoriteController.listFavorites);
favoriteRouter.post('/', favoriteController.addFavorite);
favoriteRouter.delete('/bulk', favoriteController.removeFavoritesBulk);
favoriteRouter.delete(
  '/:id',
  validateParams(favoriteIdParamsSchema),
  favoriteController.removeFavorite
);
favoriteRouter.get(
  '/check/:machineCode',
  validateQuery(favoriteCheckQuerySchema),
  favoriteController.checkFavorite
);
